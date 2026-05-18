# `tooling/test-harness/generators.ts`

## Contents

- [`nats`](#nats) — Function
- [`range`](#range) — Function
- [`randomInts`](#randomints) — Function
- [`take`](#take) — Function
- [`toArray`](#toarray) — Function

## `nats`

> Function · `tooling/test-harness/generators.ts:1`

```ts
export function* nats(max: number): Generator<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `max` | `number` | no |  |

### Returns

`Generator<number>` — 


## `range`

> Function · `tooling/test-harness/generators.ts:9`

```ts
export function* range( start: number, end: number, step?: number ): Generator<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `start` | `number` | no |  |
| `end` | `number` | no |  |
| `step` | `number` | yes |  |

### Returns

`Generator<number>` — 


## `randomInts`

> Function · `tooling/test-harness/generators.ts:38`

```ts
export function* randomInts( seed: number, count: number, max: number ): Generator<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seed` | `number` | no |  |
| `count` | `number` | no |  |
| `max` | `number` | no |  |

### Returns

`Generator<number>` — 


## `take`

> Function · `tooling/test-harness/generators.ts:51`

```ts
export function take<T>(gen: Iterable<T>, n: number): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `gen` | `Iterable<T>` | no |  |
| `n` | `number` | no |  |

### Returns

`T[]` — 


## `toArray`

> Function · `tooling/test-harness/generators.ts:63`

```ts
export function toArray<T>(gen: Iterable<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `gen` | `Iterable<T>` | no |  |

### Returns

`T[]` — 

