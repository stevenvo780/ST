# `reasoning/game-theory/linalg.ts`

Resuelve A x = b por eliminación gaussiana con pivot parcial.
Devuelve null si el sistema es singular (no único o sin solución).
Diseñado para matrices chicas (n ≤ 20).

## `solveLinear`

> Function · `reasoning/game-theory/linalg.ts:12`

Resuelve A x = b por eliminación gaussiana con pivot parcial.
Devuelve null si el sistema es singular (no único o sin solución).
Diseñado para matrices chicas (n ≤ 20).

```ts
export function solveLinear(A: number[][], b: number[], tol = 1e-10): number[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `number[][]` | no |  |
| `b` | `number[]` | no |  |
| `tol` | `any` | yes |  |

### Returns

`number[] \| null` — 

