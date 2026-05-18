# `reasoning/differential-privacy/index.ts`

============================================================ ST Differential Privacy — Primitivas y composición ============================================================ Mecanismos básicos (ε,δ)-DP con composición:   • Mecanismos de ruido: Laplace, Gaussian.   • Mecanismo exponencial (selección bajo utility).   • Randomized response (privacidad local).   • Queries derivadas: count, mean, histogram.   • Composición: básica, avanzada (Dwork-Rothblum-Vadhan),     paralela (queries sobre dominios disjuntos).   • Sensitivity calculators: global L1 y smooth (Nissim-Raskhodnikova-Smith).   • PRNG inyectable y determinista por seed para tests. Convenciones de borde:   • ε > 0 y δ ∈ [0, 1). Para δ > 0 usamos (ε,δ)-DP; el mecanismo     Gaussian exige δ > 0 (ruido subgaussiano no da δ = 0).   • La sensibilidad es L1 para Laplace, L2 para Gaussian.   • randomized response: bit ∈ {0,1}, con probabilidad p de     reportar la verdad y 1−p de flipear → ε = ln(p/(1−p)).   • Composición básica es uniforme y conservadora; la avanzada     usa la cota de Dwork-Rothblum-Vadhan (Theorem III.3, 2010)     y sólo mejora cuando k es razonablemente grande. ------------------------------------------------------------ Interfaz pública del mecanismo ------------------------------------------------------------ Mecanismo (ε,δ)-DP genérico. El método `apply` puede devolver el mismo tipo `T` (para mecanismos categóricos) o un `number` (para queries numéricas). Mantenemos la unión para permitir ambos casos sin obligar a wrappers.

## Contents

- [`DPMechanism`](#dpmechanism) — Interface
- [`DPRng`](#dprng) — Interface
- [`makeDPRng`](#makedprng) — Function
- [`laplaceNoise`](#laplacenoise) — Function
- [`gaussianNoise`](#gaussiannoise) — Function
- [`exponentialMechanism`](#exponentialmechanism) — Function
- [`randomizedResponse`](#randomizedresponse) — Function
- [`randomizedResponseEpsilon`](#randomizedresponseepsilon) — Function
- [`dpCount`](#dpcount) — Function
- [`dpMean`](#dpmean) — Function
- [`dpHistogram`](#dphistogram) — Function
- [`PrivacyBudget`](#privacybudget) — Interface
- [`basicComposition`](#basiccomposition) — Function
- [`advancedComposition`](#advancedcomposition) — Function
- [`parallelComposition`](#parallelcomposition) — Function
- [`globalSensitivityL1`](#globalsensitivityl1) — Function
- [`smoothSensitivity`](#smoothsensitivity) — Function

## `DPMechanism`

> Interface · `reasoning/differential-privacy/index.ts:34`

```ts
export interface DPMechanism<T>
```


## `DPRng`

> Interface · `reasoning/differential-privacy/index.ts:48`

```ts
export interface DPRng
```


## `makeDPRng`

> Function · `reasoning/differential-privacy/index.ts:71`

```ts
export function makeDPRng(seed?: number): DPRng
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seed` | `number` | yes |  |

### Returns

`DPRng` — 


## `laplaceNoise`

> Function · `reasoning/differential-privacy/index.ts:131`

Mecanismo de Laplace: agrega ruido Laplace(0, Δ/ε) a `value`.
Da ε-DP puro (δ = 0) cuando Δ es la sensibilidad L1 de la query.

```ts
export function laplaceNoise( value: number, sensitivity: number, epsilon: number, rng: DPRng = DEFAULT_RNG, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `number` | no |  |
| `sensitivity` | `number` | no |  |
| `epsilon` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`number` — 


## `gaussianNoise`

> Function · `reasoning/differential-privacy/index.ts:152`

Mecanismo Gaussian: agrega N(0, σ²) con σ = Δ·√(2 ln(1.25/δ))/ε,
la calibración estándar de Dwork-Roth (Algorithmic Foundations,
Theorem A.1). Garantiza (ε,δ)-DP para ε ∈ (0, 1] cuando Δ es la
sensibilidad L2. Para ε > 1 la cota sigue siendo válida pero deja
de ser tight; los frameworks modernos prefieren la "analytic
Gaussian" (Balle-Wang 2018) — la dejamos para una iteración futura.

```ts
export function gaussianNoise( value: number, sensitivity: number, epsilon: number, delta: number, rng: DPRng = DEFAULT_RNG, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `number` | no |  |
| `sensitivity` | `number` | no |  |
| `epsilon` | `number` | no |  |
| `delta` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`number` — 


## `exponentialMechanism`

> Function · `reasoning/differential-privacy/index.ts:176`

Mecanismo exponencial: elige un item con probabilidad proporcional
a exp(ε · score(item) / (2 · sensitivity)). Implementa la
formulación canónica (McSherry-Talwar 2007). Da ε-DP cuando
`sensitivity` es la sensibilidad de la función de score.

```ts
export function exponentialMechanism<T>( items: T[], score: (item: T) => number, sensitivity: number, epsilon: number, rng: DPRng = DEFAULT_RNG, ): T
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `items` | `T[]` | no |  |
| `score` | `(item: T) => number` | no |  |
| `sensitivity` | `number` | no |  |
| `epsilon` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`T` — 


## `randomizedResponse`

> Function · `reasoning/differential-privacy/index.ts:228`

Randomized response binario: reporta `bit` con probabilidad `p`,
y `¬bit` con probabilidad 1 − p. Garantiza ε-DP local con
ε = |ln(p / (1 − p))|. La elección clásica p = 3/4 da ε = ln 3.

```ts
export function randomizedResponse(bit: boolean, p: number, rng: DPRng = DEFAULT_RNG): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bit` | `boolean` | no |  |
| `p` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`boolean` — 


## `randomizedResponseEpsilon`

> Function · `reasoning/differential-privacy/index.ts:239`

ε equivalente a un mecanismo de randomized response con
probabilidad de verdad `p`. Útil para test del trade-off.

```ts
export function randomizedResponseEpsilon(p: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `number` | no |  |

### Returns

`number` — 


## `dpCount`

> Function · `reasoning/differential-privacy/index.ts:256`

Conteo DP: cuenta cuántos valores cumplen `predicate` y aplica
ruido Laplace con sensibilidad 1 (cambiar un registro mueve el
conteo en a lo más 1). El resultado se redondea al entero más
cercano y se clamp-a a ≥ 0 (un conteo nunca es negativo).

```ts
export function dpCount<T>( values: T[], predicate: (v: T) => boolean, epsilon: number, rng: DPRng = DEFAULT_RNG, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `T[]` | no |  |
| `predicate` | `(v: T) => boolean` | no |  |
| `epsilon` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`number` — 


## `dpMean`

> Function · `reasoning/differential-privacy/index.ts:276`

Media DP de valores acotados al rango [low, high]: clipea cada
valor al rango, calcula la media empírica y aplica Laplace con
sensibilidad (high − low) / n. Asumimos n público.

```ts
export function dpMean( values: number[], range: [number, number], epsilon: number, rng: DPRng = DEFAULT_RNG, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `number[]` | no |  |
| `range` | `[number, number]` | no |  |
| `epsilon` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`number` — 


## `dpHistogram`

> Function · `reasoning/differential-privacy/index.ts:309`

Histograma DP sobre `categories`: cuenta ocurrencias por categoría
y agrega ruido Laplace independiente a cada bin con sensibilidad 1.
Asumimos que cada registro pertenece a a lo más una categoría
(cambiar un registro mueve a lo más un bin en ±1). Si las
categorías son disjuntas y cubrentes, este es un caso clásico de
composición paralela: el ε total = ε.

```ts
export function dpHistogram<T>( values: T[], categories: T[], epsilon: number, rng: DPRng = DEFAULT_RNG, ): Map<T, number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `T[]` | no |  |
| `categories` | `T[]` | no |  |
| `epsilon` | `number` | no |  |
| `rng` | `DPRng` | yes |  |

### Returns

`Map<T, number>` — 


## `PrivacyBudget`

> Interface · `reasoning/differential-privacy/index.ts:334`

```ts
export interface PrivacyBudget
```


## `basicComposition`

> Function · `reasoning/differential-privacy/index.ts:345`

Composición básica (Dwork-McSherry-Nissim-Smith 2006, Theorem 3.16
en Algorithmic Foundations): la composición secuencial de k
mecanismos (ε_i, δ_i)-DP da (Σ ε_i, Σ δ_i)-DP. Cota uniforme y
conservadora.

```ts
export function basicComposition(mechanisms: PrivacyBudget[]): PrivacyBudget
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mechanisms` | `PrivacyBudget[]` | no |  |

### Returns

`PrivacyBudget` — 


## `advancedComposition`

> Function · `reasoning/differential-privacy/index.ts:370`

Composición avanzada (Dwork-Rothblum-Vadhan 2010, Theorem III.3):
para k mecanismos cada uno (ε, δ)-DP, el compuesto es

  (√(2 k ln(1/δ')) · ε  +  k · ε · (e^ε − 1),  k δ + δ')-DP

para cualquier δ' > 0. Cuando los ε_i son heterogéneos usamos el
máximo como cota uniforme (válida pero no óptima; el tight bound
heterogéneo requiere RDP/zCDP, fuera del alcance de este módulo).

`deltaTotal` es el δ' adicional que el caller acepta pagar.
Devuelve el (ε,δ) total cubriendo el slack δ'.

```ts
export function advancedComposition( mechanisms: PrivacyBudget[], deltaTotal: number, ): PrivacyBudget
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mechanisms` | `PrivacyBudget[]` | no |  |
| `deltaTotal` | `number` | no |  |

### Returns

`PrivacyBudget` — 


## `parallelComposition`

> Function · `reasoning/differential-privacy/index.ts:402`

Composición paralela: cuando k mecanismos actúan sobre particiones
disjuntas del dataset, el ε total es el máximo (no la suma), y el
δ total es el máximo (no la suma). Caso clásico: histograma con
categorías mutuamente excluyentes.

```ts
export function parallelComposition(mechanisms: PrivacyBudget[]): PrivacyBudget
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mechanisms` | `PrivacyBudget[]` | no |  |

### Returns

`PrivacyBudget` — 


## `globalSensitivityL1`

> Function · `reasoning/differential-privacy/index.ts:424`

Sensibilidad global L1: el máximo de |f(D) − f(D')| sobre la
lista de pares neighbours suministrada. Implementación empírica
pensada para tests/diagnóstico — la sensibilidad real exige
razonar sobre todas las parejas válidas, no sólo las muestreadas.

```ts
export function globalSensitivityL1( fn: (data: number[]) => number, neighbors: Array<[number[], number[]]>, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `(data: number[]) => number` | no |  |
| `neighbors` | `Array<[number[], number[]]>` | no |  |

### Returns

`number` — 


## `smoothSensitivity`

> Function · `reasoning/differential-privacy/index.ts:450`

Sensibilidad suave (Nissim-Raskhodnikova-Smith 2007):

  S*_β(f, D) = max_k e^{−β·k} · LS^{(k)}(f, D)

donde LS^{(k)} es la sensibilidad local a distancia k. Aproximamos
variando vecinos hasta `data.length` (cota superior de k). Para
datasets grandes, restringir el k máximo via la longitud del
propio dataset.

Esta es una versión basada en mutaciones simples (cambiar un valor
por el mín o máx empírico) — suficiente para median/mean acotados
en tests, no un cálculo general.

```ts
export function smoothSensitivity( fn: (data: number[]) => number, data: number[], beta: number, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `(data: number[]) => number` | no |  |
| `data` | `number[]` | no |  |
| `beta` | `number` | no |  |

### Returns

`number` — 

