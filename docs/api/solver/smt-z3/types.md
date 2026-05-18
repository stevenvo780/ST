# `solver/smt-z3/types.ts`

============================================================ ST SMT-Z3 — Tipos del backend WASM real ============================================================

## Contents

- [`AsyncSMTBackend`](#asyncsmtbackend) — Interface
- [`AvailableSMTRuntime`](#availablesmtruntime) — Type
- [`Z3WasmBackendOptions`](#z3wasmbackendoptions) — Interface
- [`Z3ScopedAssertion`](#z3scopedassertion) — Interface
- [`Z3ScopedDecl`](#z3scopeddecl) — Interface
- [`Z3Scope`](#z3scope) — Interface

## `AsyncSMTBackend`

> Interface · `solver/smt-z3/types.ts:15`

AsyncSMTBackend es la versión async del SMTBackend de `../smt/types`.

Z3 corre como WASM via Emscripten y su `check()` es inherentemente async
(event loop interno + workers). Por eso no podemos implementar el
`SMTBackend` síncrono del bridge histórico — exponemos en su lugar
`Promise<SMTResult>` para `checkSat()`.

```ts
export interface AsyncSMTBackend
```


## `AvailableSMTRuntime`

> Type · `solver/smt-z3/types.ts:28`

Solver detectado disponible para uso real (no mock).

```ts
export type AvailableSMTRuntime = 'z3-wasm' | 'z3-subprocess' | 'cvc5-subprocess' | 'none';
```


## `Z3WasmBackendOptions`

> Interface · `solver/smt-z3/types.ts:31`

Opciones de creación del backend Z3 WASM.

```ts
export interface Z3WasmBackendOptions
```


## `Z3ScopedAssertion`

> Interface · `solver/smt-z3/types.ts:43`

Una aserción registrada para reproducir scopes al rehidratar.

```ts
export interface Z3ScopedAssertion
```


## `Z3ScopedDecl`

> Interface · `solver/smt-z3/types.ts:51`

Declaración registrada por nivel del stack.

```ts
export interface Z3ScopedDecl
```


## `Z3Scope`

> Interface · `solver/smt-z3/types.ts:58`

Un nivel del stack push/pop reflejado en el host.

```ts
export interface Z3Scope
```

