// ============================================================
// Refinement types — Punto de entrada público
// ============================================================
//
// Tipos refinados al estilo Liquid Haskell didáctico:
//   { x : Int | P(x) }
//
// Capacidades:
//   - typeCheck : sintetiza o chequea tipos refinados con VC
//                 generation y descarga acotada.
//   - isSubtype : subtipado por implicación, contravarianza en
//                 parámetros de arrow.
//   - generateVC: extrae los predicados que deben mantenerse.
//   - checkVC   : solver acotado SAT-like sobre enteros + booleanos.

export type { BaseType, RefType, RTerm } from './types';
export {
  tInt,
  tBool,
  tString,
  tArrow,
  refine,
  rLit,
  rVar,
  rBinop,
  rIf,
  rLam,
  rApp,
  rLet,
  eqBase,
  eqRefType,
  baseToString,
  refTypeToString,
  termToString,
} from './types';

export { typeCheck, generateVC } from './checker';
export type { TypeCheckResult, RCtx } from './checker';

export { isSubtype } from './subtype';
export type { SubtypeOpts } from './subtype';

export { checkVC, implies } from './solver';
export type { CheckResult, SolverOpts } from './solver';

export {
  parsePredicate,
  evalPredicate,
  freeVars as predicateFreeVars,
  substVar as predicateSubstVar,
  renameVar as predicateRenameVar,
  predicateToString,
} from './predicate';
export type { PExpr, PEnv, PValue } from './predicate';
