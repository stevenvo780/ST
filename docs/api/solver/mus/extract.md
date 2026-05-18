# `solver/mus/extract.ts`

============================================================ ST MUS — Extracción de Minimal Unsatisfiable Subsets ============================================================ Algoritmos implementados:   - deletion-based (O(n) llamadas SAT)   - insertion-based (variante MARCO-like sencilla)   - QuickXplain (delegado a `quickxplain.ts`) El oráculo SAT es una caja negra: cualquier función que dado un array de cláusulas (literales enteros estilo DIMACS) devuelva `true` si tiene modelo. Sound y completo según el oráculo provisto. También exponemos `extractMUSWithSelectors` para SAT solvers incrementales que devuelven `failedAssumptions`: en ese caso usamos la API del solver para conseguir un núcleo y luego lo minimizamos.

## Contents

- [`extractMUS`](#extractmus) — Function
- [`extractMUSWithSelectors`](#extractmuswithselectors) — Function

## `extractMUS`

> Function · `solver/mus/extract.ts:151`

Extrae un MUS (Minimal Unsatisfiable Subset) del conjunto unsat
`clauses` usando el oráculo SAT provisto.

Convenciones:
  - Las cláusulas son arrays de literales enteros estilo DIMACS
    (positivo / negativo). El motor no inspecciona la semántica;
    todo lo delega al `satOracle`.
  - El conjunto retornado en `mus` son índices sobre `clauses`.
  - Si `clauses` ES satisfacible, devolvemos `mus = []` (no hay
    MUS posible).
  - Determinismo: orden numérico ascendente en todos los recorridos.

```ts
export function extractMUS( clauses: number[][], satOracle: SATOracle, opts: MUSOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `number[][]` | no |  |
| `satOracle` | `SATOracle` | no |  |
| `opts` | `MUSOptions` | yes |  |

### Returns

`MUSResult` — 


## `extractMUSWithSelectors`

> Function · `solver/mus/extract.ts:222`

Variante para SAT solvers incrementales con assumptions.

El patrón típico es:
  - Por cada cláusula original `C_i`, añadir un selector literal
    `s_i` y convertirla en `C_i ∨ ¬s_i` (la cláusula está "off"
    cuando `s_i = false`).
  - Para "activar" un subset, pasar las correspondientes `s_i` como
    assumptions positivas.
  - Cuando el problema es unsat, el solver devuelve
    `failedAssumptions ⊆ assumptions` — el unsat core proyectado
    sobre los selectors.

Esta función toma el `failedAssumptions` como punto de partida y
lo minimiza con un pase deletion-based usando el mismo solver para
garantizar minimalidad por inclusión.

```ts
export function extractMUSWithSelectors( clauses: number[][], selectors: number[], solver: AssumptionSolver, opts: MUSOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `number[][]` | no |  |
| `selectors` | `number[]` | no |  |
| `solver` | `AssumptionSolver` | no |  |
| `opts` | `MUSOptions` | yes |  |

### Returns

`MUSResult` — 

