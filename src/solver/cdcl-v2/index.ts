/**
 * @module cdcl-v2
 * Entry point público del solver CDCL v2.
 *
 * Uso: `solveCDCLv2(clauses, numVars, opts?)` donde `clauses` es un arreglo
 * de `Int32Array` en formato DIMACS (variables 1..numVars). Devuelve
 * {@link SatResult} o {@link UnsatResult}.
 */
// CDCL v2 — Entry point público.
//
// API principal:
//   solveCDCLv2(clauses, numVars, opts?) → SatResult | UnsatResult
//
// `clauses` es un arreglo de Int32Array en formato DIMACS (variables 1..numVars,
// literal positivo = true, negativo = false; cláusula vacía ⇒ UNSAT).
//
// El solver implementa el pipeline state-of-the-art clásico:
//   - 2-watched literals para BCP O(amortizado).
//   - VSIDS con EVSIDS rescaling para heurística de decisión.
//   - 1UIP conflict analysis con minimización implícita por bumped tracking.
//   - Luby restarts (1, 1, 2, 1, 1, 2, 4, ...).
//   - Phase saving (Pipatsrisawat & Darwiche 2007).
//   - LBD scoring + reducción periódica de la learnt clause database.

export { solveCDCLv2 } from './solver';
export { NO_ANTECEDENT, NO_CONFLICT, litToIdx, idxToLit } from './state';
export type {
  Clause,
  Literal,
  SatResult,
  SolveResult,
  SolverOptions,
  SolverStatsV2,
  UnsatResult,
  VarValue,
} from './state';
export { VSIDS } from './vsids';
export { LubyRestartPolicy, luby, lubySequence } from './luby';
export { PhaseSaver } from './phase-saving';
export { analyzeConflict1UIP, type AnalysisResult, type ConflictContext } from './clause-learning';
export { computeLBD, selectClausesToRemove, type LearnedMeta } from './lbd';
