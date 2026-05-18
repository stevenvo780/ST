# `semantics/text-layer/v2/mdx-bridge/parser.ts`

MDX → Claim[] parser.

Reconoce dos formatos en cualquier orden y en cualquier posición del
documento (dentro de prosa, dentro de listas, etc):

  - HTML comment style:
      <!-- st:claim id="c1" profile="p" formula="A->B" deps="c0,c2" -->

  - Fenced code block style:
      ```st-claim id=c1 profile=p deps=c0
      A->B
      ```

Bloques malformados (sin id, sin profile, sin formula, etc.) se ignoran
acumulando un warning. NUNCA lanza.

## Contents

- [`mdxToClaimsDetailed`](#mdxtoclaimsdetailed) — Const
- [`mdxToClaims`](#mdxtoclaims) — Const
- [`stripMDXMetadata`](#stripmdxmetadata) — Const

## `mdxToClaimsDetailed`

> Const · `semantics/text-layer/v2/mdx-bridge/parser.ts:122`

Versión "rica" — devuelve también warnings. La API pública delega aquí.

```ts
const mdxToClaimsDetailed
```


## `mdxToClaims`

> Const · `semantics/text-layer/v2/mdx-bridge/parser.ts:195`

MDX → Claim[]. Tolera bloques malformados ignorándolos.

```ts
const mdxToClaims
```


## `stripMDXMetadata`

> Const · `semantics/text-layer/v2/mdx-bridge/parser.ts:203`

Helper interno: convierte MDXClaim a Claim "pelado" (sin rawBlock/source).
Útil para diff que sólo compara campos lógicos.

```ts
const stripMDXMetadata
```

