// ============================================================
// ST modal μ-calculus — punto de entrada público
// ============================================================
// API:
//   modelCheck(K, φ)        → Set<stateId> que satisfacen φ
//   satisfiesAt(K, φ, s)    → boolean
//   isWellFormed(φ)         → boolean (cerrada + positiva)
//   isClosed(φ) / freeVars(φ) → análisis sintáctico
//   alternationDepth(φ)     → number
//   ctlToMu(ctlFormula)     → MuFormula
//   muToString(φ)           → notación textual
//
// El μ-cálculo subsume CTL, LTL y PDL: cualquier fórmula CTL puede
// traducirse vía `ctlToMu`. Es el "ensemble logic" de la familia
// modal/temporal.
// ============================================================

export type { MuFormula, MuVarName, KripkeStructure } from './types';
export { muToString } from './types';
export { modelCheck, satisfiesAt } from './check';
export { isWellFormed, isClosed, isPositive, freeVars, alternationDepth } from './wellformed';
export { ctlToMu } from './ctl-translate';
export type { CTLLike } from './ctl-translate';
