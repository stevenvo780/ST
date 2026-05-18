// ============================================================
// ST dL-Hybrid — Punto de entrada público del perfil
// ============================================================
// Differential Dynamic Logic (Platzer 2008/2010), subset decidible para
// verificación de sistemas híbridos: programas con estado continuo
// (ODEs polinomiales lineales) y discreto (asignaciones, choice, tests).
//
// API:
//   parseFormula(src) / parseProgram(src) / parseTerm(src)
//     Lexer + parser de la sintaxis textual dL.
//   checkValid(f, opts?)       Decisión de validez (semántica acotada).
//   checkSatisfiable(f, opts?) Decisión de satisfacibilidad.
//   evalInState(f, s, opts?)   Evaluación concreta en un estado.
//   classifyOde, flow, lieDerivative
//     Análisis y evolución analítica de sistemas ODE.
//   DLHybridProfile  Clase para registro en el `ProfileRegistry`.
//
// Limitaciones (subset):
//   • Sólo ODEs desacopladas (cada x' = f(x) sólo menciona x).
//   • x' = c (constantes) y x' = a*x + b (lineal con a, b constantes).
//   • Validez decidida por enumeración acotada sobre una malla finita:
//     no equivalente al cálculo completo de KeYmaera, pero suficiente para
//     los ejemplos canónicos.
//   • Loops α* expandidos a horizonte N (loopUnfold, default 3).
// ============================================================

export type {
  DLFormula,
  DLTerm,
  CompOp,
  HybridProgram,
  OdeSystem,
  State,
} from './ast';
export {
  num,
  variable,
  plus,
  minus,
  times,
  divide,
  negTerm,
  power,
  comp,
  trueF,
  falseF,
  notF,
  andF,
  orF,
  implies,
  iff,
  box,
  diamond,
  assign,
  nondet,
  test,
  seq,
  choice,
  loop,
  ode,
  cloneState,
  termVars,
  formulaVars,
  programVars,
  termToString,
  programToString,
  formulaToString,
} from './ast';

export {
  evalTerm,
  evalComp,
  evalQuantifierFree,
  substTerm,
  substFormula,
} from './semantics';

export type { SolutionKind } from './differential';
export {
  termToExpr,
  termIsConstant,
  termIsLinearIn,
  classifyOde,
  flow,
  lieDerivative,
  evalSym,
} from './differential';

export { parseFormula, parseProgram, parseTerm } from './parser';

export type { DLCheckResult, DLOptions } from './tableau';
export { checkValid, checkSatisfiable, evalInState, relevantVariables } from './tableau';

export { DLHybridProfile, runValidity, runSatisfiability } from './profile';
