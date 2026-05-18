# `reasoning/game-theory/types.ts`

============================================================ Game theory — Tipos y utilidades de juegos en forma normal ============================================================ Modelo de juego en forma normal (también llamado matriz de pagos) para n jugadores con conjuntos finitos de estrategias puras. Los pagos se almacenan en un layout flat:   payoffs[player][index] = u_player(s_1, ..., s_n) donde `index` es la codificación row-major (lexicográfica) del perfil de estrategias `(s_1, ..., s_n)` usando los tamaños en `strategies`. Esta forma permite manejar uniformemente juegos 2-player NxM y juegos n-player simétricos chicos.

## Contents

- [`NormalFormGame`](#normalformgame) — Interface
- [`MixedStrategy`](#mixedstrategy) — Interface
- [`NashEquilibrium`](#nashequilibrium) — Interface
- [`profileToIndex`](#profiletoindex) — Function
- [`indexToProfile`](#indextoprofile) — Function
- [`totalProfiles`](#totalprofiles) — Function
- [`createGame`](#creategame) — Function
- [`createTwoPlayerGame`](#createtwoplayergame) — Function
- [`payoffOf`](#payoffof) — Function
- [`sumOf`](#sumof) — Function
- [`expectedPayoff`](#expectedpayoff) — Function
- [`expectedPayoffFromDistributions`](#expectedpayofffromdistributions) — Function
- [`pureDistribution`](#puredistribution) — Function
- [`approxEqual`](#approxequal) — Function
- [`vectorsApproxEqual`](#vectorsapproxequal) — Function

## `NormalFormGame`

> Interface · `reasoning/game-theory/types.ts:16`

```ts
export interface NormalFormGame
```


## `MixedStrategy`

> Interface · `reasoning/game-theory/types.ts:25`

```ts
export interface MixedStrategy
```


## `NashEquilibrium`

> Interface · `reasoning/game-theory/types.ts:32`

```ts
export interface NashEquilibrium
```


## `profileToIndex`

> Function · `reasoning/game-theory/types.ts:49`

Convierte un perfil `(s_0, ..., s_{n-1})` a su índice row-major
en `payoffs[player]`. Lanza si el perfil no encaja en `sizes`.

```ts
export function profileToIndex(profile: number[], sizes: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `profile` | `number[]` | no |  |
| `sizes` | `number[]` | no |  |

### Returns

`number` — 


## `indexToProfile`

> Function · `reasoning/game-theory/types.ts:66`

Inversa de `profileToIndex`.

```ts
export function indexToProfile(index: number, sizes: number[]): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `index` | `number` | no |  |
| `sizes` | `number[]` | no |  |

### Returns

`number[]` — 


## `totalProfiles`

> Function · `reasoning/game-theory/types.ts:81`

Producto cartesiano de tamaños — número total de perfiles.

```ts
export function totalProfiles(sizes: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sizes` | `number[]` | no |  |

### Returns

`number` — 


## `createGame`

> Function · `reasoning/game-theory/types.ts:90`

Construye un juego en forma normal validando dimensiones.

```ts
export function createGame( players: number, strategies: number[], payoffs: number[][], ): NormalFormGame
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `players` | `number` | no |  |
| `strategies` | `number[]` | no |  |
| `payoffs` | `number[][]` | no |  |

### Returns

`NormalFormGame` — 


## `createTwoPlayerGame`

> Function · `reasoning/game-theory/types.ts:117`

Construye un juego 2-player a partir de dos matrices NxM.
`payoff1[i][j]` = utilidad del jugador 1 cuando juega i y el 2 juega j.
`payoff2[i][j]` = utilidad del jugador 2.

```ts
export function createTwoPlayerGame(payoff1: number[][], payoff2: number[][]): NormalFormGame
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `payoff1` | `number[][]` | no |  |
| `payoff2` | `number[][]` | no |  |

### Returns

`NormalFormGame` — 


## `payoffOf`

> Function · `reasoning/game-theory/types.ts:144`

Lectura ergonómica del pago: u_player(profile).

```ts
export function payoffOf(game: NormalFormGame, player: number, profile: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `player` | `number` | no |  |
| `profile` | `number[]` | no |  |

### Returns

`number` — 


## `sumOf`

> Function · `reasoning/game-theory/types.ts:154`

Suma de un vector — útil para chequeos de simplex.

```ts
export function sumOf(xs: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `number[]` | no |  |

### Returns

`number` — 


## `expectedPayoff`

> Function · `reasoning/game-theory/types.ts:161`

Pago esperado del jugador en un perfil mixto.

```ts
export function expectedPayoff( game: NormalFormGame, player: number, mixed: MixedStrategy[], ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `player` | `number` | no |  |
| `mixed` | `MixedStrategy[]` | no |  |

### Returns

`number` — 


## `expectedPayoffFromDistributions`

> Function · `reasoning/game-theory/types.ts:170`

```ts
export function expectedPayoffFromDistributions( game: NormalFormGame, player: number, dists: number[][], ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `player` | `number` | no |  |
| `dists` | `number[][]` | no |  |

### Returns

`number` — 


## `pureDistribution`

> Function · `reasoning/game-theory/types.ts:196`

Distribución pura: masa 1 en `s`, 0 en el resto.

```ts
export function pureDistribution(s: number, size: number): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `number` | no |  |
| `size` | `number` | no |  |

### Returns

`number[]` — 


## `approxEqual`

> Function · `reasoning/game-theory/types.ts:203`

Dos números reales aproximadamente iguales.

```ts
export function approxEqual(a: number, b: number, tol = 1e-9): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `number` | no |  |
| `b` | `number` | no |  |
| `tol` | `any` | yes |  |

### Returns

`boolean` — 


## `vectorsApproxEqual`

> Function · `reasoning/game-theory/types.ts:208`

Igualdad punto a punto bajo tolerancia.

```ts
export function vectorsApproxEqual(a: number[], b: number[], tol = 1e-9): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `number[]` | no |  |
| `b` | `number[]` | no |  |
| `tol` | `any` | yes |  |

### Returns

`boolean` — 

