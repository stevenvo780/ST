# `semantics/text-layer/v2/types.ts`

ST Text Layer 2.0 — tipos del grafo de claims con dependencias.

Una Claim es una afirmación formal con dependencias explícitas hacia
otras claims. El grafo permite validación topológica e invalidación
propagada: si una claim base falla, todas las claims que dependen
transitivamente de ella se marcan inválidas.

## Contents

- [`ClaimSource`](#claimsource) — Interface
- [`Claim`](#claim) — Interface
- [`ClaimValidation`](#claimvalidation) — Interface
- [`ClaimEvaluator`](#claimevaluator) — Type

## `ClaimSource`

> Interface · `semantics/text-layer/v2/types.ts:10`

ST Text Layer 2.0 — tipos del grafo de claims con dependencias.

Una Claim es una afirmación formal con dependencias explícitas hacia
otras claims. El grafo permite validación topológica e invalidación
propagada: si una claim base falla, todas las claims que dependen
transitivamente de ella se marcan inválidas.

```ts
export interface ClaimSource
```


## `Claim`

> Interface · `semantics/text-layer/v2/types.ts:15`

```ts
export interface Claim
```


## `ClaimValidation`

> Interface · `semantics/text-layer/v2/types.ts:23`

```ts
export interface ClaimValidation
```


## `ClaimEvaluator`

> Type · `semantics/text-layer/v2/types.ts:31`

```ts
export type ClaimEvaluator = (claim: Claim) => Promise<{ valid: boolean; result?: string; errors?: string[]; }>;
```

