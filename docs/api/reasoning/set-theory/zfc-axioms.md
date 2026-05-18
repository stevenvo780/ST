# `reasoning/set-theory/zfc-axioms.ts`

Sanity checks of selected ZFC axioms restricted to the Vω fragment.

Most axioms hold on Vω: extensionality, pairing, union, power set,
foundation, separation, replacement. Infinity FAILS on Vω because Vω
is exactly the universe of hereditarily finite sets — there is no
infinite set inside it.

The "check" functions verify on a sample of HF sets. They return
`holds = false` plus a counterexample when violated.

## Contents

- [`ZFCAxiomCheck`](#zfcaxiomcheck) — Interface
- [`checkExtensionality`](#checkextensionality) — Function
- [`checkPairing`](#checkpairing) — Function
- [`checkUnion`](#checkunion) — Function
- [`checkPowerSet`](#checkpowerset) — Function
- [`checkInfinity`](#checkinfinity) — Function
- [`checkFoundation`](#checkfoundation) — Function
- [`checkAllAxioms`](#checkallaxioms) — Function

## `ZFCAxiomCheck`

> Interface · `reasoning/set-theory/zfc-axioms.ts:30`

```ts
export interface ZFCAxiomCheck
```


## `checkExtensionality`

> Function · `reasoning/set-theory/zfc-axioms.ts:75`

Axiom of Extensionality: ∀A ∀B (A = B ↔ ∀x (x ∈ A ↔ x ∈ B)).
Our canonicalization implements extensionality directly, so we verify
agreement on a sample plus the contrapositive on intentionally distinct
sets.

```ts
export function checkExtensionality(): ZFCAxiomCheck
```

### Returns

`ZFCAxiomCheck` — 


## `checkPairing`

> Function · `reasoning/set-theory/zfc-axioms.ts:105`

Axiom of Pairing: ∀a ∀b ∃P (a ∈ P ∧ b ∈ P ∧ ∀x (x ∈ P → x = a ∨ x = b)).

```ts
export function checkPairing(_samples = 0): ZFCAxiomCheck
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `_samples` | `any` | yes |  |

### Returns

`ZFCAxiomCheck` — 


## `checkUnion`

> Function · `reasoning/set-theory/zfc-axioms.ts:126`

Axiom of Union: for any family F there exists ⋃F such that x ∈ ⋃F iff
x ∈ A for some A ∈ F.

```ts
export function checkUnion(_samples = 0): ZFCAxiomCheck
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `_samples` | `any` | yes |  |

### Returns

`ZFCAxiomCheck` — 


## `checkPowerSet`

> Function · `reasoning/set-theory/zfc-axioms.ts:165`

Axiom of Power Set: ∀A ∃P (∀x (x ∈ P ↔ x ⊆ A)). Sample over small sets
to keep |P(A)| = 2^|A| manageable.

```ts
export function checkPowerSet(_samples = 0): ZFCAxiomCheck
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `_samples` | `any` | yes |  |

### Returns

`ZFCAxiomCheck` — 


## `checkInfinity`

> Function · `reasoning/set-theory/zfc-axioms.ts:199`

Axiom of Infinity: ∃I (∅ ∈ I ∧ ∀x (x ∈ I → succ(x) ∈ I)). This is
exactly what fails on Vω: there is no HF set closed under successor,
because successor strictly increases rank and HF sets have finite rank.

We "witness" the failure by attempting a closure construction: start
with ∅, repeatedly add successors, and observe that the inductive set
cannot terminate inside Vω. Programmatically we cap the search depth
and report holds=false with the partial witness.

```ts
export function checkInfinity(): ZFCAxiomCheck
```

### Returns

`ZFCAxiomCheck` — 


## `checkFoundation`

> Function · `reasoning/set-theory/zfc-axioms.ts:234`

Axiom of Foundation (Regularity): every nonempty set A has an element
disjoint from A. On HF sets this holds automatically because the
membership relation is well-founded by construction (no cycles, no
infinite descending chains).

```ts
export function checkFoundation(_samples = 0): ZFCAxiomCheck
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `_samples` | `any` | yes |  |

### Returns

`ZFCAxiomCheck` — 


## `checkAllAxioms`

> Function · `reasoning/set-theory/zfc-axioms.ts:258`

```ts
export function checkAllAxioms(): ZFCAxiomCheck[]
```

### Returns

`ZFCAxiomCheck[]` — 

