# `runtime/formula-classifier.ts`

## Contents

- [`formulasEqual`](#formulasequal) — Function
- [`unify`](#unify) — Function
- [`classifyFormula`](#classifyformula) — Function

## `formulasEqual`

> Function · `runtime/formula-classifier.ts:19`

```ts
export function formulasEqual(a: Formula, b: Formula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Formula` | no |  |
| `b` | `Formula` | no |  |

### Returns

`boolean` — 


## `unify`

> Function · `runtime/formula-classifier.ts:33`

```ts
export function unify(f: Formula, template: Formula, mapping: Map<string, Formula>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `template` | `Formula` | no |  |
| `mapping` | `Map<string, Formula>` | no |  |

### Returns

`boolean` — 


## `classifyFormula`

> Function · `runtime/formula-classifier.ts:141`

```ts
export function classifyFormula(f: Formula): ClassificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`ClassificationResult` — 

