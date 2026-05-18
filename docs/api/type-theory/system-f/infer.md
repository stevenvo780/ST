# `type-theory/system-f/infer.ts`

============================================================ System F — Type checking ============================================================ Reglas:   x : T                   si (x:T) ∈ Γ   λx:T. M : T → U          si Γ, x:T ⊢ M : U  y T well-formed en Δ   M N : U                  si M : T → U  y  N : T   Λ X. M : ∀X. T           si Δ, X ⊢ M : T  (con X fresca)   M [T] : U[X := T]        si M : ∀X. U  y  T well-formed en Δ

## Contents

- [`FTypeResult`](#ftyperesult) — Type
- [`isTypeError`](#istypeerror) — Function
- [`typeOf`](#typeof) — Function

## `FTypeResult`

> Type · `type-theory/system-f/infer.ts:16`

```ts
export type FTypeResult = FType | { error: string };
```


## `isTypeError`

> Function · `type-theory/system-f/infer.ts:18`

```ts
export function isTypeError(r: FTypeResult): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `FTypeResult` | no |  |

### Returns

`r is { error: string }` — 


## `typeOf`

> Function · `type-theory/system-f/infer.ts:22`

```ts
export function typeOf(term: FTerm, ctx: FContext = emptyContext()): FTypeResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |
| `ctx` | `FContext` | yes |  |

### Returns

`FTypeResult` — 

