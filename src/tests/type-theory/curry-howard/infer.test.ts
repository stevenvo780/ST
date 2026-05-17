import { describe, it, expect } from 'vitest';
import {
  abs,
  app,
  arrow,
  atom,
  bottom,
  fst,
  inferType,
  inl,
  inr,
  isInferError,
  pair,
  product,
  snd,
  sum,
  vr,
  cse,
  absurd,
  typeToString,
  type PropType,
} from '../../../type-theory/curry-howard';

const P = atom('P');
const Q = atom('Q');
const R = atom('R');

function unwrap(t: ReturnType<typeof inferType>): PropType {
  if (isInferError(t)) throw new Error(`unexpected error: ${t.error}`);
  return t;
}

describe('Curry-Howard / inferType', () => {
  it('infiere identidad λx:P. x ⊢ P → P', () => {
    const t = unwrap(inferType(abs('x', P, vr('x'))));
    expect(typeToString(t)).toBe('P → P');
  });

  it('infiere composición curry: λf:P→Q. λx:P. f x ⊢ (P→Q) → P → Q', () => {
    const term = abs('f', arrow(P, Q), abs('x', P, app(vr('f'), vr('x'))));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('(P → Q) → P → Q');
  });

  it('infiere proyección fst: λp:P∧Q. fst p ⊢ P∧Q → P', () => {
    const term = abs('p', product(P, Q), fst(vr('p')));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('(P ∧ Q) → P');
  });

  it('infiere proyección snd: λp:P∧Q. snd p ⊢ P∧Q → Q', () => {
    const term = abs('p', product(P, Q), snd(vr('p')));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('(P ∧ Q) → Q');
  });

  it('infiere pair-intro: λx:P. λy:Q. ⟨x,y⟩ ⊢ P → Q → P∧Q', () => {
    const term = abs('x', P, abs('y', Q, pair(vr('x'), vr('y'))));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('P → Q → (P ∧ Q)');
  });

  it('infiere disyunción-intro izquierda: λx:P. inl(x):P∨Q ⊢ P → P∨Q', () => {
    const term = abs('x', P, inl(vr('x'), Q));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('P → (P ∨ Q)');
  });

  it('infiere case (∨-elim): λs:P∨Q. case s of inl(x)→inr(x):Q∨P | inr(y)→inl(y):Q∨P', () => {
    // prueba conmutatividad: P∨Q → Q∨P
    const term = abs('s', sum(P, Q), cse(vr('s'), 'x', inr(vr('x'), Q), 'y', inl(vr('y'), P)));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('(P ∨ Q) → (Q ∨ P)');
  });

  it('infiere ex falso: λf:⊥. absurd(f):P ⊢ ⊥ → P', () => {
    const term = abs('f', bottom(), absurd(vr('f'), P));
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('⊥ → P');
  });

  it('infiere tipo de aplicación parcial', () => {
    // λf:P→Q→R. λp:P. λq:Q. f p q ⊢ (P→Q→R) → P → Q → R
    const term = abs(
      'f',
      arrow(P, arrow(Q, R)),
      abs('p', P, abs('q', Q, app(app(vr('f'), vr('p')), vr('q')))),
    );
    const t = unwrap(inferType(term));
    expect(typeToString(t)).toBe('(P → Q → R) → P → Q → R');
  });

  it('rechaza variable libre sin contexto', () => {
    const r = inferType(vr('x'));
    expect(isInferError(r)).toBe(true);
    if (isInferError(r)) expect(r.error).toMatch(/x/);
  });

  it('rechaza aplicación mal tipada (argumento incompatible)', () => {
    // (λx:P. x) y donde y:Q (≠ P)
    const term = app(abs('x', P, vr('x')), vr('y'));
    const r = inferType(term, { y: Q });
    expect(isInferError(r)).toBe(true);
    if (isInferError(r)) expect(r.error).toMatch(/no coincide/);
  });

  it('rechaza fst sobre algo que no es par', () => {
    const term = fst(vr('x'));
    const r = inferType(term, { x: P });
    expect(isInferError(r)).toBe(true);
  });

  it('rechaza case con ramas de tipos distintos', () => {
    // case s:P∨Q of inl(x:P) → x  |  inr(y:Q) → y    (P ≠ Q)
    const term = cse(vr('s'), 'x', vr('x'), 'y', vr('y'));
    const r = inferType(term, { s: sum(P, Q) });
    expect(isInferError(r)).toBe(true);
    if (isInferError(r)) expect(r.error).toMatch(/distintos/);
  });

  it('rechaza absurd sobre algo que no es ⊥', () => {
    const term = absurd(vr('x'), P);
    const r = inferType(term, { x: Q });
    expect(isInferError(r)).toBe(true);
  });
});
