# `runtime/streaming/types.ts`

============================================================ ST Streaming — Tipos públicos del API de evaluación incremental ============================================================

## Contents

- [`EvalResult`](#evalresult) — Type
- [`StreamEvent`](#streamevent) — Type
- [`ProfileName`](#profilename) — Type

## `EvalResult`

> Type · `runtime/streaming/types.ts:8`

Resultado de evaluación expuesto por el streaming API. Alias de RunResult.

```ts
export type EvalResult = RunResult;
```


## `StreamEvent`

> Type · `runtime/streaming/types.ts:16`

Evento emitido por streamEval().

Orden garantizado:
  start → (subproof | progress | partial)* → done | error

```ts
export type StreamEvent = | { kind: 'start'; formula: string } | { kind: 'subproof'; node: string; result: 'T' | 'F' | 'both' | 'neither' | 'unknown' } | { kind: 'progress'; ratio: number } | { kind: 'partial'; result: EvalResult } | { kind: 'done'; result: EvalResult; totalMs: number } | { kind: 'error'; error: string };
```


## `ProfileName`

> Type · `runtime/streaming/types.ts:25`

Nombres válidos de perfil lógico (string abierto para extensibilidad).

```ts
export type ProfileName = string;
```

