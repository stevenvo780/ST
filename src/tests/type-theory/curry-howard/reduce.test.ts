import { describe, it, expect } from 'vitest';
import {
  abs,
  app,
  arrow,
  atom,
  bottom,
  fst,
  inl,
  inr,
  isNormal,
  normalize,
  pair,
  reduceBeta,
  snd,
  sum,
  vr,
  cse,
  inferType,
  isInferError,
  termToString,
  eqType,
  type LambdaTerm,
} from '../../../type-theory/curry-howard';

const P = atom('P');
const Q = atom('Q');

describe('Curry-Howard / β-reducción', () => {
  it('reduce identidad aplicada: (λx:P. x) y → y', () => {
    const t = app(abs('x', P, vr('x')), vr('y'));
    const r = reduceBeta(t);
    expect(r).toEqual(vr('y'));
  });

  it('reduce K-combinator: (λx:P. λy:Q. x) a → λy:Q. a', () => {
    const t = app(abs('x', P, abs('y', Q, vr('x'))), vr('a'));
    const r = reduceBeta(t);
    expect(termToString(r)).toBe('(λy:Q. a)');
  });

  it('fst ⟨a, b⟩ → a', () => {
    const t = fst(pair(vr('a'), vr('b')));
    expect(reduceBeta(t)).toEqual(vr('a'));
  });

  it('snd ⟨a, b⟩ → b', () => {
    const t = snd(pair(vr('a'), vr('b')));
    expect(reduceBeta(t)).toEqual(vr('b'));
  });

  it('case (inl v) of inl(x)→x | inr(y)→y → v', () => {
    const t = cse(inl(vr('v'), Q), 'x', vr('x'), 'y', vr('y'));
    expect(reduceBeta(t)).toEqual(vr('v'));
  });

  it('case (inr v) selecciona la rama derecha', () => {
    const t = cse(inr(vr('v'), P), 'x', vr('x'), 'y', vr('y'));
    expect(reduceBeta(t)).toEqual(vr('v'));
  });

  it('normalize: (λx. (λy. y) x) z → z', () => {
    const t = app(abs('x', P, app(abs('y', P, vr('y')), vr('x'))), vr('z'));
    const r = normalize(t);
    expect(r).toEqual(vr('z'));
  });

  it('isNormal verdadero para variables y formas λ inertes', () => {
    expect(isNormal(vr('x'))).toBe(true);
    expect(isNormal(abs('x', P, vr('x')))).toBe(true);
  });

  it('isNormal falso para redex', () => {
    const t = app(abs('x', P, vr('x')), vr('y'));
    expect(isNormal(t)).toBe(false);
  });

  it('preserva tipos: si term:T entonces reduceBeta(term):T', () => {
    // (λx:P. x) y : P  con y:P  ⇒  y : P
    const term = app(abs('x', P, vr('x')), vr('y'));
    const ctx = { y: P };
    const tBefore = inferType(term, ctx);
    const reduced = reduceBeta(term);
    const tAfter = inferType(reduced, ctx);
    expect(isInferError(tBefore)).toBe(false);
    expect(isInferError(tAfter)).toBe(false);
    if (!isInferError(tBefore) && !isInferError(tAfter)) {
      expect(eqType(tBefore, tAfter)).toBe(true);
    }
  });

  it('α-renombra al sustituir para evitar captura: (λx:P. λy:P. x) y → λy#:P. y', () => {
    // y libre en el argumento; el binder interno debe renombrarse
    const t = app(abs('x', P, abs('y', P, vr('x'))), vr('y'));
    const r = reduceBeta(t);
    // r es un abs cuyo cuerpo es 'y' (la y libre original), no la ligada
    expect(r.kind).toBe('abs');
    if (r.kind === 'abs') {
      // tras renombrar, el binder ya no se llama 'y'; el cuerpo sigue siendo la y libre
      expect(r.param).not.toBe('y');
      expect(r.body).toEqual(vr('y'));
    }
  });

  it('normalize en producto: fst ⟨(λx:P. x) a, b⟩ →* a', () => {
    const t = fst(pair(app(abs('x', P, vr('x')), vr('a')), vr('b')));
    expect(normalize(t)).toEqual(vr('a'));
  });

  it('normalize con term abierto bajo λ: λz:P. (λx:P. x) z →* λz:P. z', () => {
    const t = abs('z', P, app(abs('x', P, vr('x')), vr('z')));
    const r = normalize(t);
    expect(r).toEqual(abs('z', P, vr('z')));
  });

  it('absurd no se reduce (sin redex), preserva ⊥ → P', () => {
    const t: LambdaTerm = {
      kind: 'absurd',
      proofOfFalse: vr('f'),
      resultType: P,
    };
    expect(reduceBeta(t)).toEqual(t);
    // y se preserva el tipo
    const ty = inferType(t, { f: bottom() });
    expect(isInferError(ty)).toBe(false);
    if (!isInferError(ty)) expect(eqType(ty, P)).toBe(true);
  });

  it('no entra en loop con maxSteps: term ya normal devuelve sí mismo', () => {
    const t = abs('x', arrow(P, Q), vr('x'));
    expect(normalize(t, 10)).toEqual(t);
  });

  it('reducción dentro de pair conserva forma', () => {
    const t = pair(app(abs('x', P, vr('x')), vr('a')), vr('b'));
    const r = normalize(t);
    expect(r).toEqual(pair(vr('a'), vr('b')));
  });

  it('reduce dentro del scrutinee de case', () => {
    // case ((λx:P. x) (inl v)) of inl(a)→a | inr(b)→b  →*  v
    const t = cse(app(abs('x', sum(P, Q), vr('x')), inl(vr('v'), Q)), 'a', vr('a'), 'b', vr('b'));
    expect(normalize(t)).toEqual(vr('v'));
  });
});
