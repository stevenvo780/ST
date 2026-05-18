# `reasoning/planning/astar.ts`

============================================================ ST Planning — A* Planner (forward search con heurística) ============================================================ A* sobre el espacio de estados: f(n) = g(n) + h(n) donde   g(n) = costo acumulado del plan hasta n   h(n) = heurística admisible al goal (default FF) Con h admisible (≤ costo real), A* garantiza el plan de menor COSTO. Con heurística no admisible, sigue funcionando pero pierde la garantía de óptimo (suele ser más rápido). Implementación de la priority queue: binary heap sobre `f`. Para problemas reales (b ~ 5, d ~ 30) basta — no necesitamos Fibonacci.

## `aStarPlan`

> Function · `reasoning/planning/astar.ts:103`

A* planner. Devuelve plan de menor costo bajo `heuristic` admisible,
o `null` si no hay solución dentro de los límites.

Default: `goalCountHeuristic` (|goal\state|). Para mejor rendimiento
en problemas no triviales, pasar `makeFFHeuristic(problem)`.

```ts
export function aStarPlan(problem: STRIPSProblem, options: AStarOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `STRIPSProblem` | no |  |
| `options` | `AStarOptions` | yes |  |

### Returns

`Plan \| null` — 

