# `type-theory/combinators-ski/reduce.ts`

============================================================ SKI combinatory logic — Reducción ============================================================ Reglas (weak reduction, leftmost-outermost):   I x      → x   K x y    → x          (descarta `y` aunque éste tenga redex propios)   S x y z  → x z (y z) `reduceStep` aplica un único paso si encuentra un redex en la cabeza o, si no, baja por las ramas siguiendo orden leftmost-outermost. Como no hay binders ni captura, no se requiere renombrar; la sustitución es pegado físico de subárboles. La forma normal SKI puede no existir (e.g. términos divergentes equivalentes a Ω), por lo que `normalize` recibe `maxSteps`.

## Contents

- [`reduceStep`](#reducestep) — Function
- [`NormalizeResult`](#normalizeresult) — Interface
- [`normalize`](#normalize) — Function
- [`isNormalForm`](#isnormalform) — Function

## `reduceStep`

> Function · `type-theory/combinators-ski/reduce.ts:21`

```ts
export function reduceStep(t: CTerm): CTerm | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CTerm` | no |  |

### Returns

`CTerm \| null` — 


## `NormalizeResult`

> Interface · `type-theory/combinators-ski/reduce.ts:96`

```ts
export interface NormalizeResult
```


## `normalize`

> Function · `type-theory/combinators-ski/reduce.ts:105`

```ts
export function normalize(t: CTerm, maxSteps = 1000): NormalizeResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`NormalizeResult` — 


## `isNormalForm`

> Function · `type-theory/combinators-ski/reduce.ts:117`

```ts
export function isNormalForm(t: CTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CTerm` | no |  |

### Returns

`boolean` — 

