// ============================================================
// λ-cálculo untyped — Punto de entrada público
// ============================================================
//
// API:
//   - Constructores: v / lam / ap / apN
//   - α-equivalencia, pretty printer
//   - freeVars, substitute (capture-avoiding), alphaRename
//   - betaStep / etaStep / normalize / isNormalForm / isWeakHeadNormalForm
//   - Combinadores: I, K, S, Y, omega, omegaSmall
//   - Church numerals: churchNumeral, decodeChurch, evalChurch,
//                       churchSucc, churchAdd, churchMul

export type { Term } from './types';
export { v, lam, ap, apN, alphaEq, termToString } from './types';

export { freeVars, substitute, alphaRename, makeFreshSupply } from './substitution';

export {
  betaStep,
  etaStep,
  normalize,
  isNormalForm,
  isWeakHeadNormalForm,
} from './reduce';
export type { BetaStrategy, NormalStrategy, NormalizeOpts, NormalizeResult } from './reduce';

export { I, K, S, Y, omega, omegaSmall } from './combinators';

export {
  churchNumeral,
  decodeChurch,
  evalChurch,
  churchSucc,
  churchAdd,
  churchMul,
} from './church';
