# `reasoning/bayesian/inference.ts`

============================================================ Bayesian Inference — Algorithms ============================================================ - jointProbability: producto P(Xᵢ | parents(Xᵢ)) sobre asignación completa. - variableElimination: P(Q | E) marginalizando variables no-evidencia. - query: alias semántico de variableElimination. - mostProbableExplanation: MAP/MPE sobre variables no-evidencia.

## Contents

- [`jointProbability`](#jointprobability) — Function
- [`variableElimination`](#variableelimination) — Function
- [`query`](#query) — Function
- [`mostProbableExplanation`](#mostprobableexplanation) — Function

## `jointProbability`

> Function · `reasoning/bayesian/inference.ts:51`

```ts
export function jointProbability(net: BayesianNetwork, assignment: Record<string, string>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `BayesianNetwork` | no |  |
| `assignment` | `Record<string, string>` | no |  |

### Returns

`number` — 


## `variableElimination`

> Function · `reasoning/bayesian/inference.ts:134`

```ts
export function variableElimination( net: BayesianNetwork, queryVar: string, evidence: Evidence =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `BayesianNetwork` | no |  |
| `queryVar` | `string` | no |  |
| `evidence` | `Evidence` | yes |  |

### Returns

`PosteriorDistribution` — 


## `query`

> Function · `reasoning/bayesian/inference.ts:193`

```ts
export function query( net: BayesianNetwork, queryVar: string, evidence: Evidence =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `BayesianNetwork` | no |  |
| `queryVar` | `string` | no |  |
| `evidence` | `Evidence` | yes |  |

### Returns

`PosteriorDistribution` — 


## `mostProbableExplanation`

> Function · `reasoning/bayesian/inference.ts:207`

```ts
export function mostProbableExplanation( net: BayesianNetwork, evidence: Evidence =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `net` | `BayesianNetwork` | no |  |
| `evidence` | `Evidence` | yes |  |

### Returns

`Record<string, string>` — 

