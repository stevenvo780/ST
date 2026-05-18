# `reasoning/combinatorics/generators.ts`

## Contents

- [`generatePermutations`](#generatepermutations) — Function
- [`generateCombinations`](#generatecombinations) — Function
- [`generatePowerSet`](#generatepowerset) — Function
- [`generateSubsetsOfSize`](#generatesubsetsofsize) — Function

## `generatePermutations`

> Function · `reasoning/combinatorics/generators.ts:1`

```ts
export function* generatePermutations<T>(items: T[]): Generator<T[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |

### Returns

`Generator<T[]>` — 


## `generateCombinations`

> Function · `reasoning/combinatorics/generators.ts:39`

```ts
export function* generateCombinations<T>(items: T[], r: number): Generator<T[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |
| `r` | `number` | no |  |

### Returns

`Generator<T[]>` — 


## `generatePowerSet`

> Function · `reasoning/combinatorics/generators.ts:84`

```ts
export function* generatePowerSet<T>(items: T[]): Generator<T[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |

### Returns

`Generator<T[]>` — 


## `generateSubsetsOfSize`

> Function · `reasoning/combinatorics/generators.ts:102`

```ts
export function* generateSubsetsOfSize<T>(items: T[], k: number): Generator<T[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |
| `k` | `number` | no |  |

### Returns

`Generator<T[]>` — 

