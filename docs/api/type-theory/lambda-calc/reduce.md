# `type-theory/lambda-calc/reduce.ts`

============================================================ λ-cálculo untyped — β/η reducción y estrategias de normalización ============================================================ Estrategias soportadas:   - 'normal'        leftmost-outermost; corresponde a normalización                      teórica (encuentra forma normal si existe).   - 'cbn'           call-by-name: reduce la cabeza, no entra bajo                      lambdas (devuelve weak-head-normal form).   - 'cbv'           call-by-value (applicative order): argumentos                      reducidos a valor antes que la aplicación. Estrategias de paso simple (betaStep):   - 'leftmost-outermost' (default) — normaliza términos como SKK→I.   - 'leftmost-innermost'           — reduce dentro de los args primero.

## Contents

- [`BetaStrategy`](#betastrategy) — Type
- [`NormalStrategy`](#normalstrategy) — Type
- [`betaStep`](#betastep) — Function
- [`etaStep`](#etastep) — Function
- [`isNormalForm`](#isnormalform) — Function
- [`isWeakHeadNormalForm`](#isweakheadnormalform) — Function
- [`NormalizeResult`](#normalizeresult) — Interface
- [`NormalizeOpts`](#normalizeopts) — Interface
- [`normalize`](#normalize) — Function

## `BetaStrategy`

> Type · `type-theory/lambda-calc/reduce.ts:20`

```ts
export type BetaStrategy = 'leftmost-outermost' | 'leftmost-innermost';
```


## `NormalStrategy`

> Type · `type-theory/lambda-calc/reduce.ts:21`

```ts
export type NormalStrategy = 'normal' | 'cbn' | 'cbv';
```


## `betaStep`

> Function · `type-theory/lambda-calc/reduce.ts:25`

```ts
export function betaStep(t: Term, strategy: BetaStrategy = 'leftmost-outermost'): Term | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `strategy` | `BetaStrategy` | yes |  |

### Returns

`Term \| null` — 


## `etaStep`

> Function · `type-theory/lambda-calc/reduce.ts:75`

```ts
export function etaStep(t: Term): Term | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`Term \| null` — 


## `isNormalForm`

> Function · `type-theory/lambda-calc/reduce.ts:101`

```ts
export function isNormalForm(t: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`boolean` — 


## `isWeakHeadNormalForm`

> Function · `type-theory/lambda-calc/reduce.ts:107`

```ts
export function isWeakHeadNormalForm(t: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`boolean` — 


## `NormalizeResult`

> Interface · `type-theory/lambda-calc/reduce.ts:120`

```ts
export interface NormalizeResult
```


## `NormalizeOpts`

> Interface · `type-theory/lambda-calc/reduce.ts:126`

```ts
export interface NormalizeOpts
```


## `normalize`

> Function · `type-theory/lambda-calc/reduce.ts:134`

```ts
export function normalize(t: Term, opts: NormalizeOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `opts` | `NormalizeOpts` | yes |  |

### Returns

`NormalizeResult` — 

