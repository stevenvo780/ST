# `runtime/bdd/manager.ts`

============================================================ ROBDD — Manager con unique table + apply algorithm ============================================================ Implementación clásica de Bryant (1986):   - Unique table: garantiza canonicidad estructural   - Apply: combinador genérico para AND/OR/XOR/... con memoización   - ITE (If-Then-Else): operador universal, reduce las binarias   - Quantificadores ∃/∀ implementados sobre apply   - Sat counting con bigint para evitar overflow en >53 vars Convención: el orden de variables se respeta en todo el DAG. Si en una rama la variable de un hijo tiene índice de orden <= que el padre, hay un bug — el invariante de "ordered" se mantiene porque apply siempre desciende por la variable de menor orden.

## `BDDManager`

> Class · `runtime/bdd/manager.ts:43`

```ts
export class BDDManager
```

