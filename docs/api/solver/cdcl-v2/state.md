# `solver/cdcl-v2/state.ts`

Estado compartido del solver CDCL v2. Una "Clause" es un Int32Array de literales DIMACS (var positiva = true, negativa = false). Var IDs son 1-indexados. Literal `l` se mapea a índice de watch list mediante litToIdx(l, numVars).

## Contents

- [`Clause`](#clause) — Type
- [`Literal`](#literal) — Type
- [`VarValue`](#varvalue) — Type
- [`SolverStatsV2`](#solverstatsv2) — Interface
- [`SatResult`](#satresult) — Interface
- [`UnsatResult`](#unsatresult) — Interface
- [`SolveResult`](#solveresult) — Type
- [`SolverOptions`](#solveroptions) — Interface
- [`NO_CONFLICT`](#no-conflict) — Const
- [`NO_ANTECEDENT`](#no-antecedent) — Const
- [`litToIdx`](#littoidx) — Function
- [`idxToLit`](#idxtolit) — Function

## `Clause`

> Type · `solver/cdcl-v2/state.ts:6`

```ts
export type Clause = Int32Array;
```


## `Literal`

> Type · `solver/cdcl-v2/state.ts:8`

```ts
export type Literal = number;
```


## `VarValue`

> Type · `solver/cdcl-v2/state.ts:11`

Valor de variable: 0 = sin asignar, 1 = true, -1 = false.

```ts
export type VarValue = 0 | 1 | -1;
```


## `SolverStatsV2`

> Interface · `solver/cdcl-v2/state.ts:13`

```ts
export interface SolverStatsV2
```


## `SatResult`

> Interface · `solver/cdcl-v2/state.ts:25`

Resultado SAT con modelo.

```ts
export interface SatResult
```


## `UnsatResult`

> Interface · `solver/cdcl-v2/state.ts:33`

Resultado UNSAT con núcleo (conjunto de variables que entran en cláusulas
aprendidas vacías en el camino al conflicto raíz).

```ts
export interface UnsatResult
```


## `SolveResult`

> Type · `solver/cdcl-v2/state.ts:39`

```ts
export type SolveResult = SatResult | UnsatResult;
```


## `SolverOptions`

> Interface · `solver/cdcl-v2/state.ts:42`

Opciones públicas del solver.

```ts
export interface SolverOptions
```


## `NO_CONFLICT`

> Const · `solver/cdcl-v2/state.ts:60`

Resultado de propagar: -1 si todo OK, o índice de cláusula en conflicto.

```ts
const NO_CONFLICT
```


## `NO_ANTECEDENT`

> Const · `solver/cdcl-v2/state.ts:63`

Sentinela de "sin antecedente" (variable decidida o forzada por preprocessing).

```ts
const NO_ANTECEDENT
```


## `litToIdx`

> Function · `solver/cdcl-v2/state.ts:66`

Convierte literal DIMACS a índice de watch list (rango 0..2*numVars-1).

```ts
export function litToIdx(lit: Literal, numVars: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `Literal` | no |  |
| `numVars` | `number` | no |  |

### Returns

`number` — 


## `idxToLit`

> Function · `solver/cdcl-v2/state.ts:71`

Inversa de litToIdx — útil sólo para debugging.

```ts
export function idxToLit(idx: number, numVars: number): Literal
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `idx` | `number` | no |  |
| `numVars` | `number` | no |  |

### Returns

`Literal` — 

