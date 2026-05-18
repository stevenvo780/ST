# `tooling/lemma-library/tfidf.ts`

============================================================ Índice TF-IDF sobre LemmaLibrary Construye un vector espaciable por documento (lema) mezclando name + tags + statement. Ranking de consultas via cosine similarity. Determinístico, sin dependencias externas. ============================================================

## Contents

- [`buildIndex`](#buildindex) — Function
- [`semanticSearch`](#semanticsearch) — Function

## `buildIndex`

> Function · `tooling/lemma-library/tfidf.ts:21`

```ts
export function buildIndex(library: LemmaLibrary): TfIdfIndex
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `library` | `LemmaLibrary` | no |  |

### Returns

`TfIdfIndex` — 


## `semanticSearch`

> Function · `tooling/lemma-library/tfidf.ts:85`

```ts
export function semanticSearch(index: TfIdfIndex, query: string, k = 5): SemanticSearchHit[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `index` | `TfIdfIndex` | no |  |
| `query` | `string` | no |  |
| `k` | `any` | yes |  |

### Returns

`SemanticSearchHit[]` — 

