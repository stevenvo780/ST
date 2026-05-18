# `proof-systems/fol-prover-equality/term-utils.ts`

## Contents

- [`isEqualityLiteral`](#isequalityliteral) — Function
- [`termKey`](#termkey) — Function
- [`literalKey`](#literalkey) — Function
- [`clauseKey`](#clausekey) — Function
- [`termsEqual`](#termsequal) — Function
- [`cloneTerm`](#cloneterm) — Function
- [`cloneLiteral`](#cloneliteral) — Function
- [`cloneClause`](#cloneclause) — Function
- [`termSize`](#termsize) — Function
- [`collectVars`](#collectvars) — Function
- [`termVars`](#termvars) — Function
- [`termAt`](#termat) — Function
- [`replaceAt`](#replaceat) — Function
- [`allPositions`](#allpositions) — Function
- [`allLiteralPositions`](#allliteralpositions) — Function
- [`getLiteralSubterm`](#getliteralsubterm) — Function
- [`replaceLiteralSubterm`](#replaceliteralsubterm) — Function
- [`compareTerms`](#compareterms) — Function
- [`freshenClause`](#freshenclause) — Function
- [`substToRecordTerm`](#substtorecordterm) — Function

## `isEqualityLiteral`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:4`

```ts
export function isEqualityLiteral(lit: FOLLiteral): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |

### Returns

`boolean` — 


## `termKey`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:8`

```ts
export function termKey(t: FOLTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`string` — 


## `literalKey`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:14`

```ts
export function literalKey(lit: FOLLiteral): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |

### Returns

`string` — 


## `clauseKey`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:19`

```ts
export function clauseKey(c: FOLClause): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`string` — 


## `termsEqual`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:23`

```ts
export function termsEqual(a: FOLTerm, b: FOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLTerm` | no |  |
| `b` | `FOLTerm` | no |  |

### Returns

`boolean` — 


## `cloneTerm`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:27`

```ts
export function cloneTerm(t: FOLTerm): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`FOLTerm` — 


## `cloneLiteral`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:33`

```ts
export function cloneLiteral(lit: FOLLiteral): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |

### Returns

`FOLLiteral` — 


## `cloneClause`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:41`

```ts
export function cloneClause(c: FOLClause): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause` — 


## `termSize`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:45`

```ts
export function termSize(t: FOLTerm): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`number` — 


## `collectVars`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:53`

```ts
export function collectVars(t: FOLTerm, out: Set<string>): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |
| `out` | `Set<string>` | no |  |

### Returns

`void` — 


## `termVars`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:62`

```ts
export function termVars(t: FOLTerm): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`Set<string>` — 


## `termAt`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:72`

Returns the subterm of `t` at the given position. Position [] returns t itself;
position [i, j, ...] descends into args[i], then args[j], etc.

```ts
export function termAt(t: FOLTerm, pos: number[]): FOLTerm | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |
| `pos` | `number[]` | no |  |

### Returns

`FOLTerm \| null` — 


## `replaceAt`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:89`

Returns a new term equal to `t` but with the subterm at `pos` replaced by `replacement`.
If pos is invalid returns `t` unchanged.

```ts
export function replaceAt(t: FOLTerm, pos: number[], replacement: FOLTerm): FOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |
| `pos` | `number[]` | no |  |
| `replacement` | `FOLTerm` | no |  |

### Returns

`FOLTerm` — 


## `allPositions`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:105`

Enumerate every (non-empty) position inside the term tree, including the root.
Variables and constants only yield their own position; functions also yield children.

```ts
export function allPositions(t: FOLTerm): number[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no |  |

### Returns

`number[][]` — 


## `allLiteralPositions`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:124`

Enumerate positions for a literal as (argIndex, ...termPath). Useful for paramodulation
targets that point inside a literal's args.

```ts
export function allLiteralPositions(lit: FOLLiteral): number[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |

### Returns

`number[][]` — 


## `getLiteralSubterm`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:136`

```ts
export function getLiteralSubterm(lit: FOLLiteral, pos: number[]): FOLTerm | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |
| `pos` | `number[]` | no |  |

### Returns

`FOLTerm \| null` — 


## `replaceLiteralSubterm`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:145`

```ts
export function replaceLiteralSubterm( lit: FOLLiteral, pos: number[], replacement: FOLTerm, ): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `FOLLiteral` | no |  |
| `pos` | `number[]` | no |  |
| `replacement` | `FOLTerm` | no |  |

### Returns

`FOLLiteral` — 


## `compareTerms`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:165`

Lexicographic path ordering–ish comparison used for orienting equations and
for selecting which side rewrites the other in demodulation. Strictly compares
(size, then key) so that the "bigger" term is rewritten into the "smaller" one.

```ts
export function compareTerms(a: FOLTerm, b: FOLTerm): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FOLTerm` | no |  |
| `b` | `FOLTerm` | no |  |

### Returns

`number` — 


## `freshenClause`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:178`

```ts
export function freshenClause(c: FOLClause): FOLClause
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause` — 


## `substToRecordTerm`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:200`

```ts
export function substToRecordTerm(s: Map<string, FOLTerm>): Record<string, FOLTerm>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Map<string, FOLTerm>` | no |  |

### Returns

`Record<string, FOLTerm>` — 

