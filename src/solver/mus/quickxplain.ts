// ============================================================
// ST MUS — QuickXplain (Junker 2004)
// ============================================================
//
// Divide-y-vencerás para encontrar un MUS dentro de un conjunto
// `C = B ∪ U` donde `B` (background) ya se sabe consistente y
// queremos hallar el subconjunto mínimo de `U` que es responsable
// de la inconsistencia (junto con `B`).
//
// Pseudocódigo (versión simétrica clásica):
//
//   QX(B, ∆, C):
//     if ∆ ≠ ∅ ∧ ¬sat(B):      return ∅              // ∆ no necesario
//     if |C| = 1:               return C              // C es minimal
//     C1, C2 = split(C)
//     ∆1 = QX(B ∪ C1, C1, C2)
//     ∆2 = QX(B ∪ ∆1, ∆1, C1)
//     return ∆1 ∪ ∆2
//
// Cuidado: en la primera llamada `∆` debe ser ≠ ∅ para no caer en el
// short-circuit. Convención típica: pasar `∆ = C` en el wrap externo.
//
// Complejidad: O(2k + 2k · log(n/k)) llamadas SAT, donde n = |C| y
// k = |MUS|. Muy buena cuando k ≪ n.

import type { SATOracle } from './types';

interface QXState {
  oracle: SATOracle;
  /** Cláusulas reales indexadas por id. */
  byId: Map<number, number[]>;
  satCalls: number;
  maxIterations: number;
}

/**
 * Llama al oráculo con la unión de varios sets de ids. Si el contador
 * de llamadas excede `maxIterations`, devuelve `true` (sat) para
 * forzar la salida del algoritmo de forma segura.
 */
function check(state: QXState, ...sets: number[][]): boolean {
  if (state.satCalls >= state.maxIterations) return true;
  const seen = new Set<number>();
  for (const s of sets) for (const id of s) seen.add(id);
  const subset: number[][] = [];
  for (const id of seen) {
    const clause = state.byId.get(id);
    if (clause !== undefined) subset.push(clause);
  }
  state.satCalls++;
  return state.oracle(subset);
}

function qxRec(
  state: QXState,
  background: number[],
  delta: number[],
  candidates: number[],
): number[] {
  // Si añadir delta hizo que el background sea unsat, delta no es necesario.
  if (delta.length > 0 && !check(state, background)) {
    return [];
  }
  if (candidates.length === 1) {
    return candidates.slice();
  }
  if (state.satCalls >= state.maxIterations) {
    return candidates.slice();
  }

  const mid = Math.floor(candidates.length / 2);
  const left = candidates.slice(0, mid);
  const right = candidates.slice(mid);

  const delta1 = qxRec(state, mergeUnique(background, left), left, right);
  const delta2 = qxRec(state, mergeUnique(background, delta1), delta1, left);
  return mergeUnique(delta1, delta2);
}

function mergeUnique(a: number[], b: number[]): number[] {
  if (a.length === 0) return b.slice();
  if (b.length === 0) return a.slice();
  const seen = new Set<number>(a);
  const out = a.slice();
  for (const id of b) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Ejecuta QuickXplain sobre el conjunto de cláusulas indexadas y
 * devuelve los índices del MUS hallado más el conteo de llamadas SAT.
 */
export function quickxplain(
  clauses: number[][],
  oracle: SATOracle,
  maxIterations: number,
): { mus: number[]; satCalls: number } {
  const byId = new Map<number, number[]>();
  clauses.forEach((c, i) => byId.set(i, c));
  const ids = clauses.map((_, i) => i);

  // Pre-check: si el conjunto completo ya es SAT, no hay MUS.
  const state: QXState = { oracle, byId, satCalls: 0, maxIterations };
  if (check(state, ids)) {
    return { mus: [], satCalls: state.satCalls };
  }

  // En la primera llamada, ∆ = candidates para evitar short-circuit.
  const mus = qxRec(state, [], ids, ids);
  mus.sort((a, b) => a - b);
  return { mus, satCalls: state.satCalls };
}
