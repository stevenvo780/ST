# `logic/profiles/classical/dpll.ts`

============================================================ DPLL SAT Solver — Now delegates to CDCL for superior performance. Maintains backward-compatible API. Original DPLL kept as fallback (dpllLegacy). ============================================================

## Contents

- [`DPLLResult`](#dpllresult) — Interface
- [`dpll`](#dpll) — Function
- [`dpllAsync`](#dpllasync) — Function
- [`dpllLegacy`](#dplllegacy) — Function

## `DPLLResult`

> Interface · `logic/profiles/classical/dpll.ts:11`

```ts
export interface DPLLResult
```


## `dpll`

> Function · `logic/profiles/classical/dpll.ts:234`

DPLL SAT Solver — now delegates to CDCL for ~100x performance improvement.
Maintains the same DPLLResult interface for backward compatibility.

```ts
export function dpll(formula: Formula, timeoutMs: number = 30000): DPLLResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `timeoutMs` | `number` | yes |  |

### Returns

`DPLLResult` — 


## `dpllAsync`

> Function · `logic/profiles/classical/dpll.ts:248`

DPLL asíncrono — delega a cdclAsync con soporte de paralelismo.
Usa portfolio racing (Web Workers / worker_threads) para fórmulas grandes.

```ts
export async function dpllAsync(formula: Formula, timeoutMs: number = 30000): Promise<DPLLResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `timeoutMs` | `number` | yes |  |

### Returns

`Promise<DPLLResult>` — 


## `dpllLegacy`

> Function · `logic/profiles/classical/dpll.ts:259`

Legacy DPLL solver — kept as fallback. Use dpll() instead.

```ts
export function dpllLegacy(formula: Formula, timeoutMs: number = 30000): DPLLResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `timeoutMs` | `number` | yes |  |

### Returns

`DPLLResult` — 

