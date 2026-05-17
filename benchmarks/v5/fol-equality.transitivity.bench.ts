/**
 * FOL Equality Prover — Transitivity benchmarks.
 * --------------------------------------------------------------
 * Resolución con paramodulation sobre cadenas a1=a2=…=aN.
 */
import { bench, describe } from 'vitest';
import { proveWithEquality } from '../../src/fol-prover-equality';
import type { Formula } from '../../src/types';

const equals = (a: string, b: string): Formula => ({
  kind: 'equals',
  params: [a, b],
  terms: [a, b],
});

function chain(n: number): Formula[] {
  // a0 = a1, a1 = a2, ..., a_{n-1} = a_n
  const out: Formula[] = [];
  for (let i = 0; i < n; i++) out.push(equals(`a${i}`, `a${i + 1}`));
  return out;
}

const PREMS_3 = chain(3);
const PREMS_5 = chain(5);
const PREMS_8 = chain(8);

const GOAL_3 = equals('a0', 'a3');
const GOAL_5 = equals('a0', 'a5');
const GOAL_8 = equals('a0', 'a8');

describe('FOL equality: transitivity chains', () => {
  bench('chain of 3 equalities', () => {
    proveWithEquality(PREMS_3, GOAL_3, { timeoutMs: 3000, maxSteps: 300 });
  });

  bench('chain of 5 equalities', () => {
    proveWithEquality(PREMS_5, GOAL_5, { timeoutMs: 5000, maxSteps: 700 });
  });

  bench(
    'chain of 8 equalities',
    () => {
      proveWithEquality(PREMS_8, GOAL_8, { timeoutMs: 8000, maxSteps: 1500 });
    },
    { time: 2000 },
  );
});
