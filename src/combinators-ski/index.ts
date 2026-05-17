// ============================================================
// SKI combinatory logic — Punto de entrada público
// ============================================================
//
// API:
//   - Tipos: CTerm
//   - Constructores: S(), K(), I(), cvar, app
//   - Estructura: ctermEq, freeVars, termToString
//   - Reducción: reduceStep, normalize, isNormalForm, NormalizeResult
//   - Bracket abstraction: abstractFromLambda, toLambda

export type { CTerm } from './types';
export { S, K, I, cvar, app, ctermEq, freeVars, termToString } from './types';

export { reduceStep, normalize, isNormalForm } from './reduce';
export type { NormalizeResult } from './reduce';

export { abstractFromLambda, toLambda } from './abstract';
