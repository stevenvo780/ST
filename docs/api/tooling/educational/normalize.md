# `tooling/educational/normalize.ts`

============================================================ Normalización de respuestas — comparar strings textuales ============================================================

## Contents

- [`normalizeText`](#normalizetext) — Function
- [`matchesStatus`](#matchesstatus) — Function
- [`normalizeFormula`](#normalizeformula) — Function
- [`formulasEqualText`](#formulasequaltext) — Function
- [`parseValuation`](#parsevaluation) — Function

## `normalizeText`

> Function · `tooling/educational/normalize.ts:5`

```ts
export function normalizeText(s: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`string` — 


## `matchesStatus`

> Function · `tooling/educational/normalize.ts:46`

```ts
export function matchesStatus(answer: string, expected: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `answer` | `string` | no |  |
| `expected` | `string` | no |  |

### Returns

`boolean` — 


## `normalizeFormula`

> Function · `tooling/educational/normalize.ts:63`

```ts
export function normalizeFormula(s: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`string` — 


## `formulasEqualText`

> Function · `tooling/educational/normalize.ts:78`

```ts
export function formulasEqualText(a: string, b: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `string` | no |  |
| `b` | `string` | no |  |

### Returns

`boolean` — 


## `parseValuation`

> Function · `tooling/educational/normalize.ts:82`

```ts
export function parseValuation(raw: string): Record<string, boolean> | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `raw` | `string` | no |  |

### Returns

`Record<string, boolean> \| null` — 

