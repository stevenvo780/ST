# `reasoning/number-theory/modular.ts`

============================================================ Aritmética modular sobre bigint. ============================================================ modPow      — exponenciación modular por squaring. modInverse  — inverso multiplicativo usando Bézout (null si no existe). modSolve    — resuelve a·x ≡ b (mod m) (null si no hay solución). Convención: el resultado siempre vive en [0, m) cuando m > 0.

## Contents

- [`modPow`](#modpow) — Function
- [`modInverse`](#modinverse) — Function
- [`modSolve`](#modsolve) — Function

## `modPow`

> Function · `reasoning/number-theory/modular.ts:19`

```ts
export function modPow(base: bigint, exp: bigint, m: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `base` | `bigint` | no |  |
| `exp` | `bigint` | no |  |
| `m` | `bigint` | no |  |

### Returns

`bigint` — 


## `modInverse`

> Function · `reasoning/number-theory/modular.ts:43`

```ts
export function modInverse(a: bigint, m: bigint): bigint | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `m` | `bigint` | no |  |

### Returns

`bigint \| null` — 


## `modSolve`

> Function · `reasoning/number-theory/modular.ts:54`

```ts
export function modSolve(a: bigint, b: bigint, m: bigint): bigint | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `b` | `bigint` | no |  |
| `m` | `bigint` | no |  |

### Returns

`bigint \| null` — 

