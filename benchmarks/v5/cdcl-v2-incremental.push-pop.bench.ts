/**
 * CDCL v2 Incremental — push/pop sequence benchmarks.
 * --------------------------------------------------------------
 * Mide el overhead de checkpoint/rollback en sequences largas.
 */
import { bench, describe } from 'vitest';
import { IncrementalCDCL } from '../../src/solver/cdcl-v2-incremental';

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gen3SATClauses(vars: number, numClauses: number, seed: number): number[][] {
  const r = mulberry32(seed);
  const out: number[][] = [];
  for (let i = 0; i < numClauses; i++) {
    const used = new Set<number>();
    const lits: number[] = [];
    while (lits.length < 3) {
      const v = Math.floor(r() * vars) + 1;
      if (used.has(v)) continue;
      used.add(v);
      lits.push(r() < 0.5 ? -v : v);
    }
    out.push(lits);
  }
  return out;
}

const VARS = 20;
const BASE_CLAUSES = gen3SATClauses(VARS, 60, 17);

function setupSolver(): IncrementalCDCL {
  const s = new IncrementalCDCL(VARS);
  for (const c of BASE_CLAUSES) s.addClause(c);
  return s;
}

describe('CDCL incremental: push/pop overhead', () => {
  bench('100 push/pop without solve', () => {
    const s = setupSolver();
    for (let i = 0; i < 100; i++) {
      s.push();
      s.addClause([i % VARS + 1]);
      s.pop();
    }
  });

  bench('500 push/pop without solve', () => {
    const s = setupSolver();
    for (let i = 0; i < 500; i++) {
      s.push();
      s.addClause([(i % VARS) + 1]);
      s.pop();
    }
  });

  bench('1000 push/pop without solve', () => {
    const s = setupSolver();
    for (let i = 0; i < 1000; i++) {
      s.push();
      s.addClause([(i % VARS) + 1]);
      s.pop();
    }
  });

  bench('100 push + solve + pop', () => {
    const s = setupSolver();
    for (let i = 0; i < 100; i++) {
      s.push();
      s.solve([(i % VARS) + 1]);
      s.pop();
    }
  });
});
