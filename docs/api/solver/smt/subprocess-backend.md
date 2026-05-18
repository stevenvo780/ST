# `solver/smt/subprocess-backend.ts`

============================================================ ST SMT — Backend basado en subprocess (z3 / cvc5 via stdio) ============================================================

## Contents

- [`detectAvailableSMT`](#detectavailablesmt) — Function
- [`detectAvailableSMTDetailed`](#detectavailablesmtdetailed) — Function
- [`SubprocessBackendOptions`](#subprocessbackendoptions) — Interface
- [`SubprocessSMTBackend`](#subprocesssmtbackend) — Class

## `detectAvailableSMT`

> Function · `solver/smt/subprocess-backend.ts:50`

Detecta si hay un solver SMT (z3 o cvc5) disponible en el PATH.
No lanza excepción: si no hay solver, devuelve 'none'.

```ts
export function detectAvailableSMT(): Promise<DetectedSolver>
```

### Returns

`Promise<DetectedSolver>` — 


## `detectAvailableSMTDetailed`

> Function · `solver/smt/subprocess-backend.ts:56`

Variante síncrona que también devuelve el path resuelto.

```ts
export function detectAvailableSMTDetailed(which: WhichRunner = defaultWhich): DetectionResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `which` | `WhichRunner` | yes |  |

### Returns

`DetectionResult` — 


## `SubprocessBackendOptions`

> Interface · `solver/smt/subprocess-backend.ts:72`

```ts
export interface SubprocessBackendOptions
```


## `SubprocessSMTBackend`

> Class · `solver/smt/subprocess-backend.ts:95`

SubprocessSMTBackend invoca `z3 -in` (o cvc5 equivalente) por stdio.

Si no encuentra solver, queda en modo no-op:
  - checkSat() devuelve 'unknown'
  - getModel() devuelve undefined
  - getUnsatCore() devuelve []

El backend acumula declaraciones y asserts en memoria y los envía al solver
en cada checkSat. No mantiene proceso persistente para no introducir leaks
en tests; el costo de re-arrancar z3 es <50ms por call y es aceptable.

```ts
export class SubprocessSMTBackend implements SMTBackend
```

