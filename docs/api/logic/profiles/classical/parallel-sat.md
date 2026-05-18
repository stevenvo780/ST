# `logic/profiles/classical/parallel-sat.ts`

============================================================ Parallel SAT Solver — Portfolio Racing con Workers Compatible con Node.js (worker_threads) y Browser (Web Workers) ============================================================ Estrategia: lanza N workers con el mismo problema pero diferentes heurísticas (semillas VSIDS, políticas de restart, etc). El primero que resuelva gana; los demás se terminan. Fallback: si workers no están disponibles, ejecuta secuencialmente. ============================================================

## Contents

- [`WorkerTask`](#workertask) — Interface
- [`WorkerResult`](#workerresult) — Interface
- [`packClauses`](#packclauses) — Function
- [`unpackClauses`](#unpackclauses) — Function
- [`workersAvailable`](#workersavailable) — Function
- [`PARALLEL_THRESHOLD`](#parallel-threshold) — Const
- [`MAX_WORKERS`](#max-workers) — Const
- [`parallelSolve`](#parallelsolve) — Function
- [`tryParallelSolve`](#tryparallelsolve) — Function

## `WorkerTask`

> Interface · `logic/profiles/classical/parallel-sat.ts:18`

Mensaje del orquestador al worker

```ts
export interface WorkerTask
```


## `WorkerResult`

> Interface · `logic/profiles/classical/parallel-sat.ts:31`

Mensaje del worker al orquestador

```ts
export interface WorkerResult
```


## `packClauses`

> Function · `logic/profiles/classical/parallel-sat.ts:45`

Empaqueta un array de Int32Array clauses en un solo buffer plano.
Formato: [clauseLen, lit1, lit2, ..., clauseLen, lit1, ...]
Esto permite pasar por SharedArrayBuffer o structured clone sin overhead.

```ts
export function packClauses(clauses: Int32Array[]): Int32Array
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Int32Array[]` | no |  |

### Returns

`Int32Array` — 


## `unpackClauses`

> Function · `logic/profiles/classical/parallel-sat.ts:60`

Desempaqueta un buffer plano de vuelta a Int32Array[].

```ts
export function unpackClauses(packed: Int32Array): Int32Array[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `packed` | `Int32Array` | no |  |

### Returns

`Int32Array[]` — 


## `workersAvailable`

> Function · `logic/profiles/classical/parallel-sat.ts:85`

Comprueba si el entorno soporta workers.

```ts
export function workersAvailable(): boolean
```

### Returns

`boolean` — 


## `PARALLEL_THRESHOLD`

> Const · `logic/profiles/classical/parallel-sat.ts:562`

Umbral mínimo de variables para activar paralelismo.
Por debajo de este umbral, el overhead de workers no compensa.

```ts
const PARALLEL_THRESHOLD
```


## `MAX_WORKERS`

> Const · `logic/profiles/classical/parallel-sat.ts:567`

Número máximo de workers a lanzar (limitado por configs de portfolio).

```ts
const MAX_WORKERS
```


## `parallelSolve`

> Function · `logic/profiles/classical/parallel-sat.ts:578`

Resuelve SAT en paralelo con portfolio racing.

```ts
export function parallelSolve( clauses: Int32Array[], numVars: number, atomNames: string[], timeoutMs: number, ): Promise<CDCLResult>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Int32Array[]` | no | Cláusulas ya codificadas (post-preprocessing) |
| `numVars` | `number` | no | Número de variables |
| `atomNames` | `string[]` | no | Nombres de los átomos originales |
| `timeoutMs` | `number` | no | Timeout global |

### Returns

`Promise<CDCLResult>` — Promise con el resultado


## `tryParallelSolve`

> Function · `logic/profiles/classical/parallel-sat.ts:686`

Versión síncrona que intenta paralelismo y cae a secuencial.
Para integración transparente con el flujo actual de cdcl().

NOTA: Esta función solo es útil si el caller puede manejar
la Promise. Si no, usar cdclSolve directamente.

```ts
export function tryParallelSolve( clauses: Int32Array[], numVars: number, atomNames: string[], timeoutMs: number, ): Promise<CDCLResult> | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clauses` | `Int32Array[]` | no |  |
| `numVars` | `number` | no |  |
| `atomNames` | `string[]` | no |  |
| `timeoutMs` | `number` | no |  |

### Returns

`Promise<CDCLResult> \| null` — 

