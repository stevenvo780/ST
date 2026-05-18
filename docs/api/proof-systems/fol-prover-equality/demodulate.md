# `proof-systems/fol-prover-equality/demodulate.ts`

## Contents

- [`DemodulationRule`](#demodulationrule) — Interface
- [`demodulate`](#demodulate) — Function
- [`equalityFactor`](#equalityfactor) — Function

## `DemodulationRule`

> Interface · `proof-systems/fol-prover-equality/demodulate.ts:16`

```ts
export interface DemodulationRule
```


## `demodulate`

> Function · `proof-systems/fol-prover-equality/demodulate.ts:31`

Apply a list of oriented rewrite rules `from → to` to every position of every literal
in `clause`, repeatedly, until no more rewrites apply (fixed point) or we exceed a
safety bound. Each rule is treated as "matching by unification of the variables in
`from` against the subterm" — i.e. one-way matching, not two-way unification.

The orientation guarantees termination because every successful rewrite replaces a
larger term (by `compareTerms`) with a smaller one; we additionally cap the total
number of rewrites per call.

```ts
export function demodulate(clause: FOLClause, rewrites: DemodulationRule[]): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clause` | `FOLClause` | no |  |
| `rewrites` | `DemodulationRule[]` | no |  |

### Returns

`FOLClause` — 


## `equalityFactor`

> Function · `proof-systems/fol-prover-equality/demodulate.ts:132`

Equality factoring: given a clause containing two positive equality literals
  x = y    and    x = z
with shared lhs, produce the factor   x = y ∨ y ≠ z   (which is logically valid
given the original and helps the saturation process). Returns every distinct factor.

More generally, for two positive equalities (a=b) and (c=d) where a unifies with c
via σ, emits (a=b ∨ b≠d)·σ.

```ts
export function equalityFactor(clause: FOLClause): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clause` | `FOLClause` | no |  |

### Returns

`FOLClause[]` — 

