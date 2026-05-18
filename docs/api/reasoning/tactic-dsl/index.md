# `reasoning/tactic-dsl/index.ts`

============================================================ Tactic DSL — entry point ============================================================ Pequeño DSL al estilo Lean/Coq para construir pruebas hacia atrás (backwards) a partir de un goal. El motor:   - mantiene una lista de goals abiertos   - cada tactic transforma el goal frontal   - los combinators (seq/orElse/repeat_/tryAlt) componen tactics La meta-prueba se considera completa cuando no quedan goals. El estado lleva un `history` que registra invocaciones para que el caller pueda renderizar el proof script reproducible. Nombres: la API original (Coq/Lean) usa `then` para encadenar tactics. Por interop con vitest/ESM (un módulo ES con export `then` se trata como thenable y bloquea el import), el combinador se llama `seq` a nivel de export. Para mantener el lenguaje Coq-like, exportamos un namespace `T` con `T.then = seq`.

## Contents

- [`case_`](#case) — Const
- [`T`](#t) — Const
- [`startProof`](#startproof) — Function
- [`runTactic`](#runtactic) — Function
- [`isProven`](#isproven) — Function
- [`summary`](#summary) — Function
- [`_resetCounters`](#resetcounters) — Function

## `case_`

> Const · `reasoning/tactic-dsl/index.ts:66`

```ts
const case_
```


## `T`

> Const · `reasoning/tactic-dsl/index.ts:75`

```ts
const T
```


## `startProof`

> Function · `reasoning/tactic-dsl/index.ts:103`

```ts
export function startProof(goal: string, hyps: Record<string, string> =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `goal` | `string` | no |  |
| `hyps` | `Record<string, string>` | yes |  |

### Returns

`ProofState` — 


## `runTactic`

> Function · `reasoning/tactic-dsl/index.ts:123`

```ts
export function runTactic(state: ProofState, t: Tactic): ProofState
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |
| `t` | `Tactic` | no |  |

### Returns

`ProofState` — 


## `isProven`

> Function · `reasoning/tactic-dsl/index.ts:127`

```ts
export function isProven(state: ProofState): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |

### Returns

`boolean` — 


## `summary`

> Function · `reasoning/tactic-dsl/index.ts:131`

```ts
export function summary(state: ProofState): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ProofState` | no |  |

### Returns

`string` — 


## `_resetCounters`

> Function · `reasoning/tactic-dsl/index.ts:174`

```ts
export function _resetCounters(): void
```

### Returns

`void` — 

