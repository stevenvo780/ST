// ============================================================
// System F — Punto de entrada público
// ============================================================
//
// λ² (System F) extiende STLC con cuantificación universal sobre
// tipos. Curry-Howard: corresponde a la lógica proposicional
// intuicionista de segundo orden.
//
// Constructores y operaciones:
//   - Tipos: atom, arrow, forall.
//   - Términos: var, abs, app, tabs (Λ), tapp (t [T]).
//   - typeOf: type-checking con contexto (term + type).
//   - reduceBeta / normalize: β + type-β (call-by-name).
//   - isWellFormed: chequea que tipos no tengan variables libres
//     no declaradas.
//   - alphaEqType: igualdad de tipos módulo α.

export type { FType, FTerm, FContext } from './types';
export {
  fAtom,
  fArrow,
  fForall,
  fVar,
  fAbs,
  fApp,
  fTAbs,
  fTApp,
  freeTypeVars,
  alphaEqType,
  isWellFormed,
  fTypeToString,
  fTermToString,
  emptyContext,
  cloneContext,
} from './types';

export type { FTypeResult } from './infer';
export { typeOf, isTypeError } from './infer';

export type { NormalizeResult } from './reduce';
export {
  reduceBeta,
  normalize,
  isNormal,
  freeVars,
  termTypeVars,
  substType,
  substTypeInTerm,
  substTerm,
} from './reduce';
