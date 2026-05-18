# `runtime/parallel/index.ts`

ST Parallel Profile Pool — ejecuta múltiples perfiles lógicos en paralelo.

Usa Node.js worker_threads cuando está disponible; si no (browser o
entorno sin soporte), cae a evaluación secuencial con Promise.resolve().

## Contents

- [`ProfileName`](#profilename) — Type
- [`ParallelEvalOptions`](#parallelevaloptions) — Interface
- [`ParallelEvalResult`](#parallelevalresult) — Interface
- [`evalParallel`](#evalparallel) — Function
- [`shutdownPool`](#shutdownpool) — Function

## `ProfileName`

> Type · `runtime/parallel/index.ts:16`

```ts
export type ProfileName = string;
```


## `ParallelEvalOptions`

> Interface · `runtime/parallel/index.ts:18`

```ts
export interface ParallelEvalOptions
```


## `ParallelEvalResult`

> Interface · `runtime/parallel/index.ts:25`

```ts
export interface ParallelEvalResult
```


## `evalParallel`

> Function · `runtime/parallel/index.ts:253`

Evalúa una fórmula lógica con múltiples perfiles en paralelo.

Si worker_threads no está disponible (browser), ejecuta secuencialmente.

```ts
export async function evalParallel( formula: Formula, opts: ParallelEvalOptions, ): Promise<ParallelEvalResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `opts` | `ParallelEvalOptions` | no |  |

### Returns

`Promise<ParallelEvalResult>` — 


## `shutdownPool`

> Function · `runtime/parallel/index.ts:284`

Cierra todos los workers del pool compartido.
Llamar al final del proceso si shareWorkPool=true.

```ts
export async function shutdownPool(): Promise<void>
```

### Returns

`Promise<void>` — 

