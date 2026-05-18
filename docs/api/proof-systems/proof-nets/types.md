# `proof-systems/proof-nets/types.ts`

Polarity of an MLL atom: `'pos'` for A, `'neg'` for A⊥.

## Contents

- [`Polarity`](#polarity) — Type
- [`MLLFormula`](#mllformula) — Type
- [`LinkKind`](#linkkind) — Type
- [`ProofNetLink`](#proofnetlink) — Interface
- [`ProofNetNode`](#proofnetnode) — Interface
- [`ProofNet`](#proofnet) — Interface
- [`atomPos`](#atompos) — Const
- [`atomNeg`](#atomneg) — Const
- [`tensor`](#tensor) — Const
- [`par`](#par) — Const
- [`dual`](#dual) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`formulaToString`](#formulatostring) — Function

## `Polarity`

> Type · `proof-systems/proof-nets/types.ts:26`

Polarity of an MLL atom: `'pos'` for A, `'neg'` for A⊥.

```ts
export type Polarity = 'pos' | 'neg';
```


## `MLLFormula`

> Type · `proof-systems/proof-nets/types.ts:33`

A formula in Multiplicative Linear Logic (MLL).
Atoms carry explicit polarity; duality is involutive (A⊥)⊥ = A and
distributes De Morgan: (A⊗B)⊥ = A⊥ ⅋ B⊥, (A⅋B)⊥ = A⊥ ⊗ B⊥.

```ts
export type MLLFormula = | { kind: 'atom'; name: string; polarity: Polarity } | { kind: 'tensor'; left: MLLFormula; right: MLLFormula } | { kind: 'par'; left: MLLFormula; right: MLLFormula };
```


## `LinkKind`

> Type · `proof-systems/proof-nets/types.ts:39`

The four link types in a Girard proof net (axiom, cut, tensor, par).

```ts
export type LinkKind = 'axiom' | 'cut' | 'tensor' | 'par';
```


## `ProofNetLink`

> Interface · `proof-systems/proof-nets/types.ts:46`

```ts
export interface ProofNetLink
```


## `ProofNetNode`

> Interface · `proof-systems/proof-nets/types.ts:52`

A single formula occurrence in a proof net, identified by a numeric id.

```ts
export interface ProofNetNode
```


## `ProofNet`

> Interface · `proof-systems/proof-nets/types.ts:61`

A Girard proof net for MLL.
`conclusions` holds the ids of border nodes (not premise of any tensor/par, not in a cut).

```ts
export interface ProofNet
```


## `atomPos`

> Const · `proof-systems/proof-nets/types.ts:70`

Creates a positive atom `A` (polarity `'pos'`).

```ts
const atomPos
```


## `atomNeg`

> Const · `proof-systems/proof-nets/types.ts:77`

Creates a negative atom `A⊥` (polarity `'neg'`).

```ts
const atomNeg
```


## `tensor`

> Const · `proof-systems/proof-nets/types.ts:84`

Creates a tensor formula `A ⊗ B`.

```ts
const tensor
```


## `par`

> Const · `proof-systems/proof-nets/types.ts:91`

Creates a par formula `A ⅋ B`.

```ts
const par
```


## `dual`

> Function · `proof-systems/proof-nets/types.ts:98`

```ts
export function dual(f: MLLFormula): MLLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `MLLFormula` | no |  |

### Returns

`MLLFormula` — 


## `formulaEquals`

> Function · `proof-systems/proof-nets/types.ts:110`

Returns `true` when two MLL formulas are structurally equal.

```ts
export function formulaEquals(a: MLLFormula, b: MLLFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `MLLFormula` | no |  |
| `b` | `MLLFormula` | no |  |

### Returns

`boolean` — 


## `formulaToString`

> Function · `proof-systems/proof-nets/types.ts:124`

Renders an MLL formula as a human-readable string using ⊗, ⅋, and ⊥ notation.

```ts
export function formulaToString(f: MLLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `MLLFormula` | no |  |

### Returns

`string` — 

