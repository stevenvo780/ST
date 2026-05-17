// ============================================================
// Probabilistic Programming — Types
// ============================================================
//
// Tipos de datos para un PPL minimal: distribuciones, programas
// probabilísticos, sampler y resumen de posterior.

/**
 * Distribución de probabilidad sobre valores de tipo T.
 *
 * Cinco familias paramétricas comunes + `discrete` (PMF arbitraria
 * sobre claves T) y `categorical` (lista paralela de valores y probs).
 *
 * Convenciones:
 *   - `uniform`: continua sobre `[low, high)`.
 *   - `normal`: gaussiana con `std > 0`.
 *   - `poisson`: discreta sobre {0, 1, 2, ...}.
 *   - `bernoulli`: discreta sobre {true, false} con `P(true) = p`.
 *   - `categorical`/`discrete`: las probs deben sumar 1 (se normaliza).
 */
// Cada familia con un campo `__t` (marca fantasma) que liga el tipo
// de retorno de `sample(dist)` al T correcto. El campo es `never` en
// runtime (siempre `undefined` real) y existe solo para el sistema
// de tipos.

/** Bernoulli sobre {true, false}. */
export interface BernoulliDist {
  readonly kind: 'bernoulli';
  readonly p: number;
  /** Phantom: liga T = boolean en sample(). Runtime: undefined. */
  readonly __t?: boolean;
}

/** Uniforme continua sobre [low, high). */
export interface UniformDist {
  readonly kind: 'uniform';
  readonly low: number;
  readonly high: number;
  readonly __t?: number;
}

/** Gaussiana con media y desviación. */
export interface NormalDist {
  readonly kind: 'normal';
  readonly mean: number;
  readonly std: number;
  readonly __t?: number;
}

/** Poisson sobre {0, 1, 2, ...}. */
export interface PoissonDist {
  readonly kind: 'poisson';
  readonly lambda: number;
  readonly __t?: number;
}

/** Categorical con lista de valores paralelos a sus probabilidades. */
export interface CategoricalDist<T> {
  readonly kind: 'categorical';
  readonly values: T[];
  readonly probs: number[];
  readonly __t?: T;
}

/** Discrete con PMF (Map de valor → masa). */
export interface DiscreteDist<T> {
  readonly kind: 'discrete';
  readonly pmf: Map<T, number>;
  readonly __t?: T;
}

/**
 * Distribución sobre valores de tipo T.
 *
 * En la práctica usá los constructores (`bernoulli`, `uniform`,
 * `normal`, `poisson`, `categorical`, `discrete`) que devuelven
 * el tipo Distribution<T> ya tipado.
 */
export type Distribution<T> =
  | BernoulliDist
  | UniformDist
  | NormalDist
  | PoissonDist
  | CategoricalDist<T>
  | DiscreteDist<T>;

/**
 * Helpers de construcción. Cada uno devuelve la `Distribution<T>`
 * adecuada con T inferido (boolean / number / genérico).
 */
export function bernoulli(p: number): BernoulliDist {
  return { kind: 'bernoulli', p };
}

export function uniform(low: number, high: number): UniformDist {
  return { kind: 'uniform', low, high };
}

export function normal(mean: number, std: number): NormalDist {
  return { kind: 'normal', mean, std };
}

export function poisson(lambda: number): PoissonDist {
  return { kind: 'poisson', lambda };
}

export function categorical<T>(values: T[], probs: number[]): CategoricalDist<T> {
  return { kind: 'categorical', values, probs };
}

export function discrete<T>(pmf: Map<T, number>): DiscreteDist<T> {
  return { kind: 'discrete', pmf };
}

/**
 * Sampler: interface que recibe el programa probabilístico para
 * (a) muestrear de distribuciones, (b) condicionar con observaciones
 * que descartan ejecuciones inconsistentes, y (c) ajustar el peso
 * de la traza con un log-factor arbitrario.
 *
 * Cada motor de inferencia implementa este interface de manera
 * distinta (enumeración exacta, rejection, importance, MH).
 *
 * Las firmas overloaded permiten que `sample(bernoulli(p))` infiera
 * `boolean`, `sample(normal(...))` infiera `number`, etc.
 */
export interface Sampler {
  sample(dist: BernoulliDist): boolean;
  sample(dist: UniformDist): number;
  sample(dist: NormalDist): number;
  sample(dist: PoissonDist): number;
  sample<T>(dist: CategoricalDist<T>): T;
  sample<T>(dist: DiscreteDist<T>): T;
  sample<T>(dist: Distribution<T>): T;

  /**
   * Condiciona la traza: si `condition` es false, la traza tiene
   * peso 0 (será descartada o re-muestreada según el backend).
   */
  observe(condition: boolean): void;

  /**
   * Suma `logWeight` al log-peso de la traza. Útil para likelihoods
   * con densidad continua que no se pueden expresar como observe
   * booleano (p.ej. observe gaussiano vs valor real).
   */
  factor(logWeight: number): void;
}

/**
 * Programa probabilístico: función que, dado un sampler, produce
 * un valor de retorno (la query). Las llamadas a `sampler.sample`
 * dentro del programa definen el prior; las llamadas a `observe`
 * y `factor` definen el conditioning.
 */
export type PProgram<T> = (sampler: Sampler) => T;

/**
 * Opciones de inferencia genéricas. Defaults razonables por motor.
 *   - `numSamples`: tamaño objetivo del posterior.
 *   - `burnIn`: descartar las primeras N iteraciones (solo MCMC).
 *   - `thin`: tomar 1 de cada N (solo MCMC, para reducir autocorr).
 *   - `maxAttempts`: tope global de intentos (rejection); evita loops
 *     infinitos cuando la observación es demasiado restrictiva.
 *   - `rng`: generador inyectable para tests deterministas.
 *   - `proposalStd`: desviación para propuestas gaussianas en MH.
 */
export interface InferenceOptions {
  numSamples?: number;
  burnIn?: number;
  thin?: number;
  maxAttempts?: number;
  rng?: () => number;
  proposalStd?: number;
}

/**
 * Resumen del posterior sobre el valor de retorno del programa.
 *
 * Campos numéricos (`mean`, `std`, `quantiles`) solo se rellenan
 * cuando los samples son finitamente numéricos (incluye booleanos
 * tratados como 0/1). El histograma siempre se computa: agrupa por
 * igualdad estructural (JSON-serializable) y reporta la masa
 * estimada por valor.
 */
export interface PosteriorSummary<T> {
  samples: T[];
  mean?: number;
  std?: number;
  quantiles?: Record<number, number>;
  histogram?: Map<T, number>;
  /** Effective sample size aproximado (importance sampling). */
  ess?: number;
  /** Tasa de aceptación (solo MH). */
  acceptanceRate?: number;
  /** Fracción de propuestas aceptadas con respecto a las totales. */
  numAccepted?: number;
  /** Intentos totales (rejection / importance) — útil para diagnóstico. */
  totalAttempts?: number;
}
