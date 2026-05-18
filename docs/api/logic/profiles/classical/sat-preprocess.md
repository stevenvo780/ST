# `logic/profiles/classical/sat-preprocess.ts`

============================================================ SAT Preprocessing — Simplification before solving Implements: Subsumption Elimination, Self-Subsuming Resolution, Bounded Variable Elimination, Failed Literal Probing ============================================================

## Contents

- [`PreprocessResult`](#preprocessresult) — Interface
- [`preprocess`](#preprocess) — Function

## `PreprocessResult`

> Interface · `logic/profiles/classical/sat-preprocess.ts:12`

Result of preprocessing: simplified clauses and any forced assignments.

```ts
export interface PreprocessResult
```


## `preprocess`

> Function · `logic/profiles/classical/sat-preprocess.ts:335`

Main preprocessing pipeline.
Applies simplifications in order of effectiveness.

```ts
export function preprocess(clauses: Clause[], numVars: number): PreprocessResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Clause[]` | no |  |
| `numVars` | `number` | no |  |

### Returns

`PreprocessResult` — 

