# `reasoning/lattice/index.ts`

Finite lattice theory.

A lattice is a poset (P, ≤) in which every pair of elements has both
a least upper bound (join, ∨) and a greatest lower bound (meet, ∧).

This module focuses on **finite** lattices: given the carrier set and
a `leq` predicate, we derive join/meet exhaustively (O(n^3) per pair
via direct search). That is enough for the structural checks
downstream — distributivity, modularity, complementation, Heyting
implication — which are themselves O(n^3) or O(n^4) and not meant
for n ≫ 100.

Notable theorems used:
  - Dedekind: a lattice is **modular** iff it has no sublattice
    isomorphic to the pentagon N5.
  - Birkhoff: a lattice is **distributive** iff it has no sublattice
    isomorphic to N5 *or* to the diamond M3.

Equality of carrier elements is decided by *antisymmetry of leq*:
`a === b` whenever `leq(a,b) && leq(b,a)`. This lets callers use
structural elements like `Set<string>` without supplying their own
equality predicate.

## Contents

- [`FiniteLattice`](#finitelattice) — Interface
- [`isLattice`](#islattice) — Function
- [`makeLattice`](#makelattice) — Function
- [`isDistributive`](#isdistributive) — Function
- [`isModular`](#ismodular) — Function
- [`complement`](#complement) — Function
- [`isComplemented`](#iscomplemented) — Function
- [`isBoolean`](#isboolean) — Function
- [`relativeComplement`](#relativecomplement) — Function
- [`isHeyting`](#isheyting) — Function
- [`atoms`](#atoms) — Function
- [`coatoms`](#coatoms) — Function
- [`containsPentagon`](#containspentagon) — Function
- [`containsDiamond`](#containsdiamond) — Function
- [`DedekindAnalysis`](#dedekindanalysis) — Interface
- [`dedekindAnalysis`](#dedekindanalysis) — Function
- [`powerSetLattice`](#powersetlattice) — Function
- [`divisibilityLattice`](#divisibilitylattice) — Function
- [`chain`](#chain) — Function
- [`pentagonN5`](#pentagonn5) — Function
- [`diamondM3`](#diamondm3) — Function

## `FiniteLattice`

> Interface · `reasoning/lattice/index.ts:26`

Finite lattice theory.

A lattice is a poset (P, ≤) in which every pair of elements has both
a least upper bound (join, ∨) and a greatest lower bound (meet, ∧).

This module focuses on **finite** lattices: given the carrier set and
a `leq` predicate, we derive join/meet exhaustively (O(n^3) per pair
via direct search). That is enough for the structural checks
downstream — distributivity, modularity, complementation, Heyting
implication — which are themselves O(n^3) or O(n^4) and not meant
for n ≫ 100.

Notable theorems used:
  - Dedekind: a lattice is **modular** iff it has no sublattice
    isomorphic to the pentagon N5.
  - Birkhoff: a lattice is **distributive** iff it has no sublattice
    isomorphic to N5 *or* to the diamond M3.

Equality of carrier elements is decided by *antisymmetry of leq*:
`a === b` whenever `leq(a,b) && leq(b,a)`. This lets callers use
structural elements like `Set<string>` without supplying their own
equality predicate.

```ts
export interface FiniteLattice<T>
```


## `isLattice`

> Function · `reasoning/lattice/index.ts:95`

Check that (elements, leq) forms a lattice: poset axioms plus
existence of join/meet for every pair.

```ts
export function isLattice<T>(elements: ReadonlyArray<T>, leq: (a: T, b: T) => boolean): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `elements` | `ReadonlyArray<T>` | no |  |
| `leq` | `(a: T, b: T) => boolean` | no |  |

### Returns

`boolean` — 


## `makeLattice`

> Function · `reasoning/lattice/index.ts:130`

Build a FiniteLattice from carrier + order. Returns null if the
structure is not a lattice (missing/non-unique join or meet, or
the order itself is malformed).

```ts
export function makeLattice<T>( elements: ReadonlyArray<T>, leq: (a: T, b: T) => boolean, ): FiniteLattice<T> | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `elements` | `ReadonlyArray<T>` | no |  |
| `leq` | `(a: T, b: T) => boolean` | no |  |

### Returns

`FiniteLattice<T> \| null` — 


## `isDistributive`

> Function · `reasoning/lattice/index.ts:197`

Distributive: a ∧ (b ∨ c) = (a ∧ b) ∨ (a ∧ c) for all a,b,c.

```ts
export function isDistributive<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `isModular`

> Function · `reasoning/lattice/index.ts:213`

Modular: a ≤ c ⇒ a ∨ (b ∧ c) = (a ∨ b) ∧ c.

```ts
export function isModular<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `complement`

> Function · `reasoning/lattice/index.ts:231`

Find a complement of `a`: some x with a ∨ x = ⊤ and a ∧ x = ⊥.
Returns the first match (lattice may have multiple), or null.

```ts
export function complement<T>(L: FiniteLattice<T>, a: T): T | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |
| `a` | `T` | no |  |

### Returns

`T \| null` — 


## `isComplemented`

> Function · `reasoning/lattice/index.ts:243`

Complemented: every element has at least one complement.

```ts
export function isComplemented<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `isBoolean`

> Function · `reasoning/lattice/index.ts:254`

Boolean lattice: distributive + complemented.
In finite Boolean lattices, complements are automatically unique.

```ts
export function isBoolean<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `relativeComplement`

> Function · `reasoning/lattice/index.ts:263`

Relative pseudo-complement of `a` with respect to `b`: the largest
x such that a ∧ x ≤ b. Equivalently the Heyting implication a ⇒ b.
Returns null if no largest x exists.

```ts
export function relativeComplement<T>(L: FiniteLattice<T>, a: T, b: T): T | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |
| `a` | `T` | no |  |
| `b` | `T` | no |  |

### Returns

`T \| null` — 


## `isHeyting`

> Function · `reasoning/lattice/index.ts:287`

Heyting algebra: distributive lattice in which every pair (a,b)
has a relative pseudo-complement a ⇒ b.

In finite lattices, distributivity is equivalent to existence of
relative pseudo-complements, so any finite distributive lattice is
automatically Heyting. We still check both for clarity.

```ts
export function isHeyting<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `atoms`

> Function · `reasoning/lattice/index.ts:301`

Atoms: elements that cover ⊥ (i.e. ⊥ < a with no element strictly
between).

```ts
export function atoms<T>(L: FiniteLattice<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`T[]` — 


## `coatoms`

> Function · `reasoning/lattice/index.ts:321`

Coatoms: elements covered by ⊤.

```ts
export function coatoms<T>(L: FiniteLattice<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`T[]` — 


## `containsPentagon`

> Function · `reasoning/lattice/index.ts:350`

Detect a sublattice isomorphic to the pentagon N5.

N5 is the 5-element lattice on {⊥, a, b, c, ⊤} with:
  - ⊥ < a < c < ⊤ (a chain of length 3)
  - ⊥ < b < ⊤ (b incomparable to both a and c)
  - a ∧ b = ⊥, a ∨ b = ⊤, c ∧ b = ⊥, c ∨ b = ⊤.

Equivalent to: there exist 5 distinct elements x0 < x1 < x2 and y,
with y incomparable to x1 and to x2 minus x0, top = x2 ∨ y,
bottom = x0 ∧ y, and y ∨ x1 = y ∨ x2, y ∧ x1 = y ∧ x2.

```ts
export function containsPentagon<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `containsDiamond`

> Function · `reasoning/lattice/index.ts:396`

Detect a sublattice isomorphic to the diamond M3.

M3 is the 5-element lattice with one bottom, one top, and three
mutually incomparable elements between, each pair joining to ⊤
and meeting to ⊥.

```ts
export function containsDiamond<T>(L: FiniteLattice<T>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`boolean` — 


## `DedekindAnalysis`

> Interface · `reasoning/lattice/index.ts:426`

```ts
export interface DedekindAnalysis
```


## `dedekindAnalysis`

> Function · `reasoning/lattice/index.ts:441`

Dedekind / Birkhoff structural analysis. By the two classical
theorems:
  modular   ⇔ pentagon-free
  distributive ⇔ pentagon-free AND diamond-free
We compute both algebraically and by sublattice search; the result
agrees on well-formed finite lattices.

```ts
export function dedekindAnalysis<T>(L: FiniteLattice<T>): DedekindAnalysis
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `L` | `FiniteLattice<T>` | no |  |

### Returns

`DedekindAnalysis` — 


## `powerSetLattice`

> Function · `reasoning/lattice/index.ts:462`

Power set lattice 2^S ordered by inclusion. For |S|=n this has
2^n elements; keep n small (≤ 6).

```ts
export function powerSetLattice(baseElements: ReadonlyArray<string>): FiniteLattice<Set<string>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `baseElements` | `ReadonlyArray<string>` | no |  |

### Returns

`FiniteLattice<Set<string>>` — 


## `divisibilityLattice`

> Function · `reasoning/lattice/index.ts:485`

Divisors of n ordered by divisibility. (Lattice for any positive n.)

```ts
export function divisibilityLattice(n: number): FiniteLattice<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`FiniteLattice<number>` — 


## `chain`

> Function · `reasoning/lattice/index.ts:502`

Chain of n elements 0 < 1 < ... < n-1.

```ts
export function chain(n: number): FiniteLattice<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`FiniteLattice<number>` — 


## `pentagonN5`

> Function · `reasoning/lattice/index.ts:526`

Pentagon N5: the classical non-modular 5-element lattice.

Hasse diagram:
       T
      / \
     c   b
     |   |
     a   |
      \ /
       B

```ts
export function pentagonN5(): FiniteLattice<string>
```

### Returns

`FiniteLattice<string>` — 


## `diamondM3`

> Function · `reasoning/lattice/index.ts:551`

Diamond M3: modular but not distributive 5-element lattice.

Hasse diagram:
       T
     / | \
    a  b  c
     \ | /
       B

```ts
export function diamondM3(): FiniteLattice<string>
```

### Returns

`FiniteLattice<string>` — 

