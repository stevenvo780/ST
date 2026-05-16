// Estado compartido del solver CDCL v2.
// Una "Clause" es un Int32Array de literales DIMACS (var positiva = true, negativa = false).
// Var IDs son 1-indexados. Literal `l` se mapea a índice de watch list mediante
// litToIdx(l, numVars).

export type Clause = Int32Array;

export type Literal = number;

/** Valor de variable: 0 = sin asignar, 1 = true, -1 = false. */
export type VarValue = 0 | 1 | -1;

export interface SolverStatsV2 {
  decisions: number;
  propagations: number;
  conflicts: number;
  learnedClauses: number;
  reducedClauses: number;
  restarts: number;
  maxDecisionLevel: number;
  solveTimeMs: number;
}

/** Resultado SAT con modelo. */
export interface SatResult {
  sat: true;
  model: Record<string, boolean>;
  stats: SolverStatsV2;
}

/** Resultado UNSAT con núcleo (conjunto de variables que entran en cláusulas
 * aprendidas vacías en el camino al conflicto raíz). */
export interface UnsatResult {
  unsat: true;
  core: number[];
  stats: SolverStatsV2;
}

export type SolveResult = SatResult | UnsatResult;

/** Opciones públicas del solver. */
export interface SolverOptions {
  /** Límite total en ms. Default: 30000. */
  timeoutMs?: number;
  /** Multiplicador de la secuencia de Luby (cada paso vale `base * luby(i)` conflictos). */
  lubyBase?: number;
  /** Decay multiplicativo para activities VSIDS (entre 0 y 1, típico 0.95). */
  vsidsDecay?: number;
  /** Decay multiplicativo para activities de cláusulas (typical 0.999). */
  clauseDecay?: number;
  /** LBD máximo aceptado al reducir; cláusulas con LBD > threshold se candidatean a eliminación. */
  lbdReduceThreshold?: number;
  /** Nombres de átomos opcional para producir modelo legible (1-indexado). */
  atomNames?: ReadonlyArray<string>;
  /** Fase inicial sugerida: 1 = polaridad positiva, 0 = negativa. Default 0 (MiniSat). */
  initialPhase?: 0 | 1;
}

/** Resultado de propagar: -1 si todo OK, o índice de cláusula en conflicto. */
export const NO_CONFLICT = -1;

/** Sentinela de "sin antecedente" (variable decidida o forzada por preprocessing). */
export const NO_ANTECEDENT = -1;

/** Convierte literal DIMACS a índice de watch list (rango 0..2*numVars-1). */
export function litToIdx(lit: Literal, numVars: number): number {
  return lit > 0 ? lit - 1 : numVars + -lit - 1;
}

/** Inversa de litToIdx — útil sólo para debugging. */
export function idxToLit(idx: number, numVars: number): Literal {
  return idx < numVars ? idx + 1 : -(idx - numVars + 1);
}
