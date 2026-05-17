// ============================================================
// Higher-Order Logic (HOL Light style) — Entrada pública
// ============================================================

export type { HOLType, HOLTerm, HOLTheorem, HOLSequent } from './types';

// Sistema de tipos
export {
  tvar,
  tconst,
  tapp,
  TyBool,
  TyInd,
  funTy,
  funTyN,
  typeEq,
  isFunType,
  funDomain,
  funCodomain,
  typeToString,
  substType,
  freeTypeVars,
} from './type-system';

// Términos
export {
  mkVar,
  mkConst,
  mkAbs,
  typeOf,
  alphaEq,
  freeVars,
  occursFree,
  freshName,
  substTerm,
  instTypeInTerm,
  termToString,
  eqConst,
  mkEq,
  destEq,
  isEq,
  isIff,
} from './term';

// mkComb se expone desde rules.ts (que reexporta) para que el
// "mkComb regla" (sobre teoremas) sea el público, mientras que
// el constructor de términos vive como `mkCombTerm`.
export { mkComb as mkCombTerm } from './term';

// Reglas primitivas
export {
  refl,
  trans,
  mkComb,
  abs,
  beta,
  assume,
  eqMp,
  deductAntisymRule,
  instType,
  inst,
  instTyped,
} from './rules';

// Conectivas y cuantificadores definidos
export {
  True,
  Bottom,
  And,
  Or,
  Not,
  Implies,
  Forall,
  Exists,
  mkAnd,
  mkOr,
  mkNot,
  mkImplies,
  mkForall,
  mkExists,
  assertBool,
} from './connectives';
