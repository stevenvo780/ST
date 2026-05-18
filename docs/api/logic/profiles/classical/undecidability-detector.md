# `logic/profiles/classical/undecidability-detector.ts`

============================================================ FOL Undecidability Detector Detects patterns known to be undecidable in first-order logic, provides meaningful warnings to users. ============================================================

## Contents

- [`UndecidabilityWarning`](#undecidabilitywarning) — Interface
- [`detectUndecidable`](#detectundecidable) — Function

## `UndecidabilityWarning`

> Interface · `logic/profiles/classical/undecidability-detector.ts:9`

```ts
export interface UndecidabilityWarning
```


## `detectUndecidable`

> Function · `logic/profiles/classical/undecidability-detector.ts:20`

Analyze a first-order formula for known undecidable or computationally
intractable patterns. Returns warnings if any are detected.

```ts
export function detectUndecidable(formula: Formula): UndecidabilityWarning[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |

### Returns

`UndecidabilityWarning[]` — 

