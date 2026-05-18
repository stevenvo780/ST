# `type-theory/hott/infer.ts`

============================================================ HoTT — Inferencia / chequeo de tipos ============================================================ Reglas extra sobre MLTT:   Γ ⊢ A : Type i   Γ ⊢ a : A   Γ ⊢ b : A   ── (Path-form)            Path A a b : Type i   Γ ⊢ a : A   ── (Path-intro)           refl a : Path A a a   Γ ⊢ p : Path A x y   ── (sym)                  sym p : Path A y x   Γ ⊢ p : Path A x y   Γ ⊢ q : Path A y z   ── (concat)               p · q : Path A x z   Γ ⊢ f : A → B   Γ ⊢ p : Path A x y   ── (ap)                   ap f p : Path B (f x) (f y)   Γ ⊢ P : A → Type   Γ ⊢ p : Path A x y   Γ ⊢ e : P x   ── (transport)            transport P p e : P y   Γ ⊢ p : Path A x y   motive : Π (y : A). Π (q : Path A x y). Type   base   : motive x (refl x)   ── (J)                    J motive base p : motive y p   ── (S¹)                   S¹ : Type 0                             base : S¹                             loop : Path S¹ base base   Γ ⊢ A : Type i   ── (Σ-susp)               Σ A : Type i                             north : Σ A                             south : Σ A                             meridian a : Path (Σ A) north south   Γ ⊢ e : A ≃ B   ── (ua)                   ua e : Path U A B    (axioma)

## Contents

- [`InferContextHoTT`](#infercontexthott) — Type
- [`InferResultHoTT`](#inferresulthott) — Type
- [`isInferErrorHoTT`](#isinfererrorhott) — Function
- [`inferType`](#infertype) — Function
- [`checkType`](#checktype) — Function

## `InferContextHoTT`

> Type · `type-theory/hott/infer.ts:49`

```ts
export type InferContextHoTT = Map<string, HoTTTerm>;
```


## `InferResultHoTT`

> Type · `type-theory/hott/infer.ts:50`

```ts
export type InferResultHoTT = HoTTTerm | { error: string };
```


## `isInferErrorHoTT`

> Function · `type-theory/hott/infer.ts:52`

```ts
export function isInferErrorHoTT(r: InferResultHoTT): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferResultHoTT` | no |  |

### Returns

`r is { error: string }` — 


## `inferType`

> Function · `type-theory/hott/infer.ts:58`

```ts
export function inferType(term: HoTTTerm, ctx: InferContextHoTT = emptyCtx()): InferResultHoTT
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |
| `ctx` | `InferContextHoTT` | yes |  |

### Returns

`InferResultHoTT` — 


## `checkType`

> Function · `type-theory/hott/infer.ts:399`

```ts
export function checkType( term: HoTTTerm, expected: HoTTTerm, ctx: InferContextHoTT = emptyCtx(), ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |
| `expected` | `HoTTTerm` | no |  |
| `ctx` | `InferContextHoTT` | yes |  |

### Returns

`boolean` — 

