# `reasoning/citation-reasoning/types.ts`

Premisa externa extraída de otro documento (cross-doc citation).
Representa un teorema, axioma o claim citado desde docId.

## Contents

- [`CitedClaim`](#citedclaim) — Interface
- [`CitationDerivation`](#citationderivation) — Interface
- [`DerivationStep`](#derivationstep) — Interface
- [`CitationDerivationResult`](#citationderivationresult) — Interface

## `CitedClaim`

> Interface · `reasoning/citation-reasoning/types.ts:9`

Premisa externa extraída de otro documento (cross-doc citation).
Representa un teorema, axioma o claim citado desde docId.

```ts
export interface CitedClaim
```


## `CitationDerivation`

> Interface · `reasoning/citation-reasoning/types.ts:21`

Descripción de una derivación que combina premisas locales
con premisas citadas de documentos externos.

```ts
export interface CitationDerivation
```


## `DerivationStep`

> Interface · `reasoning/citation-reasoning/types.ts:30`

Un paso individual en la traza de la derivación.

```ts
export interface DerivationStep
```


## `CitationDerivationResult`

> Interface · `reasoning/citation-reasoning/types.ts:38`

Resultado de deriveWithCitations.

```ts
export interface CitationDerivationResult
```

