# `solver/cdcl-v2-incremental/types.ts`

Tipos públicos del solver CDCL incremental. La diferencia conceptual con `solveCDCLv2` (one-shot) es que aquí el solver es un objeto vivo: se le agregan cláusulas, se llama `solve()` varias veces, y mantiene su pool de cláusulas aprendidas + heurísticas entre llamadas. Los `assumptions` son literales que se asumen `true` para una única query. Si la query es UNSAT bajo esas asumptions, se devuelve el subconjunto `failedAssumptions` que causó el conflicto (subset minimal del prefix derivado en O(|trail|)). Eso es la base de MUS extraction y debugging.

## Contents

- [`IncrementalSolveResult`](#incrementalsolveresult) — Interface
- [`IncrementalStats`](#incrementalstats) — Interface
- [`SolverSummary`](#solversummary) — Interface
- [`IncrementalSolverOptions`](#incrementalsolveroptions) — Interface

## `IncrementalSolveResult`

> Interface · `solver/cdcl-v2-incremental/types.ts:12`

```ts
export interface IncrementalSolveResult
```


## `IncrementalStats`

> Interface · `solver/cdcl-v2-incremental/types.ts:25`

```ts
export interface IncrementalStats
```


## `SolverSummary`

> Interface · `solver/cdcl-v2-incremental/types.ts:38`

```ts
export interface SolverSummary
```


## `IncrementalSolverOptions`

> Interface · `solver/cdcl-v2-incremental/types.ts:51`

```ts
export interface IncrementalSolverOptions
```

