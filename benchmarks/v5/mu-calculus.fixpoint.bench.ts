/**
 * μ-calculus — Fixpoint model checking benchmarks.
 * --------------------------------------------------------------
 * Mide modelCheck sobre Kripke structures de tamaño creciente
 * con fórmulas μ/ν típicas (EF, AG, equivalentes CTL).
 */
import { bench, describe } from 'vitest';
import { modelCheck } from '../../src/profiles/mu-calculus';
import type {
  KripkeStructure,
  MuFormula,
} from '../../src/profiles/mu-calculus';

// ── builders ──────────────────────────────────────────────────
const atom = (name: string): MuFormula => ({ kind: 'atom', name });
const v = (name: string): MuFormula => ({ kind: 'var', name });
const or = (left: MuFormula, right: MuFormula): MuFormula => ({
  kind: 'or',
  left,
  right,
});
const and = (left: MuFormula, right: MuFormula): MuFormula => ({
  kind: 'and',
  left,
  right,
});
const diamond = (arg: MuFormula): MuFormula => ({ kind: 'diamond', arg });
const box = (arg: MuFormula): MuFormula => ({ kind: 'box', arg });
const mu = (bind: string, body: MuFormula): MuFormula => ({ kind: 'mu', bind, body });
const nu = (bind: string, body: MuFormula): MuFormula => ({ kind: 'nu', bind, body });

// EF p ≡ μX. p ∨ ◇X
const EF_P = mu('X', or(atom('p'), diamond(v('X'))));
// AG p ≡ νX. p ∧ □X
const AG_P = nu('X', and(atom('p'), box(v('X'))));

function buildLineKripke(n: number): KripkeStructure {
  const states = Array.from({ length: n }, (_, i) => `s${i}`);
  const transitions: Array<[string, string]> = [];
  for (let i = 0; i < n - 1; i++) transitions.push([`s${i}`, `s${i + 1}`]);
  transitions.push([`s${n - 1}`, `s${n - 1}`]); // self-loop at end
  const labelling: Record<string, Set<string>> = {};
  for (const s of states) labelling[s] = new Set();
  labelling[`s${n - 1}`] = new Set(['p']); // p only at the end
  return { states, transitions, labelling };
}

function buildRingKripke(n: number): KripkeStructure {
  const states = Array.from({ length: n }, (_, i) => `s${i}`);
  const transitions: Array<[string, string]> = [];
  for (let i = 0; i < n; i++) transitions.push([`s${i}`, `s${(i + 1) % n}`]);
  const labelling: Record<string, Set<string>> = {};
  for (const s of states) labelling[s] = new Set();
  labelling.s0 = new Set(['p']);
  return { states, transitions, labelling };
}

const LINE_50 = buildLineKripke(50);
const LINE_200 = buildLineKripke(200);
const LINE_500 = buildLineKripke(500);
const RING_100 = buildRingKripke(100);

describe('μ-calculus: fixpoint computation', () => {
  bench('EF p on line of 50', () => {
    modelCheck(LINE_50, EF_P);
  });

  bench('EF p on line of 200', () => {
    modelCheck(LINE_200, EF_P);
  });

  bench('EF p on line of 500', () => {
    modelCheck(LINE_500, EF_P);
  });

  bench('AG p on line of 200 (will be empty)', () => {
    modelCheck(LINE_200, AG_P);
  });

  bench('EF p on ring of 100', () => {
    modelCheck(RING_100, EF_P);
  });
});
