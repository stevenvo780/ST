/**
 * NbE (Normalization by Evaluation) — Large STLC terms.
 * --------------------------------------------------------------
 * Mide reify + evaluate sobre términos simply-typed de tamaño
 * creciente.
 */
import { bench, describe } from 'vitest';
import {
  tBase,
  tArr,
  v,
  lam,
  ap,
  apN,
  normalize,
  type Term,
  type Type,
} from '../../src/nbe';

const A = tBase('A');
const AA = tArr(A, A);
const AAA = tArr(A, AA);

// Identity at A
const ID = lam('x', A, v('x'));

// K combinator at A: λx:A.λy:A. x
const K = lam('x', A, lam('y', A, v('x')));

// Apply K to two args
const K_APPLIED = apN(K, v('a'), v('b'));

// Long chain of identity applications: (id (id (id ... (id x))))
function idChain(n: number): Term {
  let inner: Term = v('x');
  for (let i = 0; i < n; i++) {
    inner = ap(ID, inner);
  }
  return lam('x', A, inner);
}

const CHAIN_10 = idChain(10);
const CHAIN_50 = idChain(50);
const CHAIN_200 = idChain(200);

// Nested binders
function nestedAbs(n: number): Term {
  let body: Term = v('x0');
  for (let i = n - 1; i >= 0; i--) {
    body = lam(`x${i}`, A, body);
  }
  return body;
}

const NEST_10 = nestedAbs(10);
const NEST_30 = nestedAbs(30);

describe('NbE: normalize large terms', () => {
  bench('normalize id-chain of 10', () => {
    normalize(CHAIN_10, AA);
  });

  bench('normalize id-chain of 50', () => {
    normalize(CHAIN_50, AA);
  });

  bench('normalize id-chain of 200', () => {
    normalize(CHAIN_200, AA);
  });

  bench('normalize K-applied', () => {
    normalize(K_APPLIED, A);
  });

  bench('normalize 10 nested abstractions', () => {
    // type of nestedAbs(10): A → A → ... → A (chain of 11 levels)
    let t: Type = A;
    for (let i = 0; i < 10; i++) t = tArr(A, t);
    normalize(NEST_10, t);
  });

  bench('normalize 30 nested abstractions', () => {
    let t: Type = A;
    for (let i = 0; i < 30; i++) t = tArr(A, t);
    normalize(NEST_30, t);
  });
});
