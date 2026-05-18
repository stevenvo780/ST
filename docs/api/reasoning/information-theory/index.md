# `reasoning/information-theory/index.ts`

Distribución de probabilidad discreta sobre símbolos de tipo `T` (`Map<T, number>`, masa ≈ 1).

## Contents

- [`Distribution`](#distribution) — Type
- [`Joint`](#joint) — Type
- [`support`](#support) — Function
- [`isValidDistribution`](#isvaliddistribution) — Function
- [`normalize`](#normalize) — Function
- [`LogBase`](#logbase) — Type
- [`shannonEntropy`](#shannonentropy) — Function
- [`renyiEntropy`](#renyientropy) — Function
- [`minEntropy`](#minentropy) — Function
- [`maxEntropy`](#maxentropy) — Function
- [`collisionEntropy`](#collisionentropy) — Function
- [`klDivergence`](#kldivergence) — Function
- [`jsDivergence`](#jsdivergence) — Function
- [`tvDistance`](#tvdistance) — Function
- [`hellingerDistance`](#hellingerdistance) — Function
- [`crossEntropy`](#crossentropy) — Function
- [`jointToMarginals`](#jointtomarginals) — Function
- [`mutualInformation`](#mutualinformation) — Function
- [`conditionalEntropy`](#conditionalentropy) — Function
- [`chainRule`](#chainrule) — Function

## `Distribution`

> Type · `reasoning/information-theory/index.ts:23`

Distribución de probabilidad discreta sobre símbolos de tipo `T` (`Map<T, number>`, masa ≈ 1).

```ts
export type Distribution<T> = Map<T, number>;
```


## `Joint`

> Type · `reasoning/information-theory/index.ts:30`

Distribución conjunta sobre pares (X, Y).
Nota: `Map<[X, Y], number>` no des-duplica por igualdad estructural;
el llamante debe garantizar un par por combinación (x, y).

```ts
export type Joint<X, Y> = Map<[X, Y], number>;
```


## `support`

> Function · `reasoning/information-theory/index.ts:40`

Devuelve los símbolos con probabilidad estrictamente positiva (soporte de `p`).

```ts
export function support<T>(p: Distribution<T>): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |

### Returns

`T[]` — 


## `isValidDistribution`

> Function · `reasoning/information-theory/index.ts:49`

`true` si todas las probabilidades son ≥ 0, finitas y su suma difiere de 1 en menos de `eps`.

```ts
export function isValidDistribution<T>(p: Distribution<T>, eps: number = EPS_DEFAULT): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `eps` | `number` | yes |  |

### Returns

`boolean` — 


## `normalize`

> Function · `reasoning/information-theory/index.ts:62`

Reescala la distribución `p` para que su masa sea 1.

```ts
export function normalize<T>(p: Distribution<T>): Distribution<T>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |

### Returns

`Distribution<T>` — 


## `LogBase`

> Type · `reasoning/information-theory/index.ts:85`

Base del logaritmo para entropías: `2` (bits, default), `'e'` (nats), `10` (hartleys), `'log'` (alias de 2).

```ts
export type LogBase = 'log' | 'e' | 2 | 10;
```


## `shannonEntropy`

> Function · `reasoning/information-theory/index.ts:105`

Entropía de Shannon: H(p) = −Σ p(x)·log p(x). Convención: 0·log 0 = 0.

```ts
export function shannonEntropy<T>(p: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `renyiEntropy`

> Function · `reasoning/information-theory/index.ts:121`

Entropía de Rényi de orden `alpha` (α ≥ 0): H_α(p) = 1/(1−α)·log Σ p(x)^α.
Límites: α=0 → max-entropy, α=1 → Shannon, α=2 → colisión, α→∞ → min-entropy.

```ts
export function renyiEntropy<T>(p: Distribution<T>, alpha: number, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `alpha` | `number` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `minEntropy`

> Function · `reasoning/information-theory/index.ts:138`

Min-entropy: −log max_x p(x). Mide la peor predictibilidad en un solo intento.

```ts
export function minEntropy<T>(p: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `maxEntropy`

> Function · `reasoning/information-theory/index.ts:149`

Max-entropy (Hartley): log|soporte(p)|, el logaritmo del tamaño del soporte estricto.

```ts
export function maxEntropy<T>(p: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `collisionEntropy`

> Function · `reasoning/information-theory/index.ts:157`

Entropía de colisión: Rényi α=2 = −log Σ p(x)². Mide la probabilidad de dos muestras iguales.

```ts
export function collisionEntropy<T>(p: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `klDivergence`

> Function · `reasoning/information-theory/index.ts:172`

Divergencia KL: KL(p ‖ q) = Σ p(x)·log(p(x)/q(x)). Devuelve +∞ si p(x)>0 y q(x)=0.

```ts
export function klDivergence<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `q` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `jsDivergence`

> Function · `reasoning/information-theory/index.ts:185`

Divergencia Jensen-Shannon: JS(p,q) = ½ KL(p ‖ m) + ½ KL(q ‖ m), m = ½(p+q). Simétrica, ∈ [0, log 2].

```ts
export function jsDivergence<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `q` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `tvDistance`

> Function · `reasoning/information-theory/index.ts:196`

Distancia de variación total: TV(p,q) = ½ Σ |p(x) − q(x)|. ∈ [0, 1].

```ts
export function tvDistance<T>(p: Distribution<T>, q: Distribution<T>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `q` | `Distribution<T>` | no |  |

### Returns

`number` — 


## `hellingerDistance`

> Function · `reasoning/information-theory/index.ts:208`

Distancia de Hellinger: H(p,q) = (1/√2)·√(Σ (√p(x) − √q(x))²). ∈ [0, 1]; 0 ⟺ p = q; 1 ⟺ soportes disjuntos.

```ts
export function hellingerDistance<T>(p: Distribution<T>, q: Distribution<T>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `q` | `Distribution<T>` | no |  |

### Returns

`number` — 


## `crossEntropy`

> Function · `reasoning/information-theory/index.ts:227`

Cross-entropía: H(p,q) = −Σ p(x)·log q(x) = H(p) + KL(p ‖ q). Devuelve +∞ si p(x)>0 y q(x)=0.

```ts
export function crossEntropy<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `Distribution<T>` | no |  |
| `q` | `Distribution<T>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `jointToMarginals`

> Function · `reasoning/information-theory/index.ts:244`

Proyecta la distribución conjunta `j` sobre cada eje, devolviendo las marginales `X` e `Y`.

```ts
export function jointToMarginals<X, Y>(j: Joint<X, Y>):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `j` | `Joint<X, Y>` | no |  |

### Returns

`{ X: Distribution<X>; Y: Distribution<Y> }` — 


## `mutualInformation`

> Function · `reasoning/information-theory/index.ts:267`

Información mutua I(X;Y) = Σ p(x,y)·log(p(x,y)/(p(x)·p(y))) = H(X) + H(Y) − H(X,Y).

```ts
export function mutualInformation<X, Y>(j: Joint<X, Y>, base: LogBase = 2): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `j` | `Joint<X, Y>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `conditionalEntropy`

> Function · `reasoning/information-theory/index.ts:284`

Entropía condicional H(X|Y) o H(Y|X) según `condOn`. H(X|Y) = H(X,Y) − H(Y) ≥ 0.

```ts
export function conditionalEntropy<X, Y>( j: Joint<X, Y>, condOn: 'X' | 'Y', base: LogBase = 2, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `j` | `Joint<X, Y>` | no |  |
| `condOn` | `'X' \| 'Y'` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`number` — 


## `chainRule`

> Function · `reasoning/information-theory/index.ts:301`

Devuelve los cuatro escalares {hX, hY, hXY, iXY} de la regla de la cadena.
Verifica: H(X,Y) = H(X) + H(Y) − I(X;Y).

```ts
export function chainRule<X, Y>( j: Joint<X, Y>, base: LogBase = 2, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `j` | `Joint<X, Y>` | no |  |
| `base` | `LogBase` | yes |  |

### Returns

`{ hX: number; hY: number; hXY: number; iXY: number }` — 

