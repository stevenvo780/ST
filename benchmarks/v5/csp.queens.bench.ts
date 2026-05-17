/**
 * CSP — N-Queens benchmarks.
 * --------------------------------------------------------------
 * Resolución del problema N-queens via backtracking con AC-3.
 */
import { bench, describe } from 'vitest';
import { nQueens, graphColoring, ac3, backtrack } from '../../src/runtime/csp';
import type { CSP } from '../../src/runtime/csp';

describe('CSP: N-Queens', () => {
  bench('N-Queens N=4', () => {
    nQueens(4);
  });

  bench('N-Queens N=8', () => {
    nQueens(8);
  });

  bench(
    'N-Queens N=12',
    () => {
      nQueens(12);
    },
    { time: 2000 },
  );
});

// ── Graph coloring CSPs ─────────────────────────────────────
function cycleGraph(n: number): { nodes: string[]; edges: Array<[string, string]> } {
  const nodes = Array.from({ length: n }, (_, i) => `n${i}`);
  const edges: Array<[string, string]> = [];
  for (let i = 0; i < n; i++) edges.push([`n${i}`, `n${(i + 1) % n}`]);
  return { nodes, edges };
}

const CYCLE_6 = cycleGraph(6);
const CYCLE_10 = cycleGraph(10);

describe('CSP: graph coloring', () => {
  bench('cycle-6 3-color', () => {
    graphColoring(CYCLE_6, 3);
  });

  bench('cycle-10 3-color', () => {
    graphColoring(CYCLE_10, 3);
  });

  bench('cycle-10 4-color', () => {
    graphColoring(CYCLE_10, 4);
  });
});

// ── AC-3 stress ──────────────────────────────────────────────
function buildAllDifferent(n: number): CSP<string, number> {
  const variables = Array.from({ length: n }, (_, i) => `x${i}`);
  const domains = new Map<string, number[]>();
  for (const v of variables) domains.set(v, Array.from({ length: n }, (_, i) => i + 1));
  const constraints = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      constraints.push({
        vars: [`x${i}`, `x${j}`],
        predicate: (vals: number[]) => vals[0] !== vals[1],
      });
    }
  }
  return { variables, domains, constraints };
}

const ALLDIFF_5 = buildAllDifferent(5);
const ALLDIFF_8 = buildAllDifferent(8);

describe('CSP: AC-3 + backtrack', () => {
  bench('AC-3 on alldifferent N=5', () => {
    ac3(ALLDIFF_5);
  });

  bench('AC-3 on alldifferent N=8', () => {
    ac3(ALLDIFF_8);
  });

  bench('backtrack alldifferent N=5', () => {
    backtrack(ALLDIFF_5);
  });
});
