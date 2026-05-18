# `reasoning/real-analysis/index.ts`

============================================================ ST Real Analysis — Primitivas formales (límites ε-δ, continuidad, derivadas, integrales, series, Taylor, MVT) ============================================================ Estas primitivas son *numéricas*: no decidimos análisis real exactamente (eso es indecidible en general), sino que verificamos claims con tolerancia explícita ε > 0 sobre muestreos finitos. Convención: una función real es `RealFn = (x: number) => number`. Toda función que dependa de muestreos expone `eps`/`samples`/`tol` para que quien llama pueda ajustar el rigor numérico. ============================================================

## Contents

- [`RealFn`](#realfn) — Type
- [`LimitClaim`](#limitclaim) — Interface
- [`LimitVerification`](#limitverification) — Interface
- [`verifyLimit`](#verifylimit) — Function
- [`findLimit`](#findlimit) — Function
- [`isContinuousAt`](#iscontinuousat) — Function
- [`isUniformlyContinuous`](#isuniformlycontinuous) — Function
- [`findDiscontinuities`](#finddiscontinuities) — Function
- [`Derivative`](#derivative) — Interface
- [`derivative`](#derivative) — Function
- [`nthDerivative`](#nthderivative) — Function
- [`isDifferentiableAt`](#isdifferentiableat) — Function
- [`findCriticalPoints`](#findcriticalpoints) — Function
- [`Integral`](#integral) — Interface
- [`integrate`](#integrate) — Function
- [`SeriesConvergence`](#seriesconvergence) — Interface
- [`ratioTest`](#ratiotest) — Function
- [`rootTest`](#roottest) — Function
- [`partialSum`](#partialsum) — Function
- [`sequenceLimit`](#sequencelimit) — Function
- [`meanValueTheorem`](#meanvaluetheorem) — Function
- [`taylorPolynomial`](#taylorpolynomial) — Function
- [`taylorRemainderBound`](#taylorremainderbound) — Function

## `RealFn`

> Type · `reasoning/real-analysis/index.ts:14`

```ts
export type RealFn = (x: number) => number;
```


## `LimitClaim`

> Interface · `reasoning/real-analysis/index.ts:36`

```ts
export interface LimitClaim
```


## `LimitVerification`

> Interface · `reasoning/real-analysis/index.ts:42`

```ts
export interface LimitVerification
```


## `verifyLimit`

> Function · `reasoning/real-analysis/index.ts:59`

Verifica numéricamente la afirmación
  ∀ε>0 ∃δ>0 ∀x (0 < |x-point| < δ → |fn(x)-value| < ε)
para el ε dado. Devuelve δ sugerido (o counterexample si falla
incluso con δ extremadamente pequeño).

Estrategia: bisecta δ desde 1 hacia abajo, muestreando puntos en
(point-δ, point) ∪ (point, point+δ); si todos cumplen |f(x)-L|<ε,
δ es válido. Si no encontramos δ válido tras `maxIter` iteraciones,
el último x que falló se reporta como counterexample.

```ts
export function verifyLimit( claim: LimitClaim, epsilon: number, deltaFinder?: (eps: number) => number, ): LimitVerification
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `claim` | `LimitClaim` | no |  |
| `epsilon` | `number` | no |  |
| `deltaFinder` | `(eps: number) => number` | yes |  |

### Returns

`LimitVerification` — 


## `findLimit`

> Function · `reasoning/real-analysis/index.ts:125`

Encuentra (o detecta divergencia/indeterminación de) lim_{x→point} fn(x)
por muestreo bilateral con refinamiento sucesivo.

Devuelve:
  • número L si las dos colas convergen al mismo valor con tolerancia
  • 'diverges' si crece sin cota
  • 'unknown' si las colas no coinciden (límite no existe / discontinuidad de salto)

```ts
export function findLimit( fn: RealFn, point: number, opts?:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `point` | `number` | no |  |
| `opts` | `{ tolerance?: number; samples?: number }` | yes |  |

### Returns

`number \| 'diverges' \| 'unknown'` — 


## `isContinuousAt`

> Function · `reasoning/real-analysis/index.ts:188`

fn es continua en `point` si lim_{x→point} fn(x) = fn(point) con tol `eps`.

```ts
export function isContinuousAt(fn: RealFn, point: number, eps: number = DEFAULT_EPS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `point` | `number` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `isUniformlyContinuous`

> Function · `reasoning/real-analysis/index.ts:202`

Verificación numérica de continuidad uniforme en [a,b]:
  ∀ε ∃δ ∀x,y∈[a,b] (|x-y|<δ → |f(x)-f(y)|<ε)
Estrategia: para cada δ candidato muestreamos pares (x_i, x_i+δ)
cubriendo el intervalo y verificamos que |f(x)-f(x+δ)| < eps en todos.

```ts
export function isUniformlyContinuous( fn: RealFn, domain: [number, number], eps: number = DEFAULT_EPS, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `domain` | `[number, number]` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `findDiscontinuities`

> Function · `reasoning/real-analysis/index.ts:235`

Detecta puntos de discontinuidad por muestreo + chequeo local.

```ts
export function findDiscontinuities( fn: RealFn, domain: [number, number], samples: number = DEFAULT_SAMPLES, ): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `domain` | `[number, number]` | no |  |
| `samples` | `number` | yes |  |

### Returns

`number[]` — 


## `Derivative`

> Interface · `reasoning/real-analysis/index.ts:271`

```ts
export interface Derivative
```


## `derivative`

> Function · `reasoning/real-analysis/index.ts:276`

```ts
export function derivative( fn: RealFn, x: number, opts?:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `x` | `number` | no |  |
| `opts` | `{ h?: number; method?: Derivative['method'] }` | yes |  |

### Returns

`Derivative` — 


## `nthDerivative`

> Function · `reasoning/real-analysis/index.ts:313`

n-ésima derivada por diferencias finitas centrales iteradas (fórmula
con coeficientes binomiales con signo alternado).

  f^(n)(x) ≈ (1/h^n) · Σ_{k=0..n} (-1)^k C(n,k) f(x + (n/2 - k)·h)

```ts
export function nthDerivative(fn: RealFn, x: number, n: number, h?: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `x` | `number` | no |  |
| `n` | `number` | no |  |
| `h` | `number` | yes |  |

### Returns

`number` — 


## `isDifferentiableAt`

> Function · `reasoning/real-analysis/index.ts:342`

Diferenciable en `point` si las derivadas laterales coinciden con tolerancia.

```ts
export function isDifferentiableAt(fn: RealFn, point: number, eps: number = DEFAULT_EPS): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `point` | `number` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `findCriticalPoints`

> Function · `reasoning/real-analysis/index.ts:355`

Encuentra puntos críticos (f'(x) ≈ 0) por bisección en cambios de signo
de la derivada numérica.

```ts
export function findCriticalPoints( fn: RealFn, domain: [number, number], samples: number = DEFAULT_SAMPLES, ): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `domain` | `[number, number]` | no |  |
| `samples` | `number` | yes |  |

### Returns

`number[]` — 


## `Integral`

> Interface · `reasoning/real-analysis/index.ts:397`

```ts
export interface Integral
```


## `integrate`

> Function · `reasoning/real-analysis/index.ts:402`

```ts
export function integrate( fn: RealFn, from: number, to: number, opts?:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `from` | `number` | no |  |
| `to` | `number` | no |  |
| `opts` | `{ method?: Integral['method']; subdivisions?: number }` | yes |  |

### Returns

`Integral` — 


## `SeriesConvergence`

> Interface · `reasoning/real-analysis/index.ts:490`

```ts
export interface SeriesConvergence
```


## `ratioTest`

> Function · `reasoning/real-analysis/index.ts:501`

Test de la razón sobre coeficientes de una serie Σ a_n (no Σ a_n x^n):
  L = lim |a_{n+1}/a_n|
  L < 1 ⇒ converge ; L > 1 ⇒ diverge ; L = 1 ⇒ indeciso.

```ts
export function ratioTest(coefficients: number[]): SeriesConvergence
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefficients` | `number[]` | no |  |

### Returns

`SeriesConvergence` — 


## `rootTest`

> Function · `reasoning/real-analysis/index.ts:536`

Test de la raíz: L = lim sup |a_n|^{1/n}.

```ts
export function rootTest(coefficients: number[]): SeriesConvergence
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `coefficients` | `number[]` | no |  |

### Returns

`SeriesConvergence` — 


## `partialSum`

> Function · `reasoning/real-analysis/index.ts:560`

```ts
export function partialSum(fn: (n: number) => number, terms: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `(n: number) => number` | no |  |
| `terms` | `number` | no |  |

### Returns

`number` — 


## `sequenceLimit`

> Function · `reasoning/real-analysis/index.ts:568`

```ts
export function sequenceLimit( seq: (n: number) => number, opts?: { maxTerms?: number; tolerance?: number }, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seq` | `(n: number) => number` | no |  |
| `opts` | `{ maxTerms?: number; tolerance?: number }` | yes |  |

### Returns

`{ converges: boolean; limit?: number; rate?: 'linear' \| 'quadratic' \| 'unknown' }` — 


## `meanValueTheorem`

> Function · `reasoning/real-analysis/index.ts:611`

Busca c ∈ (a,b) tal que f'(c) = (f(b)-f(a))/(b-a).
Si fn es continua en [a,b] y derivable en (a,b), por MVT existe.
Aquí asumimos eso y buscamos c por bisección sobre f'(x) - slope.

```ts
export function meanValueTheorem( fn: RealFn, derivativeFn: RealFn, a: number, b: number, tolerance: number = 1e-7, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `derivativeFn` | `RealFn` | no |  |
| `a` | `number` | no |  |
| `b` | `number` | no |  |
| `tolerance` | `number` | yes |  |

### Returns

`{ holds: boolean; c?: number }` — 


## `taylorPolynomial`

> Function · `reasoning/real-analysis/index.ts:656`

Polinomio de Taylor de orden N de `fn` centrado en `center`, devuelto
como función. Las derivadas se calculan numéricamente con `nthDerivative`.

```ts
export function taylorPolynomial(fn: RealFn, center: number, order: number): (x: number) => number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `center` | `number` | no |  |
| `order` | `number` | no |  |

### Returns

`(x: number) => number` — 


## `taylorRemainderBound`

> Function · `reasoning/real-analysis/index.ts:683`

Cota grosera del resto de Lagrange: |R_n(x)| ≤ M·|x-c|^(n+1)/(n+1)!
con M estimado como sup |f^(n+1)| sobre un muestreo entre c y x.

```ts
export function taylorRemainderBound(fn: RealFn, center: number, x: number, order: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `RealFn` | no |  |
| `center` | `number` | no |  |
| `x` | `number` | no |  |
| `order` | `number` | no |  |

### Returns

`number` — 

