# `solver/cdcl-v2-incremental/solver.ts`

CDCL incremental — solver vivo que mantiene aprendizaje entre llamadas. A diferencia de solveCDCLv2 (one-shot, todas las estructuras se crean en cada invocación), aquí el solver es un objeto persistente que soporta:   - addClause(literals) — añade cláusula permanente, integra en watches.   - newVar() — declara una variable nueva creciendo todas las estructuras.   - push() / pop() — checkpoint y rollback (descarta cláusulas + aprendidas     añadidas tras el push; conserva phase saving y VSIDS como caching útil).   - solve(assumptions?) — resuelve bajo el conjunto de assumptions     (literales asumidos true sólo para esta query). Devuelve modelo o     failedAssumptions/unsatCore. Bases internas reutilizadas conceptualmente del solver one-shot:   - 2-watched literals para BCP.   - 1UIP conflict analysis (analyzeConflict1UIP de cdcl-v2).   - VSIDS, phase saving, Luby restarts.   - LBD scoring + reducción periódica de aprendidas. La maquinaria incremental clave es el manejo de assumptions: tras backtrack al nivel 0, cada assumption se introduce como decisión en su propio nivel. Si BCP detecta conflicto al asumir, derivamos el unsatCore vía análisis del conflicto + intersección con el conjunto de assumptions enqueued.

## `IncrementalCDCL`

> Class · `solver/cdcl-v2-incremental/solver.ts:62`

```ts
export class IncrementalCDCL
```

