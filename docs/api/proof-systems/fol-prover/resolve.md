# `proof-systems/fol-prover/resolve.ts`

## Contents

- [`resolve`](#resolve) — Function
- [`ResolutionStepInternal`](#resolutionstepinternal) — Interface
- [`resolveWithRecord`](#resolvewithrecord) — Function
- [`runResolutionLoop`](#runresolutionloop) — Function

## `resolve`

> Function · `proof-systems/fol-prover/resolve.ts:28`

```ts
export function resolve(c1Raw: FOLClause, c2Raw: FOLClause): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c1Raw` | `FOLClause` | no |  |
| `c2Raw` | `FOLClause` | no |  |

### Returns

`FOLClause[]` — 


## `ResolutionStepInternal`

> Interface · `proof-systems/fol-prover/resolve.ts:120`

```ts
export interface ResolutionStepInternal
```


## `resolveWithRecord`

> Function · `proof-systems/fol-prover/resolve.ts:133`

```ts
export function resolveWithRecord(input: ResolveWithRecordInput): ResolutionStepInternal[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `ResolveWithRecordInput` | no |  |

### Returns

`ResolutionStepInternal[]` — 


## `runResolutionLoop`

> Function · `proof-systems/fol-prover/resolve.ts:174`

```ts
export function runResolutionLoop(params: { premiseClauses: FOLClause[]; negatedGoalClauses: FOLClause[]; timeoutMs: number; maxSteps: number; }):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `params` | `{   premiseClauses: FOLClause[];   negatedGoalClauses: FOLClause[];   timeoutMs: number;   maxSteps: number; }` | no |  |

### Returns

`{   proven: boolean;   steps: ResolutionStepInternal[];   timeoutHit: boolean;   reason?: string; }` — 

