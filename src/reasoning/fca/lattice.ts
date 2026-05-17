// ============================================================
// FCA — diagrama de Hasse del concept lattice.
// ============================================================
// Para un conjunto B(K) de conceptos ordenado por inclusión de extent
//   (A1, B1) ≤ (A2, B2)  ⇔  A1 ⊆ A2
// la relación de cobertura es:
//   c ≺ p  sii  c < p  y  no existe q con c < q < p.
//
// El "diagrama de Hasse" representa B(K) como un DAG con sólo las aristas
// de cobertura. Implementación O(|B(K)|² · |M|):
//   1. Por cada par (i, j) con i ≠ j, marcar i < j  ⇔  extent_i ⊊ extent_j.
//   2. Para cada arista i < j, ver si existe k con i < k < j; si no,
//      es cobertura.
//
// Para retículos de hasta unos pocos miles de conceptos esto es práctico;
// para tamaños mayores conviene un algoritmo dedicado (e.g. Lindig).
// ============================================================

import type { FormalConcept, HasseLattice } from './types';

function isSubset<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size > b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function isStrictSubset<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size < b.size && isSubset(a, b);
}

/**
 * Computa el diagrama de Hasse del concept lattice como lista de aristas
 * de cobertura `[child, parent]` (índices en `concepts`).
 *
 * La orientación es de "específico" a "general":
 *   `[i, j]` significa `extent_i ⊊ extent_j` y la inclusión es inmediata.
 */
export function lattice(concepts: FormalConcept[]): HasseLattice {
  const n = concepts.length;

  // Pre-computar la matriz <. lt[i][j] = true ⇔ extent_i ⊊ extent_j.
  const lt: boolean[][] = Array.from({ length: n }, () => new Array<boolean>(n).fill(false));
  for (let i = 0; i < n; i++) {
    const ci = concepts[i];
    if (!ci) continue;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const cj = concepts[j];
      if (!cj) continue;
      if (isStrictSubset(ci.extent, cj.extent)) {
        const row = lt[i];
        if (row) row[j] = true;
      }
    }
  }

  const edges: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const row = lt[i];
    if (!row) continue;
    for (let j = 0; j < n; j++) {
      if (!row[j]) continue;
      // ¿existe k con i < k < j?  Si sí, (i,j) NO es cobertura.
      let coversImmediately = true;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const rk = lt[i];
        const rkj = lt[k];
        if (rk && rkj && rk[k] && rkj[j]) {
          coversImmediately = false;
          break;
        }
      }
      if (coversImmediately) edges.push([i, j]);
    }
  }

  return { edges };
}
