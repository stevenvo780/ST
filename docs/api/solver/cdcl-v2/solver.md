# `solver/cdcl-v2/solver.ts`

CDCL v2 — Orquestador principal. Combina: 2-watched literals, BCP, 1UIP clause learning, VSIDS, Luby restarts, phase saving, LBD scoring + reducción periódica de aprendidas.

## `solveCDCLv2`

> Function · `solver/cdcl-v2/solver.ts:93`

Resuelve un conjunto de cláusulas CNF y retorna SAT (con modelo) o UNSAT
(con core de variables involucradas en cláusulas vacías derivadas).

Convención DIMACS: variables 1..numVars, literal positivo = variable
asignada a true, negativo = false. Cláusula vacía ⇒ UNSAT inmediato.

```ts
export function solveCDCLv2( inputClauses: ReadonlyArray<Int32Array>, numVars: number, opts?: SolverOptions, ): SolveResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `inputClauses` | `ReadonlyArray<Int32Array>` | no |  |
| `numVars` | `number` | no |  |
| `opts` | `SolverOptions` | yes |  |

### Returns

`SolveResult` — 

