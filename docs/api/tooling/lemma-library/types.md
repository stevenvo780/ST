# `tooling/lemma-library/types.ts`

Dominio del lema. Las constantes documentadas son los cinco
dominios curados de base, pero se permite cualquier string para
extensiones de usuario.

## Contents

- [`LemmaDomain`](#lemmadomain) — Type
- [`LemmaDifficulty`](#lemmadifficulty) — Type
- [`CuratedLemma`](#curatedlemma) — Interface
- [`TfIdfDocument`](#tfidfdocument) — Interface
- [`TfIdfIndex`](#tfidfindex) — Interface
- [`SemanticSearchHit`](#semanticsearchhit) — Interface
- [`LemmaApplicationResult`](#lemmaapplicationresult) — Interface

## `LemmaDomain`

> Type · `tooling/lemma-library/types.ts:15`

```ts
export type LemmaDomain = 'propositional' | 'firstorder' | 'modal' | 'arithmetic' | 'set' | string;
```


## `LemmaDifficulty`

> Type · `tooling/lemma-library/types.ts:17`

```ts
export type LemmaDifficulty = 'trivial' | 'easy' | 'medium' | 'hard';
```


## `CuratedLemma`

> Interface · `tooling/lemma-library/types.ts:24`

Un lema curado: enunciado canónico + metadata para búsqueda y
aplicación. El campo `statement` se asume en forma normalizada
(ASCII + Unicode lógico estándar: ∧ ∨ ¬ → ↔ ∀ ∃ □ ◇).

```ts
export interface CuratedLemma
```


## `TfIdfDocument`

> Interface · `tooling/lemma-library/types.ts:40`

Documento indexado por TF-IDF: bag-of-words tokenizado con su
frecuencia local y un puntero al lema original.

```ts
export interface TfIdfDocument
```


## `TfIdfIndex`

> Interface · `tooling/lemma-library/types.ts:49`

Índice TF-IDF pre-calculado sobre la biblioteca completa.

```ts
export interface TfIdfIndex
```


## `SemanticSearchHit`

> Interface · `tooling/lemma-library/types.ts:56`

```ts
export interface SemanticSearchHit
```


## `LemmaApplicationResult`

> Interface · `tooling/lemma-library/types.ts:61`

```ts
export interface LemmaApplicationResult
```

