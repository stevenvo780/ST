/**
 * MLTT — Normalization benchmarks.
 * --------------------------------------------------------------
 * Reducción β en términos de Martin-Löf con varios niveles de
 * anidamiento + Nat / succ peano.
 */
import { bench, describe } from 'vitest';
import {
  mVar,
  mLam,
  mApp,
  mPi,
  mNat,
  mZero,
  mSucc,
  mUniverse,
  normalize,
  inferType,
} from '../../src/mltt';

// Identity at Type 0
const ID_TY = mPi('x', mUniverse(0), mVar('x'));
const ID = mLam('A', mUniverse(0), mLam('x', mVar('A'), mVar('x')));

// id(Nat, succ(zero))
const APP_ID = mApp(mApp(ID, mNat()), mSucc(mZero()));

// Church-ish boolean applied
const TRUE_F = mLam('a', mNat(), mLam('b', mNat(), mVar('a')));
const APP_TRUE = mApp(mApp(TRUE_F, mSucc(mZero())), mZero());

// Composition: (λf.λg.λx. f (g x)) succ succ
const COMP = mLam(
  'f',
  mPi('_', mNat(), mNat()),
  mLam(
    'g',
    mPi('_', mNat(), mNat()),
    mLam('x', mNat(), mApp(mVar('f'), mApp(mVar('g'), mVar('x')))),
  ),
);

// Build peano n via succ^n(zero)
function peano(n: number) {
  let t = mZero();
  for (let i = 0; i < n; i++) t = mSucc(t);
  return t;
}

const NAT_5 = peano(5);
const NAT_20 = peano(20);

describe('MLTT: normalize', () => {
  bench('normalize identity application', () => {
    normalize(APP_ID);
  });

  bench('normalize Church-ish true projection', () => {
    normalize(APP_TRUE);
  });

  bench('normalize peano(5)', () => {
    normalize(NAT_5);
  });

  bench('normalize peano(20)', () => {
    normalize(NAT_20);
  });

  bench('normalize composition skeleton', () => {
    normalize(COMP);
  });
});

describe('MLTT: type inference', () => {
  bench('infer type of identity', () => {
    inferType(ID);
  });

  bench('infer type of peano(20)', () => {
    inferType(NAT_20);
  });
});
