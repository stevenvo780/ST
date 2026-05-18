# `runtime/typecheck/levenshtein.ts`

Calcula la distancia de edición (Levenshtein) entre dos strings.
Complejidad: O(|a| * |b|) en tiempo y espacio.

## Contents

- [`levenshtein`](#levenshtein) — Function
- [`findClosest`](#findclosest) — Function

## `levenshtein`

> Function · `runtime/typecheck/levenshtein.ts:9`

Calcula la distancia de edición (Levenshtein) entre dos strings.
Complejidad: O(|a| * |b|) en tiempo y espacio.

```ts
export function levenshtein(a: string, b: string): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `string` | no |  |
| `b` | `string` | no |  |

### Returns

`number` — 


## `findClosest`

> Function · `runtime/typecheck/levenshtein.ts:41`

Dado un identificador no reconocido y un set de candidatos declarados,
devuelve el más cercano si su distancia ≤ maxDistance, o undefined.

```ts
export function findClosest( unknown: string, candidates: Iterable<string>, maxDistance = 2, ): string | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `unknown` | `string` | no |  |
| `candidates` | `Iterable<string>` | no |  |
| `maxDistance` | `any` | yes |  |

### Returns

`string \| undefined` — 

