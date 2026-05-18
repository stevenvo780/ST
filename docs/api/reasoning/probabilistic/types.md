# `reasoning/probabilistic/types.ts`

Distribución de probabilidad sobre valores de tipo T.

Cinco familias paramétricas comunes + `discrete` (PMF arbitraria
sobre claves T) y `categorical` (lista paralela de valores y probs).

Convenciones:
  - `uniform`: continua sobre `[low, high)`.
  - `normal`: gaussiana con `std > 0`.
  - `poisson`: discreta sobre {0, 1, 2, ...}.
  - `bernoulli`: discreta sobre {true, false} con `P(true) = p`.
  - `categorical`/`discrete`: las probs deben sumar 1 (se normaliza).

## Contents

- [`BernoulliDist`](#bernoullidist) — Interface
- [`UniformDist`](#uniformdist) — Interface
- [`NormalDist`](#normaldist) — Interface
- [`PoissonDist`](#poissondist) — Interface
- [`CategoricalDist`](#categoricaldist) — Interface
- [`DiscreteDist`](#discretedist) — Interface
- [`Distribution`](#distribution) — Type
- [`bernoulli`](#bernoulli) — Function
- [`uniform`](#uniform) — Function
- [`normal`](#normal) — Function
- [`poisson`](#poisson) — Function
- [`categorical`](#categorical) — Function
- [`discrete`](#discrete) — Function
- [`Sampler`](#sampler) — Interface
- [`PProgram`](#pprogram) — Type
- [`InferenceOptions`](#inferenceoptions) — Interface
- [`PosteriorSummary`](#posteriorsummary) — Interface

## `BernoulliDist`

> Interface · `reasoning/probabilistic/types.ts:27`

Bernoulli sobre {true, false}.

```ts
export interface BernoulliDist
```


## `UniformDist`

> Interface · `reasoning/probabilistic/types.ts:35`

Uniforme continua sobre [low, high).

```ts
export interface UniformDist
```


## `NormalDist`

> Interface · `reasoning/probabilistic/types.ts:43`

Gaussiana con media y desviación.

```ts
export interface NormalDist
```


## `PoissonDist`

> Interface · `reasoning/probabilistic/types.ts:51`

Poisson sobre {0, 1, 2, ...}.

```ts
export interface PoissonDist
```


## `CategoricalDist`

> Interface · `reasoning/probabilistic/types.ts:58`

Categorical con lista de valores paralelos a sus probabilidades.

```ts
export interface CategoricalDist<T>
```


## `DiscreteDist`

> Interface · `reasoning/probabilistic/types.ts:66`

Discrete con PMF (Map de valor → masa).

```ts
export interface DiscreteDist<T>
```


## `Distribution`

> Type · `reasoning/probabilistic/types.ts:79`

Distribución sobre valores de tipo T.

En la práctica usá los constructores (`bernoulli`, `uniform`,
`normal`, `poisson`, `categorical`, `discrete`) que devuelven
el tipo Distribution<T> ya tipado.

```ts
export type Distribution<T> = | BernoulliDist | UniformDist | NormalDist | PoissonDist | CategoricalDist<T> | DiscreteDist<T>;
```


## `bernoulli`

> Function · `reasoning/probabilistic/types.ts:91`

Helpers de construcción. Cada uno devuelve la `Distribution<T>`
adecuada con T inferido (boolean / number / genérico).

```ts
export function bernoulli(p: number): BernoulliDist
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no |  |

### Returns

`BernoulliDist` — 


## `uniform`

> Function · `reasoning/probabilistic/types.ts:95`

```ts
export function uniform(low: number, high: number): UniformDist
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `low` | `number` | no |  |
| `high` | `number` | no |  |

### Returns

`UniformDist` — 


## `normal`

> Function · `reasoning/probabilistic/types.ts:99`

```ts
export function normal(mean: number, std: number): NormalDist
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mean` | `number` | no |  |
| `std` | `number` | no |  |

### Returns

`NormalDist` — 


## `poisson`

> Function · `reasoning/probabilistic/types.ts:103`

```ts
export function poisson(lambda: number): PoissonDist
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lambda` | `number` | no |  |

### Returns

`PoissonDist` — 


## `categorical`

> Function · `reasoning/probabilistic/types.ts:107`

```ts
export function categorical<T>(values: T[], probs: number[]): CategoricalDist<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `T[]` | no |  |
| `probs` | `number[]` | no |  |

### Returns

`CategoricalDist<T>` — 


## `discrete`

> Function · `reasoning/probabilistic/types.ts:111`

```ts
export function discrete<T>(pmf: Map<T, number>): DiscreteDist<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `pmf` | `Map<T, number>` | no |  |

### Returns

`DiscreteDist<T>` — 


## `Sampler`

> Interface · `reasoning/probabilistic/types.ts:127`

Sampler: interface que recibe el programa probabilístico para
(a) muestrear de distribuciones, (b) condicionar con observaciones
que descartan ejecuciones inconsistentes, y (c) ajustar el peso
de la traza con un log-factor arbitrario.

Cada motor de inferencia implementa este interface de manera
distinta (enumeración exacta, rejection, importance, MH).

Las firmas overloaded permiten que `sample(bernoulli(p))` infiera
`boolean`, `sample(normal(...))` infiera `number`, etc.

```ts
export interface Sampler
```


## `PProgram`

> Type · `reasoning/probabilistic/types.ts:156`

Programa probabilístico: función que, dado un sampler, produce
un valor de retorno (la query). Las llamadas a `sampler.sample`
dentro del programa definen el prior; las llamadas a `observe`
y `factor` definen el conditioning.

```ts
export type PProgram<T> = (sampler: Sampler) => T;
```


## `InferenceOptions`

> Interface · `reasoning/probabilistic/types.ts:168`

Opciones de inferencia genéricas. Defaults razonables por motor.
  - `numSamples`: tamaño objetivo del posterior.
  - `burnIn`: descartar las primeras N iteraciones (solo MCMC).
  - `thin`: tomar 1 de cada N (solo MCMC, para reducir autocorr).
  - `maxAttempts`: tope global de intentos (rejection); evita loops
    infinitos cuando la observación es demasiado restrictiva.
  - `rng`: generador inyectable para tests deterministas.
  - `proposalStd`: desviación para propuestas gaussianas en MH.

```ts
export interface InferenceOptions
```


## `PosteriorSummary`

> Interface · `reasoning/probabilistic/types.ts:186`

Resumen del posterior sobre el valor de retorno del programa.

Campos numéricos (`mean`, `std`, `quantiles`) solo se rellenan
cuando los samples son finitamente numéricos (incluye booleanos
tratados como 0/1). El histograma siempre se computa: agrupa por
igualdad estructural (JSON-serializable) y reporta la masa
estimada por valor.

```ts
export interface PosteriorSummary<T>
```

