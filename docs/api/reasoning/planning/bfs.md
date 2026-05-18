# `reasoning/planning/bfs.ts`

============================================================ ST Planning — BFS Planner (forward search) ============================================================ Búsqueda forward en anchura desde el initialState. Garantiza el plan de MENOR longitud (≠ menor costo si hay costos no uniformes; para costos pesados usá `aStarPlan`). Esquema:   1. Frontera = cola con (state, planSoFar).   2. Visitados = set de hashes canónicos de estado (para no      re-expandir el mismo estado).   3. Pop, chequear goal, si no → expandir todas las acciones      aplicables (con preconditions ⊆ state) y agregar nuevos      estados a la frontera.   4. Cortar por `maxDepth` y `maxNodes`.

## Contents

- [`hashState`](#hashstate) — Function
- [`bfsPlan`](#bfsplan) — Function

## `hashState`

> Function · `reasoning/planning/bfs.ts:25`

Hash canónico de un estado: orden lex de los hechos y join. Es
O(n log n) pero los estados de planning suelen ser chicos.

```ts
export function hashState(state: Set<Fact>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `Set<Fact>` | no |  |

### Returns

`string` — 


## `bfsPlan`

> Function · `reasoning/planning/bfs.ts:40`

BFS planner. Devuelve plan de menor longitud, o `null` si no hay
solución dentro de los límites.

Complejidad: O(b^d) donde b = factor de rama (acciones ground
aplicables) y d = profundidad. Para problemas reales sin podas se
vuelve inviable rápido — usar `aStarPlan` con FF heuristic para
dominios no triviales.

```ts
export function bfsPlan(problem: STRIPSProblem, options: PlannerOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `STRIPSProblem` | no |  |
| `options` | `PlannerOptions` | yes |  |

### Returns

`Plan \| null` — 

