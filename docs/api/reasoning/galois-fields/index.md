# `reasoning/galois-fields/index.ts`

============================================================ ST Galois Fields — cuerpos finitos GF(p^n) sobre Z/p. ============================================================ Elementos: polinomios de grado < n con coeficientes en Z/p, representados            como vector de números (little-endian: coefficients[i] = coef de x^i). Operaciones: suma, resta, multiplicación, división, inverso, potencia. Utilidades: búsqueda de polinomio irreducible, elemento primitivo,             logaritmo discreto, encoding estilo Reed-Solomon. Convenciones:  - p siempre primo. n >= 1.  - El polinomio irreducible se da como vector de longitud n+1 (grado n),    con coefficients[n] = 1 (mónico).  - Todas las operaciones devuelven un nuevo GFElement (inmutable). ============================================================

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

> Interface · `reasoning/galois-fields/index.ts:17`

```ts
export interface GFElement
```


## `GaloisField`

> Interface · `reasoning/galois-fields/index.ts:23`

```ts
export interface GaloisField
```


## `findIrreducibleOverZp`

> Function · `reasoning/galois-fields/index.ts:248`

```ts
export function findIrreducibleOverZp(p: number, n: number): number[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no |  |
| `n` | `number` | no |  |

### Returns

`number[] \| null` — 


## `makeGaloisField`

> Function · `reasoning/galois-fields/index.ts:276`

```ts
export function makeGaloisField(p: number, n: number, irreducible?: number[]): GaloisField
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no |  |
| `n` | `number` | no |  |
| `irreducible` | `number[]` | yes |  |

### Returns

`GaloisField` — 


## `gfZero`

> Function · `reasoning/galois-fields/index.ts:312`

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

> Function · `reasoning/galois-fields/index.ts:320`

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

> Function · `reasoning/galois-fields/index.ts:326`

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

> Function · `reasoning/galois-fields/index.ts:343`

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

> Function · `reasoning/galois-fields/index.ts:349`

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

> Function · `reasoning/galois-fields/index.ts:355`

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

> Function · `reasoning/galois-fields/index.ts:362`

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

> Function · `reasoning/galois-fields/index.ts:378`

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

> Function · `reasoning/galois-fields/index.ts:405`

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

> Function · `reasoning/galois-fields/index.ts:412`

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

> Function · `reasoning/galois-fields/index.ts:440`

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

> Function · `reasoning/galois-fields/index.ts:465`

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

> Function · `reasoning/galois-fields/index.ts:487`

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

> Function · `reasoning/galois-fields/index.ts:505`

```ts
export function rsEncode(F: GaloisField, message: GFElement[], n: number): GFElement[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `GaloisField` | no |  |
| `message` | `GFElement[]` | no |  |
| `n` | `number` | no |  |

### Returns

`GFElement[]` — 

