# `runtime/bisimulation/types.ts`

Sistema de transiciones etiquetadas.
 - `states`      lista finita de identificadores de estado.
 - `transitions` triplas [from, action, to] que codifican →.
 - `labelling`   opcional: estado → conjunto de proposiciones atómicas que
                 se cumplen en él. Estados ausentes se tratan como ∅.

## Contents

- [`LTS`](#lts) — Interface
- [`BisimulationResult`](#bisimulationresult) — Interface

## `LTS`

> Interface · `runtime/bisimulation/types.ts:28`

Sistema de transiciones etiquetadas.
 - `states`      lista finita de identificadores de estado.
 - `transitions` triplas [from, action, to] que codifican →.
 - `labelling`   opcional: estado → conjunto de proposiciones atómicas que
                 se cumplen en él. Estados ausentes se tratan como ∅.

```ts
export interface LTS
```


## `BisimulationResult`

> Interface · `runtime/bisimulation/types.ts:41`

Resultado de un algoritmo de partition refinement.
 - `partition`  estado → índice de bloque.
 - `blocks`     bloques como listas de estados (índice consistente con partition).
 - `numBlocks`  cardinalidad de la partición final.
 - `iterations` número de iteraciones de refinamiento ejecutadas.

```ts
export interface BisimulationResult
```

