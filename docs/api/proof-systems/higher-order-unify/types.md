# `proof-systems/higher-order-unify/types.ts`

============================================================ Higher-order unification (Miller 1991) — Tipos base ============================================================ HOTerm extiende λ-cálculo con meta-variables. Las meta-variables son "incógnitas" del proceso de unificación; las variables ordinarias son variables ligadas o libres del objeto-lenguaje. Miller pattern: una meta-variable aplicada a una lista de variables *distintas* y *ligadas* — garantiza unicidad y decidibilidad del unificador más general.

## Contents

- [`HOTerm`](#hoterm) — Type
- [`HOSubst`](#hosubst) — Interface

## `HOTerm`

> Type · `proof-systems/higher-order-unify/types.ts:13`

```ts
export type HOTerm = | { kind: 'var'; name: string } | { kind: 'meta'; name: string } | { kind: 'abs'; param: string; body: HOTerm } | { kind: 'app'; fn: HOTerm; args: HOTerm[] };
```


## `HOSubst`

> Interface · `proof-systems/higher-order-unify/types.ts:19`

```ts
export interface HOSubst
```

