# `semantics/text-layer/v2/mdx-bridge/types.ts`

MDX bridge — tipos públicos para conversión bidireccional Claim[] ↔ MDX.

Una Claim se serializa en MDX con dos formatos posibles:

  1. "comment" (compacto, una sola línea, atributos HTML):
     <!-- st:claim id="c1" profile="classical.propositional" formula="A->B" deps="c0" -->

  2. "fence" (legible, multi-línea):
     ```st-claim id=c1 profile=classical.propositional deps=c0
     A->B
     ```

En ambos formatos los IDs son únicos por documento. El parser conserva el
texto crudo del bloque en `rawBlock` para poder reescribir o comparar.

## Contents

- [`MDXClaim`](#mdxclaim) — Interface
- [`MDXClaimTemplate`](#mdxclaimtemplate) — Type
- [`ClaimsToMDXOptions`](#claimstomdxoptions) — Interface
- [`MDXDelta`](#mdxdelta) — Interface
- [`MDXParseWarning`](#mdxparsewarning) — Interface
- [`MDXParseResult`](#mdxparseresult) — Interface

## `MDXClaim`

> Interface · `semantics/text-layer/v2/mdx-bridge/types.ts:20`

```ts
export interface MDXClaim extends Claim
```


## `MDXClaimTemplate`

> Type · `semantics/text-layer/v2/mdx-bridge/types.ts:25`

```ts
export type MDXClaimTemplate = 'comment' | 'fence';
```


## `ClaimsToMDXOptions`

> Interface · `semantics/text-layer/v2/mdx-bridge/types.ts:27`

```ts
export interface ClaimsToMDXOptions
```


## `MDXDelta`

> Interface · `semantics/text-layer/v2/mdx-bridge/types.ts:32`

```ts
export interface MDXDelta
```


## `MDXParseWarning`

> Interface · `semantics/text-layer/v2/mdx-bridge/types.ts:43`

Warning emitido por el parser cuando encuentra un bloque malformado.
El parser no lanza excepciones: ignora el bloque problemático y acumula
warnings para diagnóstico.

```ts
export interface MDXParseWarning
```


## `MDXParseResult`

> Interface · `semantics/text-layer/v2/mdx-bridge/types.ts:52`

```ts
export interface MDXParseResult
```

