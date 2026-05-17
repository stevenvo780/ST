// ============================================================
// Game theory — Tipos y utilidades de juegos en forma normal
// ============================================================
//
// Modelo de juego en forma normal (también llamado matriz de
// pagos) para n jugadores con conjuntos finitos de estrategias
// puras. Los pagos se almacenan en un layout flat:
//
//   payoffs[player][index] = u_player(s_1, ..., s_n)
//
// donde `index` es la codificación row-major (lexicográfica) del
// perfil de estrategias `(s_1, ..., s_n)` usando los tamaños en
// `strategies`. Esta forma permite manejar uniformemente juegos
// 2-player NxM y juegos n-player simétricos chicos.

export interface NormalFormGame {
  /** Cantidad de jugadores (≥ 2). */
  players: number;
  /** strategies[i] = número de estrategias puras del jugador i. */
  strategies: number[];
  /** payoffs[player][profileIndex] = utilidad del jugador en ese perfil. */
  payoffs: number[][];
}

export interface MixedStrategy {
  /** Índice del jugador (0-based). */
  player: number;
  /** Distribución sobre estrategias puras; debe sumar 1 y ser no-negativa. */
  distribution: number[];
}

export interface NashEquilibrium {
  /** Una distribución mixta por jugador (en orden de jugador). */
  strategies: MixedStrategy[];
  /** Pagos esperados por jugador en este equilibrio. */
  payoffs: number[];
  /** True si toda distribución pone masa 1 en alguna estrategia pura. */
  isPure: boolean;
  /** True si el equilibrio es estricto (best response única para cada jugador puro). */
  isStrict: boolean;
}

// ---------- helpers internos ----------

/**
 * Convierte un perfil `(s_0, ..., s_{n-1})` a su índice row-major
 * en `payoffs[player]`. Lanza si el perfil no encaja en `sizes`.
 */
export function profileToIndex(profile: number[], sizes: number[]): number {
  if (profile.length !== sizes.length) {
    throw new Error(`profile length ${profile.length} != strategies length ${sizes.length}`);
  }
  let idx = 0;
  for (let i = 0; i < profile.length; i++) {
    const s = profile[i];
    const size = sizes[i];
    if (s < 0 || s >= size) {
      throw new Error(`strategy ${s} out of range [0, ${size}) for player ${i}`);
    }
    idx = idx * size + s;
  }
  return idx;
}

/** Inversa de `profileToIndex`. */
export function indexToProfile(index: number, sizes: number[]): number[] {
  const profile = new Array<number>(sizes.length);
  let remaining = index;
  for (let i = sizes.length - 1; i >= 0; i--) {
    const size = sizes[i];
    profile[i] = remaining % size;
    remaining = Math.floor(remaining / size);
  }
  if (remaining !== 0) {
    throw new Error(`index ${index} out of range for sizes ${sizes.join(',')}`);
  }
  return profile;
}

/** Producto cartesiano de tamaños — número total de perfiles. */
export function totalProfiles(sizes: number[]): number {
  let n = 1;
  for (const s of sizes) n *= s;
  return n;
}

/**
 * Construye un juego en forma normal validando dimensiones.
 */
export function createGame(
  players: number,
  strategies: number[],
  payoffs: number[][],
): NormalFormGame {
  if (players < 2) throw new Error('a game needs at least 2 players');
  if (strategies.length !== players) {
    throw new Error(`strategies length ${strategies.length} != players ${players}`);
  }
  const total = totalProfiles(strategies);
  if (payoffs.length !== players) {
    throw new Error(`payoffs has ${payoffs.length} rows, expected ${players}`);
  }
  for (let i = 0; i < players; i++) {
    const row = payoffs[i];
    if (row.length !== total) {
      throw new Error(`payoffs[${i}] has length ${row.length}, expected ${total}`);
    }
  }
  return { players, strategies: strategies.slice(), payoffs: payoffs.map((r) => r.slice()) };
}

/**
 * Construye un juego 2-player a partir de dos matrices NxM.
 * `payoff1[i][j]` = utilidad del jugador 1 cuando juega i y el 2 juega j.
 * `payoff2[i][j]` = utilidad del jugador 2.
 */
export function createTwoPlayerGame(payoff1: number[][], payoff2: number[][]): NormalFormGame {
  const n = payoff1.length;
  if (n === 0) throw new Error('payoff1 must have at least one row');
  const first = payoff1[0];
  const m = first.length;
  if (m === 0) throw new Error('payoff1 must have at least one column');
  if (payoff2.length !== n) {
    throw new Error(`payoff2 has ${payoff2.length} rows, expected ${n}`);
  }
  for (let i = 0; i < n; i++) {
    const r1 = payoff1[i];
    const r2 = payoff2[i];
    if (r1.length !== m) throw new Error(`payoff1[${i}] has length ${r1.length}, expected ${m}`);
    if (r2.length !== m) throw new Error(`payoff2[${i}] has length ${r2.length}, expected ${m}`);
  }
  const flat1 = new Array<number>(n * m);
  const flat2 = new Array<number>(n * m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      flat1[i * m + j] = payoff1[i][j];
      flat2[i * m + j] = payoff2[i][j];
    }
  }
  return { players: 2, strategies: [n, m], payoffs: [flat1, flat2] };
}

/** Lectura ergonómica del pago: u_player(profile). */
export function payoffOf(game: NormalFormGame, player: number, profile: number[]): number {
  const idx = profileToIndex(profile, game.strategies);
  const row = game.payoffs[player];
  if (!row) throw new Error(`player ${player} out of range`);
  const v = row[idx];
  if (v === undefined) throw new Error('payoff missing at index');
  return v;
}

/** Suma de un vector — útil para chequeos de simplex. */
export function sumOf(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

/** Pago esperado del jugador en un perfil mixto. */
export function expectedPayoff(
  game: NormalFormGame,
  player: number,
  mixed: MixedStrategy[],
): number {
  const dists = mixed.map((m) => m.distribution);
  return expectedPayoffFromDistributions(game, player, dists);
}

export function expectedPayoffFromDistributions(
  game: NormalFormGame,
  player: number,
  dists: number[][],
): number {
  const sizes = game.strategies;
  const total = totalProfiles(sizes);
  const row = game.payoffs[player];
  if (!row) throw new Error(`player ${player} out of range`);
  let total2 = 0;
  for (let idx = 0; idx < total; idx++) {
    const profile = indexToProfile(idx, sizes);
    let prob = 1;
    for (let p = 0; p < profile.length; p++) {
      const d = dists[p];
      if (!d) throw new Error(`missing distribution for player ${p}`);
      const sp = profile[p];
      prob *= d[sp];
    }
    if (prob === 0) continue;
    total2 += prob * row[idx];
  }
  return total2;
}

/** Distribución pura: masa 1 en `s`, 0 en el resto. */
export function pureDistribution(s: number, size: number): number[] {
  const d = new Array<number>(size).fill(0);
  d[s] = 1;
  return d;
}

/** Dos números reales aproximadamente iguales. */
export function approxEqual(a: number, b: number, tol = 1e-9): boolean {
  return Math.abs(a - b) < tol;
}

/** Igualdad punto a punto bajo tolerancia. */
export function vectorsApproxEqual(a: number[], b: number[], tol = 1e-9): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!approxEqual(a[i], b[i], tol)) return false;
  }
  return true;
}
