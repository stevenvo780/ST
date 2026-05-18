# `reasoning/markov-logic/inference.ts`

============================================================ Markov Logic — Inferencia ============================================================ Funciones:   - `weight(theory, world)` → log-prob no normalizada del mundo   - `probability(theory, world, Z)` → P(world) dada la partición   - `gibbsSample(theory, evidence, iters)` → cadena de mundos   - `mapInference(theory, evidence)` → mundo más probable     (aproximado vía MaxWalkSAT). Convenciones:   - El log-score de un mundo es `Σ_i w_i · satisfied_i(W)`. Los     hard constraints (`w_i = ±Infinity`) se tratan aparte: si están     violados, el log-score es `-Infinity` (probabilidad 0).   - Atoms ausentes del mundo se interpretan como `false`.   - Las funciones que dependen de RNG aceptan `rng?: () => number`     opcional para tests deterministas.

## Contents

- [`weight`](#weight) — Function
- [`probability`](#probability) — Function
- [`exactPartition`](#exactpartition) — Function
- [`exactMarginals`](#exactmarginals) — Function
- [`gibbsSample`](#gibbssample) — Function
- [`gibbsMarginals`](#gibbsmarginals) — Function
- [`mapInference`](#mapinference) — Function

## `weight`

> Function · `reasoning/markov-logic/inference.ts:30`

Log-score (no normalizado) de un mundo:
  logZW = Σ_i w_i · satisfied_i(world)

Si la teoría tiene un hard constraint violado, devuelve
`-Infinity` (lo cual hace P(world)=0).

```ts
export function weight(theory: MLNTheory, world: MLNWorld): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |
| `world` | `MLNWorld` | no |  |

### Returns

`number` — 


## `probability`

> Function · `reasoning/markov-logic/inference.ts:59`

Probabilidad de un mundo dada una aproximación de la partición Z.

P(world) = exp(weight(world)) / partitionApprox

`partitionApprox` debe estar en el mismo "espacio" (no log).
Si `weight(world) === -Infinity` devuelve 0.

```ts
export function probability(theory: MLNTheory, world: MLNWorld, partitionApprox: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |
| `world` | `MLNWorld` | no |  |
| `partitionApprox` | `number` | no |  |

### Returns

`number` — 


## `exactPartition`

> Function · `reasoning/markov-logic/inference.ts:73`

Calcula la partición Z exactamente sumando sobre todos los mundos
posibles. SOLO viable para teorías pequeñas (≤ ~20 ground atoms).
Útil para tests.

```ts
export function exactPartition(theory: MLNTheory): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |

### Returns

`number` — 


## `exactMarginals`

> Function · `reasoning/markov-logic/inference.ts:97`

Marginales exactas P(atom = true) sobre todos los mundos.
Mismo costo exponencial que `exactPartition`. Sólo para tests.

```ts
export function exactMarginals(theory: MLNTheory): Record<string, number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |

### Returns

`Record<string, number>` — 


## `gibbsSample`

> Function · `reasoning/markov-logic/inference.ts:159`

Gibbs sampling sobre los ground atoms NO evidenciados.

En cada paso elige un atom no fijo y resamplea su valor según
P(atom=true | resto). Para MLN, esa condicional es la sigmoide del
"delta" de log-score al flippear:

  P(atom=true | ·) = σ( logScore(true) − logScore(false) )

Devuelve una secuencia de `iterations` mundos coleccionados tras
`burnIn` pasos de calentamiento, con thinning opcional.

```ts
export function gibbsSample( theory: MLNTheory, evidence: Partial<MLNWorld> = {}, iterations: number, options: GibbsOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |
| `evidence` | `Partial<MLNWorld>` | yes |  |
| `iterations` | `number` | no |  |
| `options` | `GibbsOptions` | yes |  |

### Returns

`MLNWorld[]` — 


## `gibbsMarginals`

> Function · `reasoning/markov-logic/inference.ts:278`

Marginales aproximadas: corre Gibbs y promedia indicadores.

```ts
export function gibbsMarginals( theory: MLNTheory, evidence: Partial<MLNWorld>, iterations: number, options: GibbsOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |
| `evidence` | `Partial<MLNWorld>` | no |  |
| `iterations` | `number` | no |  |
| `options` | `GibbsOptions` | yes |  |

### Returns

`Record<string, number>` — 


## `mapInference`

> Function · `reasoning/markov-logic/inference.ts:320`

MAP inference: encuentra el mundo de mayor `weight`. Aproximado
mediante MaxWalkSAT con múltiples restarts: en cada paso, elige
una ground formula INSATISFECHA y flippea uno de sus atoms; con
probabilidad `noise` lo elige al azar (random walk), con `1-noise`
elige el flip que más mejora el score (greedy).

Respeta `evidence`: nunca flippea atoms fijos.

```ts
export function mapInference( theory: MLNTheory, evidence: Partial<MLNWorld> = {}, options: MapOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |
| `evidence` | `Partial<MLNWorld>` | yes |  |
| `options` | `MapOptions` | yes |  |

### Returns

`MLNWorld` — 

