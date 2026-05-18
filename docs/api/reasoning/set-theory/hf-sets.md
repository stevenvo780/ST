# `reasoning/set-theory/hf-sets.ts`

Hereditarily finite sets (the universe Vω).

Every HF set is built from the empty set in finitely many steps using
pairing and union. Equality is extensional: two sets are equal iff they
have the same elements, regardless of order or repetition.

Internally we keep elements as a plain array; the canonical form (used
for hashing/equality) deduplicates and orders by a recursive serialization.

## Contents

- [`HFSet`](#hfset) — Interface
- [`EMPTY`](#empty) — Const
- [`canonicalize`](#canonicalize) — Function
- [`setEquals`](#setequals) — Function
- [`isElement`](#iselement) — Function
- [`isSubset`](#issubset) — Function
- [`cardinality`](#cardinality) — Function
- [`canonicalSet`](#canonicalset) — Function
- [`singleton`](#singleton) — Function
- [`pair`](#pair) — Function
- [`union`](#union) — Function
- [`unionFamily`](#unionfamily) — Function
- [`intersection`](#intersection) — Function
- [`difference`](#difference) — Function
- [`powerSet`](#powerset) — Function
- [`orderedPair`](#orderedpair) — Function
- [`fst`](#fst) — Function
- [`snd`](#snd) — Function
- [`cartesianProduct`](#cartesianproduct) — Function
- [`succ`](#succ) — Function
- [`nat`](#nat) — Function
- [`isTransitive`](#istransitive) — Function
- [`isOrdinal`](#isordinal) — Function

## `HFSet`

> Interface · `reasoning/set-theory/hf-sets.ts:12`

Hereditarily finite sets (the universe Vω).

Every HF set is built from the empty set in finitely many steps using
pairing and union. Equality is extensional: two sets are equal iff they
have the same elements, regardless of order or repetition.

Internally we keep elements as a plain array; the canonical form (used
for hashing/equality) deduplicates and orders by a recursive serialization.

```ts
export interface HFSet
```


## `EMPTY`

> Const · `reasoning/set-theory/hf-sets.ts:22`

```ts
const EMPTY: HFSet
```


## `canonicalize`

> Function · `reasoning/set-theory/hf-sets.ts:39`

```ts
export function canonicalize(x: HFSet): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HFSet` | no |  |

### Returns

`string` — 


## `setEquals`

> Function · `reasoning/set-theory/hf-sets.ts:62`

```ts
export function setEquals(a: HFSet, b: HFSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`boolean` — 


## `isElement`

> Function · `reasoning/set-theory/hf-sets.ts:66`

```ts
export function isElement(x: HFSet, A: HFSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HFSet` | no |  |
| `A` | `HFSet` | no |  |

### Returns

`boolean` — 


## `isSubset`

> Function · `reasoning/set-theory/hf-sets.ts:76`

```ts
export function isSubset(a: HFSet, b: HFSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`boolean` — 


## `cardinality`

> Function · `reasoning/set-theory/hf-sets.ts:90`

Cardinality is the number of *distinct* elements (after canonical dedup).
`a.elements` may contain syntactic duplicates if the set was built by
hand; we count once per equivalence class.

```ts
export function cardinality(a: HFSet): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |

### Returns

`number` — 


## `canonicalSet`

> Function · `reasoning/set-theory/hf-sets.ts:102`

Returns the canonical representative of a set: same elements, deduplicated
and ordered. Useful when consumers want a stable shape.

```ts
export function canonicalSet(a: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `singleton`

> Function · `reasoning/set-theory/hf-sets.ts:121`

```ts
export function singleton(x: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `pair`

> Function · `reasoning/set-theory/hf-sets.ts:125`

```ts
export function pair(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `union`

> Function · `reasoning/set-theory/hf-sets.ts:132`

```ts
export function union(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `unionFamily`

> Function · `reasoning/set-theory/hf-sets.ts:150`

Generalized union: union of every element of `sets`. If `sets` is the
family {A1, A2, ...} returns A1 ∪ A2 ∪ ... (Axiom of Union).

```ts
export function unionFamily(sets: HFSet[] | HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sets` | `HFSet[] \| HFSet` | no |  |

### Returns

`HFSet` — 


## `intersection`

> Function · `reasoning/set-theory/hf-sets.ts:159`

```ts
export function intersection(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `difference`

> Function · `reasoning/set-theory/hf-sets.ts:172`

```ts
export function difference(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `powerSet`

> Function · `reasoning/set-theory/hf-sets.ts:190`

Power set: set of all subsets. For a set of cardinality n returns a set
of cardinality 2^n. Implementation is the classic bitmask enumeration
over the canonical element list.

```ts
export function powerSet(a: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `orderedPair`

> Function · `reasoning/set-theory/hf-sets.ts:215`

Kuratowski ordered pair: ⟨a, b⟩ := { {a}, {a, b} }.
Recovers `fst` and `snd` correctly even when a = b.

```ts
export function orderedPair(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `fst`

> Function · `reasoning/set-theory/hf-sets.ts:225`

Extracts the first component of a Kuratowski pair. Returns null if the
input is not shaped like an ordered pair.

```ts
export function fst(p: HFSet): HFSet | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HFSet` | no |  |

### Returns

`HFSet \| null` — 


## `snd`

> Function · `reasoning/set-theory/hf-sets.ts:245`

```ts
export function snd(p: HFSet): HFSet | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HFSet` | no |  |

### Returns

`HFSet \| null` — 


## `cartesianProduct`

> Function · `reasoning/set-theory/hf-sets.ts:276`

Cartesian product A × B = { ⟨a, b⟩ : a ∈ A, b ∈ B }.

```ts
export function cartesianProduct(a: HFSet, b: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HFSet` | no |  |
| `b` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `succ`

> Function · `reasoning/set-theory/hf-sets.ts:298`

Von Neumann natural number: 0 := ∅, succ(n) := n ∪ {n}.
Therefore n = {0, 1, ..., n-1}.

```ts
export function succ(n: HFSet): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `HFSet` | no |  |

### Returns

`HFSet` — 


## `nat`

> Function · `reasoning/set-theory/hf-sets.ts:302`

```ts
export function nat(n: number): HFSet
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`HFSet` — 


## `isTransitive`

> Function · `reasoning/set-theory/hf-sets.ts:317`

Transitive: every element of x is also a subset of x.
Required by the von Neumann ordinal definition.

```ts
export function isTransitive(x: HFSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HFSet` | no |  |

### Returns

`boolean` — 


## `isOrdinal`

> Function · `reasoning/set-theory/hf-sets.ts:331`

Von Neumann ordinal: transitive set, well-ordered by ∈. On HF sets
(where every membership chain terminates by Foundation) this collapses
to: x is transitive and every element of x is also transitive.

```ts
export function isOrdinal(x: HFSet): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HFSet` | no |  |

### Returns

`boolean` — 

