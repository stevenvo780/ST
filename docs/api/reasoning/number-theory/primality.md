# `reasoning/number-theory/primality.ts`

============================================================ Tests de primalidad. ============================================================ isPrime       — wrapper que decide entre trial-division y Miller-Rabin                 según el tamaño de n. millerRabin   — test probabilístico, determinístico para los testigos                 estándar hasta 3.3·10^14 (con la lista de testigos                 [2,3,5,7,11,13,17,19,23,29,31,37]). nextPrime / previousPrime — siguiente/previo primo respecto a n. primesBelow   — criba de Eratóstenes hasta n (n: number, exclusivo).

## Contents

- [`millerRabin`](#millerrabin) — Function
- [`isPrime`](#isprime) — Function
- [`nextPrime`](#nextprime) — Function
- [`previousPrime`](#previousprime) — Function
- [`primesBelow`](#primesbelow) — Function

## `millerRabin`

> Function · `reasoning/number-theory/primality.ts:45`

```ts
export function millerRabin(n: bigint, witnesses: bigint[] = DEFAULT_WITNESSES): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |
| `witnesses` | `bigint[]` | yes |  |

### Returns

`boolean` — 


## `isPrime`

> Function · `reasoning/number-theory/primality.ts:70`

```ts
export function isPrime(n: bigint): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`boolean` — 


## `nextPrime`

> Function · `reasoning/number-theory/primality.ts:79`

```ts
export function nextPrime(n: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`bigint` — 


## `previousPrime`

> Function · `reasoning/number-theory/primality.ts:88`

```ts
export function previousPrime(n: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`bigint` — 


## `primesBelow`

> Function · `reasoning/number-theory/primality.ts:104`

```ts
export function primesBelow(n: number): bigint[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`bigint[]` — 

