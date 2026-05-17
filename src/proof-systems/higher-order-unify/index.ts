// ============================================================
// Higher-order unification (Miller 1991) — Punto de entrada público
// ============================================================
//
// API:
//   - HOTerm, HOSubst (tipos)
//   - isPattern / isHigherOrderPattern (detección de patrón)
//   - unifyPattern  (unificación MGU decidible)
//   - applyHOSubst  (aplicar sustitución con β-reducción)
//   - normalize     (β-normalización leftmost-outermost)

export type { HOTerm, HOSubst } from './types';

export { isPattern, isHigherOrderPattern } from './pattern';

export { unifyPattern, unifyMetaApp, buildLambdaBinding } from './unify';

export { applyHOSubst, normalize, freeVarsHO, freshName, resetFreshCounter } from './normalize';
