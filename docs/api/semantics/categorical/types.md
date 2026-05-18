# `semantics/categorical/types.ts`

Identidad estable de un morfismo. Las categorías construidas
en este módulo usan strings derivados de `src→tgt:name`, pero
un cliente puede definir su propio esquema mientras sea único.

## Contents

- [`MorId`](#morid) — Type
- [`Category`](#category) — Interface
- [`Functor`](#functor) — Interface
- [`NaturalTransformation`](#naturaltransformation) — Interface
- [`Diagram`](#diagram) — Interface
- [`Cone`](#cone) — Interface
- [`Cocone`](#cocone) — Interface
- [`MonoidalCategory`](#monoidalcategory) — Interface

## `MorId`

> Type · `semantics/categorical/types.ts:19`

Identidad estable de un morfismo. Las categorías construidas
en este módulo usan strings derivados de `src→tgt:name`, pero
un cliente puede definir su propio esquema mientras sea único.

```ts
export type MorId = string;
```


## `Category`

> Interface · `semantics/categorical/types.ts:29`

Una categoría sobre objetos `Obj` y morfismos `Mor`. Las
propiedades `objects` y `morphisms` exponen el grafo subyacente
para tests y consumidores que necesiten iterar.

Los morfismos viven en un `Map<MorId, Mor>` para que el chequeo
de leyes pueda muestrear pares aleatorios sin coste prohibitivo.

```ts
export interface Category<Obj, Mor>
```


## `Functor`

> Interface · `semantics/categorical/types.ts:61`

Functor F : C → D, dado por su acción en objetos y morfismos.
Debe preservar identidad y composición; ambas son verificables.

```ts
export interface Functor<O1, M1, O2, M2>
```


## `NaturalTransformation`

> Interface · `semantics/categorical/types.ts:78`

Transformación natural η : F ⇒ G entre functores paralelos
F, G : C → D. Cada componente `η_a : F(a) → G(a)`. La condición
de naturalidad es G(f) ∘ η_a = η_b ∘ F(f) para f : a→b en C.

```ts
export interface NaturalTransformation<O1, M1, O2, M2>
```


## `Diagram`

> Interface · `semantics/categorical/types.ts:92`

Un diagrama es un functor desde una categoría índice J (típicamente
pequeña, finita) a la categoría ambiente C. Para nuestros usos
concretos representamos el diagrama por sus vértices (objetos
de C imagen) y sus aristas (morfismos forzados entre ellos).

```ts
export interface Diagram<O, M>
```


## `Cone`

> Interface · `semantics/categorical/types.ts:101`

Cono sobre un diagrama: un objeto ápice junto con un morfismo
(`leg`) hacia cada vértice del diagrama, conmutando con sus aristas.

```ts
export interface Cone<O, M>
```


## `Cocone`

> Interface · `semantics/categorical/types.ts:109`

Cocono (dual del cono): un ápice con morfismos *desde* cada vértice.

```ts
export interface Cocone<O, M>
```


## `MonoidalCategory`

> Interface · `semantics/categorical/types.ts:120`

Categoría monoidal: añade producto tensorial y unidad sobre
la estructura categórica. No imponemos asociadores ni unitores
explícitos — los modelos concretos (Set con ×) son estrictos
suficiente para verificar α, λ, ρ por igualdad en objetos.

```ts
export interface MonoidalCategory<O, M> extends Category<O, M>
```

