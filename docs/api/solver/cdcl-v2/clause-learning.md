# `solver/cdcl-v2/clause-learning.ts`

First-UIP Conflict Analysis — Marques-Silva & Sakallah (GRASP, 1996). Recorremos hacia atrás el grafo de implicaciones desde la cláusula en conflicto hasta hallar el primer Unique Implication Point: el único literal del nivel de decisión actual que queda en la "frontera" del corte. Eso produce la cláusula aprendida mínima respecto al esquema 1UIP.

## Contents

- [`AnalysisResult`](#analysisresult) — Interface
- [`ConflictContext`](#conflictcontext) — Interface
- [`analyzeConflict1UIP`](#analyzeconflict1uip) — Function

## `AnalysisResult`

> Interface · `solver/cdcl-v2/clause-learning.ts:9`

```ts
export interface AnalysisResult
```


## `ConflictContext`

> Interface · `solver/cdcl-v2/clause-learning.ts:19`

Función mínima requerida del solver para acceder al antecedente de cada lit.

```ts
export interface ConflictContext
```


## `analyzeConflict1UIP`

> Function · `solver/cdcl-v2/clause-learning.ts:42`

Analiza un conflicto usando el esquema 1UIP.

```ts
export function analyzeConflict1UIP(conflictCi: number, ctx: ConflictContext): AnalysisResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `conflictCi` | `number` | no | cláusula que entró en conflicto durante BCP. |
| `ctx` | `ConflictContext` | no | contexto inmutable del solver (trail, levels, antecedents). |

### Returns

`AnalysisResult` — cláusula aprendida + nivel de backtrack + variables bumpeadas.

Si retorna learned.length === 0 y btLevel === -1, el solver debe interpretar
UNSAT raíz (conflicto en nivel 0).

