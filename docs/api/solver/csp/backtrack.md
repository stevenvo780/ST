# `solver/csp/backtrack.ts`

============================================================ Backtracking search con heurísticas MRV + LCV + AC-3. ============================================================ Algoritmo clásico: asigna variables una a una, propaga restricciones y retrocede en cuanto detecta inconsistencia. Heurísticas:   - MRV  (Minimum Remaining Values): elige la variable cuyo dominio     reducido sea menor. Tie-break: orden canónico.   - LCV  (Least Constraining Value): ordena los valores candidatos     priorizando el que MENOS reduzca los dominios de los vecinos.   - AC-3 inicial: contrae dominios antes de empezar y, si está activo,     re-aplica AC-3 tras cada asignación (maintaining arc consistency). La búsqueda usa un único árbol con copias incrementales de dominios. Para problemas pequeños/medianos (sudoku, n-queens hasta ~20) es suficiente; para escalar, sustituir copias por trailing. ============================================================

## Contents

- [`backtrack`](#backtrack) — Function
- [`allSolutions`](#allsolutions) — Function

## `backtrack`

> Function · `solver/csp/backtrack.ts:122`

Backtracking search. Si `useAC3` está activo, también aplica AC-3
tras cada asignación (Maintaining Arc Consistency, MAC).

Devuelve la primera solución encontrada o `null` si UNSAT. Para
enumerar todas las soluciones, ver `allSolutions`.

```ts
export function backtrack<V, D>(csp: CSP<V, D>, opts: BacktrackOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `csp` | `CSP<V, D>` | no |  |
| `opts` | `BacktrackOptions` | yes |  |

### Returns

`CSPResult<V, D>` — 


## `allSolutions`

> Function · `solver/csp/backtrack.ts:188`

Enumera hasta `maxSolutions` soluciones del CSP. Útil para contar
soluciones simétricas (e.g. n-queens completo, sudoku no-único).

```ts
export function allSolutions<V, D>( csp: CSP<V, D>, maxSolutions = 100, opts: BacktrackOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `csp` | `CSP<V, D>` | no |  |
| `maxSolutions` | `any` | yes |  |
| `opts` | `BacktrackOptions` | yes |  |

### Returns

`Array<Map<V, D>>` — 

