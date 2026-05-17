// ============================================================
// ST MUS — Extracción de Minimal Unsatisfiable Subsets
// ============================================================
//
// Algoritmos implementados:
//   - deletion-based (O(n) llamadas SAT)
//   - insertion-based (variante MARCO-like sencilla)
//   - QuickXplain (delegado a `quickxplain.ts`)
//
// El oráculo SAT es una caja negra: cualquier función que dado un
// array de cláusulas (literales enteros estilo DIMACS) devuelva
// `true` si tiene modelo. Sound y completo según el oráculo provisto.
//
// También exponemos `extractMUSWithSelectors` para SAT solvers
// incrementales que devuelven `failedAssumptions`: en ese caso
// usamos la API del solver para conseguir un núcleo y luego lo
// minimizamos.

import type { MUSAlgorithm, MUSOptions, MUSResult, SATOracle, AssumptionSolver } from './types';
import { quickxplain } from './quickxplain';

const DEFAULT_MAX_ITERATIONS = 100_000;

interface ExtractState {
  oracle: SATOracle;
  /** Cláusulas indexadas por id (id = posición en el array original). */
  byId: Map<number, number[]>;
  satCalls: number;
  iterations: number;
  maxIterations: number;
}

function callOracle(state: ExtractState, ids: number[]): boolean {
  if (state.satCalls >= state.maxIterations) return true; // forzar salida segura
  const subset: number[][] = [];
  for (const id of ids) {
    const c = state.byId.get(id);
    if (c !== undefined) subset.push(c);
  }
  state.satCalls++;
  return state.oracle(subset);
}

// ── Deletion-based ─────────────────────────────────────────────

/**
 * Recorre cada cláusula del conjunto inicial; si removerla deja al
 * resto unsat, la descarta. Garantiza minimalidad por inclusión al
 * terminar el pase porque cada cláusula sobreviviente es "necesaria"
 * en el contexto del conjunto sobreviviente.
 *
 * Detalle sutil: el orden de visita importa para *cuál* MUS se
 * encuentra (puede haber varios). Usamos el orden numérico (id
 * ascendente) para determinismo.
 */
function extractDeletion(state: ExtractState, allIds: number[]): number[] {
  let kept = allIds.slice().sort((a, b) => a - b);
  for (const id of allIds.slice().sort((a, b) => a - b)) {
    if (state.satCalls >= state.maxIterations) break;
    state.iterations++;
    const candidate = kept.filter((x) => x !== id);
    if (candidate.length === 0) continue;
    if (!callOracle(state, candidate)) {
      // Sin esa cláusula sigue unsat → no es necesaria.
      kept = candidate;
    }
  }
  return kept;
}

// ── Insertion-based ────────────────────────────────────────────

/**
 * Variante "linear search" de MUS extraction (a veces llamada
 * dichotomic / insertion). Itera:
 *
 *   1. Mantiene `mus = []` (núcleo crecido) y `pool = allIds`.
 *   2. Va añadiendo cláusulas de `pool` a un `working` set hasta que
 *      `mus ∪ working` se vuelve unsat. La última añadida es
 *      "transition" — la promueve a `mus`.
 *   3. Reset `working = []` y repite, recortando `pool` a las que
 *      quedaron antes de la transition.
 *   4. Termina cuando `mus` solo es unsat.
 *
 * Esto es esencialmente "augmenting MUS" / Junker's linear baseline.
 * O(|MUS| · |C|) llamadas SAT en el peor caso, pero suele ser mucho
 * más rápido en la práctica cuando |MUS| ≪ |C|.
 */
function extractInsertion(state: ExtractState, allIds: number[]): number[] {
  const mus: number[] = [];
  let pool = allIds.slice().sort((a, b) => a - b);

  // Caso base: si `[]` ya es unsat, el MUS es vacío.
  state.iterations++;
  if (!callOracle(state, [])) return [];

  while (state.satCalls < state.maxIterations) {
    state.iterations++;

    // Si solo `mus` ya es unsat, terminamos.
    if (!callOracle(state, mus)) break;

    let working: number[] = [];
    let transition = -1;
    const consumed: number[] = [];

    for (const id of pool) {
      if (state.satCalls >= state.maxIterations) break;
      working = working.concat(id);
      consumed.push(id);
      if (!callOracle(state, mus.concat(working))) {
        transition = id;
        break;
      }
    }

    if (transition === -1) {
      // Defensa: si nunca se hizo unsat, el conjunto no era unsat para
      // empezar (o se acabó el presupuesto). Salimos.
      break;
    }

    mus.push(transition);
    // Para el próximo loop solo nos quedamos con las cláusulas que se
    // consumieron antes de la transition (excluyendo la transition).
    // Esas son las "potencialmente irrelevantes" que aún hay que
    // testear; las que estaban después en `pool` quedan ya cubiertas
    // implícitamente por `mus`.
    pool = consumed.filter((x) => x !== transition);
  }

  mus.sort((a, b) => a - b);
  return mus;
}

// ── API pública ────────────────────────────────────────────────

/**
 * Extrae un MUS (Minimal Unsatisfiable Subset) del conjunto unsat
 * `clauses` usando el oráculo SAT provisto.
 *
 * Convenciones:
 *   - Las cláusulas son arrays de literales enteros estilo DIMACS
 *     (positivo / negativo). El motor no inspecciona la semántica;
 *     todo lo delega al `satOracle`.
 *   - El conjunto retornado en `mus` son índices sobre `clauses`.
 *   - Si `clauses` ES satisfacible, devolvemos `mus = []` (no hay
 *     MUS posible).
 *   - Determinismo: orden numérico ascendente en todos los recorridos.
 */
export function extractMUS(
  clauses: number[][],
  satOracle: SATOracle,
  opts: MUSOptions = {},
): MUSResult {
  const algorithm: MUSAlgorithm = opts.algorithm ?? 'deletion';
  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  // Pre-check: el conjunto completo debe ser unsat. Si es sat, no hay
  // MUS — devolvemos vacío.
  if (satOracle(clauses)) {
    return { mus: [], iterations: 1, satCalls: 1 };
  }

  if (clauses.length === 0) {
    // `[]` es trivialmente sat, así que el pre-check ya habría
    // devuelto. Defensa: nunca llegamos aquí porque sat([]) = true.
    return { mus: [], iterations: 1, satCalls: 1 };
  }

  const byId = new Map<number, number[]>();
  clauses.forEach((c, i) => byId.set(i, c));
  const allIds = clauses.map((_, i) => i);

  if (algorithm === 'qx') {
    const qx = quickxplain(clauses, satOracle, maxIterations);
    // QuickXplain ya devuelve un MUS minimal por inclusión.
    return { mus: qx.mus, iterations: 1, satCalls: qx.satCalls + 1 };
  }

  const state: ExtractState = {
    oracle: satOracle,
    byId,
    satCalls: 1, // contamos el pre-check inicial
    iterations: 0,
    maxIterations,
  };

  let mus: number[];
  if (algorithm === 'insertion') {
    mus = extractInsertion(state, allIds);
  } else {
    mus = extractDeletion(state, allIds);
  }

  return {
    mus: mus.slice().sort((a, b) => a - b),
    iterations: state.iterations,
    satCalls: state.satCalls,
  };
}

// ── Variante con assumptions / selectors ───────────────────────

/**
 * Variante para SAT solvers incrementales con assumptions.
 *
 * El patrón típico es:
 *   - Por cada cláusula original `C_i`, añadir un selector literal
 *     `s_i` y convertirla en `C_i ∨ ¬s_i` (la cláusula está "off"
 *     cuando `s_i = false`).
 *   - Para "activar" un subset, pasar las correspondientes `s_i` como
 *     assumptions positivas.
 *   - Cuando el problema es unsat, el solver devuelve
 *     `failedAssumptions ⊆ assumptions` — el unsat core proyectado
 *     sobre los selectors.
 *
 * Esta función toma el `failedAssumptions` como punto de partida y
 * lo minimiza con un pase deletion-based usando el mismo solver para
 * garantizar minimalidad por inclusión.
 */
export function extractMUSWithSelectors(
  clauses: number[][],
  selectors: number[],
  solver: AssumptionSolver,
  opts: MUSOptions = {},
): MUSResult {
  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  if (clauses.length !== selectors.length) {
    throw new Error(
      `extractMUSWithSelectors: clauses.length (${clauses.length}) !== selectors.length (${selectors.length})`,
    );
  }

  let satCalls = 0;
  let iterations = 0;

  // Primera llamada con TODAS las assumptions activas.
  satCalls++;
  iterations++;
  const initial = solver.solveWithAssumptions(selectors.slice());
  if (initial.sat) {
    return { mus: [], iterations, satCalls };
  }

  // Núcleo inicial: failedAssumptions si el solver lo da; sino, todos.
  const selectorToIndex = new Map<number, number>();
  selectors.forEach((s, i) => selectorToIndex.set(s, i));

  let core: number[];
  if (initial.failedAssumptions && initial.failedAssumptions.length > 0) {
    core = initial.failedAssumptions
      .map((s) => selectorToIndex.get(s))
      .filter((idx): idx is number => idx !== undefined);
  } else {
    core = clauses.map((_, i) => i);
  }
  core = Array.from(new Set(core)).sort((a, b) => a - b);

  // Minimización deletion-based sobre el core con el mismo solver.
  for (const idx of core.slice()) {
    if (satCalls >= maxIterations) break;
    iterations++;
    const candidate = core.filter((x) => x !== idx);
    if (candidate.length === 0) continue;
    const assumptions = candidate.map((i) => selectors[i]);
    satCalls++;
    const res = solver.solveWithAssumptions(assumptions);
    if (!res.sat) {
      // Sin esa cláusula sigue unsat → no es necesaria.
      core = candidate;
    }
  }

  return {
    mus: core.slice().sort((a, b) => a - b),
    iterations,
    satCalls,
  };
}
