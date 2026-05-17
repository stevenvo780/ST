// ============================================================
// CSPs predefinidos: graph coloring y N-queens.
// ============================================================
// Ambos se modelan como CSPs binarios estándar para que AC-3 sea
// directamente aplicable.
// ============================================================

import { backtrack } from './backtrack';
import type { CSP, Constraint } from './types';

/**
 * k-coloreo de un grafo no dirigido.
 *
 * Variables: nodos del grafo.
 * Dominios:  {0, 1, ..., numColors-1}.
 * Restricción binaria por arista (u, v): color(u) ≠ color(v).
 *
 * Devuelve un mapeo nodo → color o `null` si el grafo no es
 * k-coloreable.
 */
export function graphColoring(
  graph: { nodes: string[]; edges: Array<[string, string]> },
  numColors: number,
): Map<string, number> | null {
  if (numColors <= 0) return null;
  const colors: number[] = [];
  for (let i = 0; i < numColors; i++) colors.push(i);

  const domains = new Map<string, number[]>();
  for (const n of graph.nodes) domains.set(n, [...colors]);

  const constraints: Constraint<string, number>[] = [];
  // Deduplicar aristas (u,v) y (v,u).
  const seen = new Set<string>();
  for (const [u, v] of graph.edges) {
    if (u === v) {
      // Self-loop ⇒ trivialmente UNSAT.
      return null;
    }
    const key = u < v ? `${u}|${v}` : `${v}|${u}`;
    if (seen.has(key)) continue;
    seen.add(key);
    constraints.push({
      vars: [u, v],
      predicate: ([a, b]) => a !== b,
    });
  }

  const csp: CSP<string, number> = {
    variables: [...graph.nodes],
    domains,
    constraints,
  };
  const result = backtrack(csp);
  return result.solution;
}

/**
 * N-queens. Modelo CSP estándar:
 *   Variables: row 0..n-1 (una reina por fila).
 *   Dominio: columna ∈ {0, ..., n-1}.
 *   Restricción binaria entre filas (i, j):
 *     col(i) ≠ col(j)            (no misma columna)
 *     |col(i) - col(j)| ≠ |i-j|  (no misma diagonal)
 *
 * Devuelve un array `cols` donde `cols[r]` es la columna de la
 * reina en la fila r, o `null` si no hay solución (n=2, n=3).
 */
export function nQueens(n: number): number[] | null {
  if (n <= 0) return null;
  if (n === 1) return [0];

  const variables: number[] = [];
  for (let i = 0; i < n; i++) variables.push(i);
  const domains = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const d: number[] = [];
    for (let j = 0; j < n; j++) d.push(j);
    domains.set(i, d);
  }

  const constraints: Constraint<number, number>[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rowDiff = j - i;
      constraints.push({
        vars: [i, j],
        predicate: ([ci, cj]) => {
          if (ci === undefined || cj === undefined) return false;
          if (ci === cj) return false;
          if (Math.abs(ci - cj) === rowDiff) return false;
          return true;
        },
      });
    }
  }

  const csp: CSP<number, number> = { variables, domains, constraints };
  const result = backtrack(csp);
  if (!result.solution) return null;
  const out: number[] = new Array<number>(n).fill(-1);
  for (const [row, col] of result.solution) out[row] = col;
  return out;
}
