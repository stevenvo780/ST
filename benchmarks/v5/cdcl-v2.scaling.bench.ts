/**
 * CDCL v2 — Scaling benchmarks.
 * --------------------------------------------------------------
 * Instancias 3-SAT con 10, 30, 100, 300 variables (ratio clauses/vars
 * justo en el umbral de transición ≈4.25). Seeds fijos.
 */
import { bench, describe } from 'vitest';
import { solveCDCLv2 } from '../../src/solver/cdcl-v2';

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gen3SAT(vars: number, numClauses: number, seed: number): Int32Array[] {
  const r = mulberry32(seed);
  const out: Int32Array[] = [];
  for (let i = 0; i < numClauses; i++) {
    const used = new Set<number>();
    const lits: number[] = [];
    while (lits.length < 3) {
      const v = Math.floor(r() * vars) + 1;
      if (used.has(v)) continue;
      used.add(v);
      lits.push(r() < 0.5 ? -v : v);
    }
    out.push(new Int32Array(lits));
  }
  return out;
}

const INST_10 = { clauses: gen3SAT(10, 42, 1), vars: 10 };
const INST_30 = { clauses: gen3SAT(30, 127, 2), vars: 30 };
const INST_100 = { clauses: gen3SAT(100, 425, 3), vars: 100 };
const INST_300 = { clauses: gen3SAT(300, 1275, 4), vars: 300 };

describe('CDCL v2: 3-SAT scaling', () => {
  bench('3-SAT 10 vars / 42 clauses', () => {
    solveCDCLv2(INST_10.clauses, INST_10.vars);
  });

  bench('3-SAT 30 vars / 127 clauses', () => {
    solveCDCLv2(INST_30.clauses, INST_30.vars);
  });

  bench('3-SAT 100 vars / 425 clauses', () => {
    solveCDCLv2(INST_100.clauses, INST_100.vars);
  });

  bench(
    '3-SAT 300 vars / 1275 clauses',
    () => {
      solveCDCLv2(INST_300.clauses, INST_300.vars, { timeoutMs: 5000 });
    },
    { time: 2000 },
  );
});
