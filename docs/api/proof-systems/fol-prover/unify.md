# `proof-systems/fol-prover/unify.ts`

## Contents

- [`unify`](#unify) — Function
- [`applyTerm`](#applyterm) — Function
- [`applyLiteral`](#applyliteral) — Function
- [`applyClause`](#applyclause) — Function
- [`substToRecord`](#substtorecord) — Function

## `unify`

> Function · `proof-systems/fol-prover/unify.ts:5`

```ts
export function unify(t1: FOLTerm, t2: FOLTerm, sigma?: Subst): Subst | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `FOLTerm` | no |  |
| `t2` | `FOLTerm` | no |  |
| `sigma` | `Subst` | yes |  |

### Returns

`Subst \| null` — 


## `applyTerm`

> Function · `proof-systems/fol-prover/unify.ts:66`

```ts
export function applyTerm(t: FOLTerm, s: Subst): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |
| `s` | `Subst` | no |  |

### Returns

`FOLTerm` — 


## `applyLiteral`

> Function · `proof-systems/fol-prover/unify.ts:76`

```ts
export function applyLiteral(lit: FOLLiteral, s: Subst): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |
| `s` | `Subst` | no |  |

### Returns

`FOLLiteral` — 


## `applyClause`

> Function · `proof-systems/fol-prover/unify.ts:84`

```ts
export function applyClause(c: FOLClause, s: Subst): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |
| `s` | `Subst` | no |  |

### Returns

`FOLClause` — 


## `substToRecord`

> Function · `proof-systems/fol-prover/unify.ts:88`

```ts
export function substToRecord(s: Subst): Record<string, string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Subst` | no |  |

### Returns

`Record<string, string>` — 

