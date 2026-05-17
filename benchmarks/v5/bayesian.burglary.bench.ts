/**
 * Probabilistic / Bayesian — Burglary network style benchmarks.
 * --------------------------------------------------------------
 * Usa el perfil ProbabilisticBasic (validez/satisfacibilidad con
 * probabilidades) para correr inferencias sobre fórmulas con
 * varios átomos como Burglary/Alarm/JohnCalls.
 */
import { bench, describe } from 'vitest';
import { ProbabilisticBasic } from '../../src/profiles/probabilistic/basic';
import type { Formula } from '../../src/types';

const profile = new ProbabilisticBasic();

const a = (name: string): Formula => ({ kind: 'atom', name });
const and = (x: Formula, y: Formula): Formula => ({ kind: 'and', args: [x, y] });
const or = (x: Formula, y: Formula): Formula => ({ kind: 'or', args: [x, y] });
const not = (x: Formula): Formula => ({ kind: 'not', args: [x] });
const implies = (x: Formula, y: Formula): Formula => ({ kind: 'implies', args: [x, y] });
const bicon = (x: Formula, y: Formula): Formula => ({ kind: 'biconditional', args: [x, y] });

// Simulamos burglary: B (burglary), E (earthquake), A (alarm),
// J (JohnCalls), M (MaryCalls). 5 átomos = 32 mundos. Pesado pero finito.

const B = a('B');
const E = a('E');
const A = a('A');
const J = a('J');
const M = a('M');

// Goal queries (las validamos como tautologías probabilísticas o no)
const F_2_ATOMS = implies(B, or(A, not(A))); // trivial tautology
const F_3_ATOMS = bicon(and(B, E), and(E, B)); // commutativity
const F_4_ATOMS = implies(and(A, J), or(A, M));
const F_5_ATOMS = implies(and(and(A, J), M), or(B, E));

describe('Probabilistic: checkValid on Bayesian-style formulas', () => {
  bench('valid: 2-atom material tautology', () => {
    profile.checkValid(F_2_ATOMS);
  });

  bench('valid: 3-atom commutativity', () => {
    profile.checkValid(F_3_ATOMS);
  });

  bench('valid: 4-atom alarm implication', () => {
    profile.checkValid(F_4_ATOMS);
  });

  bench(
    'valid: 5-atom burglary network',
    () => {
      profile.checkValid(F_5_ATOMS);
    },
    { time: 1500 },
  );
});

describe('Probabilistic: checkSatisfiable', () => {
  bench('sat: 4-atom conjunction', () => {
    profile.checkSatisfiable(and(and(B, E), and(A, J)));
  });

  bench('sat: 5-atom disjunction', () => {
    profile.checkSatisfiable(or(or(B, E), or(A, or(J, M))));
  });
});
