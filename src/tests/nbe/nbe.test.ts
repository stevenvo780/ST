import { describe, expect, it } from 'vitest';
import {
  alphaEq,
  ap,
  apN,
  evaluate,
  lam,
  makeFreshSupply,
  normalize,
  reify,
  tArr,
  tBase,
  termToString,
  type Term,
  v,
} from '../../nbe';

// ---------- Tipos base reutilizables ----------
const P = tBase('P');
const Q = tBase('Q');
const PtoP = tArr(P, P);
const PtoPtoP = tArr(P, PtoP);

describe('NbE — Normalization by Evaluation para STLC', () => {
  it('β-reduce: (λx:P. x) y  ⇒  y', () => {
    // y es libre de tipo P
    const t = ap(lam('x', P, v('x')), v('y'));
    const nf = normalize(t, P);
    expect(alphaEq(nf, v('y'))).toBe(true);
  });

  it('η-long: identidad en P→P queda como λ_x0:P. _x0', () => {
    const t = lam('x', P, v('x'));
    const nf = normalize(t, PtoP);
    // Esperamos λ?:P. ?  (α-equivalente a la identidad)
    expect(alphaEq(nf, lam('y', P, v('y')))).toBe(true);
  });

  it('η-expansión de variable libre f : P→P  ⇒  λ_x0:P. f _x0', () => {
    const t: Term = v('f'); // libre
    const nf = normalize(t, PtoP);
    expect(alphaEq(nf, lam('z', P, ap(v('f'), v('z'))))).toBe(true);
  });

  it('η-expansión profunda de f : (P→P)→(P→P)', () => {
    const t: Term = v('f');
    const nf = normalize(t, tArr(PtoP, PtoP));
    // λg:P→P. λx:P. f g x
    const expected = lam('g', PtoP, lam('x', P, ap(ap(v('f'), v('g')), v('x'))));
    expect(alphaEq(nf, expected)).toBe(true);
  });

  it('forma normal ya normal: λx:P→P. λy:P. x y  estable módulo α', () => {
    const t = lam('x', PtoP, lam('y', P, ap(v('x'), v('y'))));
    const nf = normalize(t, tArr(PtoP, PtoP));
    expect(alphaEq(nf, t)).toBe(true);
  });

  it('β + η combinados: (λf:P→P. λx:P. f (f x)) (λy:P. y)  ⇒  λ_x:P. _x', () => {
    const inner = lam('y', P, v('y')); // id
    const doubled = lam('f', PtoP, lam('x', P, ap(v('f'), ap(v('f'), v('x')))));
    const t = ap(doubled, inner);
    const nf = normalize(t, PtoP);
    expect(alphaEq(nf, lam('x', P, v('x')))).toBe(true);
  });

  it('K combinator (λx:P. λy:Q. x) aplicado a a:P  ⇒  λy:Q. a', () => {
    const K = lam('x', P, lam('y', Q, v('x')));
    const t = ap(K, v('a'));
    const nf = normalize(t, tArr(Q, P));
    expect(alphaEq(nf, lam('y', Q, v('a')))).toBe(true);
  });

  it('Church-style const: (λx:P. λy:P. y) a b ⇒ b', () => {
    const term = apN(lam('x', P, lam('y', P, v('y'))), v('a'), v('b'));
    const nf = normalize(term, P);
    expect(alphaEq(nf, v('b'))).toBe(true);
  });

  it('aplicación atascada: f a  con f libre P→P  ⇒  f a (no se simplifica)', () => {
    const t = ap(v('f'), v('a'));
    const nf = normalize(t, P);
    expect(alphaEq(nf, ap(v('f'), v('a')))).toBe(true);
  });

  it('determinismo: misma entrada produce misma salida string-a-string', () => {
    const t = ap(lam('x', P, v('x')), v('y'));
    const a = termToString(normalize(t, P));
    const b = termToString(normalize(t, P));
    const c = termToString(normalize(t, P));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('β-reducción con captura evitada: (λx:P. λy:P. x) y  ⇒  λ_y:P. y_outer', () => {
    // El "y" exterior es la variable libre; el binder interno NO debe
    // capturarla. Como reify usa supply fresco, el binder queda como
    // _x0 (u otro nombre fresco), no como "y".
    const t = ap(lam('x', P, lam('y', P, v('x'))), v('y'));
    const nf = normalize(t, tArr(P, P));
    // El resultado debe ser α-equivalente a λz:P. y
    expect(alphaEq(nf, lam('z', P, v('y')))).toBe(true);
  });

  it('aplicación n-aria: (λx:P. λy:P. λz:P. x) a b c  ⇒  a', () => {
    const f = lam('x', P, lam('y', P, lam('z', P, v('x'))));
    const t = apN(f, v('a'), v('b'), v('c'));
    const nf = normalize(t, P);
    expect(alphaEq(nf, v('a'))).toBe(true);
  });

  it('S-like: (λf:P→P→P. λx:P. f x x) (λa:P. λb:P. a) v  ⇒  v', () => {
    // f := proj1 (λa:P. λb:P. a)
    // λx:P. f x x  =  λx:P. (λa.λb.a) x x  ⇒  λx:P. x
    // Aplicado a v ⇒ v
    const proj1 = lam('a', P, lam('b', P, v('a')));
    const w = lam('f', PtoPtoP, lam('x', P, ap(ap(v('f'), v('x')), v('x'))));
    const t = ap(ap(w, proj1), v('v_arg'));
    const nf = normalize(t, P);
    expect(alphaEq(nf, v('v_arg'))).toBe(true);
  });

  it('evaluate produce una clausura para una λ', () => {
    const val = evaluate(lam('x', P, v('x')), new Map());
    expect(val.kind).toBe('closure');
  });

  it('reify con supply explícito es reproducible', () => {
    const t: Term = v('f'); // libre, tipo P→P
    const val = evaluate(t, new Map());
    const a = termToString(reify(val, PtoP, makeFreshSupply('q')));
    const b = termToString(reify(val, PtoP, makeFreshSupply('q')));
    expect(a).toBe(b);
    // El nombre fresco debe aparecer con el prefijo elegido.
    expect(a.includes('q0')).toBe(true);
  });

  it('idempotencia: normalize(normalize(t)) ≡α normalize(t)', () => {
    const t = ap(lam('f', PtoP, lam('x', P, ap(v('f'), ap(v('f'), v('x'))))), lam('y', P, v('y')));
    const nf1 = normalize(t, PtoP);
    const nf2 = normalize(nf1, PtoP);
    expect(alphaEq(nf1, nf2)).toBe(true);
  });

  it('η-expansión en aplicación parcial: (λx:P→P. x) f  con f:P→P  ⇒  λ_x:P. f _x', () => {
    const t = ap(lam('x', PtoP, v('x')), v('f'));
    const nf = normalize(t, PtoP);
    expect(alphaEq(nf, lam('z', P, ap(v('f'), v('z'))))).toBe(true);
  });
});
