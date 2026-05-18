# `tooling/proof-guidance/search.ts`

============================================================ ST Proof Guidance — Beam search guiado por el modelo Hill-climbing relajado: en cada paso retenemos los `beamWidth` estados con mejor score acumulado y expandimos solo esos. El score se hereda del modelo (ranking) — el modelo guía qué rama explorar primero. ============================================================

## `guidedSearch`

> Function · `tooling/proof-guidance/search.ts:53`

Beam search guiado por el modelo. `applyTactic` define la semántica
de cada táctica — el módulo no asume nada sobre la lógica de fondo.

```ts
export function guidedSearch( initialState: ProofState, applyTactic: ApplyTactic, model: RankingModel, candidates: string[], opts: SearchOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `initialState` | `ProofState` | no |  |
| `applyTactic` | `ApplyTactic` | no |  |
| `model` | `RankingModel` | no |  |
| `candidates` | `string[]` | no |  |
| `opts` | `SearchOptions` | yes |  |

### Returns

`SearchResult` — 

