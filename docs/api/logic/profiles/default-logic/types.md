# `logic/profiles/default-logic/types.ts`

============================================================ ST Default Logic (Reiter) — Tipos ============================================================ Lógica default de Reiter (1980). Una default rule:     α : β1, ..., βn / γ significa "si α se cree y cada βi es consistente con las creencias actuales, entonces concluye γ". Una extensión es un punto fijo del operador inducido por la teoría: el conjunto de creencias estable donde todos los defaults aplicables ya fueron aplicados y ninguno más aplica sin generar inconsistencia. Limitación v1: prerequisites, justifications y consequents son literales (ground): "P" o "¬P". La consistencia se verifica buscando pares L/¬L en el conjunto de creencias. Esto cubre todos los ejemplos clásicos (Tweety, Nixon-diamond, etc.) sin SAT completo. ============================================================

## Contents

- [`DefaultRule`](#defaultrule) — Interface
- [`DefaultTheory`](#defaulttheory) — Interface
- [`Extension`](#extension) — Interface
- [`ComputeOptions`](#computeoptions) — Interface
- [`DEFAULT_MAX_EXTENSIONS`](#default-max-extensions) — Const
- [`DEFAULT_MAX_DEFAULTS`](#default-max-defaults) — Const

## `DefaultRule`

> Interface · `logic/profiles/default-logic/types.ts:21`

```ts
export interface DefaultRule
```


## `DefaultTheory`

> Interface · `logic/profiles/default-logic/types.ts:31`

```ts
export interface DefaultTheory
```


## `Extension`

> Interface · `logic/profiles/default-logic/types.ts:37`

```ts
export interface Extension
```


## `ComputeOptions`

> Interface · `logic/profiles/default-logic/types.ts:44`

```ts
export interface ComputeOptions
```


## `DEFAULT_MAX_EXTENSIONS`

> Const · `logic/profiles/default-logic/types.ts:51`

```ts
const DEFAULT_MAX_EXTENSIONS
```


## `DEFAULT_MAX_DEFAULTS`

> Const · `logic/profiles/default-logic/types.ts:52`

```ts
const DEFAULT_MAX_DEFAULTS
```

