// ============================================================
// Support enumeration — algoritmo para enumerar TODOS los Nash
// equilibria de un juego 2-player.
// ============================================================
//
// Idea (Dickhaut–Kaplan, generalizado): un equilibrio mixto está
// soportado por dos subconjuntos S_1 ⊆ [n], S_2 ⊆ [m] de igual
// cardinalidad (por el Lemma de complementariedad).
//
// Para cada par (S_1, S_2) del mismo tamaño k:
//   - jugador 1 mezcla solo en S_1 con probs p_i (i ∈ S_1)
//   - jugador 2 mezcla solo en S_2 con probs q_j (j ∈ S_2)
//   - p, q deben volver indiferente al rival en su soporte:
//       sum_i p_i * a[i][j]  = u_2  para todo j ∈ S_2
//       sum_j q_j * a'[i][j] = u_1  para todo i ∈ S_1
//     (donde a' = pagos de player 1, a = pagos de player 2)
//   - p, q ≥ 0, suman 1
//   - mejores fuera del soporte no deben superar el pago de equilibrio
//
// Resolvemos el sistema lineal y filtramos. Para juegos chicos
// (n*m ≤ ~10) la enumeración es trivial: 2^n * 2^m subsets.

import type { NashEquilibrium, NormalFormGame } from './types';
import { expectedPayoffFromDistributions } from './types';
import { solveLinear } from './linalg';

const TOL = 1e-9;

export function enumerateAllNash(game: NormalFormGame, maxSize?: number): NashEquilibrium[] {
  if (game.players !== 2) {
    throw new Error('enumerateAllNash currently supports 2-player games only');
  }
  const n = game.strategies[0];
  const m = game.strategies[1];
  const a1 = game.payoffs[0]; // a1[i*m+j] = u_1(i, j)
  const a2 = game.payoffs[1]; // a2[i*m+j] = u_2(i, j)

  const cap = maxSize ?? Math.min(n, m);
  const results: NashEquilibrium[] = [];
  const seen = new Set<string>();

  // Enumerar subsets crecientes para que las equilibria puras
  // aparezcan primero.
  for (let k = 1; k <= cap; k++) {
    const subsetsRow = subsetsOfSize(n, k);
    const subsetsCol = subsetsOfSize(m, k);
    for (const S1 of subsetsRow) {
      for (const S2 of subsetsCol) {
        const eq = solveSupport(n, m, a1, a2, S1, S2);
        if (eq == null) continue;
        const key = canonicalKey(eq.strategies[0].distribution, eq.strategies[1].distribution);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(eq);
      }
    }
  }
  return results;
}

function solveSupport(
  n: number,
  m: number,
  a1: number[],
  a2: number[],
  S1: number[],
  S2: number[],
): NashEquilibrium | null {
  const k = S1.length;
  if (S2.length !== k) return null;

  // Sistema para q (variable del jugador 2, |S2| = k):
  //   Para cada i ∈ S1:  sum_{j ∈ S2} a1[i,j] * q_j = u_1
  //   sum_{j ∈ S2} q_j = 1
  // Variables: q_j (k), u_1 (1). Ecuaciones: k + 1.
  const A_q: number[][] = [];
  const b_q: number[] = [];
  for (const i of S1) {
    const row = new Array<number>(k + 1).fill(0);
    for (let idx = 0; idx < k; idx++) {
      const j = S2[idx];
      row[idx] = a1[i * m + j];
    }
    row[k] = -1; // -u_1
    A_q.push(row);
    b_q.push(0);
  }
  const last_q = new Array<number>(k + 1).fill(0);
  for (let idx = 0; idx < k; idx++) last_q[idx] = 1;
  A_q.push(last_q);
  b_q.push(1);

  const solQ = solveLinear(A_q, b_q);
  if (solQ === null) return null;

  // Sistema para p (variable del jugador 1, |S1| = k):
  //   Para cada j ∈ S2:  sum_{i ∈ S1} a2[i,j] * p_i = u_2
  //   sum_{i ∈ S1} p_i = 1
  const A_p: number[][] = [];
  const b_p: number[] = [];
  for (const j of S2) {
    const row = new Array<number>(k + 1).fill(0);
    for (let idx = 0; idx < k; idx++) {
      const i = S1[idx];
      row[idx] = a2[i * m + j];
    }
    row[k] = -1; // -u_2
    A_p.push(row);
    b_p.push(0);
  }
  const last_p = new Array<number>(k + 1).fill(0);
  for (let idx = 0; idx < k; idx++) last_p[idx] = 1;
  A_p.push(last_p);
  b_p.push(1);

  const solP = solveLinear(A_p, b_p);
  if (solP === null) return null;

  const q_support = solQ.slice(0, k);
  const u1 = solQ[k];
  const p_support = solP.slice(0, k);
  const u2 = solP[k];

  // Probabilidades dentro del soporte deben ser ≥ 0 (y >0 idealmente)
  for (const v of q_support) {
    if (v < -TOL) return null;
    if (v < TOL) return null; // soporte = solo elementos con prob>0
  }
  for (const v of p_support) {
    if (v < -TOL) return null;
    if (v < TOL) return null;
  }

  // Reconstruir distribuciones completas
  const p = new Array<number>(n).fill(0);
  for (let idx = 0; idx < k; idx++) p[S1[idx]] = p_support[idx];
  const q = new Array<number>(m).fill(0);
  for (let idx = 0; idx < k; idx++) q[S2[idx]] = q_support[idx];

  // Mejor respuesta fuera del soporte no debe superar u_1 / u_2
  for (let i = 0; i < n; i++) {
    if (S1.includes(i)) continue;
    let u = 0;
    for (let j = 0; j < m; j++) u += q[j] * a1[i * m + j];
    if (u > u1 + 1e-7) return null;
  }
  for (let j = 0; j < m; j++) {
    if (S2.includes(j)) continue;
    let u = 0;
    for (let i = 0; i < n; i++) u += p[i] * a2[i * m + j];
    if (u > u2 + 1e-7) return null;
  }

  const game: NormalFormGame = {
    players: 2,
    strategies: [n, m],
    payoffs: [a1, a2],
  };
  const dists = [p, q];
  const payoffs = [
    expectedPayoffFromDistributions(game, 0, dists),
    expectedPayoffFromDistributions(game, 1, dists),
  ];
  const isPure = k === 1;
  const isStrict = isPure && isStrictBR(n, m, a1, a2, S1[0], S2[0]);
  return {
    strategies: [
      { player: 0, distribution: p },
      { player: 1, distribution: q },
    ],
    payoffs,
    isPure,
    isStrict,
  };
}

function isStrictBR(
  n: number,
  m: number,
  a1: number[],
  a2: number[],
  i: number,
  j: number,
): boolean {
  const cur1 = a1[i * m + j];
  for (let ii = 0; ii < n; ii++) {
    if (ii === i) continue;
    if (a1[ii * m + j] >= cur1 - TOL) return false;
  }
  const cur2 = a2[i * m + j];
  for (let jj = 0; jj < m; jj++) {
    if (jj === j) continue;
    if (a2[i * m + jj] >= cur2 - TOL) return false;
  }
  return true;
}

function subsetsOfSize(n: number, k: number): number[][] {
  const result: number[][] = [];
  const cur: number[] = [];
  function rec(start: number) {
    if (cur.length === k) {
      result.push(cur.slice());
      return;
    }
    const need = k - cur.length;
    for (let i = start; i <= n - need; i++) {
      cur.push(i);
      rec(i + 1);
      cur.pop();
    }
  }
  rec(0);
  return result;
}

function canonicalKey(p: number[], q: number[]): string {
  const round = (xs: number[]) => xs.map((x) => Math.round(x * 1e6) / 1e6).join(',');
  return `${round(p)}|${round(q)}`;
}
