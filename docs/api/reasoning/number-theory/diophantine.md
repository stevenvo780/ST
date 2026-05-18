# `reasoning/number-theory/diophantine.ts`

============================================================ Diofantinas lineales y fracciones continuas. ============================================================ linearDiophantine        — soluciona a·x + b·y = c sobre enteros. continuedFractionExpansion — coeficientes de la expansión simple                              de num/den (Euclides clásico). fromContinuedFraction    — reconstruye num/den a partir de [a0;a1,...].

## Contents

- [`linearDiophantine`](#lineardiophantine) — Function
- [`continuedFractionExpansion`](#continuedfractionexpansion) — Function
- [`fromContinuedFraction`](#fromcontinuedfraction) — Function

## `linearDiophantine`

> Function · `reasoning/number-theory/diophantine.ts:11`

```ts
export function linearDiophantine( a: bigint, b: bigint, c: bigint, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `b` | `bigint` | no |  |
| `c` | `bigint` | no |  |

### Returns

`{ x: bigint; y: bigint } \| null` — 


## `continuedFractionExpansion`

> Function · `reasoning/number-theory/diophantine.ts:37`

```ts
export function continuedFractionExpansion(num: bigint, den: bigint, maxLen = 64): bigint[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `num` | `bigint` | no |  |
| `den` | `bigint` | no |  |
| `maxLen` | `any` | yes |  |

### Returns

`bigint[]` — 


## `fromContinuedFraction`

> Function · `reasoning/number-theory/diophantine.ts:65`

```ts
export function fromContinuedFraction(coefs: bigint[]):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefs` | `bigint[]` | no |  |

### Returns

`{ num: bigint; den: bigint }` — 

