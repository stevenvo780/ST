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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:5`

Returns `true` when `lit` is an equality literal (predicate `=` with exactly 2 args).

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:14`

Produces a canonical string key for a term, suitable for equality checks and
set membership. Variables are prefixed with `?`, constants with `#`,
functions use `name(arg,arg,...)`.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:24`

Produces a canonical string key for a literal.
Negated literals are prefixed with `!`.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:33`

Produces a canonical string key for a clause by sorting its literal keys.
Suitable for deduplication of resolved clauses.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:38`

Returns `true` when two terms are structurally equal (via their canonical keys).

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:43`

Returns a deep copy of a term.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:50`

Returns a deep copy of a literal, cloning all argument terms.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:59`

Returns a deep copy of a clause (array of literals).

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:67`

Counts the number of nodes in the term tree (variables and constants count as 1,
function nodes add 1 plus the size of each argument).

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:80`

Accumulates all variable names reachable from `t` into `out`.

```ts
export function collectVars(t: FOLTerm, out: Set<string>): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FOLTerm` | no | The term to inspect. |
| `out` | `Set<string>` | no | Set that receives variable names (mutated in place). |

### Returns

`void` — 


## `termVars`

> Function · `proof-systems/fol-prover-equality/term-utils.ts:90`

Returns the set of variable names that appear anywhere in `t`.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:100`

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:117`

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:133`

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:152`

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:169`

Returns the subterm of `lit` addressed by `pos`, where `pos[0]` selects the
argument index and the remaining path descends into that term.
Returns `null` if the position is out of range or empty.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:183`

Returns a new literal with the subterm at `pos` replaced by `replacement`.
`pos[0]` selects the argument; remaining path is forwarded to `replaceAt`.
Returns a clone of `lit` unchanged if `pos` is empty or invalid.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:203`

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:220`

Returns a copy of `c` with every variable renamed to a globally unique name,
preventing variable-capture during paramodulation/resolution with other clauses.

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

> Function · `proof-systems/fol-prover-equality/term-utils.ts:246`

Converts a substitution Map to a plain Record, deep-cloning each term.
Useful for serialization and interop with result types that expect plain objects.

```ts
export function substToRecordTerm(s: Map<string, FOLTerm>): Record<string, FOLTerm>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Map<string, FOLTerm>` | no |  |

### Returns

`Record<string, FOLTerm>` — 

