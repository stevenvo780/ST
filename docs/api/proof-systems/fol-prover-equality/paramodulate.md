# `proof-systems/fol-prover-equality/paramodulate.ts`

## Contents

- [`ParamodResult`](#paramodresult) — Interface
- [`paramodulate`](#paramodulate) — Function
- [`paramodulateWithSubst`](#paramodulatewithsubst) — Function
- [`ParamodAllStep`](#paramodallstep) — Interface
- [`paramodulateAll`](#paramodulateall) — Function
- [`reflexivityResolve`](#reflexivityresolve) — Function

## `ParamodResult`

> Interface · `proof-systems/fol-prover-equality/paramodulate.ts:16`

```ts
export interface ParamodResult
```


## `paramodulate`

> Function · `proof-systems/fol-prover-equality/paramodulate.ts:35`

Paramodulation:

  from C ∨ (s = t)         (eqClause, eq_idx points to the s=t literal)
  and  D[u]                (target clause, target_idx points to literal containing u,
                           target_pos points inside that literal's args)
  if unify(s, u) = σ then  (C ∨ D[u → t])·σ

The direction is fixed: args[0] = s (lhs), args[1] = t (rhs). To paramodulate
"in the other direction" callers should retry with the equation flipped (see
`paramodulateAll` for the symmetric enumeration).

Returns null when the literals can't paramodulate (wrong kind, unification fails, etc.).

```ts
export function paramodulate( c1Raw: FOLClause, eq_idx: number, c2Raw: FOLClause, target_idx: number, target_pos: number[], ): FOLClause | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c1Raw` | `FOLClause` | no |  |
| `eq_idx` | `number` | no |  |
| `c2Raw` | `FOLClause` | no |  |
| `target_idx` | `number` | no |  |
| `target_pos` | `number[]` | no |  |

### Returns

`FOLClause \| null` — 


## `paramodulateWithSubst`

> Function · `proof-systems/fol-prover-equality/paramodulate.ts:46`

```ts
export function paramodulateWithSubst( c1Raw: FOLClause, eq_idx: number, c2Raw: FOLClause, target_idx: number, target_pos: number[], ): ParamodResult | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c1Raw` | `FOLClause` | no |  |
| `eq_idx` | `number` | no |  |
| `c2Raw` | `FOLClause` | no |  |
| `target_idx` | `number` | no |  |
| `target_pos` | `number[]` | no |  |

### Returns

`ParamodResult \| null` — 


## `ParamodAllStep`

> Interface · `proof-systems/fol-prover-equality/paramodulate.ts:98`

Generate all paramodulation children between two clauses considering both directions
of every equality literal in either clause and every interior position of every
non-equality target literal in the other.

```ts
export interface ParamodAllStep
```


## `paramodulateAll`

> Function · `proof-systems/fol-prover-equality/paramodulate.ts:109`

```ts
export function paramodulateAll( idxA: number, cA: FOLClause, idxB: number, cB: FOLClause, ): ParamodAllStep[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `idxA` | `number` | no |  |
| `cA` | `FOLClause` | no |  |
| `idxB` | `number` | no |  |
| `cB` | `FOLClause` | no |  |

### Returns

`ParamodAllStep[]` — 


## `reflexivityResolve`

> Function · `proof-systems/fol-prover-equality/paramodulate.ts:189`

Reflexivity resolution: drop a literal of the form ¬(t = t) from a clause.
Useful both during search and for proving reflexive goals.

```ts
export function reflexivityResolve(c: FOLClause): FOLClause | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause \| null` — 

