# `logic/profiles/classical/cdcl.ts`

============================================================ CDCL SAT Solver — Conflict-Driven Clause Learning Implements: Watched Literals, 1UIP Conflict Analysis, Non-Chronological Backtracking, VSIDS, Luby Restarts, Phase Saving, Preprocessing Integration, Pattern Detection (PHP, Parity, Symmetry) ============================================================

## Contents

- [`CDCLResult`](#cdclresult) — Interface
- [`SolverStats`](#solverstats) — Interface
- [`PatternDetection`](#patterndetection) — Interface
- [`detectPatterns`](#detectpatterns) — Function
- [`addSymmetryBreaking`](#addsymmetrybreaking) — Function
- [`cdcl`](#cdcl) — Function
- [`cdclAsync`](#cdclasync) — Function
- [`DPLLResult`](#dpllresult) — Type

## `CDCLResult`

> Interface · `logic/profiles/classical/cdcl.ts:14`

```ts
export interface CDCLResult
```


## `SolverStats`

> Interface · `logic/profiles/classical/cdcl.ts:20`

```ts
export interface SolverStats
```


## `PatternDetection`

> Interface · `logic/profiles/classical/cdcl.ts:715`

```ts
export interface PatternDetection
```


## `detectPatterns`

> Function · `logic/profiles/classical/cdcl.ts:721`

```ts
export function detectPatterns(clauses: Int32Array[], numVars: number): PatternDetection | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Int32Array[]` | no |  |
| `numVars` | `number` | no |  |

### Returns

`PatternDetection \| null` — 


## `addSymmetryBreaking`

> Function · `logic/profiles/classical/cdcl.ts:791`

```ts
export function addSymmetryBreaking(clauses: Int32Array[], numVars: number): Int32Array[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Int32Array[]` | no |  |
| `numVars` | `number` | no |  |

### Returns

`Int32Array[]` — 


## `cdcl`

> Function · `logic/profiles/classical/cdcl.ts:825`

```ts
export function cdcl(formula: Formula, timeoutMs: number = 30000): CDCLResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `timeoutMs` | `number` | yes |  |

### Returns

`CDCLResult` — 


## `cdclAsync`

> Function · `logic/profiles/classical/cdcl.ts:873`

Versión asíncrona del solver CDCL con soporte de paralelismo.
Cuando la fórmula es suficientemente grande (≥ PARALLEL_THRESHOLD vars),
lanza workers en portfolio racing. Para fórmulas pequeñas, ejecuta
el solver secuencial como wrapper de Promise.

Compatible con Node.js (worker_threads) y Browser (Web Workers).

```ts
export async function cdclAsync(formula: Formula, timeoutMs: number = 30000): Promise<CDCLResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `timeoutMs` | `number` | yes |  |

### Returns

`Promise<CDCLResult>` — 


## `DPLLResult`

> Type · `logic/profiles/classical/cdcl.ts:935`

```ts
export type DPLLResult = CDCLResult;
```

