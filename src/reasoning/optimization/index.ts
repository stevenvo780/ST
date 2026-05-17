// ============================================================
// ST Optimization — barrel público.
// ============================================================
// API:
//   solveLP(problem, opts?)   → LPSolution     simplex de dos fases
//   solveILP(problem, opts?)  → ILPSolution    branch-and-bound
//   lpRelaxation(ilp)         → LPProblem      relajación continua
//   standardForm(lp)          → LPProblem      forma estándar
// ============================================================

export type {
  LPProblem,
  LPSolution,
  LPStatus,
  LPConstraint,
  LPOptions,
  ILPProblem,
  ILPSolution,
  ILPOptions,
  ObjectiveKind,
  ConstraintOperator,
} from './types';

export { solveLP } from './simplex';
export { solveILP, lpRelaxation } from './branch-and-bound';
export { standardForm } from './standard-form';
