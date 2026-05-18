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

> Type · `proof-systems/fol-prover-advanced/types.ts:32`

A first-order substitution: maps variable names to replacement terms.

```ts
export type Substitution = Map<string, FOLTerm>;
```


## `RefinementStrategy`

> Type · `proof-systems/fol-prover-advanced/types.ts:42`

The inference strategy used by the advanced resolution prover.
- `binary`: standard binary resolution.
- `hyperresolution`: resolves a positive clause against several negative ones simultaneously.
- `set-of-support`: restricts resolution to clauses derived from the goal.
- `ordered`: restricts resolution to maximal literals under a term ordering.
- `unit-preference`: prefers unit clauses (single literal) during selection.

```ts
export type RefinementStrategy = | 'binary' | 'hyperresolution' | 'set-of-support' | 'ordered' | 'unit-preference';
```


## `TermOrdering`

> Type · `proof-systems/fol-prover-advanced/types.ts:50`

Term ordering used to orient equations and select maximal literals.

```ts
export type TermOrdering = 'KBO' | 'LPO' | 'none';
```


## `AdvancedProveOptions`

> Interface · `proof-systems/fol-prover-advanced/types.ts:52`

```ts
export interface AdvancedProveOptions
```


## `ProofStep`

> Interface · `proof-systems/fol-prover-advanced/types.ts:66`

Records a single inference step in the advanced prover's derivation.

```ts
export interface ProofStep
```


## `ProofStats`

> Interface · `proof-systems/fol-prover-advanced/types.ts:74`

Aggregated statistics collected during a proof search run.

```ts
export interface ProofStats
```


## `AdvancedProveResult`

> Interface · `proof-systems/fol-prover-advanced/types.ts:83`

```ts
export interface AdvancedProveResult
```

