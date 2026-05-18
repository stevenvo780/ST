# `type-theory/cubical/normalize.ts`

============================================================ Cubical — Reducción β + reglas computacionales del intervalo ============================================================ Reglas extendidas vs HoTT:   (λi. t) @ r           ↦ t[i := r]                  (β para path)   ~0 ↦ 1   ~1 ↦ 0   ~(~i) ↦ i                       (involución)   0 ∧ i ↦ 0   1 ∧ i ↦ i                              (min)   0 ∨ i ↦ i   1 ∨ i ↦ 1                              (max) Las β estándar (app sobre lam) se heredan literalmente del fragment MLTT embebido.

## Contents

- [`reduceStepCubical`](#reducestepcubical) — Function
- [`normalizeCubical`](#normalizecubical) — Function
- [`isNormalCubical`](#isnormalcubical) — Function

## `reduceStepCubical`

> Function · `type-theory/cubical/normalize.ts:19`

```ts
export function reduceStepCubical(term: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 


## `normalizeCubical`

> Function · `type-theory/cubical/normalize.ts:109`

```ts
export function normalizeCubical(term: CubicalTerm, maxSteps = 1000): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`CubicalTerm` — 


## `isNormalCubical`

> Function · `type-theory/cubical/normalize.ts:119`

```ts
export function isNormalCubical(term: CubicalTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |

### Returns

`boolean` — 

