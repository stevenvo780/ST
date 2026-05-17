/**
 * System F — Type inference on large polymorphic terms.
 * --------------------------------------------------------------
 * Mide typeOf sobre términos anidados con type abstractions /
 * applications a varios niveles.
 */
import { bench, describe } from 'vitest';
import {
  fAtom,
  fArrow,
  fForall,
  fVar,
  fAbs,
  fApp,
  fTAbs,
  fTApp,
  typeOf,
  normalize,
} from '../../src/system-f';

const X = fAtom('X');

// Polymorphic identity: ΛX. λx:X. x : ∀X. X → X
const POLY_ID = fTAbs('X', fAbs('x', X, fVar('x')));

// Self-apply identity to itself at type (∀X. X→X)
const ID_TYPE = fForall('X', fArrow(X, X));
const APPLY_ID_TO_ID = fApp(fTApp(POLY_ID, ID_TYPE), POLY_ID);

// Church-encoded boolean true: ΛX. λt:X. λf:X. t
const TRUE = fTAbs('X', fAbs('t', X, fAbs('f', X, fVar('t'))));

// Deep type-application chain
function deepTAppChain(n: number) {
  let term = POLY_ID;
  for (let i = 0; i < n; i++) {
    term = fApp(fTApp(POLY_ID, ID_TYPE), term);
  }
  return term;
}

const CHAIN_5 = deepTAppChain(5);
const CHAIN_20 = deepTAppChain(20);
const CHAIN_50 = deepTAppChain(50);

// Polymorphic compose: ΛX.ΛY.ΛZ.λf:Y→Z.λg:X→Y.λx:X. f (g x)
const Y = fAtom('Y');
const Z = fAtom('Z');
const COMPOSE = fTAbs(
  'X',
  fTAbs(
    'Y',
    fTAbs(
      'Z',
      fAbs(
        'f',
        fArrow(Y, Z),
        fAbs(
          'g',
          fArrow(X, Y),
          fAbs('x', X, fApp(fVar('f'), fApp(fVar('g'), fVar('x')))),
        ),
      ),
    ),
  ),
);

describe('System F: typeOf on large terms', () => {
  bench('typeOf polymorphic identity', () => {
    typeOf(POLY_ID);
  });

  bench('typeOf compose (3 type abs)', () => {
    typeOf(COMPOSE);
  });

  bench('typeOf chain of 5 type-apps', () => {
    typeOf(CHAIN_5);
  });

  bench('typeOf chain of 20 type-apps', () => {
    typeOf(CHAIN_20);
  });

  bench('typeOf chain of 50 type-apps', () => {
    typeOf(CHAIN_50);
  });
});

describe('System F: normalize', () => {
  bench('normalize identity-applied-to-identity', () => {
    normalize(APPLY_ID_TO_ID);
  });

  bench('normalize chain of 20 type-apps', () => {
    normalize(CHAIN_20);
  });
});
