# `tooling/mathlib/types.ts`

Estructura algebraica genérica: un dominio de elementos + un
diccionario de operaciones + una lista de axiomas declarados.

`elements` puede ser un arreglo finito (para grupos finitos como S_3)
o un generador indexado (para anillos infinitos como Z donde se
muestrea un subconjunto representativo).

## Contents

- [`AlgebraicStructure`](#algebraicstructure) — Interface
- [`AlgebraAxiom`](#algebraaxiom) — Interface
- [`PartialOrder`](#partialorder) — Interface
- [`TotalOrder`](#totalorder) — Interface
- [`Magma`](#magma) — Interface
- [`Semigroup`](#semigroup) — Interface
- [`Monoid`](#monoid) — Interface
- [`Group`](#group) — Interface
- [`AbelianGroup`](#abeliangroup) — Interface
- [`Ring`](#ring) — Interface
- [`Lemma`](#lemma) — Interface
- [`VerificationResult`](#verificationresult) — Interface

## `AlgebraicStructure`

> Interface · `tooling/mathlib/types.ts:14`

Estructura algebraica genérica: un dominio de elementos + un
diccionario de operaciones + una lista de axiomas declarados.

`elements` puede ser un arreglo finito (para grupos finitos como S_3)
o un generador indexado (para anillos infinitos como Z donde se
muestrea un subconjunto representativo).

```ts
export interface AlgebraicStructure<T>
```


## `AlgebraAxiom`

> Interface · `tooling/mathlib/types.ts:25`

Un axioma con su fórmula informal (template) y un verificador
computacional opcional que decide si los elementos lo cumplen.

```ts
export interface AlgebraAxiom
```


## `PartialOrder`

> Interface · `tooling/mathlib/types.ts:35`

```ts
export interface PartialOrder<T>
```


## `TotalOrder`

> Interface · `tooling/mathlib/types.ts:39`

```ts
export interface TotalOrder<T> extends PartialOrder<T>
```


## `Magma`

> Interface · `tooling/mathlib/types.ts:47`

```ts
export interface Magma<T>
```


## `Semigroup`

> Interface · `tooling/mathlib/types.ts:53`

```ts
export interface Semigroup<T> extends Magma<T>
```


## `Monoid`

> Interface · `tooling/mathlib/types.ts:57`

```ts
export interface Monoid<T> extends Semigroup<T>
```


## `Group`

> Interface · `tooling/mathlib/types.ts:61`

```ts
export interface Group<T> extends Monoid<T>
```


## `AbelianGroup`

> Interface · `tooling/mathlib/types.ts:65`

```ts
export interface AbelianGroup<T> extends Group<T>
```


## `Ring`

> Interface · `tooling/mathlib/types.ts:73`

```ts
export interface Ring<T>
```


## `Lemma`

> Interface · `tooling/mathlib/types.ts:85`

```ts
export interface Lemma
```


## `VerificationResult`

> Interface · `tooling/mathlib/types.ts:96`

```ts
export interface VerificationResult
```

