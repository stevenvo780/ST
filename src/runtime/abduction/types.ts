// ============================================================
// ST Abduction — Tipos públicos
// ============================================================
//
// Razonamiento abductivo (Peirce 1903; Reiter 1987): dado un
// background knowledge KB y una observación O, encontrar
// hipótesis H ⊆ Abducibles tal que:
//
//   1. KB ∪ H ⊨ O       (la hipótesis explica la observación)
//   2. KB ∪ H consistent (la hipótesis es compatible con KB)
//   3. H es minimal (no hay H' ⊂ H que cumpla 1 y 2)
//
// Usos típicos:
//   - Diagnóstico (¿qué fallas explican estos síntomas?)
//   - Inferencia best-fit (la hipótesis más simple/barata gana)
//   - Generación de explicaciones (debugging de cadenas causales)
//
// El espacio de hipótesis se enumera sobre 2^|abducibles|. Para
// |abducibles| ≲ 16 la enumeración exhaustiva es viable. Para más
// grande, conviene un oráculo SAT incremental.

/** Una fórmula (formato libre — strings, opaque al motor). */
export type Formula = string;

/**
 * Oráculo de consecuencia lógica: dado un conjunto de premisas P y
 * una fórmula objetivo q, devuelve `true` sii P ⊨ q.
 *
 * El motor abductivo es agnóstico al sistema lógico. Quien usa la
 * librería provee este oráculo (puede ser propositional, FOL,
 * description logic, etc).
 */
export type EntailmentOracle = (premises: ReadonlyArray<Formula>, target: Formula) => boolean;

/**
 * Oráculo de consistencia: dado un conjunto de fórmulas, devuelve
 * `true` sii admite al menos un modelo. Default razonable: si no
 * lo dan, decimos consistente sii NO P ⊨ ⊥. Como no tenemos ⊥
 * estándar en strings, en la práctica conviene pasar este oráculo.
 */
export type ConsistencyOracle = (premises: ReadonlyArray<Formula>) => boolean;

/**
 * Problema abductivo.
 *
 * - `kb`: background knowledge (axiomas del dominio).
 * - `observation`: fórmula que queremos explicar.
 * - `abducibles`: el conjunto de fórmulas elegibles como hipótesis.
 *   El razonador buscará H ⊆ abducibles.
 */
export interface AbductionProblem {
  kb: ReadonlyArray<Formula>;
  observation: Formula;
  abducibles: ReadonlyArray<Formula>;
}

/**
 * Una explicación candidata.
 *
 * - `hypotheses`: subconjunto de abducibles.
 * - `size`: cardinalidad (= hypotheses.length).
 * - `parsimonious`: true sii no existe subconjunto propio que
 *   también explique la observación de forma consistente.
 *   (Equivale a "minimal por inclusión".)
 * - `costScore`: suma de costos si se proveyó costFunction.
 */
export interface Explanation {
  hypotheses: ReadonlyArray<Formula>;
  size: number;
  parsimonious: boolean;
  costScore?: number;
}

/**
 * Criterio de preferencia sobre el conjunto de explicaciones.
 *
 * - `all`: todas las explicaciones encontradas (no filtra).
 * - `minimal`: solo las minimal-por-inclusión (parsimonious).
 * - `minimum-cardinality`: las de menor |H| entre las minimales.
 * - `minimum-cost`: las de menor costo total (requiere costFunction).
 */
export type Preference = 'all' | 'minimal' | 'minimum-cardinality' | 'minimum-cost';

export interface AbductionOptions {
  /** Oráculo de entailment. Default: `defaultEntails` (propositional, ver entails.ts). */
  entails?: EntailmentOracle;
  /** Oráculo de consistencia. Default: derivado de `entails` (no entails ⊥-equiv). */
  consistent?: ConsistencyOracle;
  /**
   * Tope de explicaciones a retornar. Útil cuando hay explosión
   * combinatoria. Default: 1024.
   */
  maxHypotheses?: number;
  /**
   * Tope para |H|. Acota el espacio de búsqueda. Default: igual a
   * |abducibles| (sin tope efectivo). Bajarlo es una buena idea
   * para |abducibles| > 12.
   */
  maxSize?: number;
  /** Función de costo por hipótesis. Default: 1 por hipótesis. */
  costFunction?: (h: Formula) => number;
  /** Cómo filtrar/ordenar el output. Default: `minimal`. */
  preferred?: Preference;
}
