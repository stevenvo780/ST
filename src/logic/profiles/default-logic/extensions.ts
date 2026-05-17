// ============================================================
// ST Default Logic (Reiter) — Cálculo de extensiones
// ============================================================

import {
  DefaultRule,
  DefaultTheory,
  Extension,
  ComputeOptions,
  DEFAULT_MAX_EXTENSIONS,
  DEFAULT_MAX_DEFAULTS,
} from './types';

/**
 * Normaliza un literal a forma canónica:
 *   "P", "p"           → "P"
 *   "¬P", "!P", "~P",
 *   "not P", " ¬  P "  → "¬P"
 * Quita espacios extra; preserva mayúsculas/minúsculas internas
 * tras el primer carácter (case-sensitive para predicados FOL como
 * "flies(tweety)" vs "Flies(tweety)").
 */
export function normalizeLiteral(lit: string): string {
  const trimmed = lit.trim();
  if (trimmed === '') {
    throw new Error('Literal vacío');
  }

  // Detectar prefijos de negación
  const negPrefixes = ['¬', '!', '~'];
  const notWordRe = /^not\s+/i;

  let isNeg = false;
  let body = trimmed;

  // Pelar múltiples negaciones (doble negación cancela)
  while (true) {
    let stripped = false;
    for (const p of negPrefixes) {
      if (body.startsWith(p)) {
        body = body.slice(p.length).trim();
        isNeg = !isNeg;
        stripped = true;
        break;
      }
    }
    if (!stripped) {
      const m = body.match(notWordRe);
      if (m) {
        body = body.slice(m[0].length).trim();
        isNeg = !isNeg;
        stripped = true;
      }
    }
    if (!stripped) break;
  }

  // Normalizar espacios internos en el cuerpo
  body = body.replace(/\s+/g, '');
  if (body === '') {
    throw new Error(`Literal sin átomo: "${lit}"`);
  }

  return isNeg ? `¬${body}` : body;
}

/** Devuelve la negación canónica de un literal normalizado. */
export function negate(lit: string): string {
  const norm = normalizeLiteral(lit);
  return norm.startsWith('¬') ? norm.slice(1) : `¬${norm}`;
}

/** Verifica si un conjunto de literales es consistente (no contiene L y ¬L). */
export function isConsistent(beliefs: ReadonlySet<string>): boolean {
  for (const lit of beliefs) {
    if (beliefs.has(negate(lit))) return false;
  }
  return true;
}

/**
 * Comprueba si una justificación β es consistente con las creencias:
 * basta con que ¬β no esté en el conjunto.
 */
export function isJustificationConsistent(
  justification: string,
  beliefs: ReadonlySet<string>,
): boolean {
  return !beliefs.has(negate(justification));
}

interface NormalizedDefault {
  id: string;
  prerequisite: string;
  justifications: string[];
  consequent: string;
}

function normalizeDefault(d: DefaultRule): NormalizedDefault {
  return {
    id: d.id,
    prerequisite: normalizeLiteral(d.prerequisite),
    justifications: d.justifications.map(normalizeLiteral),
    consequent: normalizeLiteral(d.consequent),
  };
}

function normalizeTheory(
  T: DefaultTheory,
  opts: ComputeOptions,
): {
  facts: Set<string>;
  defaults: NormalizedDefault[];
} {
  const maxDefaults = opts.maxDefaults ?? DEFAULT_MAX_DEFAULTS;
  if (T.defaults.length > maxDefaults) {
    throw new Error(
      `Teoría con ${T.defaults.length} defaults excede el límite (${maxDefaults}). ` +
        `Pase maxDefaults explícitamente si la teoría es legítima.`,
    );
  }

  // Detectar IDs duplicados (rompería el seguimiento de extensiones)
  const seen = new Set<string>();
  for (const d of T.defaults) {
    if (seen.has(d.id)) {
      throw new Error(`ID de default duplicado: "${d.id}"`);
    }
    seen.add(d.id);
  }

  const facts = new Set<string>(T.facts.map(normalizeLiteral));
  if (!isConsistent(facts)) {
    throw new Error('Facts inconsistentes (contienen un literal y su negación)');
  }

  return {
    facts,
    defaults: T.defaults.map(normalizeDefault),
  };
}

/**
 * Aplica todos los defaults posibles a partir de un conjunto de creencias,
 * en orden de prioridad por índice. Devuelve el cierre forward y los
 * defaults aplicados. Esta función es determinista para una secuencia fija
 * de defaults, no enumera ramas.
 */
function forwardClose(
  initial: ReadonlySet<string>,
  defaults: NormalizedDefault[],
  order: number[],
): { beliefs: Set<string>; applied: string[] } {
  const beliefs = new Set<string>(initial);
  const applied: string[] = [];
  const usedIdx = new Set<number>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const idx of order) {
      if (usedIdx.has(idx)) continue;
      const d = defaults[idx];
      if (!beliefs.has(d.prerequisite)) continue;
      // Todas las justificaciones consistentes con las creencias actuales
      if (!d.justifications.every((j) => isJustificationConsistent(j, beliefs))) continue;
      // Aplicar
      const next = new Set(beliefs);
      next.add(d.consequent);
      if (!isConsistent(next)) continue; // el consequent no debe romper consistencia
      beliefs.add(d.consequent);
      applied.push(d.id);
      usedIdx.add(idx);
      changed = true;
    }
  }

  return { beliefs, applied };
}

/**
 * Verifica que un conjunto candidato E sea efectivamente una extensión
 * de la teoría: usando E como contexto de consistencia, los defaults que
 * disparan generan exactamente las creencias de E.
 *
 * Esta es la definición de punto fijo de Reiter (operador Γ): E es
 * extensión si Γ_T(E) = E.
 */
function isExtension(
  candidate: ReadonlySet<string>,
  appliedIds: ReadonlySet<string>,
  facts: ReadonlySet<string>,
  defaults: NormalizedDefault[],
): boolean {
  // Construir Γ_T(E): facts + consequents de los defaults cuyas
  // justificaciones son consistentes con E.
  const gamma = new Set<string>(facts);
  // Punto fijo monótono: reaplicar hasta estabilizar (necesario porque
  // el prerequisite de un default puede ser el consequent de otro).
  let changed = true;
  const usedForGamma = new Set<string>();
  while (changed) {
    changed = false;
    for (const d of defaults) {
      if (usedForGamma.has(d.id)) continue;
      if (!gamma.has(d.prerequisite)) continue;
      // Justificaciones se chequean contra el candidato E (definición Reiter)
      if (!d.justifications.every((j) => isJustificationConsistent(j, candidate))) continue;
      gamma.add(d.consequent);
      usedForGamma.add(d.id);
      changed = true;
    }
  }

  // E es extensión sii Γ_T(E) = E
  if (gamma.size !== candidate.size) return false;
  for (const lit of gamma) {
    if (!candidate.has(lit)) return false;
  }
  // Coherencia: los defaults aplicados deben coincidir con los que Γ usó
  if (usedForGamma.size !== appliedIds.size) return false;
  for (const id of usedForGamma) {
    if (!appliedIds.has(id)) return false;
  }
  return true;
}

/**
 * Calcula todas las extensiones de la teoría enumerando órdenes de
 * aplicación de defaults y verificando que el resultado sea un punto
 * fijo del operador Γ_T.
 *
 * Estrategia: para cada subconjunto de defaults, intentamos aplicarlos
 * en algún orden. Como en v1 trabajamos con literales y la aplicación
 * de un default no se desbloquea por reordering una vez fijado el
 * subconjunto consistente, basta enumerar subconjuntos maximales
 * generables por forward-close empezando desde cada permutación
 * heurística. Para acotar costo: probamos todas las permutaciones
 * cuando |defaults| ≤ 6, y un sampling determinista si excede.
 */
export function computeExtensions(T: DefaultTheory, options: ComputeOptions = {}): Extension[] {
  const opts: ComputeOptions = { ...options };
  const { facts, defaults } = normalizeTheory(T, opts);
  const maxExt = opts.maxExtensions ?? DEFAULT_MAX_EXTENSIONS;

  if (defaults.length === 0) {
    return [{ formulas: new Set(facts), appliedDefaults: [] }];
  }

  // Conjunto candidato → extension
  const candidates = new Map<string, Extension>();

  const tryOrder = (order: number[]): void => {
    const { beliefs, applied } = forwardClose(facts, defaults, order);
    const appliedSet = new Set(applied);
    if (!isExtension(beliefs, appliedSet, facts, defaults)) return;
    const key = signatureOf(beliefs);
    if (candidates.has(key)) return;
    candidates.set(key, {
      formulas: beliefs,
      appliedDefaults: applied,
    });
  };

  const n = defaults.length;
  if (n <= 6) {
    // Enumerar todas las permutaciones
    const idx = Array.from({ length: n }, (_, i) => i);
    for (const perm of permutations(idx)) {
      if (candidates.size >= maxExt) break;
      tryOrder(perm);
    }
  } else {
    // Heurística: para cada default, intentarlo primero. Esto cubre la
    // típica explosión "Nixon diamond" donde el orden inicial decide qué
    // default queda bloqueado por inconsistencia.
    const base = Array.from({ length: n }, (_, i) => i);
    tryOrder(base);
    for (let i = 0; i < n && candidates.size < maxExt; i++) {
      const order = [i, ...base.filter((j) => j !== i)];
      tryOrder(order);
    }
    // Y todos los pares (i,j) como prefijo
    for (let i = 0; i < n && candidates.size < maxExt; i++) {
      for (let j = 0; j < n && candidates.size < maxExt; j++) {
        if (i === j) continue;
        const order = [i, j, ...base.filter((k) => k !== i && k !== j)];
        tryOrder(order);
      }
    }
  }

  return Array.from(candidates.values());
}

function signatureOf(set: ReadonlySet<string>): string {
  return Array.from(set).sort().join('|');
}

function* permutations<T>(arr: readonly T[]): Generator<T[]> {
  if (arr.length <= 1) {
    yield arr.slice();
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const head = arr[i];
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const sub of permutations(rest)) {
      yield [head, ...sub];
    }
  }
}
