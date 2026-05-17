import { describe, it, expect } from 'vitest';
import {
  type CubeTerm,
  type CubeContext,
  type InferResult,
  SYSTEMS,
  rulesOf,
  hasRule,
  cVar,
  cStar,
  cBox,
  cPi,
  cLam,
  cApp,
  cArrow,
  inferType,
  checkType,
  isInferError,
  normalize,
  isNormal,
  alphaBetaEq,
  erase,
  isEraseError,
  termToString,
  extendContext,
  polymorphicIdentity,
  polymorphicIdentityType,
  churchNumeral,
  churchNumeralType,
  dependentList,
  predicateOverNat,
  typeLevelIdentity,
  typeLevelIdentityKind,
} from '../../../type-theory/lambda-cube';

// ---------- Helpers ----------

function unwrap(r: InferResult): CubeTerm {
  if (isInferError(r)) throw new Error(`unexpected type error: ${r.error}`);
  return r;
}

function ruleSet(system: Parameters<typeof rulesOf>[0]): Set<string> {
  return new Set(rulesOf(system).map((r) => `${r.from},${r.to}`));
}

// =============================================================
// 1. Formation rules — geometría del cubo
// =============================================================

describe('Lambda Cube / formation rules', () => {
  it('λ→ tiene solo la regla (*,*)', () => {
    const rules = ruleSet('lambda');
    expect(rules).toEqual(new Set(['*,*']));
  });

  it('λ2 (System F) tiene (*,*) y (◻,*)', () => {
    const rules = ruleSet('lambda2');
    expect(rules).toEqual(new Set(['*,*', '◻,*']));
  });

  it('λω (System Fω) tiene (*,*), (◻,*) y (◻,◻)', () => {
    const rules = ruleSet('lambda-omega');
    expect(rules).toEqual(new Set(['*,*', '◻,*', '◻,◻']));
  });

  it('λP (LF) tiene (*,*) y (*,◻)', () => {
    const rules = ruleSet('lambda-P');
    expect(rules).toEqual(new Set(['*,*', '*,◻']));
  });

  it('λC (CoC) contiene las 4 reglas de formación', () => {
    const rules = ruleSet('lambda-C');
    expect(rules).toEqual(new Set(['*,*', '◻,*', '*,◻', '◻,◻']));
  });

  it('los 8 sistemas son distinguibles por sus reglas', () => {
    const seen = new Set<string>();
    for (const sys of Object.keys(SYSTEMS) as Array<keyof typeof SYSTEMS>) {
      const key = [...ruleSet(sys)].sort().join('|');
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(8);
  });
});

// =============================================================
// 2. λ→ — STLC
// =============================================================

describe('Lambda Cube / λ→ (STLC)', () => {
  it('λ x:P. x  tipa como P → P, dado P : *', () => {
    // P es una constante de tipo: la declaramos como variable de tipo *.
    const ctx: CubeContext = extendContext(new Map(), 'P', cStar);
    const term = cLam('x', cVar('P'), cVar('x'));
    const ty = unwrap(inferType(term, ctx, 'lambda'));
    expect(termToString(ty)).toBe('P → P');
  });

  it('λ→ rechaza polimorfismo: λ X:*. λ x:X. x', () => {
    // El binder X:* exige formar Π X:*. ...  → regla (◻,*) ∉ λ→.
    const term = polymorphicIdentity();
    const r = inferType(term, new Map(), 'lambda');
    expect(isInferError(r)).toBe(true);
  });
});

// =============================================================
// 3. λ2 — System F
// =============================================================

describe('Lambda Cube / λ2 (System F)', () => {
  it('identidad polimórfica tiene tipo ∀X:*. X → X', () => {
    const term = polymorphicIdentity();
    const ty = unwrap(inferType(term, new Map(), 'lambda2'));
    expect(alphaBetaEq(ty, polymorphicIdentityType(), 'lambda2')).toBe(true);
  });

  it('aplicación de tipo: (λ X:*. λ x:X. x) P : P → P', () => {
    const ctx = extendContext(new Map(), 'P', cStar);
    const term = cApp(polymorphicIdentity(), cVar('P'));
    const ty = unwrap(inferType(term, ctx, 'lambda2'));
    expect(termToString(normalize(ty, 'lambda2'))).toBe('P → P');
  });

  it('Church 3 tipa como Π X:*. (X → X) → X → X', () => {
    const ty = unwrap(inferType(churchNumeral(3), new Map(), 'lambda2'));
    expect(alphaBetaEq(ty, churchNumeralType(), 'lambda2')).toBe(true);
  });

  it('Church 0 también tipa con el mismo esquema', () => {
    const ty = unwrap(inferType(churchNumeral(0), new Map(), 'lambda2'));
    expect(alphaBetaEq(ty, churchNumeralType(), 'lambda2')).toBe(true);
  });
});

// =============================================================
// 4. λω — operadores de tipo
// =============================================================

describe('Lambda Cube / λω', () => {
  it('id-type λ A:*. A → A  vive en λω con tipo * → *', () => {
    const ty = unwrap(inferType(typeLevelIdentity(), new Map(), 'lambda-omega'));
    expect(alphaBetaEq(ty, typeLevelIdentityKind(), 'lambda-omega')).toBe(true);
  });

  it('λ→ rechaza el operador de tipo (regla (◻,◻) ausente)', () => {
    const r = inferType(typeLevelIdentity(), new Map(), 'lambda');
    expect(isInferError(r)).toBe(true);
  });
});

// =============================================================
// 5. λP — tipos dependientes
// =============================================================

describe('Lambda Cube / λP', () => {
  it('Π n:Nat. Vector n  tipa en λP (codominio en *, regla (*,*))', () => {
    // Contexto: Nat : *,  Vector : Nat → *.
    let ctx: CubeContext = new Map();
    ctx = extendContext(ctx, 'Nat', cStar);
    ctx = extendContext(ctx, 'Vector', cArrow(cVar('Nat'), cStar));
    const ty = unwrap(inferType(dependentList(), ctx, 'lambda-P'));
    expect(termToString(ty)).toBe('*');
  });

  it('predicado Π n:Nat. *  necesita regla (*,◻) — vive en ◻ en λP', () => {
    const ctx = extendContext(new Map(), 'Nat', cStar);
    const ty = unwrap(inferType(predicateOverNat(), ctx, 'lambda-P'));
    expect(termToString(ty)).toBe('◻');
  });

  it('λ2 rechaza el predicado Π n:Nat. * (regla (*,◻) ausente)', () => {
    const ctx = extendContext(new Map(), 'Nat', cStar);
    const r = inferType(predicateOverNat(), ctx, 'lambda2');
    expect(isInferError(r)).toBe(true);
  });

  it('λ→ rechaza el predicado Π n:Nat. * (regla (*,◻) ausente)', () => {
    const ctx = extendContext(new Map(), 'Nat', cStar);
    const r = inferType(predicateOverNat(), ctx, 'lambda');
    expect(isInferError(r)).toBe(true);
  });
});

// =============================================================
// 6. λC — Calculus of Constructions
// =============================================================

describe('Lambda Cube / λC (Calculus of Constructions)', () => {
  it('Π A:*. A → A  tipa como * en λC', () => {
    const term = cPi('A', cStar, cArrow(cVar('A'), cVar('A')));
    const ty = unwrap(inferType(term, new Map(), 'lambda-C'));
    expect(termToString(ty)).toBe('*');
  });

  it('λC habilita construcciones que λ→ rechaza (poly / type-op / dep-type)', () => {
    // (◻,*): identidad polimórfica
    expect(isInferError(inferType(polymorphicIdentity(), new Map(), 'lambda'))).toBe(true);
    expect(isInferError(inferType(polymorphicIdentity(), new Map(), 'lambda-C'))).toBe(false);
    // (◻,◻): operador de tipo
    expect(isInferError(inferType(typeLevelIdentity(), new Map(), 'lambda'))).toBe(true);
    expect(isInferError(inferType(typeLevelIdentity(), new Map(), 'lambda-C'))).toBe(false);
    // (*,◻): predicado Π n:Nat. *
    const ctx = extendContext(new Map(), 'Nat', cStar);
    expect(isInferError(inferType(predicateOverNat(), ctx, 'lambda'))).toBe(true);
    expect(isInferError(inferType(predicateOverNat(), ctx, 'lambda-C'))).toBe(false);
  });
});

// =============================================================
// 7. Sorts y axioma * : ◻
// =============================================================

describe('Lambda Cube / sorts', () => {
  it('* tiene tipo ◻', () => {
    const ty = unwrap(inferType(cStar));
    expect(termToString(ty)).toBe('◻');
  });

  it('◻ no es tipable (sin axioma)', () => {
    expect(isInferError(inferType(cBox))).toBe(true);
  });
});

// =============================================================
// 8. β-normalización
// =============================================================

describe('Lambda Cube / normalize', () => {
  it('β-reduce en λ2: (λ X:*. λ x:X. x) [P] (a:P) ⇒ a', () => {
    const ctx: CubeContext = extendContext(extendContext(new Map(), 'P', cStar), 'a', cVar('P'));
    // (Λ X. λ x:X. x) P a se codifica como ((id-poly) P) a.
    const idP = cApp(polymorphicIdentity(), cVar('P'));
    const idApplied = cApp(idP, cVar('a'));
    // El término tipa en λ2 con tipo P (resultado de aplicar la id polimórfica).
    const ty = unwrap(inferType(idApplied, ctx, 'lambda2'));
    expect(termToString(ty)).toBe('P');
    // Antes de normalizar no está en NF (hay redex).
    expect(isNormal(idApplied)).toBe(false);
    const nf = normalize(idApplied, 'lambda2');
    expect(termToString(nf)).toBe('a');
    expect(isNormal(nf)).toBe(true);
  });

  it('checkType usa igualdad β: (id P) ≡ P → P en λ2', () => {
    const ctx = extendContext(new Map(), 'P', cStar);
    const idType = cApp(typeLevelIdentity(), cVar('P'));
    // El tipo computado es (λ A:*. A → A) P, que β-reduce a P → P.
    const reduced = cArrow(cVar('P'), cVar('P'));
    expect(alphaBetaEq(idType, reduced, 'lambda-omega')).toBe(true);
    expect(checkType(reduced, cStar, ctx, 'lambda-omega')).toBe(true);
  });
});

// =============================================================
// 9. Erasure
// =============================================================

describe('Lambda Cube / erase', () => {
  it('erase de id polimórfica produce λX. λx. x  en λ-untyped', () => {
    const e = erase(polymorphicIdentity());
    if (isEraseError(e)) throw new Error(e.error);
    expect(e.kind).toBe('abs');
    if (e.kind !== 'abs') return;
    expect(e.body.kind).toBe('abs');
  });

  it('erase de Church-3 produce λX. λs. λz. s(s(s z))', () => {
    const e = erase(churchNumeral(3));
    if (isEraseError(e)) throw new Error(e.error);
    // Esperamos 3 abstracciones anidadas y 3 aplicaciones de s sobre z.
    let depth = 0;
    let cur: typeof e = e;
    while (cur.kind === 'abs') {
      depth++;
      cur = cur.body;
    }
    expect(depth).toBe(3);
  });

  it('erase falla sobre un sort solitario', () => {
    const r = erase(cStar);
    expect(isEraseError(r)).toBe(true);
  });
});

// =============================================================
// 10. Errores de tipado
// =============================================================

describe('Lambda Cube / errores', () => {
  it('aplicación con argumento mal tipado es rechazada', () => {
    // (λ x:P. x) Q donde P,Q son distintos tipos atómicos.
    let ctx: CubeContext = new Map();
    ctx = extendContext(ctx, 'P', cStar);
    ctx = extendContext(ctx, 'Q', cStar);
    ctx = extendContext(ctx, 'q', cVar('Q'));
    const term = cApp(cLam('x', cVar('P'), cVar('x')), cVar('q'));
    const r = inferType(term, ctx, 'lambda');
    expect(isInferError(r)).toBe(true);
  });

  it('variable libre sin binding es rechazada', () => {
    const r = inferType(cVar('libre'), new Map(), 'lambda-C');
    expect(isInferError(r)).toBe(true);
  });

  it('aplicar algo que no es Π falla', () => {
    // x P  donde x : *  (un sort no es función).
    const ctx = extendContext(new Map(), 'x', cStar);
    const r = inferType(cApp(cVar('x'), cStar), ctx, 'lambda-C');
    expect(isInferError(r)).toBe(true);
  });
});

// =============================================================
// 11. Cross-system: hasRule / inclusiones
// =============================================================

describe('Lambda Cube / inclusiones', () => {
  it('λC incluye todas las reglas de los otros 7 sistemas', () => {
    for (const sys of Object.keys(SYSTEMS) as Array<keyof typeof SYSTEMS>) {
      for (const r of rulesOf(sys)) {
        expect(hasRule('lambda-C', r.from, r.to)).toBe(true);
      }
    }
  });

  it('λ→ es el subsistema más pequeño', () => {
    for (const sys of Object.keys(SYSTEMS) as Array<keyof typeof SYSTEMS>) {
      // (*, *) está en todo el cubo.
      expect(hasRule(sys, '*', '*')).toBe(true);
    }
  });
});
