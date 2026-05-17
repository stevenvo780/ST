// ============================================================
// ST Abduction — Barrel
// ============================================================
//
// Razonamiento abductivo: dado un knowledge base KB y una observación
// O, encontrar la hipótesis mínima H ⊆ Abducibles tal que
// KB ∪ H ⊨ O y KB ∪ H es consistente.
//
// API pública:
//   - `findExplanations(problem, opts?)`  → todas las explicaciones
//   - `bestExplanation(problem, opts?)`   → la mejor según preferencia
//   - `defaultEntails(opts?)`             → oráculo entailment Horn-like
//   - `defaultConsistent(opts?)`          → oráculo consistencia derivado
//
// Tipos: `AbductionProblem`, `Explanation`, `AbductionOptions`,
// `EntailmentOracle`, `ConsistencyOracle`, `Preference`, `Formula`.

export { findExplanations, bestExplanation } from './find';
export { defaultEntails, defaultConsistent } from './entails';
export type {
  AbductionOptions,
  AbductionProblem,
  ConsistencyOracle,
  EntailmentOracle,
  Explanation,
  Formula,
  Preference,
} from './types';
