# `reasoning/combinatorics/generating-functions.ts`

## Contents

- [`multiplyPolynomials`](#multiplypolynomials) — Function
- [`generatingFunction`](#generatingfunction) — Function
- [`binomialGF`](#binomialgf) — Function

## `multiplyPolynomials`

> Function · `reasoning/combinatorics/generating-functions.ts:1`

```ts
export function multiplyPolynomials(a: number[], b: number[]): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `number[]` | no |  |
| `b` | `number[]` | no |  |

### Returns

`number[]` — 


## `generatingFunction`

> Function · `reasoning/combinatorics/generating-functions.ts:24`

Evalúa los primeros `n+1` coeficientes (grado 0..n) de la serie de potencias
formal cuyos coeficientes están dados explícitamente por `coefficients`.
Si `coefficients` tiene menos términos, los completa con 0.

```ts
export function generatingFunction(coefficients: number[], n: number): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefficients` | `number[]` | no |  |
| `n` | `number` | no |  |

### Returns

`number[]` — 


## `binomialGF`

> Function · `reasoning/combinatorics/generating-functions.ts:39`

Devuelve los coeficientes de (1+x)^n (binomiales). Útil como GF estándar.

```ts
export function binomialGF(n: number): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`number[]` — 

