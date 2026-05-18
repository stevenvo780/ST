# `solver/smt/types.ts`

============================================================ ST SMT — Tipos públicos del bridge a solvers SMT externos ============================================================

## Contents

- [`SMTSort`](#smtsort) — Type
- [`SMTLogic`](#smtlogic) — Type
- [`SMTResult`](#smtresult) — Type
- [`SMTModel`](#smtmodel) — Type
- [`ToSMTLIBOptions`](#tosmtliboptions) — Interface
- [`SMTBackend`](#smtbackend) — Interface
- [`DetectedSolver`](#detectedsolver) — Type
- [`DetectionResult`](#detectionresult) — Interface
- [`ConstDeclaration`](#constdeclaration) — Interface
- [`ScopedAssertion`](#scopedassertion) — Interface
- [`SMTScope`](#smtscope) — Interface

## `SMTSort`

> Type · `solver/smt/types.ts:8`

Sorts SMT-LIB v2 soportados por el bridge.

```ts
export type SMTSort = 'Bool' | 'Int' | 'Real' | 'BitVec';
```


## `SMTLogic`

> Type · `solver/smt/types.ts:11`

Lógicas SMT-LIB v2 reconocidas por el serializador.

```ts
export type SMTLogic = 'QF_LRA' | 'QF_LIA' | 'QF_BV' | 'AUFLIA';
```


## `SMTResult`

> Type · `solver/smt/types.ts:14`

Resultado de checkSat según SMT-LIB v2.

```ts
export type SMTResult = 'sat' | 'unsat' | 'unknown';
```


## `SMTModel`

> Type · `solver/smt/types.ts:17`

Modelo devuelto por getModel: mapa de constante → valor decodificado.

```ts
export type SMTModel = Record<string, string | number | boolean>;
```


## `ToSMTLIBOptions`

> Interface · `solver/smt/types.ts:20`

Opciones para el serializador SMT-LIB v2.

```ts
export interface ToSMTLIBOptions
```


## `SMTBackend`

> Interface · `solver/smt/types.ts:30`

Backend SMT — abstracción común para mock e implementaciones reales.

```ts
export interface SMTBackend
```


## `DetectedSolver`

> Type · `solver/smt/types.ts:43`

Solver externo detectado en el PATH.

```ts
export type DetectedSolver = 'z3' | 'cvc5' | 'none';
```


## `DetectionResult`

> Interface · `solver/smt/types.ts:46`

Resultado interno de una operación de detección.

```ts
export interface DetectionResult
```


## `ConstDeclaration`

> Interface · `solver/smt/types.ts:53`

Declaración de constante registrada en un scope.

```ts
export interface ConstDeclaration
```


## `ScopedAssertion`

> Interface · `solver/smt/types.ts:60`

Aserción registrada en un scope.

```ts
export interface ScopedAssertion
```


## `SMTScope`

> Interface · `solver/smt/types.ts:68`

Estado de un nivel del stack push/pop.

```ts
export interface SMTScope
```

