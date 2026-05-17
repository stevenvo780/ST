/**
 * Bisimulation — Paige-Tarjan partition refinement benchmarks.
 * --------------------------------------------------------------
 * LTS con 100/500/1000 estados + transiciones aleatorias seedeadas.
 */
import { bench, describe } from 'vitest';
import { paigeTarjan, quotientLTS } from '../../src/runtime/bisimulation';
import type { LTS } from '../../src/runtime/bisimulation';

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLTS(n: number, edgesPerNode: number, alphabet: number, seed: number): LTS {
  const r = mulberry32(seed);
  const states = Array.from({ length: n }, (_, i) => `s${i}`);
  const acts = Array.from({ length: alphabet }, (_, i) => `a${i}`);
  const transitions: Array<[string, string, string]> = [];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < edgesPerNode; k++) {
      const to = Math.floor(r() * n);
      const act = acts[Math.floor(r() * alphabet)]!;
      transitions.push([`s${i}`, act, `s${to}`]);
    }
  }
  const labelling: Record<string, Set<string>> = {};
  for (const s of states) {
    // ~ 50% of states get a label
    if (r() < 0.5) labelling[s] = new Set([r() < 0.5 ? 'p' : 'q']);
    else labelling[s] = new Set();
  }
  return { states, transitions, labelling };
}

const LTS_100 = buildLTS(100, 3, 2, 11);
const LTS_500 = buildLTS(500, 3, 3, 12);
const LTS_1000 = buildLTS(1000, 3, 3, 13);
const LTS_DEAD = buildLTS(200, 0, 1, 14); // no transitions = each state isolated

describe('Bisimulation: Paige-Tarjan', () => {
  bench('100-state LTS, ~3 edges/state', () => {
    paigeTarjan(LTS_100);
  });

  bench('500-state LTS, ~3 edges/state', () => {
    paigeTarjan(LTS_500);
  });

  bench(
    '1000-state LTS, ~3 edges/state',
    () => {
      paigeTarjan(LTS_1000);
    },
    { time: 2000 },
  );

  bench('200-state LTS with no transitions (label-only partition)', () => {
    paigeTarjan(LTS_DEAD);
  });
});

describe('Bisimulation: quotient LTS', () => {
  bench('quotient 500-state LTS', () => {
    quotientLTS(LTS_500);
  });

  bench('quotient 100-state LTS', () => {
    quotientLTS(LTS_100);
  });
});
