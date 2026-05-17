// ============================================================
// HoTT — Homotopy Type Theory (núcleo público)
// ============================================================
//
// Extiende MLTT con:
//   - Path A x y como espacio de caminos (no proposición)
//   - refl, transport, ap, J-eliminator (computacionales sobre refl)
//   - pathSym (inverso) y pathConcat (concatenación)
//   - HITs: S¹ (circle, base, loop) y suspensión (north, south, meridian)
//   - Univalence como axioma (ua) no computacional
//
// API mínima compatible con MLTT:
//   inferType / checkType / normalize / alphaBetaEq

export type { HoTTTerm } from './types';
export {
  hVar,
  hUniverse,
  hPi,
  hLam,
  hApp,
  hSigma,
  hPair,
  hFst,
  hSnd,
  hNat,
  hZero,
  hSucc,
  hArrow,
  hPath,
  hRefl,
  hTransport,
  hPathSym,
  hPathConcat,
  hAp,
  hJElim,
  hCircle,
  hBaseOfCircle,
  hLoopOfCircle,
  hSuspension,
  hNorth,
  hSouth,
  hMeridian,
  hUa,
  freeVarsHoTT,
  occursFreeHoTT,
  termToStringHoTT,
} from './types';

export { substituteHoTT } from './substitute';
export { reduceStepHoTT, normalizeHoTT, isNormalHoTT } from './normalize';
export { alphaEqHoTT, alphaBetaEqHoTT } from './equality';
export { inferType, checkType, isInferErrorHoTT } from './infer';
export type { InferContextHoTT, InferResultHoTT } from './infer';
export {
  refl,
  pathInverse,
  pathCompose,
  isHEquivalence,
  univalence,
  univalenceWitness,
} from './path-algebra';
export type { UnivalenceWitness } from './path-algebra';

// Alias sin sufijo para uso ergonómico desde otros módulos.
export { normalizeHoTT as normalize } from './normalize';
export { alphaBetaEqHoTT as alphaBetaEq, alphaEqHoTT as alphaEq } from './equality';
export { termToStringHoTT as termToString } from './types';
