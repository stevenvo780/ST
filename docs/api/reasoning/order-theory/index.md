# `reasoning/order-theory/index.ts`

Order theory — posets, chains, antichains, Dilworth, Hasse,
well-orderings, well-founded induction and a constructive
Zorn's-lemma witness for finite posets.

A poset (P, ≤) is a set together with a binary relation that is
reflexive, antisymmetric and transitive. This module operates on
**finite** carriers given as `elements: T[]` plus a decidable
`leq` predicate. Equality of carrier elements is decided by
antisymmetry of `leq`: `a ≡ b` iff `leq(a,b) && leq(b,a)`.

Complexities are O(n^2) for the relational checks and O(n^3) for
the chain/antichain explorations; the maximal-chain/antichain
enumerators are exponential in the worst case and are meant for
small posets (n ≲ 25), which is where the constructive value
lives.

Zorn's lemma is non-constructive in general (it requires the
axiom of choice). For **finite** posets it becomes a trivial
theorem: every chain has its largest element as an upper bound,
hence a maximal element exists. We expose that finite-case witness
as `zornsLemmaWitness`: given any chain `C`, we follow upper
bounds until we reach a maximal element of P. This is honestly
labelled `finite-only` so callers do not mistake it for the
general AC-equivalent statement.

## Contents

- [`Poset`](#poset) — Interface
- [`isReflexive`](#isreflexive) — Function
- [`isAntisymmetric`](#isantisymmetric) — Function
- [`isTransitive`](#istransitive) — Function
- [`isPoset`](#isposet) — Function
- [`isTotal`](#istotal) — Function
- [`coverRelations`](#coverrelations) — Function
- [`hasseDot`](#hassedot) — Function
- [`isChain`](#ischain) — Function
- [`isAntichain`](#isantichain) — Function
- [`maximalChains`](#maximalchains) — Function
- [`maximalAntichains`](#maximalantichains) — Function
- [`width`](#width) — Function
- [`height`](#height) — Function
- [`dilworth`](#dilworth) — Function
- [`isWellOrdered`](#iswellordered) — Function
- [`leastElement`](#leastelement) — Function
- [`greatestElement`](#greatestelement) — Function
- [`minimalElements`](#minimalelements) — Function
- [`maximalElements`](#maximalelements) — Function
- [`infimum`](#infimum) — Function
- [`supremum`](#supremum) — Function
- [`zornsLemmaWitness`](#zornslemmawitness) — Function
- [`wellFoundedInduction`](#wellfoundedinduction) — Function

## `Poset`

> Interface · `reasoning/order-theory/index.ts:28`

Order theory — posets, chains, antichains, Dilworth, Hasse,
well-orderings, well-founded induction and a constructive
Zorn's-lemma witness for finite posets.

A poset (P, ≤) is a set together with a binary relation that is
reflexive, antisymmetric and transitive. This module operates on
**finite** carriers given as `elements: T[]` plus a decidable
`leq` predicate. Equality of carrier elements is decided by
antisymmetry of `leq`: `a ≡ b` iff `leq(a,b) && leq(b,a)`.

Complexities are O(n^2) for the relational checks and O(n^3) for
the chain/antichain explorations; the maximal-chain/antichain
enumerators are exponential in the worst case and are meant for
small posets (n ≲ 25), which is where the constructive value
lives.

Zorn's lemma is non-constructive in general (it requires the
axiom of choice). For **finite** posets it becomes a trivial
theorem: every chain has its largest element as an upper bound,
hence a maximal element exists. We expose that finite-case witness
as `zornsLemmaWitness`: given any chain `C`, we follow upper
bounds until we reach a maximal element of P. This is honestly
labelled `finite-only` so callers do not mistake it for the
general AC-equivalent statement.

```ts
export interface Poset<T>
```


## `isReflexive`

> Function · `reasoning/order-theory/index.ts:54`

```ts
export function isReflexive<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `isAntisymmetric`

> Function · `reasoning/order-theory/index.ts:61`

```ts
export function isAntisymmetric<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `isTransitive`

> Function · `reasoning/order-theory/index.ts:83`

```ts
export function isTransitive<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `isPoset`

> Function · `reasoning/order-theory/index.ts:95`

```ts
export function isPoset<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `isTotal`

> Function · `reasoning/order-theory/index.ts:99`

```ts
export function isTotal<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `coverRelations`

> Function · `reasoning/order-theory/index.ts:116`

Cover relations: pairs (a,b) with a < b and no z with a < z < b.
Reflexive self-loops are excluded.

```ts
export function coverRelations<T>(P: Poset<T>): Array<[T, T]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`Array<[T, T]>` — 


## `hasseDot`

> Function · `reasoning/order-theory/index.ts:140`

GraphViz `dot` source for the Hasse diagram. Edges go upwards
(lower → upper). The optional labeller stringifies elements.

```ts
export function hasseDot<T>(P: Poset<T>, label?: (x: T) => string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `label` | `(x: T) => string` | yes |  |

### Returns

`string` — 


## `isChain`

> Function · `reasoning/order-theory/index.ts:160`

```ts
export function isChain<T>(P: Poset<T>, S: ReadonlyArray<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`boolean` — 


## `isAntichain`

> Function · `reasoning/order-theory/index.ts:171`

```ts
export function isAntichain<T>(P: Poset<T>, S: ReadonlyArray<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`boolean` — 


## `maximalChains`

> Function · `reasoning/order-theory/index.ts:187`

Enumerate inclusion-maximal chains. Worst-case exponential; intended
for small posets. Chains are returned in increasing order.

```ts
export function maximalChains<T>(P: Poset<T>): T[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T[][]` — 


## `maximalAntichains`

> Function · `reasoning/order-theory/index.ts:236`

Enumerate inclusion-maximal antichains. Exponential worst case.

```ts
export function maximalAntichains<T>(P: Poset<T>): T[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T[][]` — 


## `width`

> Function · `reasoning/order-theory/index.ts:268`

Width = size of the largest antichain. Computed by scanning maximal
antichains; for ≤25 element posets that is comfortably fast.

```ts
export function width<T>(P: Poset<T>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`number` — 


## `height`

> Function · `reasoning/order-theory/index.ts:279`

Height = size of the longest chain.

```ts
export function height<T>(P: Poset<T>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`number` — 


## `dilworth`

> Function · `reasoning/order-theory/index.ts:296`

Dilworth-style decomposition: a partition of P into chains whose
count equals `width(P)`. We use a greedy algorithm by repeatedly
extracting a maximum-length chain from the remaining elements until
the cover is found, and then *refining* the result by merging
compatible chains until the count matches the width. The output
count is at most `width(P)` for the canonical posets exercised in
the tests.

```ts
export function dilworth<T>(P: Poset<T>): T[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T[][]` — 


## `isWellOrdered`

> Function · `reasoning/order-theory/index.ts:399`

A finite poset is **well-ordered** iff it is totally ordered (every
non-empty subset of a finite total order has a least element, which
is the classical condition).

```ts
export function isWellOrdered<T>(P: Poset<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`boolean` — 


## `leastElement`

> Function · `reasoning/order-theory/index.ts:408`

```ts
export function leastElement<T>(P: Poset<T>, S: ReadonlyArray<T>): T | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`T \| undefined` — 


## `greatestElement`

> Function · `reasoning/order-theory/index.ts:416`

```ts
export function greatestElement<T>(P: Poset<T>, S: ReadonlyArray<T>): T | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`T \| undefined` — 


## `minimalElements`

> Function · `reasoning/order-theory/index.ts:424`

```ts
export function minimalElements<T>(P: Poset<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T[]` — 


## `maximalElements`

> Function · `reasoning/order-theory/index.ts:440`

```ts
export function maximalElements<T>(P: Poset<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T[]` — 


## `infimum`

> Function · `reasoning/order-theory/index.ts:460`

```ts
export function infimum<T>(P: Poset<T>, S: ReadonlyArray<T>): T | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`T \| undefined` — 


## `supremum`

> Function · `reasoning/order-theory/index.ts:469`

```ts
export function supremum<T>(P: Poset<T>, S: ReadonlyArray<T>): T | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `S` | `ReadonlyArray<T>` | no |  |

### Returns

`T \| undefined` — 


## `zornsLemmaWitness`

> Function · `reasoning/order-theory/index.ts:496`

Constructive Zorn witness for finite posets.

Statement (finite case): every non-empty finite poset in which every
chain has an upper bound contains a maximal element. For finite
posets the chain-upper-bound hypothesis is automatic — the largest
element of any finite chain is its upper bound — so the statement
collapses to "every non-empty finite poset has a maximal element",
which we witness by returning one.

Returns the maximal element (any deterministic choice) or an error
describing why no witness exists (empty carrier, or `P` failing the
poset axioms).

```ts
export function zornsLemmaWitness<T>(P: Poset<T>): T |
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |

### Returns

`T \| { error: string }` — 


## `wellFoundedInduction`

> Function · `reasoning/order-theory/index.ts:530`

Well-founded induction principle (finite case).

For a finite poset, `<` is automatically well-founded. The principle
says: to prove `∀x. P(x)` it suffices to prove
    `∀x. (∀y. y < x → P(y)) → P(x)`.

We verify the principle pointwise: for every `x ∈ elements` we check
that whenever `P` holds on all strict predecessors of `x` it also
holds on `x`. If the user predicate respects this induction step,
`P` must hold everywhere — and the function returns `true`.

This is **not** a general termination proof: it merely checks the
inductive step is consistent on the given carrier.

```ts
export function wellFoundedInduction<T>(P: Poset<T>, predicate: (x: T) => boolean): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `Poset<T>` | no |  |
| `predicate` | `(x: T) => boolean` | no |  |

### Returns

`boolean` — 

