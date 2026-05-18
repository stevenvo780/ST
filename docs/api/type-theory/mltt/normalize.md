# `type-theory/mltt/normalize.ts`

============================================================ MLTT — β-reducción + reducciones ι (proyecciones, recursión Nat trivial) ============================================================ Reglas:   β:    (λ (x : A). M) N        ↦  M[N/x]   π1:   fst ⟨a, b⟩               ↦  a   π2:   snd ⟨a, b⟩               ↦  b La normalización es congruente: reduce dentro de Π/Σ/λ/Id/refl/succ para alcanzar formas normales completas (necesario para igualdad definicional de tipos).

## Contents

- [`reduceStep`](#reducestep) — Function
- [`normalize`](#normalize) — Function
- [`isNormal`](#isnormal) — Function

## `reduceStep`

> Function · `type-theory/mltt/normalize.ts:18`

Aplica un único paso de reducción (leftmost-outermost) si hay redex.

```ts
export function reduceStep(term: MLTTTerm): MLTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |

### Returns

`MLTTTerm` — 


## `normalize`

> Function · `type-theory/mltt/normalize.ts:98`

Normaliza hasta forma normal (o agota `maxSteps`).

```ts
export function normalize(term: MLTTTerm, maxSteps = 1000): MLTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`MLTTTerm` — 


## `isNormal`

> Function · `type-theory/mltt/normalize.ts:108`

```ts
export function isNormal(term: MLTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |

### Returns

`boolean` — 

