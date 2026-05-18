# `runtime/countermodel-min/types.ts`

Algoritmo de minimización a usar.

- `one-at-a-time`: O(n) pruebas. Por cada variable intenta removerla;
  si la fórmula sigue siendo falsada (para ambas completaciones de la
  variable removida), la elimina permanentemente.
- `binary-search`: O(n log n). Divide el conjunto de assignments en
  mitades y trata de descartar la mitad completa de una vez.
- `delta-debug`: O(n log n) en el peor caso, mucho más rápido en la
  práctica. Granularidad creciente al estilo Zeller 1999. Empieza
  removiendo bloques grandes y se reduce a granularidad 1.

## Contents

- [`CountermodelMinAlgorithm`](#countermodelminalgorithm) — Type
- [`CountermodelMinOptions`](#countermodelminoptions) — Interface
- [`CountermodelAssignment`](#countermodelassignment) — Type
- [`MinimalCountermodel`](#minimalcountermodel) — Interface

## `CountermodelMinAlgorithm`

> Type · `runtime/countermodel-min/types.ts:17`

Algoritmo de minimización a usar.

- `one-at-a-time`: O(n) pruebas. Por cada variable intenta removerla;
  si la fórmula sigue siendo falsada (para ambas completaciones de la
  variable removida), la elimina permanentemente.
- `binary-search`: O(n log n). Divide el conjunto de assignments en
  mitades y trata de descartar la mitad completa de una vez.
- `delta-debug`: O(n log n) en el peor caso, mucho más rápido en la
  práctica. Granularidad creciente al estilo Zeller 1999. Empieza
  removiendo bloques grandes y se reduce a granularidad 1.

```ts
export type CountermodelMinAlgorithm = 'delta-debug' | 'binary-search' | 'one-at-a-time';
```


## `CountermodelMinOptions`

> Interface · `runtime/countermodel-min/types.ts:19`

```ts
export interface CountermodelMinOptions
```


## `CountermodelAssignment`

> Type · `runtime/countermodel-min/types.ts:35`

Asignación final: para cada variable que queda en el contramodelo
mínimo, guardamos su valor.

Para perfiles clásicos los valores son `boolean`. Se permite también
`'T'`, `'F'`, `'both'`, `'neither'` para perfiles paraconsistentes
(Belnap) — la API queda abierta a futuro aunque el algoritmo actual
sólo opera sobre `boolean`.

```ts
export type CountermodelAssignment = Record<string, boolean | 'T' | 'F' | 'both' | 'neither'>;
```


## `MinimalCountermodel`

> Interface · `runtime/countermodel-min/types.ts:37`

```ts
export interface MinimalCountermodel
```

