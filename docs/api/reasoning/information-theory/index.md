# `reasoning/information-theory/index.ts`

============================================================ ST Information Theory — Toolkit de entropías y divergencias ============================================================ Sobre distribuciones simbólicas discretas (`Map<T, number>` con masa total ≈ 1) provee:   • Entropías: Shannon, Rényi(α), min, max, colisión.   • Divergencias: KL, JS, total-variation, Hellinger.   • Información mutua a partir de distribución conjunta.   • Cross-entropy y la relación H(p,q) = H(p) + KL(p ‖ q). Convenciones de borde:   • La probabilidad 0 contribuye 0 a la entropía (lim x·log x = 0).   • KL(p ‖ q) es +∞ si existe x con p(x) > 0 y q(x) = 0.   • La base por defecto del logaritmo es 2 (bits). También se aceptan     'e' (nats), 10 (hartleys/dits) y el alias 'log' = 2.   • Validamos con tolerancia EPS_DEFAULT antes de cualquier cómputo     que asuma normalización. `normalize` no se llama implícitamente     porque queremos que el usuario decida cuándo reescalar. Tipo público: distribución discreta sobre símbolos T.

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

```ts
export type Distribution<T> = Map<T, number>;
```


## `Joint`

> Type · `reasoning/information-theory/index.ts:29`

```ts
export type Joint<X, Y> = Map<[X, Y], number>;
```


## `support`

> Function · `reasoning/information-theory/index.ts:40`

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

> Function · `reasoning/information-theory/index.ts:50`

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

> Function · `reasoning/information-theory/index.ts:61`

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

> Type · `reasoning/information-theory/index.ts:84`

```ts
export type LogBase = 'log' | 'e' | 2 | 10;
```


## `shannonEntropy`

> Function · `reasoning/information-theory/index.ts:105`

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

> Function · `reasoning/information-theory/index.ts:127`

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

> Function · `reasoning/information-theory/index.ts:144`

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

> Function · `reasoning/information-theory/index.ts:155`

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

> Function · `reasoning/information-theory/index.ts:163`

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

> Function · `reasoning/information-theory/index.ts:180`

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

> Function · `reasoning/information-theory/index.ts:194`

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

> Function · `reasoning/information-theory/index.ts:205`

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

> Function · `reasoning/information-theory/index.ts:218`

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

> Function · `reasoning/information-theory/index.ts:238`

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

> Function · `reasoning/information-theory/index.ts:258`

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

> Function · `reasoning/information-theory/index.ts:284`

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

> Function · `reasoning/information-theory/index.ts:302`

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

> Function · `reasoning/information-theory/index.ts:317`

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

