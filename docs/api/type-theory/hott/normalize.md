# `type-theory/hott/normalize.ts`

============================================================ HoTT — β-reducción + reglas computacionales sobre caminos ============================================================ Reglas β/ι heredadas de MLTT (app, fst, snd) y extendidas:   transport(P, refl(x), e)        ↦  e   J(motive, base, refl(x))        ↦  base   pathSym(refl(x))                ↦  refl(x)   pathSym(pathSym(p))             ↦  p              (involutividad)   pathConcat(refl(x), p)          ↦  p              (identidad izq)   pathConcat(p, refl(y))          ↦  p              (identidad der)   ap(f, refl(x))                  ↦  refl(f x) Univalence (ua) NO reduce computacionalmente: el axioma queda como término inerte. Esa es la honestidad estándar pre-cubical.

## Contents

- [`reduceStepHoTT`](#reducestephott) — Function
- [`normalizeHoTT`](#normalizehott) — Function
- [`isNormalHoTT`](#isnormalhott) — Function

## `reduceStepHoTT`

> Function · `type-theory/hott/normalize.ts:21`

```ts
export function reduceStepHoTT(term: HoTTTerm): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |

### Returns

`HoTTTerm` — 


## `normalizeHoTT`

> Function · `type-theory/hott/normalize.ts:184`

```ts
export function normalizeHoTT(term: HoTTTerm, maxSteps = 1000): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`HoTTTerm` — 


## `isNormalHoTT`

> Function · `type-theory/hott/normalize.ts:194`

```ts
export function isNormalHoTT(term: HoTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |

### Returns

`boolean` — 

