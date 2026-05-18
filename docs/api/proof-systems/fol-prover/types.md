# `proof-systems/fol-prover/types.ts`

A first-order term: variable, constant, or function application.
`args` is present (and may be empty) only when `kind === 'func'`.

## Contents

- [`FOLTerm`](#folterm) — Interface
- [`FOLLiteral`](#folliteral) — Interface
- [`FOLClause`](#folclause) — Type
- [`FOLResolutionStep`](#folresolutionstep) — Interface
- [`FOLProveResult`](#folproveresult) — Interface
- [`FOLProveOptions`](#folproveoptions) — Interface
- [`mkVar`](#mkvar) — Function
- [`mkConst`](#mkconst) — Function
- [`mkFunc`](#mkfunc) — Function
- [`mkLit`](#mklit) — Function
- [`termToString`](#termtostring) — Function
- [`literalToString`](#literaltostring) — Function
- [`clauseToString`](#clausetostring) — Function

## `FOLTerm`

> Interface · `proof-systems/fol-prover/types.ts:5`

A first-order term: variable, constant, or function application.
`args` is present (and may be empty) only when `kind === 'func'`.

```ts
export interface FOLTerm
```


## `FOLLiteral`

> Interface · `proof-systems/fol-prover/types.ts:12`

A first-order literal: a (possibly negated) predicate applied to terms.

```ts
export interface FOLLiteral
```


## `FOLClause`

> Type · `proof-systems/fol-prover/types.ts:19`

A clause in CNF: a disjunction of literals. Empty clause represents ⊥.

```ts
export type FOLClause = FOLLiteral[];
```


## `FOLResolutionStep`

> Interface · `proof-systems/fol-prover/types.ts:22`

Records one resolution step: which two clauses were resolved and the result.

```ts
export interface FOLResolutionStep
```


## `FOLProveResult`

> Interface · `proof-systems/fol-prover/types.ts:29`

Result returned by the FOL resolution prover.

```ts
export interface FOLProveResult
```


## `FOLProveOptions`

> Interface · `proof-systems/fol-prover/types.ts:37`

Options controlling the FOL prover's search budget.

```ts
export interface FOLProveOptions
```


## `mkVar`

> Function · `proof-systems/fol-prover/types.ts:43`

Creates a variable term.

```ts
export function mkVar(name: string): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`FOLTerm` — 


## `mkConst`

> Function · `proof-systems/fol-prover/types.ts:48`

Creates a constant term.

```ts
export function mkConst(name: string): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`FOLTerm` — 


## `mkFunc`

> Function · `proof-systems/fol-prover/types.ts:53`

Creates a function application term.

```ts
export function mkFunc(name: string, args: FOLTerm[]): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `args` | `FOLTerm[]` | no |  |

### Returns

`FOLTerm` — 


## `mkLit`

> Function · `proof-systems/fol-prover/types.ts:58`

Creates a literal from its negation flag, predicate name, and argument terms.

```ts
export function mkLit(negated: boolean, predicate: string, args: FOLTerm[]): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `negated` | `boolean` | no |  |
| `predicate` | `string` | no |  |
| `args` | `FOLTerm[]` | no |  |

### Returns

`FOLLiteral` — 


## `termToString`

> Function · `proof-systems/fol-prover/types.ts:63`

Renders a term as `name` (var/const) or `name(arg,...)` (func).

```ts
export function termToString(t: FOLTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`string` — 


## `literalToString`

> Function · `proof-systems/fol-prover/types.ts:70`

Renders a literal as `P(args)` or `¬P(args)`.

```ts
export function literalToString(lit: FOLLiteral): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |

### Returns

`string` — 


## `clauseToString`

> Function · `proof-systems/fol-prover/types.ts:77`

Renders a clause as a disjunction of literals, or `⊥` for the empty clause.

```ts
export function clauseToString(c: FOLClause): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`string` — 

