# `reasoning/combinatorics/burnside.ts`

## Contents

- [`burnsideCount`](#burnsidecount) — Function
- [`cyclicRotations`](#cyclicrotations) — Function

## `burnsideCount`

> Function · `reasoning/combinatorics/burnside.ts:35`

Aplica el lema de Burnside para contar órbitas. `items` es el alfabeto;
el conjunto X sobre el que actúa el grupo son las cadenas de longitud
`length` (collares de `length` perlas con `items.length` colores).
`groupActions` son las funciones del grupo G actuando sobre X.

|X/G| = (1/|G|) * sum_{g in G} |X^g|

```ts
export function burnsideCount<T>( items: T[], length: number, groupActions: Array<(x: T[]) => T[]>, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |
| `length` | `number` | no |  |
| `groupActions` | `Array<(x: T[]) => T[]>` | no |  |

### Returns

`number` — 


## `cyclicRotations`

> Function · `reasoning/combinatorics/burnside.ts:69`

Genera las |group| rotaciones cíclicas de un arreglo de tamaño `length`.
Útil para contar collares con simetría cíclica.

```ts
export function cyclicRotations(length: number): Array<(x: unknown[]) => unknown[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `length` | `number` | no |  |

### Returns

`Array<(x: unknown[]) => unknown[]>` — 

