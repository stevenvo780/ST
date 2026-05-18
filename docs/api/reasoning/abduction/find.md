# `reasoning/abduction/find.ts`

============================================================ ST Abduction — Núcleo: búsqueda de explicaciones ============================================================ Estrategia: enumeración por tamaño creciente (BFS sobre subsets).   for k in 0..maxSize:     for cada subset H ⊆ abducibles con |H| = k:       si KB ∪ H ⊨ O y KB ∪ H consistent:         registrar H como explicación         marcar todos sus supersets como redundantes (no parsimoniosos) Las explicaciones se reportan ordenadas por tamaño ascendente. La minimalidad por inclusión se verifica al final con una pasada O(N²) sobre las explicaciones encontradas (suficiente para |explicaciones| ≲ algunos miles; en problemas grandes acotar `maxHypotheses`). Para `preferred = 'minimal'`, solo se reportan las parsimoniosas. Para `minimum-cardinality`, se reportan únicamente las de tamaño igual al mínimo encontrado. Para `minimum-cost`, las de costo mínimo (requiere costFunction o se usa size).

## Contents

- [`findExplanations`](#findexplanations) — Function
- [`bestExplanation`](#bestexplanation) — Function

## `findExplanations`

> Function · `reasoning/abduction/find.ts:112`

Encuentra todas las explicaciones de un problema abductivo.

- Enumera subsets de abducibles en orden creciente de tamaño.
- Filtra los inconsistentes y los que no implican la observación.
- Calcula minimalidad por inclusión (parsimony) post-hoc.
- Aplica el filtro `preferred` para el output final.

```ts
export function findExplanations( problem: AbductionProblem, opts?: AbductionOptions, ): Explanation[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `AbductionProblem` | no |  |
| `opts` | `AbductionOptions` | yes |  |

### Returns

`Explanation[]` — 


## `bestExplanation`

> Function · `reasoning/abduction/find.ts:220`

Devuelve UNA explicación: la "mejor" según `preferred`. Si hay
empate, la primera en orden lex (consistente y reproducible).

Devuelve `null` si no hay explicación posible.

```ts
export function bestExplanation( problem: AbductionProblem, opts?: AbductionOptions, ): Explanation | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `AbductionProblem` | no |  |
| `opts` | `AbductionOptions` | yes |  |

### Returns

`Explanation \| null` — 

