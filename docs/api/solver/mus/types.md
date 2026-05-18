# `solver/mus/types.ts`

Algoritmos disponibles para extracción de MUS.

- `deletion`: por cada cláusula c, prueba si C \ {c} sigue unsat;
  si sí, descarta c definitivamente. O(n) llamadas al oráculo SAT.
  Sencillo, robusto, fácil de auditar.

- `insertion`: empieza con conjunto vacío W, agrega cláusulas una
  por una. Cuando W se vuelve unsat, la última cláusula añadida es
  "necesaria" (la fija en el MUS y vacía W). Repite hasta cubrir
  todo. Útil cuando el MUS es pequeño respecto al total.

- `qx`: QuickXplain (Junker 2004). Algoritmo divide-y-vencerás que
  resuelve "minimum conflict explanation" con O(2k · log(n/k))
  llamadas SAT, donde k es el tamaño del MUS. En la práctica mucho
  más rápido que deletion para MUS grandes embebidos en problemas
  inmensos.

## Contents

- [`MUSAlgorithm`](#musalgorithm) — Type
- [`MUSOptions`](#musoptions) — Interface
- [`MUSResult`](#musresult) — Interface
- [`SATOracle`](#satoracle) — Type
- [`AssumptionSolver`](#assumptionsolver) — Interface

## `MUSAlgorithm`

> Type · `solver/mus/types.ts:37`

Algoritmos disponibles para extracción de MUS.

- `deletion`: por cada cláusula c, prueba si C \ {c} sigue unsat;
  si sí, descarta c definitivamente. O(n) llamadas al oráculo SAT.
  Sencillo, robusto, fácil de auditar.

- `insertion`: empieza con conjunto vacío W, agrega cláusulas una
  por una. Cuando W se vuelve unsat, la última cláusula añadida es
  "necesaria" (la fija en el MUS y vacía W). Repite hasta cubrir
  todo. Útil cuando el MUS es pequeño respecto al total.

- `qx`: QuickXplain (Junker 2004). Algoritmo divide-y-vencerás que
  resuelve "minimum conflict explanation" con O(2k · log(n/k))
  llamadas SAT, donde k es el tamaño del MUS. En la práctica mucho
  más rápido que deletion para MUS grandes embebidos en problemas
  inmensos.

```ts
export type MUSAlgorithm = 'deletion' | 'insertion' | 'qx';
```


## `MUSOptions`

> Interface · `solver/mus/types.ts:39`

```ts
export interface MUSOptions
```


## `MUSResult`

> Interface · `solver/mus/types.ts:46`

```ts
export interface MUSResult
```


## `SATOracle`

> Type · `solver/mus/types.ts:61`

Oráculo SAT: dado un conjunto de cláusulas (cada cláusula es una
lista de literales enteros — convención DIMACS: positivo es literal
positivo, negativo es negado), devuelve `true` sii el conjunto
tiene un modelo, `false` si es unsat.

```ts
export type SATOracle = (subset: number[][]) => boolean;
```


## `AssumptionSolver`

> Interface · `solver/mus/types.ts:75`

Solver incremental con assumptions (estilo MiniSat / SAT4J):
dadas N cláusulas hard y una lista de literales-asumidos, devuelve
`{ sat: false, failedAssumptions: [...] }` cuando el problema es
unsat — el array `failedAssumptions` contiene un subconjunto de las
assumptions suficientes para que el problema sea unsat (el unsat
core proyectado sobre assumptions).

En la práctica `failedAssumptions` ya es un MUS (sobre la
codificación por selectors) o un superset cercano; corremos un pase
adicional de minimización para garantizar minimalidad.

```ts
export interface AssumptionSolver
```

