# `reasoning/bayesian/factor.ts`

============================================================ Bayesian Inference — Factor representation ============================================================ Un Factor representa una función φ(X₁,…,Xₙ) → ℝ⁺ sobre un conjunto de variables discretas. Las CPTs se convierten a factores; los algoritmos de variable elimination producen y consumen factores con tres operaciones: restricción por evidencia, producto, y suma-marginalización.

## Contents

- [`Factor`](#factor) — Interface
- [`assignmentKey`](#assignmentkey) — Function
- [`parseParentKey`](#parseparentkey) — Function
- [`buildParentKey`](#buildparentkey) — Function
- [`iterateAssignments`](#iterateassignments) — Function
- [`factorFromCPT`](#factorfromcpt) — Function
- [`restrictFactor`](#restrictfactor) — Function
- [`parseAssignmentKey`](#parseassignmentkey) — Function
- [`multiplyFactors`](#multiplyfactors) — Function
- [`sumOut`](#sumout) — Function
- [`maxOut`](#maxout) — Function
- [`normalizeFactor`](#normalizefactor) — Function
- [`variableDomainsOf`](#variabledomainsof) — Function

## `Factor`

> Interface · `reasoning/bayesian/factor.ts:13`

```ts
export interface Factor
```


## `assignmentKey`

> Function · `reasoning/bayesian/factor.ts:23`

```ts
export function assignmentKey(variables: string[], assignment: Record<string, string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `variables` | `string[]` | no |  |
| `assignment` | `Record<string, string>` | no |  |

### Returns

`string` — 


## `parseParentKey`

> Function · `reasoning/bayesian/factor.ts:32`

```ts
export function parseParentKey(parents: string[], key: string): Record<string, string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `parents` | `string[]` | no |  |
| `key` | `string` | no |  |

### Returns

`Record<string, string>` — 


## `buildParentKey`

> Function · `reasoning/bayesian/factor.ts:47`

```ts
export function buildParentKey(parents: string[], assignment: Record<string, string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `parents` | `string[]` | no |  |
| `assignment` | `Record<string, string>` | no |  |

### Returns

`string` — 


## `iterateAssignments`

> Function · `reasoning/bayesian/factor.ts:58`

```ts
export function* iterateAssignments( variables: string[], domains: Record<string, string[]>, ): Generator<Record<string, string>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `variables` | `string[]` | no |  |
| `domains` | `Record<string, string[]>` | no |  |

### Returns

`Generator<Record<string, string>>` — 


## `factorFromCPT`

> Function · `reasoning/bayesian/factor.ts:91`

```ts
export function factorFromCPT(cpt: CPT, variableDomains: Record<string, string[]>): Factor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cpt` | `CPT` | no |  |
| `variableDomains` | `Record<string, string[]>` | no |  |

### Returns

`Factor` — 


## `restrictFactor`

> Function · `reasoning/bayesian/factor.ts:116`

```ts
export function restrictFactor(factor: Factor, evidence: Evidence): Factor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `factor` | `Factor` | no |  |
| `evidence` | `Evidence` | no |  |

### Returns

`Factor` — 


## `parseAssignmentKey`

> Function · `reasoning/bayesian/factor.ts:140`

```ts
export function parseAssignmentKey(key: string): Record<string, string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `key` | `string` | no |  |

### Returns

`Record<string, string>` — 


## `multiplyFactors`

> Function · `reasoning/bayesian/factor.ts:153`

```ts
export function multiplyFactors(a: Factor, b: Factor): Factor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Factor` | no |  |
| `b` | `Factor` | no |  |

### Returns

`Factor` — 


## `sumOut`

> Function · `reasoning/bayesian/factor.ts:179`

```ts
export function sumOut(factor: Factor, variable: string): Factor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `factor` | `Factor` | no |  |
| `variable` | `string` | no |  |

### Returns

`Factor` — 


## `maxOut`

> Function · `reasoning/bayesian/factor.ts:201`

```ts
export function maxOut( factor: Factor, variable: string, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `factor` | `Factor` | no |  |
| `variable` | `string` | no |  |

### Returns

`{ factor: Factor; backpointer: Map<string, string> }` — 


## `normalizeFactor`

> Function · `reasoning/bayesian/factor.ts:232`

```ts
export function normalizeFactor(factor: Factor): Factor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `factor` | `Factor` | no |  |

### Returns

`Factor` — 


## `variableDomainsOf`

> Function · `reasoning/bayesian/factor.ts:246`

```ts
export function variableDomainsOf(net: BayesianNetwork): Record<string, string[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `BayesianNetwork` | no |  |

### Returns

`Record<string, string[]>` — 

