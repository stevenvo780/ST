# `logic/profiles/classical/propositional.ts`

============================================================ ST Classical Propositional — Motor completo ============================================================

## Contents

- [`collectAtoms`](#collectatoms) — Function
- [`evaluateClassical`](#evaluateclassical) — Function
- [`generateValuationsLazy`](#generatevaluationslazy) — Function
- [`formulaToString`](#formulatostring) — Function
- [`toNNF`](#tonnf) — Function
- [`toCNF`](#tocnf) — Function
- [`toDNF`](#todnf) — Function
- [`extractClauses`](#extractclauses) — Function
- [`ClassicalPropositional`](#classicalpropositional) — Class

## `collectAtoms`

> Function · `logic/profiles/classical/propositional.ts:26`

```ts
export function collectAtoms(f: Formula): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Set<string>` — 


## `evaluateClassical`

> Function · `logic/profiles/classical/propositional.ts:46`

```ts
export function evaluateClassical(f: Formula, v: Valuation): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `v` | `Valuation` | no |  |

### Returns

`boolean` — 


## `generateValuationsLazy`

> Function · `logic/profiles/classical/propositional.ts:115`

Generador lazy de valuaciones para streaming (usado por el intérprete para truth_table masivas).

```ts
export function* generateValuationsLazy(atoms: string[]): Generator<Valuation>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `atoms` | `string[]` | no |  |

### Returns

`Generator<Valuation>` — 


## `formulaToString`

> Function · `logic/profiles/classical/propositional.ts:331`

```ts
export function formulaToString(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `toNNF`

> Function · `logic/profiles/classical/propositional.ts:445`

```ts
export function toNNF(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `toCNF`

> Function · `logic/profiles/classical/propositional.ts:599`

```ts
export function toCNF(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `toDNF`

> Function · `logic/profiles/classical/propositional.ts:630`

```ts
export function toDNF(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `extractClauses`

> Function · `logic/profiles/classical/propositional.ts:638`

Extracts clauses from a CNF formula for resolution analysis (#28)
Returns an array of clauses, where each clause is an array of literals.

```ts
export function extractClauses(f: Formula): string[][]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string[][]` — 


## `ClassicalPropositional`

> Class · `logic/profiles/classical/propositional.ts:2595`

```ts
export class ClassicalPropositional implements LogicProfile
```

