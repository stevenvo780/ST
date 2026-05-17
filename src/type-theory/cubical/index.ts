// ============================================================
// CTT-Lite — Cubical Type Theory (núcleo público)
// ============================================================
//
// Extiende MLTT con:
//   - Intervalo I con conexiones (∧, ∨) e involución (~)
//   - PathP A x y como caminos dependientes en I
//   - λi. t y p @ r (path-abstracción y aplicación)
//   - Reducciones computacionales del intervalo
//   - glue como precursor sintáctico de la computación de ua
//
// La diferencia central con HoTT (en /hott/) es que aquí univalence
// es computacional: transport sobre un path generado por glue puede
// reducir (en una versión completa de CTT). En este subset se sienta
// la base sintáctica que permite esa reducción.

export type { CubicalTerm } from './types';
export {
  cI0,
  cI1,
  cIVar,
  cIMin,
  cIMax,
  cINeg,
  cPathP,
  cPLam,
  cPApp,
  cGlue,
  cVar,
  cUniverse,
  cPi,
  cLam,
  cApp,
  cArrow,
  isIntervalExpr,
  freeVarsCubical,
  occursFreeCubical,
  termToStringCubical,
} from './types';

export { substituteCubical } from './substitute';
export { evalInterval, normalizeInterval } from './interval';
export type { IntervalValue } from './interval';
export { reduceStepCubical, normalizeCubical, isNormalCubical } from './normalize';
export { alphaEqCubical, alphaBetaEqCubical } from './equality';
export { inferType, checkType, isInferErrorCubical, makeContext, intervalType } from './infer';
export type { CubicalContext, InferResultCubical } from './infer';
export { reflPath, pathInverse, pathCompose, glue } from './path-algebra';

// Alias sin sufijo para uso ergonómico
export { normalizeCubical as normalize } from './normalize';
export { alphaBetaEqCubical as alphaBetaEq, alphaEqCubical as alphaEq } from './equality';
export { termToStringCubical as termToString } from './types';
