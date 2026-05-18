# `reasoning/polynomial-ring/index.ts`

============================================================ ST Polynomial Ring — polinomios sobre Z, Q (via Z) y Z/pZ. ============================================================ Representación densa: `coefficients[i]` es el coeficiente de x^i, con `coefficients[0]` como término constante. El array se mantiene normalizado (sin ceros finales) salvo el polinomio cero `[0n]`. Cuando `modulus` está definido, todas las operaciones reducen coeficientes mod p (p primo) — útil para Berlekamp. Convenciones:   • Factorización `factor(p)` devuelve factores con contenido     entero positivo (primitive part) más una constante líder si     la hay; el producto reconstruye `p`.   • `gcd` sobre Z[x] devuelve un polinomio primitivo con líder     positivo (gcd "monic-like" sobre Q[x]).   • Resultantes y discriminantes se calculan vía subresultant     prs cuando `modulus` está ausente. ============================================================

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

> Interface · `reasoning/polynomial-ring/index.ts:21`

```ts
export interface Polynomial
```


## `poly`

> Function · `reasoning/polynomial-ring/index.ts:97`

```ts
export function poly(coefficients: bigint[] | number[], modulus?: bigint): Polynomial
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefficients` | `bigint[] \| number[]` | no |  |
| `modulus` | `bigint` | yes |  |

### Returns

`Polynomial` — 


## `degree`

> Function · `reasoning/polynomial-ring/index.ts:103`

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

> Function · `reasoning/polynomial-ring/index.ts:110`

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

> Function · `reasoning/polynomial-ring/index.ts:116`

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

> Function · `reasoning/polynomial-ring/index.ts:122`

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

> Function · `reasoning/polynomial-ring/index.ts:134`

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

> Function · `reasoning/polynomial-ring/index.ts:146`

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

> Function · `reasoning/polynomial-ring/index.ts:175`

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

> Function · `reasoning/polynomial-ring/index.ts:305`

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

> Function · `reasoning/polynomial-ring/index.ts:344`

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

> Function · `reasoning/polynomial-ring/index.ts:353`

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

> Function · `reasoning/polynomial-ring/index.ts:363`

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

> Function · `reasoning/polynomial-ring/index.ts:405`

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

> Function · `reasoning/polynomial-ring/index.ts:473`

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

> Function · `reasoning/polynomial-ring/index.ts:535`

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

> Function · `reasoning/polynomial-ring/index.ts:610`

```ts
export function isIrreducible(p: Polynomial, samples = 30): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |
| `samples` | `any` | yes |  |

### Returns

`boolean` — 


## `factorInZp`

> Function · `reasoning/polynomial-ring/index.ts:642`

```ts
export function factorInZp(p: Polynomial, prime: bigint): Polynomial[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |
| `prime` | `bigint` | no |  |

### Returns

`Polynomial[]` — 


## `resultant`

> Function · `reasoning/polynomial-ring/index.ts:715`

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

> Function · `reasoning/polynomial-ring/index.ts:780`

```ts
export function discriminant(p: Polynomial): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Polynomial` | no |  |

### Returns

`bigint` — 

