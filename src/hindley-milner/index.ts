// ============================================================
// Hindley-Milner — Punto de entrada público
// ============================================================
//
// Sistema de tipos let-polimórfico (Damas-Milner). Provee:
//   - Sintaxis: Type, TypeScheme, Expr, TypeEnv.
//   - Constructores breves: tVar, tConst, tArrow, tApp, eLam, eApp,
//     eLet, eLetRec, eIf, eLit, eVar.
//   - Algoritmo W: algorithmW / infer / inferScheme.
//   - Unificación y sustituciones: unify, applySubst, composeSubsts,
//     freshTypeVar, generalize, instantiate.
//   - Entorno inicial con primitivos (+, ==, pair, cons, ...).
//   - normalizeScheme: renombra tvars ligadas a a, b, c, ... para
//     comparación estable en tests.

export type { Type, TypeScheme, Expr } from './types';
export type { Substitution, UnifyResult } from './substitution';
export type { InferResult, InferOutcome, InferSchemeResult } from './infer';

export {
  TypeEnv,
  tVar,
  tConst,
  tArrow,
  tApp,
  scheme,
  mono,
  eVar,
  eLit,
  eApp,
  eAppN,
  eLam,
  eLet,
  eLetRec,
  eIf,
  TInt,
  TBool,
  TStr,
  typeFreeVars,
  schemeFreeVars,
  typeToString,
  schemeToString,
} from './types';

export {
  emptySubst,
  applySubst,
  applySubstScheme,
  composeSubsts,
  freshTypeVar,
  resetFreshSupply,
  occursIn,
  unify,
  isUnifyError,
  generalize,
  instantiate,
} from './substitution';

export { algorithmW, infer, inferScheme, isInferError, initialEnv, normalizeScheme } from './infer';
