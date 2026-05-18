# `reasoning/probabilistic/examples.ts`

============================================================ Probabilistic Programming — Programas de ejemplo ============================================================ Mini-biblioteca de programas canónicos para exámenes/demos:   - `coinExample()`           Bernoulli(0.5) sin conditioning.   - `biasedCoinExample(p)`    Bernoulli(p) sin conditioning.   - `twoCoinsExample()`       AND de dos monedas (sanity check).   - `bayesianLinearRegression(xs, ys)`                              priors gaussianos sobre slope/intercept                              + likelihood gaussiana del residuo.   - `gaussianMeanModel(data)` posterior sobre mu | data,                              prior Normal(0, 10), σ conocido = 1.

## Contents

- [`coinExample`](#coinexample) — Function
- [`biasedCoinExample`](#biasedcoinexample) — Function
- [`twoCoinsExample`](#twocoinsexample) — Function
- [`bayesianLinearRegression`](#bayesianlinearregression) — Function
- [`gaussianMeanModel`](#gaussianmeanmodel) — Function

## `coinExample`

> Function · `reasoning/probabilistic/examples.ts:19`

Bernoulli simétrica: prior trivial sobre {true, false}.

```ts
export function coinExample(): PProgram<boolean>
```

### Returns

`PProgram<boolean>` — 


## `biasedCoinExample`

> Function · `reasoning/probabilistic/examples.ts:24`

Bernoulli con bias arbitrario p ∈ [0,1].

```ts
export function biasedCoinExample(p: number): PProgram<boolean>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no |  |

### Returns

`PProgram<boolean>` — 


## `twoCoinsExample`

> Function · `reasoning/probabilistic/examples.ts:29`

AND de dos monedas Bernoulli(0.5): P(true) = 0.25 esperado.

```ts
export function twoCoinsExample(): PProgram<boolean>
```

### Returns

`PProgram<boolean>` — 


## `bayesianLinearRegression`

> Function · `reasoning/probabilistic/examples.ts:47`

Bayesian linear regression univariado:
  slope ~ Normal(0, 5)
  intercept ~ Normal(0, 5)
  yᵢ | slope, intercept ~ Normal(slope·xᵢ + intercept, 1)

Devuelve la pareja (slope, intercept). Las observaciones se
codifican como factor(logPdf(...)) sobre el residuo — equivale
a una likelihood gaussiana, suitable para importance/MH.

```ts
export function bayesianLinearRegression( xs: number[], ys: number[], ): PProgram<
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `number[]` | no |  |
| `ys` | `number[]` | no |  |

### Returns

`PProgram<{ slope: number; intercept: number }>` — 


## `gaussianMeanModel`

> Function · `reasoning/probabilistic/examples.ts:78`

Posterior sobre la media de una gaussiana con σ conocido.
  mu ~ Normal(0, 10)
  xᵢ | mu ~ Normal(mu, 1)

Útil como caso de test analítico: el posterior verdadero es
Normal((Σxᵢ) / (n + 1/100), 1/√(n + 1/100)).

```ts
export function gaussianMeanModel(data: number[]): PProgram<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `data` | `number[]` | no |  |

### Returns

`PProgram<number>` — 

