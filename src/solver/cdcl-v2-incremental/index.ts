// CDCL incremental — entry point público.
//
// API:
//   const s = new IncrementalCDCL(numVars?);
//   s.addClause([1, -2, 3]);            // cláusulas DIMACS
//   s.push();                            // checkpoint opcional
//   const r = s.solve([assump1, ...]);   // sat/unsat con assumptions opcionales
//   s.pop();                             // rollback al checkpoint
//
// Ver `types.ts` para los tipos de resultado.

export { IncrementalCDCL } from './solver';
export type {
  IncrementalSolveResult,
  IncrementalSolverOptions,
  IncrementalStats,
  SolverSummary,
} from './types';
