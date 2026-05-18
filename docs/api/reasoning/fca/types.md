# `reasoning/fca/types.ts`

Contexto formal K = (G, M, I).
 - `objects`    G como lista finita ordenada.
 - `attributes` M como lista finita ordenada.
 - `incidence`  representación canónica como conjunto de pares
                codificados "objeto|atributo" para test O(1).

## Contents

- [`FormalContext`](#formalcontext) — Interface
- [`FormalConcept`](#formalconcept) — Interface
- [`HasseLattice`](#hasselattice) — Interface

## `FormalContext`

> Interface · `reasoning/fca/types.ts:36`

Contexto formal K = (G, M, I).
 - `objects`    G como lista finita ordenada.
 - `attributes` M como lista finita ordenada.
 - `incidence`  representación canónica como conjunto de pares
                codificados "objeto|atributo" para test O(1).

```ts
export interface FormalContext
```


## `FormalConcept`

> Interface · `reasoning/fca/types.ts:46`

Concepto formal (A, B) con A = extent, B = intent.
Invariante: A' = B y B' = A (verificable con `isConcept`).

```ts
export interface FormalConcept
```


## `HasseLattice`

> Interface · `reasoning/fca/types.ts:58`

Diagrama de Hasse del concept lattice como lista de aristas de cobertura.
`edges[i] = [child, parent]` significa que el concepto `child` está cubierto
inmediatamente por `parent` (no hay concepto intermedio estricto).
Los índices son posiciones en el array de conceptos devuelto por
`allConcepts`.

```ts
export interface HasseLattice
```

