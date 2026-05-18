# `proof-systems/fol-prover/cnf.ts`

## Contents

- [`negate`](#negate) — Function
- [`CNFArtifacts`](#cnfartifacts) — Interface
- [`skolemize`](#skolemize) — Function
- [`toCNF`](#tocnf) — Function

## `negate`

> Function · `proof-systems/fol-prover/cnf.ts:61`

```ts
export function negate(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `CNFArtifacts`

> Interface · `proof-systems/fol-prover/cnf.ts:349`

```ts
export interface CNFArtifacts
```


## `skolemize`

> Function · `proof-systems/fol-prover/cnf.ts:354`

```ts
export function skolemize(formula: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |

### Returns

`Formula` — 


## `toCNF`

> Function · `proof-systems/fol-prover/cnf.ts:364`

```ts
export function toCNF(formula: Formula): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |

### Returns

`FOLClause[]` — 

