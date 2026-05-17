// ============================================================
// ST Abduction — Núcleo: búsqueda de explicaciones
// ============================================================
//
// Estrategia: enumeración por tamaño creciente (BFS sobre subsets).
//
//   for k in 0..maxSize:
//     for cada subset H ⊆ abducibles con |H| = k:
//       si KB ∪ H ⊨ O y KB ∪ H consistent:
//         registrar H como explicación
//         marcar todos sus supersets como redundantes (no parsimoniosos)
//
// Las explicaciones se reportan ordenadas por tamaño ascendente. La
// minimalidad por inclusión se verifica al final con una pasada O(N²)
// sobre las explicaciones encontradas (suficiente para |explicaciones|
// ≲ algunos miles; en problemas grandes acotar `maxHypotheses`).
//
// Para `preferred = 'minimal'`, solo se reportan las parsimoniosas.
// Para `minimum-cardinality`, se reportan únicamente las de tamaño
// igual al mínimo encontrado. Para `minimum-cost`, las de costo
// mínimo (requiere costFunction o se usa size).

import { defaultConsistent, defaultEntails } from './entails';
import type {
  AbductionOptions,
  AbductionProblem,
  ConsistencyOracle,
  EntailmentOracle,
  Explanation,
  Formula,
  Preference,
} from './types';

interface ResolvedOptions {
  entails: EntailmentOracle;
  consistent: ConsistencyOracle;
  maxHypotheses: number;
  maxSize: number;
  costFunction: (h: Formula) => number;
  preferred: Preference;
}

function resolveOptions(
  abducibles: ReadonlyArray<Formula>,
  opts?: AbductionOptions,
): ResolvedOptions {
  const entails = opts?.entails ?? defaultEntails();
  const consistent = opts?.consistent ?? defaultConsistent();
  return {
    entails,
    consistent,
    maxHypotheses: opts?.maxHypotheses ?? 1024,
    maxSize: opts?.maxSize ?? abducibles.length,
    costFunction: opts?.costFunction ?? (() => 1),
    preferred: opts?.preferred ?? 'minimal',
  };
}

/** Itera sobre todos los subsets de [0..n) de tamaño exactamente k (orden lex). */
function* combinations(n: number, k: number): Generator<number[]> {
  if (k < 0 || k > n) return;
  if (k === 0) {
    yield [];
    return;
  }
  const idx = new Array<number>(k);
  for (let i = 0; i < k; i++) idx[i] = i;
  while (true) {
    yield idx.slice();
    // Avanzar al siguiente combination en orden lex.
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i] = idx[i] + 1;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

function isSubsetOf(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
  if (a.length > b.length) return false;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const ai = a[i];
    const bj = b[j];
    if (ai === bj) {
      i++;
      j++;
    } else if (ai < bj) {
      return false;
    } else {
      j++;
    }
  }
  return i === a.length;
}

interface RawExplanation {
  indices: number[];
  hypotheses: Formula[];
  costScore: number;
}

/**
 * Encuentra todas las explicaciones de un problema abductivo.
 *
 * - Enumera subsets de abducibles en orden creciente de tamaño.
 * - Filtra los inconsistentes y los que no implican la observación.
 * - Calcula minimalidad por inclusión (parsimony) post-hoc.
 * - Aplica el filtro `preferred` para el output final.
 */
export function findExplanations(
  problem: AbductionProblem,
  opts?: AbductionOptions,
): Explanation[] {
  const { kb, observation, abducibles } = problem;
  const resolved = resolveOptions(abducibles, opts);
  const n = abducibles.length;
  const maxK = Math.min(resolved.maxSize, n);

  // Pre-check: si KB ya implica O sin ninguna hipótesis, la explicación
  // vacía es la única parsimoniosa.
  // (Esto requiere consistencia de KB y derivación.)
  const raw: RawExplanation[] = [];
  if (resolved.consistent(kb) && resolved.entails(kb, observation)) {
    raw.push({ indices: [], hypotheses: [], costScore: 0 });
  }

  // Buscamos también H no vacíos. Si la vacía explica, según
  // `preferred` puede ser todo lo que necesitamos (case-by-case).
  outer: for (let k = 1; k <= maxK; k++) {
    for (const idx of combinations(n, k)) {
      const hypotheses: Formula[] = [];
      let costScore = 0;
      for (const i of idx) {
        const f = abducibles[i];
        if (f === undefined) continue;
        hypotheses.push(f);
        costScore += resolved.costFunction(f);
      }
      const combined = [...kb, ...hypotheses];
      // Skip duplicate trivial: si algún subset menor ya está en raw y es
      // subset de este, este NO va a ser parsimonious. Lo enumeramos
      // igual porque `preferred=all` debe verlos, pero podemos saltarlo
      // si `preferred` ∈ {minimal, minimum-cardinality, minimum-cost}.
      if (
        resolved.preferred !== 'all' &&
        raw.some((r) => r.indices.length < idx.length && isSubsetOf(r.indices, idx))
      ) {
        continue;
      }
      if (!resolved.consistent(combined)) continue;
      if (!resolved.entails(combined, observation)) continue;
      raw.push({ indices: idx, hypotheses, costScore });
      if (raw.length >= resolved.maxHypotheses) break outer;
    }
  }

  // Determinar parsimony por inclusión: una H es parsimoniosa sii no
  // existe H' ∈ raw con H' ⊂ H (subconjunto propio).
  const parsimonyMap = new Map<string, boolean>();
  const keyFor = (r: RawExplanation): string => r.indices.join(',');
  for (const r of raw) {
    let parsim = true;
    for (const other of raw) {
      if (other === r) continue;
      if (other.indices.length >= r.indices.length) continue;
      if (isSubsetOf(other.indices, r.indices)) {
        parsim = false;
        break;
      }
    }
    parsimonyMap.set(keyFor(r), parsim);
  }

  // Convertir a Explanation[].
  const explanations: Explanation[] = raw.map((r) => ({
    hypotheses: r.hypotheses,
    size: r.hypotheses.length,
    parsimonious: parsimonyMap.get(keyFor(r)) ?? false,
    costScore: r.costScore,
  }));

  return applyPreference(explanations, resolved);
}

function applyPreference(
  expls: ReadonlyArray<Explanation>,
  resolved: ResolvedOptions,
): Explanation[] {
  if (expls.length === 0) return [];
  switch (resolved.preferred) {
    case 'all':
      return expls.slice();
    case 'minimal':
      return expls.filter((e) => e.parsimonious);
    case 'minimum-cardinality': {
      const minimal = expls.filter((e) => e.parsimonious);
      if (minimal.length === 0) return [];
      const minSize = minimal.reduce((m, e) => Math.min(m, e.size), Infinity);
      return minimal.filter((e) => e.size === minSize);
    }
    case 'minimum-cost': {
      const minimal = expls.filter((e) => e.parsimonious);
      if (minimal.length === 0) return [];
      const minCost = minimal.reduce((m, e) => Math.min(m, e.costScore ?? Infinity), Infinity);
      return minimal.filter((e) => (e.costScore ?? Infinity) === minCost);
    }
    default:
      return expls.slice();
  }
}

/**
 * Devuelve UNA explicación: la "mejor" según `preferred`. Si hay
 * empate, la primera en orden lex (consistente y reproducible).
 *
 * Devuelve `null` si no hay explicación posible.
 */
export function bestExplanation(
  problem: AbductionProblem,
  opts?: AbductionOptions,
): Explanation | null {
  // Para best-explanation, forzamos minimum-cost si hay costFunction;
  // si no, minimum-cardinality. El cliente puede overridear con
  // opts.preferred.
  const preferred: Preference =
    opts?.preferred ?? (opts?.costFunction ? 'minimum-cost' : 'minimum-cardinality');
  const all = findExplanations(problem, { ...opts, preferred });
  return all.length > 0 ? all[0] : null;
}
