# `type-theory/mltt/infer.ts`

============================================================ MLTT — Inferencia / chequeo de tipos bidireccional simplificado ============================================================ Reglas implementadas (informalmente):   ── (Var)   Γ, x : A ⊢ x : A   ── (Universe)        Type i : Type (i+1)   Γ ⊢ A : Type i    Γ, x : A ⊢ B : Type j   ── (Π-form)        Π (x : A). B : Type max(i,j)   Γ, x : A ⊢ M : B   ── (Π-intro)         λ (x : A). M : Π (x : A). B   Γ ⊢ f : Π (x : A). B    Γ ⊢ a : A   ── (Π-elim)             f a : B[a/x]   Γ ⊢ A : Type i   Γ, x : A ⊢ B : Type j   ── (Σ-form)            Σ (x : A). B : Type max(i,j)   Γ ⊢ a : A   Γ ⊢ b : B[a/x]   (Σ (x : A). B)   ── (Σ-intro)              ⟨a,b⟩ : Σ (x:A). B   * Simplificación: como `pair` no lleva anotación del Σ esperado,     en inferencia devolvemos `Σ (_ : A). B` con B independiente     (igual al tipo inferido para `b`). Para Σ dependiente se debe     usar `checkType` con el Σ esperado.   Γ ⊢ p : Σ (x : A). B   ── (Σ-elim-1)             fst p : A   ── (Σ-elim-2)             snd p : B[fst p / x]   Γ ⊢ A : Type i   Γ ⊢ a : A   Γ ⊢ b : A   ── (Id-form)              Id(A, a, b) : Type i   Γ ⊢ a : A   ── (Id-intro)             refl(a) : Id(A, a, a)   ── (Nat)                  Nat : Type 0   ── (zero)                 zero : Nat   Γ ⊢ n : Nat   ── (succ)                 succ n : Nat

## Contents

- [`InferContext`](#infercontext) — Type
- [`InferResult`](#inferresult) — Type
- [`isInferError`](#isinfererror) — Function
- [`inferType`](#infertype) — Function
- [`checkType`](#checktype) — Function

## `InferContext`

> Type · `type-theory/mltt/infer.ts:52`

```ts
export type InferContext = Map<string, MLTTTerm>;
```


## `InferResult`

> Type · `type-theory/mltt/infer.ts:53`

```ts
export type InferResult = MLTTTerm | { error: string };
```


## `isInferError`

> Function · `type-theory/mltt/infer.ts:55`

```ts
export function isInferError(r: InferResult): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferResult` | no |  |

### Returns

`r is { error: string }` — 


## `inferType`

> Function · `type-theory/mltt/infer.ts:62`

Infiere el tipo de `term` o devuelve un error legible.

```ts
export function inferType(term: MLTTTerm, ctx: InferContext = emptyCtx()): InferResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |
| `ctx` | `InferContext` | yes |  |

### Returns

`InferResult` — 


## `checkType`

> Function · `type-theory/mltt/infer.ts:216`

Chequea que `term` tenga el tipo `expected` (bajo αβ-equality).
Implementa el modo "check" donde para `pair` se conoce el Σ esperado
y se permite la dependencia del segundo componente.

```ts
export function checkType( term: MLTTTerm, expected: MLTTTerm, ctx: InferContext = emptyCtx(), ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |
| `expected` | `MLTTTerm` | no |  |
| `ctx` | `InferContext` | yes |  |

### Returns

`boolean` — 

