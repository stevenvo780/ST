# `solver/smt-z3/z3-wasm-backend.ts`

============================================================ ST SMT-Z3 — Backend real basado en z3-solver (WASM in-process) ============================================================

## Contents

- [`isZ3Available`](#isz3available) — Function
- [`detectAvailableSMT`](#detectavailablesmt) — Function
- [`Z3WasmBackend`](#z3wasmbackend) — Class

## `isZ3Available`

> Function · `solver/smt-z3/z3-wasm-backend.ts:86`

`isZ3Available()` intenta inicializar z3-solver y devuelve true si
obtiene un Context utilizable. No lanza. Útil para skip de tests y
detección de runtime.

```ts
export async function isZ3Available(): Promise<boolean>
```

### Returns

`Promise<boolean>` — 


## `detectAvailableSMT`

> Function · `solver/smt-z3/z3-wasm-backend.ts:105`

Detector unificado de runtime SMT con preferencia por el WASM in-process.
- z3-wasm si la WASM bind carga.
- z3-subprocess o cvc5-subprocess si hay binario en PATH.
- 'none' si no hay nada.

```ts
export async function detectAvailableSMT(): Promise<AvailableSMTRuntime>
```

### Returns

`Promise<AvailableSMTRuntime>` — 


## `Z3WasmBackend`

> Class · `solver/smt-z3/z3-wasm-backend.ts:136`

Z3WasmBackend — wrapper sobre z3-solver con interfaz AsyncSMTBackend.

Modelo de estado:
 - Mantiene un único `Solver` Z3 cuyo stack push/pop se sincroniza con
   `scopes[]` del host (espejo). Esto permite re-hidratar el solver con
   `solver.reset()` + replay de scopes si fuera necesario (no se hace
   en el flujo normal, sólo en `reset()`).
 - `assertFormula(body)` mete `(assert body)` en el solver actual,
   pero también lo registra en `scopes[top].assertions` por trazabilidad.
 - `getUnsatCore()` requiere haber usado `assertNamed(name, body)`:
   estos asserts se envuelven en `(=> <track> <body>)` y se pasan como
   assumption literals al check(). El core devuelto es la lista de
   nombres `track`.

```ts
export class Z3WasmBackend implements AsyncSMTBackend
```

