# `proof-systems/tableau-framework/propositional.ts`

============================================================ Tableau Framework — Propositional prover factory ============================================================

## Contents

- [`PropFormula`](#propformula) — Type
- [`createPropositionalProver`](#createpropositionalprover) — Function

## `PropFormula`

> Type · `proof-systems/tableau-framework/propositional.ts:12`

Minimal formula shape used by the propositional prover.
More fields (args, name, etc.) are allowed via the index signature.

```ts
export type PropFormula = { kind: string; [k: string]: unknown; };
```


## `createPropositionalProver`

> Function · `proof-systems/tableau-framework/propositional.ts:155`

```ts
export function createPropositionalProver(): TableauProver<PropFormula>
```

### Returns

`TableauProver<PropFormula>` — 

