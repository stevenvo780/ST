# `proof-systems/tableau-framework/types.ts`

============================================================ Tableau Framework — Core types ============================================================

## Contents

- [`TableauNode`](#tableaunode) — Interface
- [`TableauBranch`](#tableaubranch) — Interface
- [`Tableau`](#tableau) — Interface
- [`Rule`](#rule) — Type
- [`ClosureCondition`](#closurecondition) — Type

## `TableauNode`

> Interface · `proof-systems/tableau-framework/types.ts:5`

```ts
export interface TableauNode<F>
```


## `TableauBranch`

> Interface · `proof-systems/tableau-framework/types.ts:11`

```ts
export interface TableauBranch<F>
```


## `Tableau`

> Interface · `proof-systems/tableau-framework/types.ts:17`

```ts
export interface Tableau<F>
```


## `Rule`

> Type · `proof-systems/tableau-framework/types.ts:29`

A rule consumes a node from a branch and expands it into
one or more groups of new nodes.  Each inner array represents
a new branch (α-rules return 1 group, β-rules return 2+).

```ts
export type Rule<F> = { name: string; match: (node: TableauNode<F>, branch: TableauBranch<F>) => boolean; apply: (node: TableauNode<F>, branch: TableauBranch<F>) => TableauNode<F>[][]; };
```


## `ClosureCondition`

> Type · `proof-systems/tableau-framework/types.ts:39`

A closure condition inspects a branch and returns a human-readable
reason string when the branch should be closed, or null otherwise.

```ts
export type ClosureCondition<F> = (branch: TableauBranch<F>) => string | null;
```

