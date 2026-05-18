/**
 * Tipos base de primer orden para el prover avanzado.
 *
 * Variables: identificadores que empiezan con minúscula y se interpretan como
 * sustituibles durante la unificación (convención: `x`, `y`, `u`, `v`).
 * Constantes/funciones: identificadores en minúscula con `args` (aridad ≥ 0).
 * Diferenciamos `variable` vs `function` por el campo `kind` para evitar
 * ambigüedades.
 */

export type FOLTerm =
  | { kind: 'variable'; name: string }
  | { kind: 'function'; name: string; args: FOLTerm[] };

export interface FOLLiteral {
  /** Si la literal está negada (¬P(x)) o es positiva (P(x)). */
  negated: boolean;
  predicate: string;
  args: FOLTerm[];
}

export interface FOLClause {
  /** Disyunción de literales. Cláusula vacía ⇒ contradicción. */
  literals: FOLLiteral[];
  /** Trazabilidad: índices de cláusulas padre (si fue derivada). */
  parents?: number[];
  /** Marca cláusulas que provienen del goal o su negación (SoS). */
  fromGoal?: boolean;
}

/** A first-order substitution: maps variable names to replacement terms. */
export type Substitution = Map<string, FOLTerm>;

/**
 * The inference strategy used by the advanced resolution prover.
 * - `binary`: standard binary resolution.
 * - `hyperresolution`: resolves a positive clause against several negative ones simultaneously.
 * - `set-of-support`: restricts resolution to clauses derived from the goal.
 * - `ordered`: restricts resolution to maximal literals under a term ordering.
 * - `unit-preference`: prefers unit clauses (single literal) during selection.
 */
export type RefinementStrategy =
  | 'binary'
  | 'hyperresolution'
  | 'set-of-support'
  | 'ordered'
  | 'unit-preference';

/** Term ordering used to orient equations and select maximal literals. */
export type TermOrdering = 'KBO' | 'LPO' | 'none';

export interface AdvancedProveOptions {
  strategy: RefinementStrategy;
  ordering?: TermOrdering;
  /** Pesos para KBO (símbolo → peso). Variables tienen peso fijo 1. */
  kboWeights?: Map<string, number>;
  /** Precedencia para LPO/ordered (símbolo → rank; mayor = más fuerte). */
  precedence?: Map<string, number>;
  /** Índices (en `premises` + goal-negado) que arrancan en el set-of-support. */
  setOfSupport?: number[];
  timeoutMs?: number;
  maxSteps?: number;
}

/** Records a single inference step in the advanced prover's derivation. */
export interface ProofStep {
  rule: string;
  from: number[];
  result: FOLClause;
  substitution?: Substitution;
}

/** Aggregated statistics collected during a proof search run. */
export interface ProofStats {
  resolutions: number;
  subsumed: number;
  deduplicated: number;
  hyperresolutions: number;
  factored: number;
  steps: number;
}

export interface AdvancedProveResult {
  proven: boolean;
  steps: ProofStep[];
  stats: ProofStats;
  /** Razón cuando `proven=false`: timeout, saturated, maxSteps. */
  termination: 'refuted' | 'saturated' | 'timeout' | 'max-steps';
}
