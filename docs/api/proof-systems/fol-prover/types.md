# `proof-systems/fol-prover/types.ts`

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

> Interface · `proof-systems/fol-prover/types.ts:1`

```ts
export interface FOLTerm
```


## `FOLLiteral`

> Interface · `proof-systems/fol-prover/types.ts:7`

```ts
export interface FOLLiteral
```


## `FOLClause`

> Type · `proof-systems/fol-prover/types.ts:13`

```ts
export type FOLClause = FOLLiteral[];
```


## `FOLResolutionStep`

> Interface · `proof-systems/fol-prover/types.ts:15`

```ts
export interface FOLResolutionStep
```


## `FOLProveResult`

> Interface · `proof-systems/fol-prover/types.ts:21`

```ts
export interface FOLProveResult
```


## `FOLProveOptions`

> Interface · `proof-systems/fol-prover/types.ts:28`

```ts
export interface FOLProveOptions
```


## `mkVar`

> Function · `proof-systems/fol-prover/types.ts:33`

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

> Function · `proof-systems/fol-prover/types.ts:37`

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

> Function · `proof-systems/fol-prover/types.ts:41`

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

> Function · `proof-systems/fol-prover/types.ts:45`

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

> Function · `proof-systems/fol-prover/types.ts:49`

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

> Function · `proof-systems/fol-prover/types.ts:55`

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

> Function · `proof-systems/fol-prover/types.ts:61`

```ts
export function clauseToString(c: FOLClause): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`string` — 

