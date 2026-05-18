# `utils/memo.ts`

## Contents

- [`memoizeString`](#memoizestring) — Function
- [`memoizeHash`](#memoizehash) — Function
- [`memoizeAtoms`](#memoizeatoms) — Function
- [`memoizeNNF`](#memoizennf) — Function
- [`memoizeCNF`](#memoizecnf) — Function
- [`memoizeDNF`](#memoizednf) — Function

## `memoizeString`

> Function · `utils/memo.ts:21`

Función genérica de memoización para operaciones que toman FormData y
devuelven un string.

```ts
export function memoizeString(f: Formula, compute: (f: Formula) => string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => string` | no |  |

### Returns

`string` — 


## `memoizeHash`

> Function · `utils/memo.ts:29`

```ts
export function memoizeHash(f: Formula, compute: (f: Formula) => string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => string` | no |  |

### Returns

`string` — 


## `memoizeAtoms`

> Function · `utils/memo.ts:37`

```ts
export function memoizeAtoms(f: Formula, compute: (f: Formula) => Set<string>): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => Set<string>` | no |  |

### Returns

`Set<string>` — 


## `memoizeNNF`

> Function · `utils/memo.ts:45`

```ts
export function memoizeNNF(f: Formula, compute: (f: Formula) => Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => Formula` | no |  |

### Returns

`Formula` — 


## `memoizeCNF`

> Function · `utils/memo.ts:53`

```ts
export function memoizeCNF(f: Formula, compute: (f: Formula) => Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => Formula` | no |  |

### Returns

`Formula` — 


## `memoizeDNF`

> Function · `utils/memo.ts:61`

```ts
export function memoizeDNF(f: Formula, compute: (f: Formula) => Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `compute` | `(f: Formula) => Formula` | no |  |

### Returns

`Formula` — 

