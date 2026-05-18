# `reasoning/combinatorics/inclusion-exclusion.ts`

Calcula |A_1 ∪ A_2 ∪ ... ∪ A_n| usando el principio de inclusión-exclusión
a fuerza bruta sobre el reticulado de subconjuntos no vacíos de índices.

|⋃ A_i| = Σ_{S≠∅} (-1)^(|S|+1) |⋂_{i∈S} A_i|

## `inclusionExclusion`

> Function · `reasoning/combinatorics/inclusion-exclusion.ts:7`

Calcula |A_1 ∪ A_2 ∪ ... ∪ A_n| usando el principio de inclusión-exclusión
a fuerza bruta sobre el reticulado de subconjuntos no vacíos de índices.

|⋃ A_i| = Σ_{S≠∅} (-1)^(|S|+1) |⋂_{i∈S} A_i|

```ts
export function inclusionExclusion(sets: Array<Set<number>>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sets` | `Array<Set<number>>` | no |  |

### Returns

`number` — 

