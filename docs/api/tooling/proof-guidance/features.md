# `tooling/proof-guidance/features.ts`

============================================================ ST Proof Guidance — Feature extraction Features simples y baratas (sin embeddings). El extractor es determinístico: para el mismo state siempre devuelve los mismos (name, value). Los tests de `extractFeatures determinístico' dependen de esa propiedad. ============================================================

## Contents

- [`extractFeatures`](#extractfeatures) — Function
- [`featureNames`](#featurenames) — Function

## `extractFeatures`

> Function · `tooling/proof-guidance/features.ts:63`

Extrae features del estado. Estabilidad:
- mismo state → mismo array (orden, nombres, valores).
- todos los valores son números finitos.

```ts
export function extractFeatures(state: ProofState): Feature[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |

### Returns

`Feature[]` — 


## `featureNames`

> Function · `tooling/proof-guidance/features.ts:100`

Lista cerrada de feature names — útil para inicializar el modelo.

```ts
export function featureNames(): string[]
```

### Returns

`string[]` — 

