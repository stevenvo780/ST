# `tooling/proof-guidance/types.ts`

Estado de prueba: goal a demostrar + hipótesis disponibles.
`context` opcional para metadatos arbitrarios (nombre del teorema,
profile lógico activo, etc.) — el extractor lo ignora hoy pero
deja la puerta abierta para features ricas en el futuro.

## Contents

- [`ProofState`](#proofstate) — Interface
- [`TacticRecord`](#tacticrecord) — Interface
- [`Feature`](#feature) — Interface
- [`RankingModel`](#rankingmodel) — Interface
- [`RankedTactic`](#rankedtactic) — Interface
- [`SearchOptions`](#searchoptions) — Interface
- [`SearchResult`](#searchresult) — Interface
- [`ApplyTactic`](#applytactic) — Type

## `ProofState`

> Interface · `tooling/proof-guidance/types.ts:13`

Estado de prueba: goal a demostrar + hipótesis disponibles.
`context` opcional para metadatos arbitrarios (nombre del teorema,
profile lógico activo, etc.) — el extractor lo ignora hoy pero
deja la puerta abierta para features ricas en el futuro.

```ts
export interface ProofState
```


## `TacticRecord`

> Interface · `tooling/proof-guidance/types.ts:24`

Registro histórico: una aplicación de táctica con el resultado.
`proofDepthRemaining` permite ponderar éxito por proximidad al QED:
tácticas que cierran la prueba pesan más que tácticas medias.

```ts
export interface TacticRecord
```


## `Feature`

> Interface · `tooling/proof-guidance/types.ts:38`

Feature extraída de un estado. `value` es numérico (los booleanos
se codifican como 0/1) para que el ranker haga producto interno
sin tratos especiales.

```ts
export interface Feature
```


## `RankingModel`

> Interface · `tooling/proof-guidance/types.ts:48`

Modelo entrenado. Por cada par (tactic, feature) hay un peso
— los lemas también caben aquí porque se tratan como tácticas
con nombre `lemma:<id>`.

```ts
export interface RankingModel
```


## `RankedTactic`

> Interface · `tooling/proof-guidance/types.ts:61`

Resultado de ranking: score sin normalizar, mayor = mejor candidata.
No es probabilidad estricta — usar `Math.exp(score) / sum` si se
necesita softmax.

```ts
export interface RankedTactic
```


## `SearchOptions`

> Interface · `tooling/proof-guidance/types.ts:66`

```ts
export interface SearchOptions
```


## `SearchResult`

> Interface · `tooling/proof-guidance/types.ts:77`

```ts
export interface SearchResult
```


## `ApplyTactic`

> Type · `tooling/proof-guidance/types.ts:89`

Función que aplica una táctica a un estado. null = táctica no aplicable.

```ts
export type ApplyTactic = ( state: ProofState, tactic: string, args?: unknown[], ) => ProofState | null;
```

