# `type-theory/curry-howard/infer.ts`

============================================================ Curry-Howard — Type inference (checking) para λ-terms anotados ============================================================ El λ-cálculo simplemente tipado con anotaciones en el binder admite type-checking directo (no requiere Hindley-Milner): cada abstracción declara el tipo de su parámetro, así que el tipo del cuerpo se obtiene recursivamente. Devuelve `{ error }` en lugar de lanzar para que sea fácil componer en tests y herramientas didácticas.

## Contents

- [`InferResult`](#inferresult) — Type
- [`inferType`](#infertype) — Function
- [`isInferError`](#isinfererror) — Function

## `InferResult`

> Type · `type-theory/curry-howard/infer.ts:16`

```ts
export type InferResult = PropType | { error: string };
```


## `inferType`

> Function · `type-theory/curry-howard/infer.ts:18`

```ts
export function inferType(term: LambdaTerm, ctx: Context =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `LambdaTerm` | no |  |
| `ctx` | `Context` | yes |  |

### Returns

`InferResult` — 


## `isInferError`

> Function · `type-theory/curry-howard/infer.ts:22`

```ts
export function isInferError(r: InferResult): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferResult` | no |  |

### Returns

`r is { error: string }` — 

