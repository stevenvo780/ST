# `logic/profiles/probabilistic/basic.ts`

============================================================ ST Probabilistic Basic — Razonamiento Probabilístico ============================================================ Motor básico de razonamiento probabilístico basado en asignaciones de probabilidad y reglas bayesianas. En este perfil, las fórmulas proposicionales se evalúan con probabilidades [0,1] en lugar de booleanos. Reglas:   P(A)       ∈ [0, 1]   P(¬A)      = 1 - P(A)   P(A ∧ B)   = P(A) × P(B)          (independencia)   P(A ∨ B)   = P(A) + P(B) - P(A∧B) (inclusión-exclusión)   P(A → B)   = P(¬A ∨ B)            (material conditional)   P(A ↔ B)   = P(A→B) × P(B→A) Validez: P(φ) = 1 para toda asignación Satisfacible: ∃ asignación con P(φ) > 0 ============================================================

## `ProbabilisticBasic`

> Class · `logic/profiles/probabilistic/basic.ts:143`

```ts
export class ProbabilisticBasic implements LogicProfile
```

