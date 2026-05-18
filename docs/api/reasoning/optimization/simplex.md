# `reasoning/optimization/simplex.ts`

============================================================ Simplex de dos fases sobre tableau denso. ============================================================ Implementa el método simplex revisado (forma tableau) con Bland's rule para evitar ciclos. Fase 1 construye una solución básica factible (BFS) introduciendo variables artificiales y minimizando su suma; si el óptimo de Fase 1 no es cero, el problema original es infactible. Fase 2 optimiza la función objetivo real partiendo de la BFS obtenida. Convenciones internas (DESPUÉS de pasar por `standardForm`):   - Maximizar c·x s.t. Ax ≤ b, x ≥ 0.   - Añadimos slacks s_i para cada restricción: Ax + Is = b.   - Si algún b_i < 0, multiplicamos la fila por -1 (invierte el     operador). Tras ese arreglo, si una fila no es naturalmente     básica (slack negativo no nos sirve), introducimos artificial     y entramos a Fase 1. El tableau se almacena como Float64Array por filas en un arreglo de length (m+1) * (n+m+a+1), donde m = #restricciones, n = #vars originales, a = #artificiales y la última columna es el RHS. La fila final es el costo reducido (objetivo). Tolerancia numérica: epsilon configurable. Bland's rule selecciona la columna entrante de menor índice con costo reducido > 0 (estrictamente). Esto garantiza terminación finita aunque sea más lento que Dantzig en problemas degenerados. ============================================================

## `solveLP`

> Function · `reasoning/optimization/simplex.ts:317`

Solver LP principal. Acepta el problema en cualquier forma
(min/max, ≤/≥/=, con o sin cotas), lo lleva a standardForm y
ejecuta simplex de dos fases.

```ts
export function solveLP(problem: LPProblem, opts: LPOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `LPProblem` | no |  |
| `opts` | `LPOptions` | yes |  |

### Returns

`LPSolution` — 

