# `reasoning/probabilistic/distributions.ts`

============================================================ Probabilistic Programming — Distributions ============================================================ Muestreo y log-density para las seis familias soportadas. Todo función pura y RNG inyectable.

## Contents

- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`sampleFrom`](#samplefrom) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`logPdf`](#logpdf) — Function
- [`enumerateSupport`](#enumeratesupport) — Function
- [`enumerateSupport`](#enumeratesupport) — Function
- [`enumerateSupport`](#enumeratesupport) — Function
- [`enumerateSupport`](#enumeratesupport) — Function
- [`enumerateSupport`](#enumeratesupport) — Function

## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:29`

Saca un valor de `dist` usando `rng` (uniforme [0,1)).

Para `categorical` y `discrete`, normaliza las probs internamente
para tolerar entradas no exactamente sumadas a 1.

Las firmas overloaded dan inferencia precisa por familia.

```ts
export function sampleFrom(dist: BernoulliDist, rng: () => number): boolean;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `BernoulliDist` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`boolean` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:30`

```ts
export function sampleFrom(dist: UniformDist, rng: () => number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `UniformDist` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`number` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:31`

```ts
export function sampleFrom(dist: NormalDist, rng: () => number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `NormalDist` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`number` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:32`

```ts
export function sampleFrom(dist: PoissonDist, rng: () => number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `PoissonDist` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`number` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:33`

```ts
export function sampleFrom<T>(dist: CategoricalDist<T>, rng: () => number): T;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `CategoricalDist<T>` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`T` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:34`

```ts
export function sampleFrom<T>(dist: DiscreteDist<T>, rng: () => number): T;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `DiscreteDist<T>` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`T` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:35`

```ts
export function sampleFrom<T>(dist: Distribution<T>, rng: () => number): T;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`T` — 


## `sampleFrom`

> Function · `reasoning/probabilistic/distributions.ts:36`

```ts
export function sampleFrom<T>(dist: Distribution<T>, rng: () => number): T
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |
| `rng` | `() => number` | no |  |

### Returns

`T` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:87`

Log-densidad / log-masa de `value` bajo `dist`.

Para distribuciones continuas (`uniform`, `normal`) es log-pdf;
para discretas (`bernoulli`, `poisson`, `categorical`, `discrete`)
es log-pmf. Valores fuera del soporte devuelven `-Infinity`.

```ts
export function logPdf(dist: BernoulliDist, value: boolean): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `BernoulliDist` | no |  |
| `value` | `boolean` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:88`

```ts
export function logPdf(dist: UniformDist, value: number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `UniformDist` | no |  |
| `value` | `number` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:89`

```ts
export function logPdf(dist: NormalDist, value: number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `NormalDist` | no |  |
| `value` | `number` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:90`

```ts
export function logPdf(dist: PoissonDist, value: number): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `PoissonDist` | no |  |
| `value` | `number` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:91`

```ts
export function logPdf<T>(dist: CategoricalDist<T>, value: T): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `CategoricalDist<T>` | no |  |
| `value` | `T` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:92`

```ts
export function logPdf<T>(dist: DiscreteDist<T>, value: T): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `DiscreteDist<T>` | no |  |
| `value` | `T` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:93`

```ts
export function logPdf<T>(dist: Distribution<T>, value: T): number;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |
| `value` | `T` | no |  |

### Returns

`number` — 


## `logPdf`

> Function · `reasoning/probabilistic/distributions.ts:94`

```ts
export function logPdf<T>(dist: Distribution<T>, value: T): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |
| `value` | `T` | no |  |

### Returns

`number` — 


## `enumerateSupport`

> Function · `reasoning/probabilistic/distributions.ts:148`

Enumera el soporte de una distribución discreta como pares
`[valor, probabilidad]`. Para distribuciones continuas o de
soporte infinito (poisson), lanza error: no se puede enumerar.

Para `poisson` se podría truncar pero la enumeración exacta no
lo soporta — el usuario debe usar `categorical` con un soporte
acotado si quiere enumeración.

```ts
export function enumerateSupport(dist: BernoulliDist): Array<[boolean, number]>;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `BernoulliDist` | no |  |

### Returns

`Array<[boolean, number]>` — 


## `enumerateSupport`

> Function · `reasoning/probabilistic/distributions.ts:149`

```ts
export function enumerateSupport<T>(dist: CategoricalDist<T>): Array<[T, number]>;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `CategoricalDist<T>` | no |  |

### Returns

`Array<[T, number]>` — 


## `enumerateSupport`

> Function · `reasoning/probabilistic/distributions.ts:150`

```ts
export function enumerateSupport<T>(dist: DiscreteDist<T>): Array<[T, number]>;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `DiscreteDist<T>` | no |  |

### Returns

`Array<[T, number]>` — 


## `enumerateSupport`

> Function · `reasoning/probabilistic/distributions.ts:151`

```ts
export function enumerateSupport<T>(dist: Distribution<T>): Array<[T, number]>;
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |

### Returns

`Array<[T, number]>` — 


## `enumerateSupport`

> Function · `reasoning/probabilistic/distributions.ts:152`

```ts
export function enumerateSupport<T>(dist: Distribution<T>): Array<[T, number]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `Distribution<T>` | no |  |

### Returns

`Array<[T, number]>` — 

