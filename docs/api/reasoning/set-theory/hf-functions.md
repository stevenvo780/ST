# `reasoning/set-theory/hf-functions.ts`

Functions modelled as sets of Kuratowski ordered pairs (the graph), plus
an explicit domain and codomain. A graph is a valid function iff it is
functional: ⟨x, y₁⟩ ∈ f and ⟨x, y₂⟩ ∈ f implies y₁ = y₂.

## Contents

- [`HFFunction`](#hffunction) — Interface
- [`isValidFunction`](#isvalidfunction) — Function
- [`applyHF`](#applyhf) — Function
- [`composeHF`](#composehf) — Function
- [`isInjective`](#isinjective) — Function
- [`isSurjective`](#issurjective) — Function
- [`isBijective`](#isbijective) — Function
- [`makeFunction`](#makefunction) — Function
- [`EMPTY_FUNCTION`](#empty-function) — Const

## `HFFunction`

> Interface · `reasoning/set-theory/hf-functions.ts:21`

```ts
export interface HFFunction
```


## `isValidFunction`

> Function · `reasoning/set-theory/hf-functions.ts:33`

The graph must be a subset of domain × codomain, every element must be
a Kuratowski pair, and the relation must be functional. We also require
the graph to be total on `domain` so that `apply` is well-defined for
every x in the declared domain.

```ts
export function isValidFunction(f: HFFunction): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |

### Returns

`boolean` — 


## `applyHF`

> Function · `reasoning/set-theory/hf-functions.ts:61`

```ts
export function applyHF(f: HFFunction, x: HFSet): HFSet | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |
| `x` | `HFSet` | no |  |

### Returns

`HFSet \| null` — 


## `composeHF`

> Function · `reasoning/set-theory/hf-functions.ts:79`

(f ∘ g)(x) = f(g(x)). Returns null when the codomain of g is not the
domain of f, or either function is malformed.

```ts
export function composeHF(f: HFFunction, g: HFFunction): HFFunction | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |
| `g` | `HFFunction` | no |  |

### Returns

`HFFunction \| null` — 


## `isInjective`

> Function · `reasoning/set-theory/hf-functions.ts:108`

```ts
export function isInjective(f: HFFunction): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |

### Returns

`boolean` — 


## `isSurjective`

> Function · `reasoning/set-theory/hf-functions.ts:124`

```ts
export function isSurjective(f: HFFunction): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |

### Returns

`boolean` — 


## `isBijective`

> Function · `reasoning/set-theory/hf-functions.ts:141`

```ts
export function isBijective(f: HFFunction): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HFFunction` | no |  |

### Returns

`boolean` — 


## `makeFunction`

> Function · `reasoning/set-theory/hf-functions.ts:150`

Constructor helper: builds an HFFunction from an explicit mapping. The
caller passes parallel arrays; we form the graph from Kuratowski pairs.
No validation here — call `isValidFunction` afterwards if you need it.

```ts
export function makeFunction( domain: HFSet, codomain: HFSet, mapping: ReadonlyArray<readonly [HFSet, HFSet]>, ): HFFunction
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `domain` | `HFSet` | no |  |
| `codomain` | `HFSet` | no |  |
| `mapping` | `ReadonlyArray<readonly [HFSet, HFSet]>` | no |  |

### Returns

`HFFunction` — 


## `EMPTY_FUNCTION`

> Const · `reasoning/set-theory/hf-functions.ts:163`

```ts
const EMPTY_FUNCTION: HFFunction
```

