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
  pair,
  product,
  proofIsConsistent,
  proofToTerm,
  snd,
  sum,
  termToProof,
  vr,
  cse,
  absurd,
  inferType,
  isInferError,
  eqType,
  typeToString,
} from '../../curry-howard';

const P = atom('P');
const Q = atom('Q');

describe('Curry-Howard / termToProof', () => {
  it('λx:P. x produce →I sobre axioma', () => {
    const proof = termToProof(abs('x', P, vr('x')));
    expect(proof.rule).toBe('→I');
    expect(typeToString(proof.conclusion)).toBe('P → P');
    expect(proof.discharged).toEqual([{ name: 'x', type: P }]);
    expect(proof.premises[0].rule).toBe('axiom');
    expect(proof.premises[0].assumption).toBe('x');
  });

  it('modus ponens produce →E', () => {
    // (f:P→Q) (x:P) → Q   con f y x en contexto
    const proof = termToProof(app(vr('f'), vr('x')), { f: arrow(P, Q), x: P });
    expect(proof.rule).toBe('→E');
    expect(typeToString(proof.conclusion)).toBe('Q');
    expect(proof.premises.length).toBe(2);
  });

  it('⟨x,y⟩ produce ∧I', () => {
    const proof = termToProof(pair(vr('x'), vr('y')), { x: P, y: Q });
    expect(proof.rule).toBe('∧I');
    expect(typeToString(proof.conclusion)).toBe('(P ∧ Q)');
  });

  it('fst p produce ∧E-L', () => {
    const proof = termToProof(fst(vr('p')), { p: product(P, Q) });
    expect(proof.rule).toBe('∧E-L');
    expect(typeToString(proof.conclusion)).toBe('P');
  });

  it('snd p produce ∧E-R', () => {
    const proof = termToProof(snd(vr('p')), { p: product(P, Q) });
    expect(proof.rule).toBe('∧E-R');
    expect(typeToString(proof.conclusion)).toBe('Q');
  });

  it('inl produce ∨I-L', () => {
    const proof = termToProof(inl(vr('x'), Q), { x: P });
    expect(proof.rule).toBe('∨I-L');
    expect(typeToString(proof.conclusion)).toBe('(P ∨ Q)');
  });

  it('case produce ∨E con dos descargas', () => {
    const term = cse(vr('s'), 'a', vr('a'), 'b', vr('b'));
    const proof = termToProof(term, { s: sum(P, P) });
    expect(proof.rule).toBe('∨E');
    expect(proof.discharged?.length).toBe(2);
  });

  it('absurd produce ⊥E', () => {
    const proof = termToProof(absurd(vr('f'), Q), { f: bottom() });
    expect(proof.rule).toBe('⊥E');
    expect(typeToString(proof.conclusion)).toBe('Q');
  });
});

describe('Curry-Howard / proofToTerm round-trip', () => {
  it('term → proof → term preserva tipos para identidad', () => {
    const t1 = abs('x', P, vr('x'));
    const proof = termToProof(t1);
    const t2 = proofToTerm(proof);
    const ty1 = inferType(t1);
    const ty2 = inferType(t2);
    expect(isInferError(ty1)).toBe(false);
    expect(isInferError(ty2)).toBe(false);
    if (!isInferError(ty1) && !isInferError(ty2)) {
      expect(eqType(ty1, ty2)).toBe(true);
    }
    expect(t2).toEqual(t1);
  });

  it('term → proof → term preserva tipos para composición', () => {
    const t1 = abs('f', arrow(P, Q), abs('x', P, app(vr('f'), vr('x'))));
    const proof = termToProof(t1);
    const t2 = proofToTerm(proof);
    expect(t2).toEqual(t1);
    const ty1 = inferType(t1);
    const ty2 = inferType(t2);
    if (!isInferError(ty1) && !isInferError(ty2)) {
      expect(eqType(ty1, ty2)).toBe(true);
    }
  });

  it('term → proof → term preserva tipos para conmutatividad de ∨', () => {
    const t1 = abs('s', sum(P, Q), cse(vr('s'), 'x', inr(vr('x'), Q), 'y', inl(vr('y'), P)));
    const proof = termToProof(t1);
    const t2 = proofToTerm(proof);
    const ty1 = inferType(t1);
    const ty2 = inferType(t2);
    if (!isInferError(ty1) && !isInferError(ty2)) {
      expect(eqType(ty1, ty2)).toBe(true);
    }
  });

  it('proofIsConsistent confirma coherencia para árboles válidos', () => {
    const t = abs('p', product(P, Q), pair(snd(vr('p')), fst(vr('p'))));
    const proof = termToProof(t);
    expect(proofIsConsistent(proof)).toBe(true);
  });

  it('ex falso preserva tipo: λf:⊥. absurd(f):P', () => {
    const t1 = abs('f', bottom(), absurd(vr('f'), P));
    const proof = termToProof(t1);
    expect(proof.rule).toBe('→I');
    const t2 = proofToTerm(proof);
    const ty = inferType(t2);
    if (!isInferError(ty)) expect(typeToString(ty)).toBe('⊥ → P');
  });
});
