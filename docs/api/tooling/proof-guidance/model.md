# `tooling/proof-guidance/model.ts`

============================================================ ST Proof Guidance — Modelo de ranking Aprende un peso por par (tactic, feature) via logistic regression con descenso por gradiente. Sin embeddings, sin librerías externas — todo en memoria, vectorizable a mano. ============================================================

## Contents

- [`createEmptyModel`](#createemptymodel) — Function
- [`trainModel`](#trainmodel) — Function
- [`rankTactics`](#ranktactics) — Function
- [`updateModel`](#updatemodel) — Function
- [`tacticSuccessProbability`](#tacticsuccessprobability) — Function

## `createEmptyModel`

> Function · `tooling/proof-guidance/model.ts:46`

Inicializa modelo vacío con feature names canónicos.
Los pesos arrancan en 0 — equivalente a "uniform prior".

```ts
export function createEmptyModel(): RankingModel
```

### Returns

`RankingModel` — 


## `trainModel`

> Function · `tooling/proof-guidance/model.ts:72`

Entrena un `RankingModel` via logistic regression mini-batch full-epoch.

Para cada record: target = `successful ? 1 : 0`, ponderado por
`1 / (1 + proofDepthRemaining ?? 0)` cuando está presente — tácticas
que dejan menos profundidad pesan más.

Las features son las de `extractFeatures(record.beforeState)`.

```ts
export function trainModel(records: TacticRecord[], opts: TrainOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `records` | `TacticRecord[]` | no |  |
| `opts` | `TrainOptions` | yes |  |

### Returns

`RankingModel` — 


## `rankTactics`

> Function · `tooling/proof-guidance/model.ts:118`

Rankea candidatas por score descendente. Las tácticas sin pesos
aprendidos reciben score 0 (bias 0 + features × 0) y quedan al
final establemente (sort estable por index).

```ts
export function rankTactics( state: ProofState, model: RankingModel, candidates: string[], ): RankedTactic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |
| `model` | `RankingModel` | no |  |
| `candidates` | `string[]` | no |  |

### Returns

`RankedTactic[]` — 


## `updateModel`

> Function · `tooling/proof-guidance/model.ts:145`

Update online: 1 paso de gradient descent con el record nuevo.
Devuelve un modelo nuevo (no mutación in-place del Map original).

Útil cuando el agente IA acaba de probar una táctica y queremos
incorporar la señal sin re-entrenar desde cero.

```ts
export function updateModel( model: RankingModel, record: TacticRecord, learningRate = 0.1, ): RankingModel
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `model` | `RankingModel` | no |  |
| `record` | `TacticRecord` | no |  |
| `learningRate` | `any` | yes |  |

### Returns

`RankingModel` — 


## `tacticSuccessProbability`

> Function · `tooling/proof-guidance/model.ts:179`

Probabilidad calibrada [0,1] de éxito según el modelo.

```ts
export function tacticSuccessProbability( state: ProofState, model: RankingModel, tactic: string, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |
| `model` | `RankingModel` | no |  |
| `tactic` | `string` | no |  |

### Returns

`number` — 

