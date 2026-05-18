# `type-theory/cubical/infer.ts`

============================================================ Cubical — Inferencia / chequeo de tipos ============================================================ Reglas principales del subset CTT-Lite:   ── (I-form)     i0 : I    i1 : I    iVar i : I   Γ ⊢ r : I   Γ ⊢ s : I   ── (∧, ∨)       r ∧ s : I    r ∨ s : I   Γ ⊢ r : I   ── (~)          ~ r : I   Γ ⊢ A : I → Type   Γ ⊢ x : A i0   Γ ⊢ y : A i1   ── (PathP)      PathP A x y : Type   Γ, i : I ⊢ t : A i   ── (pLam)       λi. t : PathP (λi. A i) (t[i := i0]) (t[i := i1])   Γ ⊢ p : PathP A x y   Γ ⊢ r : I   ── (pApp)       p @ r : A r                   con (p @ i0) ≡ x y (p @ i1) ≡ y   Γ ⊢ e : A ≃ B (codificado como Σ)   Γ ⊢ partial : algún término candidato   ── (glue)       glue(e, partial) : PathP _ A B  (precursor de ua)

## Contents

- [`CubicalContext`](#cubicalcontext) — Interface
- [`InferResultCubical`](#inferresultcubical) — Type
- [`intervalType`](#intervaltype) — Const
- [`isInferErrorCubical`](#isinfererrorcubical) — Function
- [`makeContext`](#makecontext) — Function
- [`inferType`](#infertype) — Function
- [`checkType`](#checktype) — Function

## `CubicalContext`

> Interface · `type-theory/cubical/infer.ts:35`

```ts
export interface CubicalContext
```


## `InferResultCubical`

> Type · `type-theory/cubical/infer.ts:40`

```ts
export type InferResultCubical = CubicalTerm | { error: string };
```


## `intervalType`

> Const · `type-theory/cubical/infer.ts:42`

```ts
const intervalType
```


## `isInferErrorCubical`

> Function · `type-theory/cubical/infer.ts:44`

```ts
export function isInferErrorCubical(r: InferResultCubical): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `InferResultCubical` | no |  |

### Returns

`r is { error: string }` — 


## `makeContext`

> Function · `type-theory/cubical/infer.ts:48`

```ts
export function makeContext(): CubicalContext
```

### Returns

`CubicalContext` — 


## `inferType`

> Function · `type-theory/cubical/infer.ts:70`

```ts
export function inferType( term: CubicalTerm, ctx: CubicalContext = makeContext(), ): InferResultCubical
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |
| `ctx` | `CubicalContext` | yes |  |

### Returns

`InferResultCubical` — 


## `checkType`

> Function · `type-theory/cubical/infer.ts:233`

```ts
export function checkType( term: CubicalTerm, expected: CubicalTerm, ctx: CubicalContext = makeContext(), ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |
| `expected` | `CubicalTerm` | no |  |
| `ctx` | `CubicalContext` | yes |  |

### Returns

`boolean` — 

