/**
 * λ-calculus untyped — Church arithmetic benchmarks.
 * --------------------------------------------------------------
 * Evalúa SUCC, PLUS, MULT sobre Church numerals con varios tamaños.
 */
import { bench, describe } from 'vitest';
import {
  ap,
  lam,
  v,
  normalize,
  churchNumeral,
  churchAdd,
  churchMul,
  churchSucc,
  evalChurch,
} from '../../src/lambda-calc';

const N3 = churchNumeral(3);
const N5 = churchNumeral(5);
const N7 = churchNumeral(7);
const N10 = churchNumeral(10);

describe('λ-calc: Church arithmetic', () => {
  bench('succ(3)', () => {
    evalChurch(ap(churchSucc, N3));
  });

  bench('3 + 5', () => {
    evalChurch(ap(ap(churchAdd, N3), N5));
  });

  bench('5 + 7', () => {
    evalChurch(ap(ap(churchAdd, N5), N7));
  });

  bench('3 * 5', () => {
    evalChurch(ap(ap(churchMul, N3), N5), 20000);
  });

  bench('5 * 7', () => {
    evalChurch(ap(ap(churchMul, N5), N7), 50000);
  });
});

describe('λ-calc: normalize raw terms', () => {
  // ((λx.x) (λy.y)) z  → z
  const APP_ID_TO_ID = ap(ap(lam('x', v('x')), lam('y', v('y'))), v('z'));

  // ω small: (λx. x x) (λy. y) → λy. y
  const WS_REDUCIBLE = ap(lam('x', ap(v('x'), v('x'))), lam('y', v('y')));

  bench('normalize id-id', () => {
    normalize(APP_ID_TO_ID);
  });

  bench('normalize self-app reducible', () => {
    normalize(WS_REDUCIBLE);
  });

  bench('normalize Church(10)', () => {
    normalize(N10);
  });
});
