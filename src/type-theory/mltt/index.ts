// ============================================================
// MLTT — Martin-Löf Type Theory (núcleo público)
// ============================================================
//
// Cálculo λ con tipos dependientes:
//   - Π (x : A). B(x)          funciones dependientes
//   - Σ (x : A). B(x)          pares dependientes
//   - Id(A, a, b) + refl       tipo identidad propositional
//   - Type i jerárquico        universos
//   - Nat / zero / succ        naturales como tipo base
//
// inferType / checkType / normalize / alphaBetaEq son la API mínima
// para construir lenguajes tipo Coq/Agda didácticos encima.

export type { MLTTTerm } from './types';
export {
  mVar,
  mUniverse,
  mPi,
  mLam,
  mApp,
  mSigma,
  mPair,
  mFst,
  mSnd,
  mId,
  mRefl,
  mNat,
  mZero,
  mSucc,
  mArrow,
  freeVars,
  occursFree,
  termToString,
} from './types';

export { substitute } from './substitute';
export { reduceStep, normalize, isNormal } from './normalize';
export { alphaEq, alphaBetaEq } from './equality';
export { inferType, checkType, isInferError } from './infer';
export type { InferContext, InferResult } from './infer';
