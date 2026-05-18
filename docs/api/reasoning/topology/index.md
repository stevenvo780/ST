# `reasoning/topology/index.ts`

Simplex abstracto: lista ordenada ascendente de vértices (enteros).

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

Simplex abstracto: lista ordenada ascendente de vértices (enteros).

```ts
export type Simplex = number[];
```


## `SignedSimplex`

> Interface · `reasoning/topology/index.ts:37`

Simplex con signo orientado, usado por el operador borde ∂ sobre Z.

```ts
export interface SignedSimplex
```


## `SimplicialComplex`

> Interface · `reasoning/topology/index.ts:47`

Complejo simplicial abstracto.
Internamente los simplices se indexan por dimensión (`k = |s|-1`) y se
almacenan por su clave canónica `v0,v1,...,vk`.

```ts
export interface SimplicialComplex
```


## `HomologyResult`

> Interface · `reasoning/topology/index.ts:58`

Resultado de un cómputo de homología sobre un complejo simplicial.
Incluye números de Betti, característica de Euler y, cuando se trabaja
sobre Z, la torsión por dimensión.

```ts
export interface HomologyResult
```


## `makeComplex`

> Function · `reasoning/topology/index.ts:98`

Crea un complejo simplicial vacío (sin vértices ni simplices).

```ts
export function makeComplex(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `addSimplex`

> Function · `reasoning/topology/index.ts:111`

Añade un simplex `s` y todas sus caras al complejo `K` (cierre hacia abajo).
El simplex se normaliza a orden creciente antes de insertarse.

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

> Function · `reasoning/topology/index.ts:153`

Devuelve las caras directas (codimensión 1) del k-simplex `s`.
Un k-simplex tiene exactamente k+1 caras. Devuelve `[]` para 0-simplices.

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

> Function · `reasoning/topology/index.ts:170`

Operador borde ∂ sobre Z/2 (coeficientes en F₂): lista de caras sin signos.

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

> Function · `reasoning/topology/index.ts:178`

Operador borde ∂ sobre Z: devuelve cada cara con signo `(-1)^i`, donde `i`
es el índice del vértice omitido en el orden canónico del simplex.

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

> Function · `reasoning/topology/index.ts:200`

Dimensión del complejo simplicial (el mayor k tal que K contiene un k-simplex, o -1 si está vacío).

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

> Function · `reasoning/topology/index.ts:208`

f-vector del complejo: `f[i]` = número de i-simplices, para i = 0..dim.

```ts
export function fVector(K: SimplicialComplex): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |

### Returns

`number[]` — 

### Examples

```ts
fVector(nSimplex(2)) // [3, 3, 1] (triángulo lleno)
```


## `eulerCharacteristic`

> Function · `reasoning/topology/index.ts:220`

Característica de Euler: χ = ∑ (-1)^i f_i.
Invariante topológico (S² → 2, T² → 0, RP² → 1).

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

> Function · `reasoning/topology/index.ts:324`

Rango del operador borde ∂_d : C_d → C_{d-1} sobre F₂.

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

> Function · `reasoning/topology/index.ts:334`

Número de Betti β_d sobre Z/2 (F₂).
β_d = dim ker ∂_d − dim im ∂_{d+1} = n_d − rank ∂_d − rank ∂_{d+1}.

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

> Function · `reasoning/topology/index.ts:390`

Forma Normal de Smith sobre Z para una matriz entera.
Devuelve la SNF (diagonal con factores invariantes d₁ | d₂ | … | dᵣ, resto ceros),
el rango (número de pivotes no nulos) y la dimensión del kernel (cols − rankIm).
Algoritmo: reducción iterativa estilo Bareiss/Euclídea sobre filas y columnas.

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

> Function · `reasoning/topology/index.ts:605`

Número de Betti β_d sobre Z (parte libre de la homología H_d).
β_d = rank ker ∂_d − rank im ∂_{d+1}, equivalente a contar copias de Z en H_d.

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

> Function · `reasoning/topology/index.ts:621`

Factores invariantes (> 1) de la torsión de H_d sobre Z.
H_d = Z^{β_d} ⊕ ⊕ᵢ Z/dᵢ, con d₁ | d₂ | … | dₖ, dᵢ > 1.
Ejemplo: RP² tiene torsión [2] en dimensión 1.

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

> Function · `reasoning/topology/index.ts:637`

Complejo del n-simplex completo: todos los subconjuntos no vacíos de {0,…,n}.
`nSimplex(2)` da un triángulo relleno (2-cara incluida), no solo su borde.

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

> Function · `reasoning/topology/index.ts:650`

Triangulación canónica de la esfera S^n (frontera del (n+1)-simplex).
`spheres(2)` = borde del tetraedro: 4 vértices, 6 aristas, 4 triángulos; χ = 2.

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

> Function · `reasoning/topology/index.ts:672`

Triangulación del toro T² (cuadrado 3×3 con identificaciones a b a⁻¹ b⁻¹).
9 vértices, 27 aristas, 18 triángulos. χ = 0, β_{Z/2} = [1,2,1].

```ts
export function torus2(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `projectivePlane`

> Function · `reasoning/topology/index.ts:694`

Triangulación mínima del plano proyectivo real RP² (6 vértices, 15 aristas, 10 triángulos).
β_Z = [1,0,0] con torsión Z/2 en dimensión 1; β_{Z/2} = [1,1,1]; χ = 1.

```ts
export function projectivePlane(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `kleinBottle`

> Function · `reasoning/topology/index.ts:716`

Triangulación de la botella de Klein (cuadrado 3×3 con identificaciones a b a b⁻¹).
9 vértices; χ = 0; β_Z = [1,1,0]; torsión Z/2 en dim 1.

```ts
export function kleinBottle(): SimplicialComplex
```

### Returns

`SimplicialComplex` — 


## `computeHomology`

> Function · `reasoning/topology/index.ts:758`

Cómputo completo de homología de `K` con coeficientes en Z/2 o Z.
Devuelve números de Betti, característica de Euler y (si Z) la torsión por dimensión.

```ts
export function computeHomology( K: SimplicialComplex, coefficients: 'Z2' | 'Z' = 'Z2', ): HomologyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `K` | `SimplicialComplex` | no |  |
| `coefficients` | `'Z2' \| 'Z'` | yes | `'Z2'` para F₂ (defecto) o `'Z'` para coeficientes enteros. |

### Returns

`HomologyResult` — 

