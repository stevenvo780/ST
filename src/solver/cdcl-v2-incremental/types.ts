// Tipos públicos del solver CDCL incremental.
//
// La diferencia conceptual con `solveCDCLv2` (one-shot) es que aquí el solver
// es un objeto vivo: se le agregan cláusulas, se llama `solve()` varias veces,
// y mantiene su pool de cláusulas aprendidas + heurísticas entre llamadas.
//
// Los `assumptions` son literales que se asumen `true` para una única query.
// Si la query es UNSAT bajo esas asumptions, se devuelve el subconjunto
// `failedAssumptions` que causó el conflicto (subset minimal del prefix
// derivado en O(|trail|)). Eso es la base de MUS extraction y debugging.

export interface IncrementalSolveResult {
  /** True si las cláusulas + assumptions son satisfacibles. */
  sat: boolean;
  /** Modelo (sólo si sat). varId 1-indexado → polaridad asignada. */
  model?: Map<number, boolean>;
  /** Núcleo UNSAT de assumptions (sólo si !sat y había assumptions). */
  unsatCore?: number[];
  /** Subconjunto de assumptions que provocó el conflicto. Igual a unsatCore en v1. */
  failedAssumptions?: number[];
  /** Estadísticas acumuladas durante esta llamada. */
  stats: IncrementalStats;
}

export interface IncrementalStats {
  /** Decisiones tomadas en esta llamada. */
  decisions: number;
  /** Conflictos resueltos en esta llamada. */
  conflicts: number;
  /** Cláusulas aprendidas añadidas en esta llamada. */
  learned: number;
  /** Propagaciones aplicadas en esta llamada. */
  propagations: number;
  /** Restarts ejecutados en esta llamada. */
  restarts: number;
}

export interface SolverSummary {
  /** Decisiones acumuladas en todas las queries. */
  decisions: number;
  /** Conflictos acumulados. */
  conflicts: number;
  /** Cláusulas aprendidas vivas (no descartadas por pop ni reducción). */
  learned: number;
  /** Variables actualmente declaradas. */
  vars: number;
  /** Cláusulas vivas (originales + aprendidas, no eliminadas). */
  clauses: number;
}

export interface IncrementalSolverOptions {
  /** Timeout total por llamada a solve(). Default 30s. */
  timeoutMs?: number;
  /** Decay multiplicativo VSIDS (entre 0 y 1). Default 0.95. */
  vsidsDecay?: number;
  /** Multiplicador secuencia Luby para restarts. Default 100. */
  lubyBase?: number;
  /** Fase inicial sugerida (0 = falso, 1 = verdadero). Default 0. */
  initialPhase?: 0 | 1;
}
