# `runtime/parallel/worker.ts`

ST Parallel Profile Worker — ejecutado en un hilo separado (worker_threads).

Recibe un WorkerTask con la fórmula serializada y el nombre del perfil,
evalúa checkValid() y devuelve WorkerResponse al hilo principal.

## Contents

- [`WorkerTask`](#workertask) — Interface
- [`WorkerResponse`](#workerresponse) — Interface

## `WorkerTask`

> Interface · `runtime/parallel/worker.ts:18`

```ts
export interface WorkerTask
```


## `WorkerResponse`

> Interface · `runtime/parallel/worker.ts:25`

```ts
export interface WorkerResponse
```

