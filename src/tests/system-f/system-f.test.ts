import { describe, it, expect } from 'vitest';
import {
  alphaEqType,
  emptyContext,
  fAbs,
  fApp,
  fArrow,
  fAtom,
  fForall,
  fTAbs,
  fTApp,
  fTermToString,
  fTypeToString,
  fVar,
  isNormal,
  isTypeError,
  isWellFormed,
  normalize,
  reduceBeta,
  typeOf,
  type FContext,
  type FType,
} from '../../system-f';

// ---------- Helpers ----------
const X = fAtom('X');
const Y = fAtom('Y');
const P = fAtom('P');

function unwrap(r: ReturnType<typeof typeOf>): FType {
  if (isTypeError(r)) throw new Error(`unexpected type error: ${r.error}`);
  return r;
}

function ctxWithType(...names: string[]): FContext {
  const c = emptyContext();
  for (const n of names) c.type.add(n);
  return c;
}

// =============================================================
// 1. Type checking
// =============================================================
describe('System F / typeOf', () => {
  it('identidad polimórfica: Λ X. λ x:X. x ⊢ ∀X. X → X', () => {
    const term = fTAbs('X', fAbs('x', X, fVar('x')));
    const t = unwrap(typeOf(term));
    expect(fTypeToString(t)).toBe('∀X. X → X');
  });

  it('type application: (Λ X. λ x:X. x) [P] ⊢ P → P', () => {
    const term = fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), P);
    const t = unwrap(typeOf(term, ctxWithType('P')));
    expect(fTypeToString(t)).toBe('P → P');
  });

  it('Church boolean true: Λ X. λ t:X. λ f:X. t ⊢ ∀X. X → X → X', () => {
    const trueTerm = fTAbs('X', fAbs('t', X, fAbs('f', X, fVar('t'))));
    const t = unwrap(typeOf(trueTerm));
    expect(fTypeToString(t)).toBe('∀X. X → X → X');
  });

  it('Church boolean false: Λ X. λ t:X. λ f:X. f ⊢ ∀X. X → X → X', () => {
    const falseTerm = fTAbs('X', fAbs('t', X, fAbs('f', X, fVar('f'))));
    const t = unwrap(typeOf(falseTerm));
    expect(fTypeToString(t)).toBe('∀X. X → X → X');
  });

  it('composición polimórfica: Λ X. Λ Y. λ f:X→Y. λ x:X. f x ⊢ ∀X. ∀Y. (X→Y) → X → Y', () => {
    const term = fTAbs(
      'X',
      fTAbs('Y', fAbs('f', fArrow(X, Y), fAbs('x', X, fApp(fVar('f'), fVar('x'))))),
    );
    const t = unwrap(typeOf(term));
    expect(fTypeToString(t)).toBe('∀X. ∀Y. (X → Y) → X → Y');
  });

  it('rechaza variable libre sin contexto', () => {
    const r = typeOf(fVar('x'));
    expect(isTypeError(r)).toBe(true);
  });

  it('rechaza aplicación mal tipada (función no-flecha)', () => {
    // (λx:P. x) aplicado a sí mismo: λx:P. x : P → P, no aplicable a algo no-P.
    const ctx = emptyContext();
    ctx.type.add('P');
    ctx.term.set('q', fAtom('Q'));
    ctx.type.add('Q');
    const term = fApp(fAbs('x', P, fVar('x')), fVar('q'));
    const r = typeOf(term, ctx);
    expect(isTypeError(r)).toBe(true);
    if (isTypeError(r)) expect(r.error).toMatch(/no coincide/);
  });

  it('rechaza type-application sobre algo que no es ∀', () => {
    const ctx = ctxWithType('P');
    const term = fTApp(fAbs('x', P, fVar('x')), P);
    const r = typeOf(term, ctx);
    expect(isTypeError(r)).toBe(true);
    if (isTypeError(r)) expect(r.error).toMatch(/∀/);
  });

  it('rechaza anotación de tipo con var libre no declarada', () => {
    // λ x:Z. x  donde Z no está en el contexto de tipos.
    const term = fAbs('x', fAtom('Z'), fVar('x'));
    const r = typeOf(term, emptyContext());
    expect(isTypeError(r)).toBe(true);
    if (isTypeError(r)) expect(r.error).toMatch(/bien-formada|no declarad/);
  });

  it('Λ con shadowing implícito es rechazado', () => {
    // En contexto con X ya declarada, Λ X. λ x:X. x falla.
    const ctx = ctxWithType('X');
    const term = fTAbs('X', fAbs('x', X, fVar('x')));
    const r = typeOf(term, ctx);
    expect(isTypeError(r)).toBe(true);
  });
});

// =============================================================
// 2. β / type-β reduction
// =============================================================
describe('System F / reduceBeta + normalize', () => {
  it('type-β: (Λ X. λ x:X. x) [P] → λ x:P. x', () => {
    const term = fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), P);
    const r = reduceBeta(term);
    expect(fTermToString(r)).toBe('(λx:P. x)');
  });

  it('type-β con tipo compuesto: (Λ X. λ x:X. x) [P → P] → λ x:P→P. x', () => {
    const term = fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), fArrow(P, P));
    const r = reduceBeta(term);
    expect(fTermToString(r)).toBe('(λx:P → P. x)');
  });

  it('β estándar: (λ x:P. x) y → y', () => {
    const term = fApp(fAbs('x', P, fVar('x')), fVar('y'));
    const r = reduceBeta(term);
    expect(r).toEqual(fVar('y'));
  });

  it('normalize: identidad polimórfica aplicada termina en λx:P. x', () => {
    const term = fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), P);
    const { result, terminated } = normalize(term);
    expect(terminated).toBe(true);
    expect(fTermToString(result)).toBe('(λx:P. x)');
  });

  it('normalize: cuenta los pasos exactos', () => {
    // ((Λ X. λ x:X. x) [P]) y  → 2 pasos: type-β + β
    const term = fApp(fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), P), fVar('y'));
    const { result, steps, terminated } = normalize(term);
    expect(terminated).toBe(true);
    expect(steps).toBe(2);
    expect(result).toEqual(fVar('y'));
  });

  it('normalize: forma normal estable es punto fijo', () => {
    const term = fAbs('x', P, fVar('x'));
    const { result, steps, terminated } = normalize(term);
    expect(terminated).toBe(true);
    expect(steps).toBe(0);
    expect(result).toEqual(term);
    expect(isNormal(term)).toBe(true);
  });
});

// =============================================================
// 3. Church booleans en System F
// =============================================================
describe('System F / Church booleans encoded', () => {
  // Bool = ∀X. X → X → X
  const Bool = fForall('X', fArrow(X, fArrow(X, X)));
  const TRUE = fTAbs('X', fAbs('t', X, fAbs('f', X, fVar('t'))));
  const FALSE = fTAbs('X', fAbs('t', X, fAbs('f', X, fVar('f'))));

  it('Bool = ∀X. X → X → X bien formado', () => {
    expect(isWellFormed(Bool)).toBe(true);
    expect(fTypeToString(Bool)).toBe('∀X. X → X → X');
  });

  it('true y false tienen ambos tipo Bool (módulo α)', () => {
    const tT = unwrap(typeOf(TRUE));
    const tF = unwrap(typeOf(FALSE));
    expect(alphaEqType(tT, Bool)).toBe(true);
    expect(alphaEqType(tF, Bool)).toBe(true);
  });

  it('true [P] a b se reduce a a (con a, b : P)', () => {
    // Construimos un contexto con P declarada y a, b : P.
    const ctx: FContext = emptyContext();
    ctx.type.add('P');
    ctx.term.set('a', P);
    ctx.term.set('b', P);
    const expr = fApp(fApp(fTApp(TRUE, P), fVar('a')), fVar('b'));
    // Tipa a P:
    const ty = unwrap(typeOf(expr, ctx));
    expect(alphaEqType(ty, P)).toBe(true);
    // Reduce a a:
    const { result } = normalize(expr);
    expect(result).toEqual(fVar('a'));
  });

  it('false [P] a b se reduce a b', () => {
    const expr = fApp(fApp(fTApp(FALSE, P), fVar('a')), fVar('b'));
    const { result } = normalize(expr);
    expect(result).toEqual(fVar('b'));
  });
});

// =============================================================
// 4. Well-formedness y α-equivalencia de tipos
// =============================================================
describe('System F / isWellFormed + alphaEqType', () => {
  it('∀X. X → X es well-formed sin contexto', () => {
    expect(isWellFormed(fForall('X', fArrow(X, X)))).toBe(true);
  });

  it('X solo (no bajo ∀) NO es well-formed sin contexto', () => {
    expect(isWellFormed(X)).toBe(false);
  });

  it('X solo SÍ es well-formed con X declarada', () => {
    expect(isWellFormed(X, new Set(['X']))).toBe(true);
  });

  it('alphaEqType: ∀X. X → X ≡ ∀Y. Y → Y', () => {
    const a = fForall('X', fArrow(X, X));
    const b = fForall('Y', fArrow(Y, Y));
    expect(alphaEqType(a, b)).toBe(true);
  });

  it('alphaEqType: ∀X. X → Y ≢ ∀Y. Y → Y (var libre Y se confunde)', () => {
    const a = fForall('X', fArrow(X, Y));
    const b = fForall('Y', fArrow(Y, Y));
    expect(alphaEqType(a, b)).toBe(false);
  });
});

// =============================================================
// 5. Capture-avoidance al sustituir tipos
// =============================================================
describe('System F / capture-avoidance', () => {
  it('type-β no captura: (Λ X. Λ Y. λ x:X. x) [Y] genera tipo con Y fresco', () => {
    // Si la sustitución X := Y se hiciera ingenuamente bajo Λ Y, capturaría.
    // Esperamos que el binder interno se α-renombre.
    const term = fTApp(fTAbs('X', fTAbs('Y', fAbs('x', X, fVar('x')))), Y);
    const r = reduceBeta(term);
    // El resultado debe ser Λ Y'. λ x:Y. x, con Y' ≠ Y.
    expect(r.kind).toBe('tabs');
    if (r.kind === 'tabs') {
      expect(r.bind).not.toBe('Y');
      // El cuerpo interno ahora tiene la anotación de x como Y (el tipo sustituido).
      expect(r.body.kind).toBe('abs');
    }
  });

  it('alphaEqType tras type-β preserva semántica', () => {
    // (Λ X. λ x:X. x) [P]  debe tipar a P → P (módulo α).
    const term = fTApp(fTAbs('X', fAbs('x', X, fVar('x'))), P);
    const ty = unwrap(typeOf(term, ctxWithType('P')));
    expect(alphaEqType(ty, fArrow(P, P))).toBe(true);
  });
});
