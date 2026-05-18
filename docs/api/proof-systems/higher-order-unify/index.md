# `proof-systems/higher-order-unify/index.ts`

============================================================ Higher-order unification (Miller 1991) — Punto de entrada público ============================================================ API:   - HOTerm, HOSubst (tipos)   - isPattern / isHigherOrderPattern (detección de patrón)   - unifyPattern  (unificación MGU decidible)   - applyHOSubst  (aplicar sustitución con β-reducción)   - normalize     (β-normalización leftmost-outermost)
