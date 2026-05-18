# `reasoning/bayesian/types.ts`

============================================================ Bayesian Inference — Types ============================================================ Tipos para representar redes bayesianas discretas y consultas de inferencia probabilística.

## Contents

- [`DiscreteVariable`](#discretevariable) — Interface
- [`CPT`](#cpt) — Interface
- [`BayesianNetwork`](#bayesiannetwork) — Interface
- [`Evidence`](#evidence) — Type
- [`PosteriorDistribution`](#posteriordistribution) — Interface

## `DiscreteVariable`

> Interface · `reasoning/bayesian/types.ts:8`

```ts
export interface DiscreteVariable
```


## `CPT`

> Interface · `reasoning/bayesian/types.ts:13`

```ts
export interface CPT
```


## `BayesianNetwork`

> Interface · `reasoning/bayesian/types.ts:21`

```ts
export interface BayesianNetwork
```


## `Evidence`

> Type · `reasoning/bayesian/types.ts:26`

```ts
export type Evidence = Record<string, string>;
```


## `PosteriorDistribution`

> Interface · `reasoning/bayesian/types.ts:28`

```ts
export interface PosteriorDistribution
```

