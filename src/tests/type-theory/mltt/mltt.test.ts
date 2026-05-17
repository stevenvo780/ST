import { describe, it, expect } from 'vitest';
import {
  mApp,
  mArrow,
  mFst,
  mId,
  mLam,
  mNat,
  mPair,
  mPi,
  mRefl,
  mSigma,
  mSnd,
  mSucc,
  mUniverse,
  mVar,
  mZero,
  alphaBetaEq,
  alphaEq,
  checkType,
  inferType,
  isInferError,
  isNormal,
  normalize,
  occursFree,
  reduceStep,
  termToString,
  type MLTTTerm,
} from '../../../type-theory/mltt';

function unwrap(r: ReturnType<typeof inferType>): MLTTTerm {
  if (isInferError(r)) throw new Error(`unexpected error: ${r.error}`);
  return r;
}

describe('MLTT / inferType — núcleo', () => {
  it('λ (x : Nat). x infiere Π (x : Nat). Nat', () => {
    const term = mLam('x', mNat(), mVar('x'));
    const t = unwrap(inferType(term));
    expect(termToString(t)).toBe('(Nat → Nat)');
  });

  it('zero : Nat', () => {
    const t = unwrap(inferType(mZero()));
    expect(t.kind).toBe('nat');
  });

  it('succ (succ zero) : Nat', () => {
    const t = unwrap(inferType(mSucc(mSucc(mZero()))));
    expect(t.kind).toBe('nat');
  });

  it('refl(zero) : Id(Nat, zero, zero)', () => {
    const t = unwrap(inferType(mRefl(mZero())));
    expect(t.kind).toBe('identity');
    expect(termToString(t)).toBe('Id(Nat, zero, zero)');
  });

  it('Π (x : Nat). Nat : Type 0', () => {
    const t = unwrap(inferType(mPi('x', mNat(), mNat())));
    expect(termToString(t)).toBe('Type');
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });

  it('Π (A : Type). Π (x : A). A : Type 1 (universo polimórfico simple)', () => {
    const term = mPi('A', mUniverse(0), mPi('x', mVar('A'), mVar('A')));
    const t = unwrap(inferType(term));
    expect(t.kind === 'universe' && t.level === 1).toBe(true);
  });

  it('Type 0 : Type 1', () => {
    const t = unwrap(inferType(mUniverse(0)));
    expect(t.kind === 'universe' && t.level === 1).toBe(true);
  });

  it('Type 3 : Type 4', () => {
    const t = unwrap(inferType(mUniverse(3)));
    expect(t.kind === 'universe' && t.level === 4).toBe(true);
  });

  it('Nat : Type 0', () => {
    const t = unwrap(inferType(mNat()));
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });

  it('aplicación bien-tipada: (λ x:Nat. x) zero : Nat', () => {
    const term = mApp(mLam('x', mNat(), mVar('x')), mZero());
    const t = unwrap(inferType(term));
    expect(t.kind).toBe('nat');
  });

  it('aplicación dependiente: identidad polimórfica aplicada a Nat y zero', () => {
    // id : Π (A : Type). Π (x : A). A
    const id = mLam('A', mUniverse(0), mLam('x', mVar('A'), mVar('x')));
    const t = unwrap(inferType(id));
    // (id Nat) : Π (x : Nat). Nat
    const idNat = mApp(id, mNat());
    const tIdNat = unwrap(inferType(idNat));
    expect(normalize(tIdNat).kind).toBe('pi');
    // (id Nat zero) : Nat
    const idNatZero = mApp(idNat, mZero());
    const tIdNatZero = unwrap(inferType(idNatZero));
    expect(normalize(tIdNatZero).kind).toBe('nat');
    expect(t.kind).toBe('pi');
  });

  it('rechaza variable libre sin contexto', () => {
    const r = inferType(mVar('x'));
    expect(isInferError(r)).toBe(true);
  });

  it('rechaza aplicación con argumento de tipo incorrecto', () => {
    // (λ x:Nat. x) Type   → error
    const term = mApp(mLam('x', mNat(), mVar('x')), mUniverse(0));
    const r = inferType(term);
    expect(isInferError(r)).toBe(true);
  });

  it('rechaza refl(a) si los lados no concuerdan en Id explícito mal armado', () => {
    // Id(Nat, zero, Type) — derecha no es Nat
    const term = mId(mNat(), mZero(), mUniverse(0));
    const r = inferType(term);
    expect(isInferError(r)).toBe(true);
  });
});

describe('MLTT / Σ pares dependientes', () => {
  it('pair ⟨zero, zero⟩ infiere Σ (_ : Nat). Nat', () => {
    const t = unwrap(inferType(mPair(mZero(), mZero())));
    expect(t.kind).toBe('sigma');
  });

  it('fst ⟨zero, succ zero⟩ ↦ zero (ι1)', () => {
    const p = mPair(mZero(), mSucc(mZero()));
    expect(alphaEq(normalize(mFst(p)), mZero())).toBe(true);
  });

  it('snd ⟨zero, succ zero⟩ ↦ succ zero (ι2)', () => {
    const p = mPair(mZero(), mSucc(mZero()));
    expect(alphaEq(normalize(mSnd(p)), mSucc(mZero()))).toBe(true);
  });

  it('checkType acepta ⟨zero, refl zero⟩ : Σ (n : Nat). Id(Nat, n, n)', () => {
    const sigma = mSigma('n', mNat(), mId(mNat(), mVar('n'), mVar('n')));
    const pair = mPair(mZero(), mRefl(mZero()));
    expect(checkType(pair, sigma)).toBe(true);
  });

  it('checkType rechaza ⟨succ zero, refl zero⟩ : Σ (n : Nat). Id(Nat, n, n)', () => {
    const sigma = mSigma('n', mNat(), mId(mNat(), mVar('n'), mVar('n')));
    const pair = mPair(mSucc(mZero()), mRefl(mZero()));
    expect(checkType(pair, sigma)).toBe(false);
  });

  it('Σ (n : Nat). Nat : Type 0', () => {
    const t = unwrap(inferType(mSigma('n', mNat(), mNat())));
    expect(t.kind === 'universe' && t.level === 0).toBe(true);
  });
});

describe('MLTT / β-reducción y normalización', () => {
  it('(λ x:Nat. x) zero β→ zero', () => {
    const t = mApp(mLam('x', mNat(), mVar('x')), mZero());
    expect(alphaEq(reduceStep(t), mZero())).toBe(true);
  });

  it('normalize idempotente sobre forma normal (succ zero)', () => {
    expect(isNormal(mSucc(mZero()))).toBe(true);
    expect(alphaEq(normalize(mSucc(mZero())), mSucc(mZero()))).toBe(true);
  });

  it('alphaBetaEq: (λ x:Nat. x) zero ≡ zero', () => {
    expect(alphaBetaEq(mApp(mLam('x', mNat(), mVar('x')), mZero()), mZero())).toBe(true);
  });

  it('alphaBetaEq distingue zero y succ zero', () => {
    expect(alphaBetaEq(mZero(), mSucc(mZero()))).toBe(false);
  });

  it('α-equivalencia: λ x:Nat. x ≡ λ y:Nat. y', () => {
    const a = mLam('x', mNat(), mVar('x'));
    const b = mLam('y', mNat(), mVar('y'));
    expect(alphaEq(a, b)).toBe(true);
  });

  it('reducción dentro de Π: Π (_ : (λx:Type. x) Nat). Nat normaliza a Nat → Nat', () => {
    // dominio aplica una λ que reduce a Nat
    const reducingDom = mApp(mLam('x', mUniverse(0), mVar('x')), mNat());
    const term = mPi('_', reducingDom, mNat());
    const nf = normalize(term);
    expect(alphaEq(nf, mArrow(mNat(), mNat()))).toBe(true);
  });
});

describe('MLTT / checkType bidireccional', () => {
  it('checkType acepta λ (x : Nat). x contra Nat → Nat', () => {
    const term = mLam('x', mNat(), mVar('x'));
    expect(checkType(term, mArrow(mNat(), mNat()))).toBe(true);
  });

  it('checkType acepta zero : Nat', () => {
    expect(checkType(mZero(), mNat())).toBe(true);
  });

  it('checkType rechaza zero : Type', () => {
    expect(checkType(mZero(), mUniverse(0))).toBe(false);
  });

  it('checkType acepta refl(succ zero) : Id(Nat, succ zero, succ zero)', () => {
    expect(checkType(mRefl(mSucc(mZero())), mId(mNat(), mSucc(mZero()), mSucc(mZero())))).toBe(
      true,
    );
  });

  it('occursFree detecta dependencia en codomain de Π', () => {
    // Π (x : Nat). Id(Nat, x, x)  — x ocurre libre en codomain
    const term = mPi('x', mNat(), mId(mNat(), mVar('x'), mVar('x')));
    if (term.kind !== 'pi') throw new Error('expected pi');
    expect(occursFree('x', term.codomain)).toBe(true);
  });

  it('occursFree falso para familia constante Π (x : Nat). Nat', () => {
    const term = mPi('x', mNat(), mNat());
    if (term.kind !== 'pi') throw new Error('expected pi');
    expect(occursFree('x', term.codomain)).toBe(false);
  });
});

describe('MLTT / serialización', () => {
  it('termToString para Π (x : Nat). Id(Nat, x, x)', () => {
    const term = mPi('x', mNat(), mId(mNat(), mVar('x'), mVar('x')));
    expect(termToString(term)).toBe('(Π (x : Nat). Id(Nat, x, x))');
  });

  it('termToString colapsa Π no-dependiente a →', () => {
    const term = mPi('x', mNat(), mNat());
    expect(termToString(term)).toBe('(Nat → Nat)');
  });
});
