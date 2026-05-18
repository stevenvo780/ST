# `proof-systems/fol-prover-advanced/types.ts`

Tipos base de primer orden para el prover avanzado.

Variables: identificadores que empiezan con minúscula y se interpretan como
sustituibles durante la unificación (convención: `x`, `y`, `u`, `v`).
Constantes/funciones: identificadores en minúscula con `args` (aridad ≥ 0).
Diferenciamos `variable` vs `function` por el campo `kind` para evitar
ambigüedades.

## Contents

- [`FOLTerm`](#folterm) — Type
- [`FOLLiteral`](#folliteral) — Interface
- [`FOLClause`](#folclause) — Interface
- [`Substitution`](#substitution) — Type
- [`RefinementStrategy`](#refinementstrategy) — Type
- [`TermOrdering`](#termordering) — Type
- [`AdvancedProveOptions`](#advancedproveoptions) — Interface
- [`ProofStep`](#proofstep) — Interface
- [`ProofStats`](#proofstats) — Interface
- [`AdvancedProveResult`](#advancedproveresult) — Interface

## `FOLTerm`

> Type · `proof-systems/fol-prover-advanced/types.ts:11`

Tipos base de primer orden para el prover avanzado.

Variables: identificadores que empiezan con minúscula y se interpretan como
sustituibles durante la unificación (convención: `x`, `y`, `u`, `v`).
Constantes/funciones: identificadores en minúscula con `args` (aridad ≥ 0).
Diferenciamos `variable` vs `function` por el campo `kind` para evitar
ambigüedades.

```ts
export type FOLTerm = | { kind: 'variable'; name: string } | { kind: 'function'; name: string; args: FOLTerm[] };
```


## `FOLLiteral`

> Interface · `proof-systems/fol-prover-advanced/types.ts:15`

```ts
export interface FOLLiteral
```


## `FOLClause`

> Interface · `proof-systems/fol-prover-advanced/types.ts:22`

```ts
export interface FOLClause
```


## `Substitution`

> Type · `proof-systems/fol-prover-advanced/types.ts:31`

```ts
export type Substitution = Map<string, FOLTerm>;
```


## `RefinementStrategy`

> Type · `proof-systems/fol-prover-advanced/types.ts:33`

```ts
export type RefinementStrategy = | 'binary' | 'hyperresolution' | 'set-of-support' | 'ordered' | 'unit-preference';
```


## `TermOrdering`

> Type · `proof-systems/fol-prover-advanced/types.ts:40`

```ts
export type TermOrdering = 'KBO' | 'LPO' | 'none';
```


## `AdvancedProveOptions`

> Interface · `proof-systems/fol-prover-advanced/types.ts:42`

```ts
export interface AdvancedProveOptions
```


## `ProofStep`

> Interface · `proof-systems/fol-prover-advanced/types.ts:55`

```ts
export interface ProofStep
```


## `ProofStats`

> Interface · `proof-systems/fol-prover-advanced/types.ts:62`

```ts
export interface ProofStats
```


## `AdvancedProveResult`

> Interface · `proof-systems/fol-prover-advanced/types.ts:71`

```ts
export interface AdvancedProveResult
```

