# `tooling/mathlib/ring.ts`

============================================================ ST Mathlib — Ring theory Verificación de axiomas de anillo y check de campo. ============================================================

## Contents

- [`verifyRing`](#verifyring) — Function
- [`isField`](#isfield) — Function

## `verifyRing`

> Function · `tooling/mathlib/ring.ts:15`

Verifica los axiomas de anillo (con identidad multiplicativa):
  - (R, +, 0) grupo abeliano.
  - (R, ·, 1) monoide (asociatividad + identidad).
  - · distribuye sobre + por ambos lados.

```ts
export function verifyRing<T>( r: Ring<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): VerificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `Ring<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`VerificationResult` — 


## `isField`

> Function · `tooling/mathlib/ring.ts:75`

Un anillo conmutativo R es campo si todo elemento no nulo tiene
inverso multiplicativo dentro del conjunto. `div` debe devolver
un T para argumentos válidos o `undefined` cuando no existe inverso.

```ts
export function isField<T>( r: Ring<T>, elements: T[], div: (a: T, b: T) => T | undefined, eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `Ring<T>` | no |  |
| `elements` | `T[]` | no |  |
| `div` | `(a: T, b: T) => T \| undefined` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 

