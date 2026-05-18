# `type-theory/hindley-milner/infer.ts`

============================================================ Hindley-Milner — Algorithm W (Damas-Milner) ============================================================ Implementación de Algorithm W tal como aparece en Damas & Milner 1982. La función W toma un entorno Γ y una expresión e, y devuelve un par (S, τ) donde S es la sustitución principal y τ el tipo principal de e bajo S(Γ). Reglas (esquemáticas):   W(Γ, x)        = (∅, [β/α] τ) si Γ(x) = ∀α. τ con β frescas   W(Γ, λx.e)     = sea β fresca; (S, τ) = W(Γ[x:β], e);                    devolver (S, S(β) → τ)   W(Γ, e₁ e₂)    = (S₁, τ₁) = W(Γ, e₁);                    (S₂, τ₂) = W(S₁(Γ), e₂);                    β fresca; V = mgu(S₂(τ₁), τ₂ → β);                    devolver (V ∘ S₂ ∘ S₁, V(β))   W(Γ, let x = e₁ in e₂) =                    (S₁, τ₁) = W(Γ, e₁);                    σ = generalize(S₁(Γ), τ₁);                    (S₂, τ₂) = W(S₁(Γ)[x:σ], e₂);                    devolver (S₂ ∘ S₁, τ₂)   W(Γ, if c then a else b) = unificar c con Bool y a con b.   W(Γ, letRec [n₁=e₁,...] in e) — todos los nᵢ con tvars frescos   en el entorno mientras se infieren los eᵢ; luego generalizar. Convención: trabajamos con `freshTypeVar('t')`. Para tests con nombres predecibles se llama `resetFreshSupply()`.

## Contents

- [`InferResult`](#inferresult) — Interface
- [`InferOutcome`](#inferoutcome) — Type
- [`isInferError`](#isinfererror) — Function
- [`initialEnv`](#initialenv) — Function
- [`algorithmW`](#algorithmw) — Function
- [`infer`](#infer) — Function
- [`InferSchemeResult`](#inferschemeresult) — Interface
- [`inferScheme`](#inferscheme) — Function
- [`normalizeScheme`](#normalizescheme) — Function

## `InferResult`

> Interface · `type-theory/hindley-milner/infer.ts:45`

```ts
export interface InferResult
```


## `InferOutcome`

> Type · `type-theory/hindley-milner/infer.ts:50`

```ts
export type InferOutcome = InferResult | { error: string };
```


## `isInferError`

> Function · `type-theory/hindley-milner/infer.ts:52`

```ts
export function isInferError(r: InferOutcome): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferOutcome` | no |  |

### Returns

`r is { error: string }` — 


## `initialEnv`

> Function · `type-theory/hindley-milner/infer.ts:61`

```ts
export function initialEnv(): TypeEnv
```

### Returns

`TypeEnv` — 


## `algorithmW`

> Function · `type-theory/hindley-milner/infer.ts:111`

```ts
export function algorithmW(expr: Expr, env: TypeEnv): InferOutcome
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |
| `env` | `TypeEnv` | no |  |

### Returns

`InferOutcome` — 


## `infer`

> Function · `type-theory/hindley-milner/infer.ts:237`

```ts
export function infer(expr: Expr, env: TypeEnv = initialEnv()): InferOutcome
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |
| `env` | `TypeEnv` | yes |  |

### Returns

`InferOutcome` — 


## `InferSchemeResult`

> Interface · `type-theory/hindley-milner/infer.ts:241`

```ts
export interface InferSchemeResult
```


## `inferScheme`

> Function · `type-theory/hindley-milner/infer.ts:247`

```ts
export function inferScheme( expr: Expr, env: TypeEnv = initialEnv(), ): InferSchemeResult |
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |
| `env` | `TypeEnv` | yes |  |

### Returns

`InferSchemeResult \| { error: string }` — 


## `normalizeScheme`

> Function · `type-theory/hindley-milner/infer.ts:271`

```ts
export function normalizeScheme(sc: TypeScheme): TypeScheme
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sc` | `TypeScheme` | no |  |

### Returns

`TypeScheme` — 

