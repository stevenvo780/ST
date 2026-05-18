# `reasoning/galois-fields/index.ts`

An element of GF(p^n) represented as a polynomial of degree < n
with coefficients in Z/p (little-endian: `coefficients[i]` = coef of x^i).

## Contents

- [`GFElement`](#gfelement) — Interface
- [`GaloisField`](#galoisfield) — Interface
- [`findIrreducibleOverZp`](#findirreducibleoverzp) — Function
- [`makeGaloisField`](#makegaloisfield) — Function
- [`gfZero`](#gfzero) — Function
- [`gfOne`](#gfone) — Function
- [`gfElement`](#gfelement) — Function
- [`gfAdd`](#gfadd) — Function
- [`gfSub`](#gfsub) — Function
- [`gfMul`](#gfmul) — Function
- [`gfEq`](#gfeq) — Function
- [`gfInverse`](#gfinverse) — Function
- [`gfDiv`](#gfdiv) — Function
- [`gfPow`](#gfpow) — Function
- [`order`](#order) — Function
- [`findPrimitive`](#findprimitive) — Function
- [`discreteLog`](#discretelog) — Function
- [`rsEncode`](#rsencode) — Function

## `GFElement`

> Interface · `reasoning/galois-fields/index.ts:21`

An element of GF(p^n) represented as a polynomial of degree < n
with coefficients in Z/p (little-endian: `coefficients[i]` = coef of x^i).

```ts
export interface GFElement
```


## `GaloisField`

> Interface · `reasoning/galois-fields/index.ts:31`

A finite field GF(p^n) defined by a monic irreducible polynomial of degree n over Z/p.
Elements are polynomials mod `irreducible`; arithmetic is done in Z/p[x] / (irreducible).

```ts
export interface GaloisField
```


## `findIrreducibleOverZp`

> Function · `reasoning/galois-fields/index.ts:264`

Finds the first monic irreducible polynomial of degree `n` over Z/p
by enumerating all monic polys and applying Rabin's irreducibility test.

```ts
export function findIrreducibleOverZp(p: number, n: number): number[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no | A prime number. |
| `n` | `number` | no | Degree >= 1. |

### Returns

`number[] \| null` — Coefficient array (little-endian), or `null` if none found (should not happen for valid inputs).


## `makeGaloisField`

> Function · `reasoning/galois-fields/index.ts:300`

Constructs the finite field GF(p^n).
If `irreducible` is not provided, one is found automatically via {@link findIrreducibleOverZp}.

```ts
export function makeGaloisField(p: number, n: number, irreducible?: number[]): GaloisField
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no | A prime number. |
| `n` | `number` | no | Extension degree >= 1. `n = 1` gives the prime field GF(p). |
| `irreducible` | `number[]` | yes | Optional monic irreducible polynomial of degree `n` over Z/p. |

### Returns

`GaloisField` — 


## `gfZero`

> Function · `reasoning/galois-fields/index.ts:337`

Returns the additive identity 0 of the field `F`.

```ts
export function gfZero(F: GaloisField): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |

### Returns

`GFElement` — 


## `gfOne`

> Function · `reasoning/galois-fields/index.ts:346`

Returns the multiplicative identity 1 of the field `F`.

```ts
export function gfOne(F: GaloisField): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |

### Returns

`GFElement` — 


## `gfElement`

> Function · `reasoning/galois-fields/index.ts:356`

Constructs an element of `F` from a coefficient array, reducing each coefficient mod p
and padding/truncating to length `F.degree`.

```ts
export function gfElement(F: GaloisField, coefficients: number[]): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `coefficients` | `number[]` | no |  |

### Returns

`GFElement` — 


## `gfAdd`

> Function · `reasoning/galois-fields/index.ts:374`

Returns `a + b` in `F`.

```ts
export function gfAdd(F: GaloisField, a: GFElement, b: GFElement): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |
| `b` | `GFElement` | no |  |

### Returns

`GFElement` — 


## `gfSub`

> Function · `reasoning/galois-fields/index.ts:381`

Returns `a - b` in `F`.

```ts
export function gfSub(F: GaloisField, a: GFElement, b: GFElement): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |
| `b` | `GFElement` | no |  |

### Returns

`GFElement` — 


## `gfMul`

> Function · `reasoning/galois-fields/index.ts:388`

Returns `a * b` in `F` (polynomial product reduced mod the irreducible).

```ts
export function gfMul(F: GaloisField, a: GFElement, b: GFElement): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |
| `b` | `GFElement` | no |  |

### Returns

`GFElement` — 


## `gfEq`

> Function · `reasoning/galois-fields/index.ts:396`

Returns `true` when `a` and `b` represent the same field element (coefficient-wise).

```ts
export function gfEq(a: GFElement, b: GFElement): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `GFElement` | no |  |
| `b` | `GFElement` | no |  |

### Returns

`boolean` — 


## `gfInverse`

> Function · `reasoning/galois-fields/index.ts:415`

Returns the multiplicative inverse of `a` in `F` via the extended Euclidean algorithm,
or `null` when `a` is the zero element.

```ts
export function gfInverse(F: GaloisField, a: GFElement): GFElement | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |

### Returns

`GFElement \| null` — 


## `gfDiv`

> Function · `reasoning/galois-fields/index.ts:443`

Returns `a / b` in `F`, or `null` when `b` is zero (not invertible).

```ts
export function gfDiv(F: GaloisField, a: GFElement, b: GFElement): GFElement | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |
| `b` | `GFElement` | no |  |

### Returns

`GFElement \| null` — 


## `gfPow`

> Function · `reasoning/galois-fields/index.ts:455`

Returns `a^exp` in `F` via square-and-multiply.
Negative exponents compute the inverse first.

```ts
export function gfPow(F: GaloisField, a: GFElement, exp: bigint): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |
| `exp` | `bigint` | no |  |

### Returns

`GFElement` — 


## `order`

> Function · `reasoning/galois-fields/index.ts:486`

Returns the multiplicative order of `a` in `F`: the minimum k >= 1 such that `a^k = 1`.
The result always divides `F.order - 1` (by Lagrange's theorem).

```ts
export function order(F: GaloisField, a: GFElement): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `a` | `GFElement` | no |  |

### Returns

`number` — 


## `findPrimitive`

> Function · `reasoning/galois-fields/index.ts:515`

Finds a primitive element (generator of the multiplicative group) of `F`
by iterating over non-zero elements and checking multiplicative order.

```ts
export function findPrimitive(F: GaloisField): GFElement
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |

### Returns

`GFElement` — 


## `discreteLog`

> Function · `reasoning/galois-fields/index.ts:539`

Computes the discrete logarithm `k` such that `base^k = target` in `F`,
or `null` when no such `k` exists. Uses linear search — intended for small fields.

```ts
export function discreteLog(F: GaloisField, base: GFElement, target: GFElement): number | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `base` | `GFElement` | no |  |
| `target` | `GFElement` | no |  |

### Returns

`number \| null` — 


## `rsEncode`

> Function · `reasoning/galois-fields/index.ts:563`

Reed-Solomon-style encoding: evaluates the polynomial with coefficients `message`
at `n` points `{g^0, g^1, …, g^(n-1)}`, where `g` is a primitive element of `F`.

```ts
export function rsEncode(F: GaloisField, message: GFElement[], n: number): GFElement[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `message` | `GFElement[]` | no |  |
| `n` | `number` | no | Number of evaluation points; must be <= `F.order - 1`. |

### Returns

`GFElement[]` — 

