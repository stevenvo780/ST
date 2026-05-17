/**
 * FOL Prover — Standard TPTP-style problems (small).
 * --------------------------------------------------------------
 * Resolución first-order sobre problemas tipo TPTP simplificados:
 * silogismos, modus tollens, transitividad, group axioms light.
 */
import { bench, describe } from 'vitest';
import { proveFOL } from '../../src/fol-prover/prove';
import type { Formula } from '../../src/types';

// ── builders ──────────────────────────────────────────────────
const P = (name: string, args: string[]): Formula => ({
  kind: 'predicate',
  name,
  params: args,
  terms: args,
});
const forall = (v: string, body: Formula): Formula => ({
  kind: 'forall',
  variable: v,
  args: [body],
});
const exists = (v: string, body: Formula): Formula => ({
  kind: 'exists',
  variable: v,
  args: [body],
});
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });

// ── Problem 1: Socrates syllogism ─────────────────────────────
const SOC_PREMS: Formula[] = [
  forall('x', implies(P('Human', ['x']), P('Mortal', ['x']))),
  P('Human', ['socrates']),
];
const SOC_GOAL: Formula = P('Mortal', ['socrates']);

// ── Problem 2: 4-link transitivity ────────────────────────────
const TRANS4_PREMS: Formula[] = [
  forall('x', implies(P('A', ['x']), P('B', ['x']))),
  forall('x', implies(P('B', ['x']), P('C', ['x']))),
  forall('x', implies(P('C', ['x']), P('D', ['x']))),
  forall('x', implies(P('D', ['x']), P('E', ['x']))),
  P('A', ['c0']),
];
const TRANS4_GOAL: Formula = P('E', ['c0']);

// ── Problem 3: modus tollens ──────────────────────────────────
const MT_PREMS: Formula[] = [
  forall('x', implies(P('P', ['x']), P('Q', ['x']))),
  not(P('Q', ['a'])),
];
const MT_GOAL: Formula = not(P('P', ['a']));

// ── Problem 4: existential introduction ───────────────────────
const EXI_PREMS: Formula[] = [P('Loves', ['mary', 'john'])];
const EXI_GOAL: Formula = exists('y', P('Loves', ['mary', 'y']));

// ── Problem 5: disjunction elimination ────────────────────────
const DE_PREMS: Formula[] = [
  forall('x', implies(P('Cat', ['x']), P('Pet', ['x']))),
  forall('x', implies(P('Dog', ['x']), P('Pet', ['x']))),
  P('Cat', ['fluffy']),
];
const DE_GOAL: Formula = P('Pet', ['fluffy']);

describe('FOL prover: TPTP-style standard problems', () => {
  bench('Socrates syllogism', () => {
    proveFOL(SOC_PREMS, SOC_GOAL, { timeoutMs: 2000, maxSteps: 200 });
  });

  bench('4-link transitivity', () => {
    proveFOL(TRANS4_PREMS, TRANS4_GOAL, { timeoutMs: 3000, maxSteps: 500 });
  });

  bench('modus tollens', () => {
    proveFOL(MT_PREMS, MT_GOAL, { timeoutMs: 2000, maxSteps: 200 });
  });

  bench('existential introduction', () => {
    proveFOL(EXI_PREMS, EXI_GOAL, { timeoutMs: 2000, maxSteps: 200 });
  });

  bench('disjunction over predicates', () => {
    proveFOL(DE_PREMS, DE_GOAL, { timeoutMs: 2000, maxSteps: 300 });
  });
});
