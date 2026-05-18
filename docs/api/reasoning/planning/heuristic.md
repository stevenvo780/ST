# `reasoning/planning/heuristic.ts`

============================================================ ST Planning — Heurísticas ============================================================ Heurística "Fast-Forward" simplificada (Hoffmann & Nebel 2001): ignora la delete-list (delete-relaxation), construye un grafo de planificación relajado por "niveles" hasta que todos los hechos del goal aparezcan, y devuelve el número de niveles como estima. Es admisible (en el sentido relajado) y barata; en práctica guía muy bien a A* clásico para STRIPS. La versión completa de FF haría además extracción de plan relajado con contadores de "support" para mejorar el factor de rama. Acá nos quedamos con la estima por niveles, que ya es estricta mejor que `|goal \ state|` para problemas no triviales.

## Contents

- [`goalCountHeuristic`](#goalcountheuristic) — Const
- [`fastForwardHeuristic`](#fastforwardheuristic) — Function
- [`makeFFHeuristic`](#makeffheuristic) — Function

## `goalCountHeuristic`

> Const · `reasoning/planning/heuristic.ts:25`

Distancia básica: `|goal \ state|` (número de hechos del goal aún
no presentes en state). Es admisible pero muy débil.

```ts
const goalCountHeuristic: Heuristic
```


## `fastForwardHeuristic`

> Function · `reasoning/planning/heuristic.ts:47`

Heurística Fast-Forward (versión por niveles, ignora delete-list).

Construcción:
  F₀ = state
  F_{i+1} = F_i ∪ {add-effects de toda acción ground con pre ⊆ F_i}
  Termina cuando goal ⊆ F_k → devuelve k.
  Si F se estabiliza sin alcanzar el goal → devuelve Infinity
  (estado dead-end del problema relajado, por lo tanto del original).

Sin delete-list, F crece monotónicamente, así que la iteración
termina en ≤ |universo de hechos accesibles| pasos.

`actions` debe ser una lista de schemas (lifted). Internamente
grounded en cada nivel con los objetos del dominio.

```ts
export function fastForwardHeuristic( state: Set<Fact>, goal: Set<Fact>, actions: STRIPSAction[], objects?: Record<string, string[]>, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `Set<Fact>` | no |  |
| `goal` | `Set<Fact>` | no |  |
| `actions` | `STRIPSAction[]` | no |  |
| `objects` | `Record<string, string[]>` | yes |  |

### Returns

`number` — 


## `makeFFHeuristic`

> Function · `reasoning/planning/heuristic.ts:168`

Helper para crear una heurística FF cerrada sobre el problema.
Devuelve una función `Heuristic` que `aStarPlan` puede consumir.

```ts
export function makeFFHeuristic(problem: STRIPSProblem): Heuristic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `STRIPSProblem` | no |  |

### Returns

`Heuristic` — 

