# `reasoning/topology/index.ts`

============================================================ ST Topology — Complejos simpliciales y homología ============================================================ Implementa complejos simpliciales abstractos y el cómputo de su homología sobre coeficientes en Z/2 y en Z. Calcula característica de Euler, números de Betti y factores invariantes (torsión). Convenciones:   • Un simplex se representa como una lista ordenada estrictamente     creciente de vértices (índices enteros no negativos). La clave     canónica es `v0,v1,...,vk`.   • Un complejo es cerrado bajo caras: `addSimplex(K, s)` añade `s`     y todas sus subcaras al complejo.   • Orientación inducida: la orientación canónica del k-simplex     `[v_0,...,v_k]` es la dada por el orden creciente. La cara     que omite el vértice i-ésimo tiene signo `(-1)^i` (coeficientes Z)     y se usa el conteo de paridad de inversiones para reordenar.   • Sobre Z/2 los signos no importan y el operador borde es lineal     mod 2. Resultados clásicos verificados en tests:   • Triángulo (1-borde): χ = 0.   • Esfera S^2 (borde de tetraedro): β = [1,0,1], χ = 2.   • Toro T²: β_{Z/2} = [1,2,1], χ = 0.   • Plano proyectivo RP²: β_{Z/2} = [1,1,1], β_Z = [1,0,0]     con torsión Z/2 en dimensión 1. ------------------------------------------------------------ Tipos ------------------------------------------------------------ Un simplex es la lista ordenada ascendente de sus vértices.

## Contents

- [`Simplex`](#simplex) — Type
- [`SignedSimplex`](#signedsimplex) — Interface
- [`SimplicialComplex`](#simplicialcomplex) — Interface
- [`HomologyResult`](#homologyresult) — Interface
- [`makeComplex`](#makecomplex) — Function
- [`addSimplex`](#addsimplex) — Function
- [`faces`](#faces) — Function
- [`boundaryZ2`](#boundaryz2) — Function
- [`boundaryZ`](#boundaryz) — Function
- [`dimension`](#dimension) — Function
- [`fVector`](#fvector) — Function
- [`eulerCharacteristic`](#eulercharacteristic) — Function
- [`rankBoundaryZ2`](#rankboundaryz2) — Function
- [`bettiNumberZ2`](#bettinumberz2) — Function
- [`smithNormalForm`](#smithnormalform) — Function
- [`bettiNumberZ`](#bettinumberz) — Function
- [`torsionZ`](#torsionz) — Function
- [`nSimplex`](#nsimplex) — Function
- [`spheres`](#spheres) — Function
- [`torus2`](#torus2) — Function
- [`projectivePlane`](#projectiveplane) — Function
- [`kleinBottle`](#kleinbottle) — Function
- [`computeHomology`](#computehomology) — Function

## `Simplex`

> Type · `reasoning/topology/index.ts:34`

```ts
export type Simplex = number[];
```


## `SignedSimplex`

> Interface · `reasoning/topology/index.ts:37`

```ts
export interface SignedSimplex
```


## `SimplicialComplex`

> Interface · `reasoning/topology/index.ts:45`

```ts
export interface SimplicialComplex
```


## `HomologyResult`

> Interface · `reasoning/topology/index.ts:52`

```ts
export interface HomologyResult
```


## `makeComplex`

> Function · `reasoning/topology/index.ts:91`

```ts
export function makeComplex(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `addSimplex`

> Function · `reasoning/topology/index.ts:100`

```ts
export function addSimplex(K: SimplicialComplex, s: Simplex): void
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `s` | `Simplex` | no |  |

### Returns

`void` — 


## `faces`

> Function · `reasoning/topology/index.ts:139`

```ts
export function faces(s: Simplex): Simplex[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `Simplex` | no |  |

### Returns

`Simplex[]` — 


## `boundaryZ2`

> Function · `reasoning/topology/index.ts:156`

```ts
export function boundaryZ2(simplex: Simplex): Simplex[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `simplex` | `Simplex` | no |  |

### Returns

`Simplex[]` — 


## `boundaryZ`

> Function · `reasoning/topology/index.ts:162`

```ts
export function boundaryZ(simplex: Simplex): SignedSimplex[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `simplex` | `Simplex` | no |  |

### Returns

`SignedSimplex[]` — 


## `dimension`

> Function · `reasoning/topology/index.ts:183`

```ts
export function dimension(K: SimplicialComplex): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |

### Returns

`number` — 


## `fVector`

> Function · `reasoning/topology/index.ts:188`

```ts
export function fVector(K: SimplicialComplex): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |

### Returns

`number[]` — 


## `eulerCharacteristic`

> Function · `reasoning/topology/index.ts:197`

```ts
export function eulerCharacteristic(K: SimplicialComplex): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |

### Returns

`number` — 


## `rankBoundaryZ2`

> Function · `reasoning/topology/index.ts:301`

```ts
export function rankBoundaryZ2(K: SimplicialComplex, dim: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `dim` | `number` | no |  |

### Returns

`number` — 


## `bettiNumberZ2`

> Function · `reasoning/topology/index.ts:310`

```ts
export function bettiNumberZ2(K: SimplicialComplex, dim: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `dim` | `number` | no |  |

### Returns

`number` — 


## `smithNormalForm`

> Function · `reasoning/topology/index.ts:367`

```ts
export function smithNormalForm(matrix: number[][]):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `matrix` | `number[][]` | no |  |

### Returns

`{   snf: number[][];   rankIm: number;   rankKer: number;   invariants: number[]; }` — 


## `bettiNumberZ`

> Function · `reasoning/topology/index.ts:580`

```ts
export function bettiNumberZ(K: SimplicialComplex, dim: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `dim` | `number` | no |  |

### Returns

`number` — 


## `torsionZ`

> Function · `reasoning/topology/index.ts:594`

```ts
export function torsionZ(K: SimplicialComplex, dim: number): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `dim` | `number` | no |  |

### Returns

`number[]` — 


## `nSimplex`

> Function · `reasoning/topology/index.ts:608`

```ts
export function nSimplex(n: number): SimplicialComplex
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`SimplicialComplex` — 


## `spheres`

> Function · `reasoning/topology/index.ts:619`

```ts
export function spheres(n: number): SimplicialComplex
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`SimplicialComplex` — 


## `torus2`

> Function · `reasoning/topology/index.ts:644`

```ts
export function torus2(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `projectivePlane`

> Function · `reasoning/topology/index.ts:665`

```ts
export function projectivePlane(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `kleinBottle`

> Function · `reasoning/topology/index.ts:691`

```ts
export function kleinBottle(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `computeHomology`

> Function · `reasoning/topology/index.ts:728`

```ts
export function computeHomology( K: SimplicialComplex, coefficients: 'Z2' | 'Z' = 'Z2', ): HomologyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `coefficients` | `'Z2' \| 'Z'` | yes |  |

### Returns

`HomologyResult` — 

