# `solver/mus/quickxplain.ts`

============================================================ ST MUS — QuickXplain (Junker 2004) ============================================================ Divide-y-vencerás para encontrar un MUS dentro de un conjunto `C = B ∪ U` donde `B` (background) ya se sabe consistente y queremos hallar el subconjunto mínimo de `U` que es responsable de la inconsistencia (junto con `B`). Pseudocódigo (versión simétrica clásica):   QX(B, ∆, C):     if ∆ ≠ ∅ ∧ ¬sat(B):      return ∅              // ∆ no necesario     if |C| = 1:               return C              // C es minimal     C1, C2 = split(C)     ∆1 = QX(B ∪ C1, C1, C2)     ∆2 = QX(B ∪ ∆1, ∆1, C1)     return ∆1 ∪ ∆2 Cuidado: en la primera llamada `∆` debe ser ≠ ∅ para no caer en el short-circuit. Convención típica: pasar `∆ = C` en el wrap externo. Complejidad: O(2k + 2k · log(n/k)) llamadas SAT, donde n = |C| y k = |MUS|. Muy buena cuando k ≪ n.

## `quickxplain`

> Function · `solver/mus/quickxplain.ts:98`

Ejecuta QuickXplain sobre el conjunto de cláusulas indexadas y
devuelve los índices del MUS hallado más el conteo de llamadas SAT.

```ts
export function quickxplain( clauses: number[][], oracle: SATOracle, maxIterations: number, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `number[][]` | no |  |
| `oracle` | `SATOracle` | no |  |
| `maxIterations` | `number` | no |  |

### Returns

`{ mus: number[]; satCalls: number }` — 

