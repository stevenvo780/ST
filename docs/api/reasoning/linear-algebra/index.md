# `reasoning/linear-algebra/index.ts`

Matriz densa de números reales representada como array de filas.

## Contents

- [`Matrix`](#matrix) — Type
- [`Vector`](#vector) — Type
- [`mat`](#mat) — Function
- [`zeros`](#zeros) — Function
- [`ones`](#ones) — Function
- [`identity`](#identity) — Function
- [`diagonal`](#diagonal) — Function
- [`clone`](#clone) — Function
- [`transpose`](#transpose) — Function
- [`add`](#add) — Function
- [`sub`](#sub) — Function
- [`scalarMul`](#scalarmul) — Function
- [`multiply`](#multiply) — Function
- [`matVec`](#matvec) — Function
- [`dot`](#dot) — Function
- [`norm`](#norm) — Function
- [`normalize`](#normalize) — Function
- [`cross`](#cross) — Function
- [`rref`](#rref) — Function
- [`rank`](#rank) — Function
- [`determinant`](#determinant) — Function
- [`inverse`](#inverse) — Function
- [`solve`](#solve) — Function
- [`leastSquares`](#leastsquares) — Function
- [`LU`](#lu) — Interface
- [`decomposeLU`](#decomposelu) — Function
- [`permutationMatrix`](#permutationmatrix) — Function
- [`QR`](#qr) — Interface
- [`decomposeQR`](#decomposeqr) — Function
- [`SVD`](#svd) — Interface
- [`decomposeSVD`](#decomposesvd) — Function
- [`powerIteration`](#poweriteration) — Function
- [`eigenvalues`](#eigenvalues) — Function
- [`eigenvectors`](#eigenvectors) — Function
- [`nullSpace`](#nullspace) — Function
- [`columnSpace`](#columnspace) — Function
- [`gramSchmidt`](#gramschmidt) — Function
- [`isLinearlyIndependent`](#islinearlyindependent) — Function

## `Matrix`

> Type · `reasoning/linear-algebra/index.ts:3`

Matriz densa de números reales representada como array de filas.

```ts
export type Matrix = number[][];
```


## `Vector`

> Type · `reasoning/linear-algebra/index.ts:5`

Vector de números reales representado como array plano.

```ts
export type Vector = number[];
```


## `mat`

> Function · `reasoning/linear-algebra/index.ts:65`

Crea una matriz `rows × cols` rellena con `fill` (default 0).

```ts
export function mat(rows: number, cols: number, fill = 0): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rows` | `number` | no |  |
| `cols` | `number` | no |  |
| `fill` | `any` | yes |  |

### Returns

`Matrix` — 


## `zeros`

> Function · `reasoning/linear-algebra/index.ts:77`

Crea una matriz de ceros de dimensión `rows × cols`.

```ts
export function zeros(rows: number, cols: number): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rows` | `number` | no |  |
| `cols` | `number` | no |  |

### Returns

`Matrix` — 


## `ones`

> Function · `reasoning/linear-algebra/index.ts:82`

Crea una matriz de unos de dimensión `rows × cols`.

```ts
export function ones(rows: number, cols: number): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rows` | `number` | no |  |
| `cols` | `number` | no |  |

### Returns

`Matrix` — 


## `identity`

> Function · `reasoning/linear-algebra/index.ts:87`

Crea la matriz identidad `n × n`.

```ts
export function identity(n: number): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`Matrix` — 


## `diagonal`

> Function · `reasoning/linear-algebra/index.ts:96`

Crea una matriz diagonal con `entries` en la diagonal principal.

```ts
export function diagonal(entries: number[]): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `entries` | `number[]` | no |  |

### Returns

`Matrix` — 


## `clone`

> Function · `reasoning/linear-algebra/index.ts:106`

Devuelve una copia profunda de la matriz `M`.

```ts
export function clone(M: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `transpose`

> Function · `reasoning/linear-algebra/index.ts:118`

Devuelve la transpuesta de la matriz `M`.

```ts
export function transpose(M: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `add`

> Function · `reasoning/linear-algebra/index.ts:139`

Suma elemento a elemento de dos matrices con la misma forma.

```ts
export function add(a: Matrix, b: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Matrix` | no |  |
| `b` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `sub`

> Function · `reasoning/linear-algebra/index.ts:151`

Resta elemento a elemento de dos matrices con la misma forma.

```ts
export function sub(a: Matrix, b: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Matrix` | no |  |
| `b` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `scalarMul`

> Function · `reasoning/linear-algebra/index.ts:163`

Multiplica todos los elementos de `M` por el escalar `c`.

```ts
export function scalarMul(c: number, M: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `number` | no |  |
| `M` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `multiply`

> Function · `reasoning/linear-algebra/index.ts:175`

Producto matricial estándar `a × b`. Lanza si las dimensiones son incompatibles.

```ts
export function multiply(a: Matrix, b: Matrix): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Matrix` | no |  |
| `b` | `Matrix` | no |  |

### Returns

`Matrix` — 


## `matVec`

> Function · `reasoning/linear-algebra/index.ts:197`

Multiplica la matriz `M` por el vector `v` (M·v).

```ts
export function matVec(M: Matrix, v: Vector): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |
| `v` | `Vector` | no |  |

### Returns

`Vector` — 


## `dot`

> Function · `reasoning/linear-algebra/index.ts:214`

Producto punto (escalar) de dos vectores de igual longitud.

```ts
export function dot(a: Vector, b: Vector): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Vector` | no |  |
| `b` | `Vector` | no |  |

### Returns

`number` — 


## `norm`

> Function · `reasoning/linear-algebra/index.ts:226`

Norma euclidiana (L2) del vector `v`.

```ts
export function norm(v: Vector): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `Vector` | no |  |

### Returns

`number` — 


## `normalize`

> Function · `reasoning/linear-algebra/index.ts:236`

Devuelve el vector `v` escalado a norma unitaria. Lanza si `v` es el vector cero.

```ts
export function normalize(v: Vector): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `Vector` | no |  |

### Returns

`Vector` — 


## `cross`

> Function · `reasoning/linear-algebra/index.ts:249`

Producto vectorial de `a` × `b` en R³. Lanza si alguno no tiene exactamente 3 componentes.

```ts
export function cross(a: Vector, b: Vector): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Vector` | no |  |
| `b` | `Vector` | no |  |

### Returns

`Vector` — 


## `rref`

> Function · `reasoning/linear-algebra/index.ts:263`

Reduce la matriz a forma escalonada reducida (RREF) por Gauss-Jordan. Devuelve la matriz reducida, el rango y las columnas pivot.

```ts
export function rref(M: Matrix):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`{ reduced: Matrix; rank: number; pivotCols: number[] }` — 


## `rank`

> Function · `reasoning/linear-algebra/index.ts:316`

Calcula el rango de la matriz `M` mediante RREF.

```ts
export function rank(M: Matrix): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`number` — 


## `determinant`

> Function · `reasoning/linear-algebra/index.ts:321`

Calcula el determinante de la matriz cuadrada `M` por eliminación de Gauss con pivoteo parcial.

```ts
export function determinant(M: Matrix): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`number` — 


## `inverse`

> Function · `reasoning/linear-algebra/index.ts:367`

Devuelve la inversa de la matriz cuadrada `M`, o `null` si es singular.

```ts
export function inverse(M: Matrix): Matrix | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`Matrix \| null` — 


## `solve`

> Function · `reasoning/linear-algebra/index.ts:399`

Resuelve el sistema lineal Ax = b. Devuelve `null` si no tiene solución única (sistema indeterminado o incompatible).

```ts
export function solve(A: Matrix, b: Vector): Vector | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Matrix` | no |  |
| `b` | `Vector` | no |  |

### Returns

`Vector \| null` — 


## `leastSquares`

> Function · `reasoning/linear-algebra/index.ts:429`

Calcula la solución de mínimos cuadrados de Ax ≈ b vía ecuaciones normales (AᵀAx = Aᵀb).

```ts
export function leastSquares(A: Matrix, b: Vector): Vector
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `A` | `Matrix` | no |  |
| `b` | `Vector` | no |  |

### Returns

`Vector` — 


## `LU`

> Interface · `reasoning/linear-algebra/index.ts:448`

Resultado de una descomposición LU con pivoteo parcial: L, U y la permutación P.

```ts
export interface LU
```


## `decomposeLU`

> Function · `reasoning/linear-algebra/index.ts:455`

Descomposición LU con pivoteo parcial de la matriz cuadrada `M`. Devuelve `null` si es singular.

```ts
export function decomposeLU(M: Matrix): LU | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`LU \| null` — 


## `permutationMatrix`

> Function · `reasoning/linear-algebra/index.ts:506`

Construye la matriz de permutación correspondiente al vector de permutación `P`.

```ts
export function permutationMatrix(P: number[]): Matrix
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `P` | `number[]` | no |  |

### Returns

`Matrix` — 


## `QR`

> Interface · `reasoning/linear-algebra/index.ts:516`

Resultado de una descomposición QR: Q ortogonal y R triangular superior.

```ts
export interface QR
```


## `decomposeQR`

> Function · `reasoning/linear-algebra/index.ts:522`

Descomposición QR por Gram-Schmidt para matrices con `rows >= cols`.

```ts
export function decomposeQR(M: Matrix): QR
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`QR` — 


## `SVD`

> Interface · `reasoning/linear-algebra/index.ts:561`

Resultado de una descomposición SVD: matrices U, V y valores singulares S.

```ts
export interface SVD
```


## `decomposeSVD`

> Function · `reasoning/linear-algebra/index.ts:636`

Descomposición SVD de `M` vía eigendescomposición de AᵀA con el algoritmo de Jacobi.

```ts
export function decomposeSVD(M: Matrix, maxIter = 200): SVD
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |
| `maxIter` | `any` | yes |  |

### Returns

`SVD` — 


## `powerIteration`

> Function · `reasoning/linear-algebra/index.ts:678`

Calcula el autovalor dominante y su autovector por el método de la potencia.

```ts
export function powerIteration( M: Matrix, opts: { maxIter?: number; eps?: number } = {}, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |
| `opts` | `{ maxIter?: number; eps?: number }` | yes |  |

### Returns

`{ eigenvalue: number; eigenvector: Vector }` — 


## `eigenvalues`

> Function · `reasoning/linear-algebra/index.ts:740`

Calcula los autovalores reales de la matriz cuadrada `M` (QR iterativo para asimétricas, Jacobi para simétricas).

```ts
export function eigenvalues(M: Matrix, opts: { maxIter?: number; eps?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |
| `opts` | `{ maxIter?: number; eps?: number }` | yes |  |

### Returns

`number[]` — 


## `eigenvectors`

> Function · `reasoning/linear-algebra/index.ts:792`

Calcula autovalores y autovectores de la matriz simétrica `M` por el algoritmo de Jacobi.

```ts
export function eigenvectors( M: Matrix, opts: { maxIter?: number; eps?: number } = {}, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |
| `opts` | `{ maxIter?: number; eps?: number }` | yes |  |

### Returns

`{ values: number[]; vectors: Matrix }` — 


## `nullSpace`

> Function · `reasoning/linear-algebra/index.ts:825`

Devuelve una base del espacio nulo (kernel) de `M` usando RREF.

```ts
export function nullSpace(M: Matrix): Vector[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`Vector[]` — 


## `columnSpace`

> Function · `reasoning/linear-algebra/index.ts:853`

Devuelve una base del espacio columna (imagen) de `M` como las columnas pivot del original.

```ts
export function columnSpace(M: Matrix): Vector[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `M` | `Matrix` | no |  |

### Returns

`Vector[]` — 


## `gramSchmidt`

> Function · `reasoning/linear-algebra/index.ts:868`

Ortogonaliza y normaliza la lista de vectores mediante el proceso de Gram-Schmidt. Descarta vectores linealmente dependientes.

```ts
export function gramSchmidt(vectors: Vector[]): Vector[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |

### Returns

`Vector[]` — 


## `isLinearlyIndependent`

> Function · `reasoning/linear-algebra/index.ts:903`

Comprueba si la lista de vectores es linealmente independiente verificando que el rango de la matriz columna sea igual a su cantidad.

```ts
export function isLinearlyIndependent(vectors: Vector[]): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `vectors` | `Vector[]` | no |  |

### Returns

`boolean` — 

