# `reasoning/optimization/branch-and-bound.ts`

============================================================ Branch-and-bound para Integer Linear Programming. ============================================================ Estrategia clásica:   1. Resolver la relajación LP. Si infactible/unbounded, salir.   2. Si la solución LP es entera en `integerVars`, es óptima      del ILP y devolvemos.   3. Elegir la variable entera más fraccional (closest-to-0.5).      Generar dos subproblemas añadiendo x ≤ ⌊x*⌋ y x ≥ ⌈x*⌉ a      las restricciones originales y descender (DFS con pila).   4. Mantener mejor incumbent (mejor entero encontrado). Podar      cuando el bound de la relajación es peor que el incumbent      (más una tolerancia). Para problemas binarios (variables 0/1) las cotas adicionales son innecesarias porque ya están restringidas por `variableBounds`; aún así, la lógica B&B funciona idéntica. Limitación conocida: no detecta optimalidad por GAP=0 sin explorar toda la rama; el `gap` reportado es relativo al bound del root LP. ============================================================

## Contents

- [`lpRelaxation`](#lprelaxation) — Function
- [`solveILP`](#solveilp) — Function

## `lpRelaxation`

> Function · `reasoning/optimization/branch-and-bound.ts:35`

Genera el LP relajado: descarta integerVars/binaryVars pero
mantiene `variableBounds` (los binarios ya tienen [0,1] ahí).

```ts
export function lpRelaxation(ilp: ILPProblem): LPProblem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ilp` | `ILPProblem` | no |  |

### Returns

`LPProblem` — 


## `solveILP`

> Function · `reasoning/optimization/branch-and-bound.ts:168`

Solver ILP principal. Estrategia DFS con pila explícita.

```ts
export function solveILP(problem: ILPProblem, opts: ILPOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `ILPProblem` | no |  |
| `opts` | `ILPOptions` | yes |  |

### Returns

`ILPSolution` — 

