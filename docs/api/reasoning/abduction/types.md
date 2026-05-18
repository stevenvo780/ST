# `reasoning/abduction/types.ts`

Una fórmula (formato libre — strings, opaque al motor).

## Contents

- [`Formula`](#formula) — Type
- [`EntailmentOracle`](#entailmentoracle) — Type
- [`ConsistencyOracle`](#consistencyoracle) — Type
- [`AbductionProblem`](#abductionproblem) — Interface
- [`Explanation`](#explanation) — Interface
- [`Preference`](#preference) — Type
- [`AbductionOptions`](#abductionoptions) — Interface

## `Formula`

> Type · `reasoning/abduction/types.ts:23`

Una fórmula (formato libre — strings, opaque al motor).

```ts
export type Formula = string;
```


## `EntailmentOracle`

> Type · `reasoning/abduction/types.ts:33`

Oráculo de consecuencia lógica: dado un conjunto de premisas P y
una fórmula objetivo q, devuelve `true` sii P ⊨ q.

El motor abductivo es agnóstico al sistema lógico. Quien usa la
librería provee este oráculo (puede ser propositional, FOL,
description logic, etc).

```ts
export type EntailmentOracle = (premises: ReadonlyArray<Formula>, target: Formula) => boolean;
```


## `ConsistencyOracle`

> Type · `reasoning/abduction/types.ts:41`

Oráculo de consistencia: dado un conjunto de fórmulas, devuelve
`true` sii admite al menos un modelo. Default razonable: si no
lo dan, decimos consistente sii NO P ⊨ ⊥. Como no tenemos ⊥
estándar en strings, en la práctica conviene pasar este oráculo.

```ts
export type ConsistencyOracle = (premises: ReadonlyArray<Formula>) => boolean;
```


## `AbductionProblem`

> Interface · `reasoning/abduction/types.ts:51`

Problema abductivo.

- `kb`: background knowledge (axiomas del dominio).
- `observation`: fórmula que queremos explicar.
- `abducibles`: el conjunto de fórmulas elegibles como hipótesis.
  El razonador buscará H ⊆ abducibles.

```ts
export interface AbductionProblem
```


## `Explanation`

> Interface · `reasoning/abduction/types.ts:67`

Una explicación candidata.

- `hypotheses`: subconjunto de abducibles.
- `size`: cardinalidad (= hypotheses.length).
- `parsimonious`: true sii no existe subconjunto propio que
  también explique la observación de forma consistente.
  (Equivale a "minimal por inclusión".)
- `costScore`: suma de costos si se proveyó costFunction.

```ts
export interface Explanation
```


## `Preference`

> Type · `reasoning/abduction/types.ts:82`

Criterio de preferencia sobre el conjunto de explicaciones.

- `all`: todas las explicaciones encontradas (no filtra).
- `minimal`: solo las minimal-por-inclusión (parsimonious).
- `minimum-cardinality`: las de menor |H| entre las minimales.
- `minimum-cost`: las de menor costo total (requiere costFunction).

```ts
export type Preference = 'all' | 'minimal' | 'minimum-cardinality' | 'minimum-cost';
```


## `AbductionOptions`

> Interface · `reasoning/abduction/types.ts:84`

```ts
export interface AbductionOptions
```

