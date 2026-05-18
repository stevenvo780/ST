# `reasoning/number-theory/factorization.ts`

============================================================ Factorización entera y funciones aritméticas derivadas. ============================================================ factorize  — combina trial-division (hasta primos pequeños),              Miller-Rabin y Pollard's rho con polinomio              x^2 + c para factores grandes. divisors   — todos los divisores positivos en orden creciente. eulerPhi   — totient de Euler: φ(n) = n · ∏ (1 - 1/p). mobius     — función de Möbius: 0 si hay primo al cuadrado,              (-1)^k si n = p1·...·pk con todos distintos.

## Contents

- [`factorize`](#factorize) — Function
- [`divisors`](#divisors) — Function
- [`eulerPhi`](#eulerphi) — Function
- [`mobius`](#mobius) — Function
- [`_internal`](#internal) — Const

## `factorize`

> Function · `reasoning/number-theory/factorization.ts:38`

```ts
export function factorize(n: bigint): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`Array<{ prime: bigint; exponent: number }>` — 


## `divisors`

> Function · `reasoning/number-theory/factorization.ts:78`

```ts
export function divisors(n: bigint): bigint[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`bigint[]` — 


## `eulerPhi`

> Function · `reasoning/number-theory/factorization.ts:98`

```ts
export function eulerPhi(n: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`bigint` — 


## `mobius`

> Function · `reasoning/number-theory/factorization.ts:110`

```ts
export function mobius(n: bigint): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`-1 \| 0 \| 1` — 


## `_internal`

> Const · `reasoning/number-theory/factorization.ts:124`

```ts
const _internal
```

