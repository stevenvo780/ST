# `reasoning/polynomial-ring/index.ts`

Dense polynomial over Z or Z/pZ.
`coefficients[i]` is the coefficient of x^i (little-endian).
When `modulus` is defined, all coefficients are kept reduced mod p.

## Contents

- [`Polynomial`](#polynomial) — Interface
- [`poly`](#poly) — Function
- [`degree`](#degree) — Function
- [`leadingCoefficient`](#leadingcoefficient) — Function
- [`isZero`](#iszero) — Function
- [`add`](#add) — Function
- [`sub`](#sub) — Function
- [`multiply`](#multiply) — Function
- [`divmod`](#divmod) — Function
- [`gcd`](#gcd) — Function
- [`derivative`](#derivative) — Function
- [`evaluate`](#evaluate) — Function
- [`compose`](#compose) — Function
- [`rationalRoots`](#rationalroots) — Function
- [`squareFree`](#squarefree) — Function
- [`factor`](#factor) — Function
- [`isIrreducible`](#isirreducible) — Function
- [`factorInZp`](#factorinzp) — Function
- [`resultant`](#resultant) — Function
- [`discriminant`](#discriminant) — Function

## `Polynomial`

> Interface · `reasoning/polynomial-ring/index.ts:26`

Dense polynomial over Z or Z/pZ.
`coefficients[i]` is the coefficient of x^i (little-endian).
When `modulus` is defined, all coefficients are kept reduced mod p.

```ts
export interface Polynomial
```


## `poly`

> Function · `reasoning/polynomial-ring/index.ts:108`

Constructs a normalized {@link Polynomial} from a coefficient array.
`coefficients[0]` is the constant term; accepts `number[]` for convenience.

```ts
export function poly(coefficients: bigint[] | number[], modulus?: bigint): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefficients` | `bigint[] \| number[]` | no | Little-endian coefficient array (index = power of x). |
| `modulus` | `bigint` | yes | Optional prime modulus p; all coefficients are reduced mod p. |

### Returns

`Polynomial` — 


## `degree`

> Function · `reasoning/polynomial-ring/index.ts:118`

Returns the degree of `p`. Returns -1 for the zero polynomial (a finite
sentinel, since `number` cannot represent -∞ cleanly in strict TS).

```ts
export function degree(p: Polynomial): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`number` — 


## `leadingCoefficient`

> Function · `reasoning/polynomial-ring/index.ts:126`

Returns the coefficient of the highest-degree term, or `0n` for the zero polynomial.

```ts
export function leadingCoefficient(p: Polynomial): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`bigint` — 


## `isZero`

> Function · `reasoning/polynomial-ring/index.ts:133`

Returns `true` when `p` is the zero polynomial (degree -1).

```ts
export function isZero(p: Polynomial): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`boolean` — 


## `add`

> Function · `reasoning/polynomial-ring/index.ts:140`

Returns `a + b`. Reduces coefficients mod p when both share a modulus.

```ts
export function add(a: Polynomial, b: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `sub`

> Function · `reasoning/polynomial-ring/index.ts:153`

Returns `a - b`.

```ts
export function sub(a: Polynomial, b: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `multiply`

> Function · `reasoning/polynomial-ring/index.ts:166`

Returns `a * b` via schoolbook convolution, O(deg(a)·deg(b)).

```ts
export function multiply(a: Polynomial, b: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `divmod`

> Function · `reasoning/polynomial-ring/index.ts:201`

Euclidean division of `a` by `b`, returning `{ quotient, remainder }`.
Over Z/pZ the result is exact. Over Z, requires `b` to be monic (lead ±1)
or uses pseudo-division when the leading coefficient does not divide.

```ts
export function divmod( a: Polynomial, b: Polynomial, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`{ quotient: Polynomial; remainder: Polynomial }` — 


## `gcd`

> Function · `reasoning/polynomial-ring/index.ts:336`

Greatest common divisor of `a` and `b`.
Over Z/pZ uses Euclides in the field and returns a monic result.
Over Z uses subresultant PRS and returns the primitive part with positive leading coefficient.

```ts
export function gcd(a: Polynomial, b: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `derivative`

> Function · `reasoning/polynomial-ring/index.ts:376`

Returns the formal derivative d/dx of `p`. Constant polynomials map to zero.

```ts
export function derivative(p: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `evaluate`

> Function · `reasoning/polynomial-ring/index.ts:389`

Evaluates `p` at integer point `x` via Horner's rule.
When `p` has a modulus, the result is reduced mod p.

```ts
export function evaluate(p: Polynomial, x: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |
| `x` | `bigint` | no |  |

### Returns

`bigint` — 


## `compose`

> Function · `reasoning/polynomial-ring/index.ts:403`

Returns the composition `a(b(x))` via Horner evaluation of `a` over `b`.
Both polynomials must share the same modulus (or both be over Z).

```ts
export function compose(a: Polynomial, b: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `rationalRoots`

> Function · `reasoning/polynomial-ring/index.ts:450`

Returns all rational roots of `p ∈ Z[x]` as reduced fractions `{ num, den }`.
Uses the rational root theorem: roots have the form ±(divisors of a₀) / (divisors of aₙ).

```ts
export function rationalRoots(p: Polynomial): Array<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`Array<{ num: bigint; den: bigint }>` — 


## `squareFree`

> Function · `reasoning/polynomial-ring/index.ts:523`

Returns the square-free part of `p`: `p / gcd(p, p')`.
Over Z/pZ: divides out the gcd with the formal derivative.
Over Z: uses primitive-part arithmetic to avoid coefficient blow-up.

```ts
export function squareFree(p: Polynomial): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`Polynomial` — 


## `factor`

> Function · `reasoning/polynomial-ring/index.ts:592`

Factors `p ∈ Z[x]` into irreducible factors over Q.
Extracts integer content, linear factors via rational root theorem,
and returns the remaining primitive part as a single factor when no
further rational roots are found.

```ts
export function factor(p: Polynomial): Polynomial[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`Polynomial[]` — 


## `isIrreducible`

> Function · `reasoning/polynomial-ring/index.ts:673`

Tests whether `p` is irreducible over Q (when no modulus) or over Z/pZ (when modulus is set).
Over Q: degree ≤ 3 uses rational root test; degree ≥ 4 delegates to {@link factor}.
Over Z/pZ: delegates to {@link factorInZp} and checks for a single factor.

```ts
export function isIrreducible(p: Polynomial, samples = 30): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |
| `samples` | `any` | yes | Unused (kept for API compatibility). |

### Returns

`boolean` — 


## `factorInZp`

> Function · `reasoning/polynomial-ring/index.ts:712`

Factors `p` in Z/pZ (the field with `prime` elements).
Uses root-finding for linear factors, then exhaustive search for
irreducible quadratic factors (lite Berlekamp for small p).

```ts
export function factorInZp(p: Polynomial, prime: bigint): Polynomial[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |
| `prime` | `bigint` | no | A prime modulus > 1. |

### Returns

`Polynomial[]` — 


## `resultant`

> Function · `reasoning/polynomial-ring/index.ts:790`

Computes the resultant of `a` and `b` in Z[x] via the Sylvester matrix determinant.
Returns 0 when either polynomial is zero.

```ts
export function resultant(a: Polynomial, b: Polynomial): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Polynomial` | no |  |
| `b` | `Polynomial` | no |  |

### Returns

`bigint` — 


## `discriminant`

> Function · `reasoning/polynomial-ring/index.ts:860`

Returns the discriminant of `p ∈ Z[x]`:
`disc(p) = (-1)^{n(n-1)/2} · res(p, p') / lead(p)`.

```ts
export function discriminant(p: Polynomial): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`bigint` — 

