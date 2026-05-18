# `reasoning/tactic-dsl/tactics.ts`

============================================================ Tactic DSL — tactics built-in ============================================================ Cada tactic recibe un ProofState y devuelve un ProofState nuevo (inmutable). Si la tactic no aplica al goal actual, lanza TacticError. Eso permite que `orElse` capture la falla y pruebe otra alternativa. Convención: el goal "activo" es siempre `state.goals[0]`. Las reglas que generan sub-goals (split, induction, destruct, …) los insertan al frente para que se trabajen en orden.

## Contents

- [`_resetGoalCounter`](#resetgoalcounter) — Function
- [`intro`](#intro) — Function
- [`exact`](#exact) — Function
- [`assumption`](#assumption) — Function
- [`apply`](#apply) — Function
- [`rewrite`](#rewrite) — Function
- [`rfl`](#rfl) — Function
- [`trivial`](#trivial) — Function
- [`split`](#split) — Function
- [`left`](#left) — Function
- [`right`](#right) — Function
- [`destruct`](#destruct) — Function
- [`induction`](#induction) — Function
- [`caseAnalysis`](#caseanalysis) — Function
- [`DefDictionary`](#defdictionary) — Interface
- [`unfold`](#unfold) — Function
- [`simp`](#simp) — Function

## `_resetGoalCounter`

> Function · `reasoning/tactic-dsl/tactics.ts:31`

```ts
export function _resetGoalCounter(): void
```

### Returns

`void` — 


## `intro`

> Function · `reasoning/tactic-dsl/tactics.ts:73`

```ts
export function intro(name?: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | yes |  |

### Returns

`Tactic` — 


## `exact`

> Function · `reasoning/tactic-dsl/tactics.ts:113`

```ts
export function exact(term: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `string` | no |  |

### Returns

`Tactic` — 


## `assumption`

> Function · `reasoning/tactic-dsl/tactics.ts:135`

```ts
export function assumption(): Tactic
```

### Returns

`Tactic` — 


## `apply`

> Function · `reasoning/tactic-dsl/tactics.ts:164`

```ts
export function apply(thm: string, args?: string[]): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `thm` | `string` | no |  |
| `args` | `string[]` | yes |  |

### Returns

`Tactic` — 


## `rewrite`

> Function · `reasoning/tactic-dsl/tactics.ts:222`

```ts
export function rewrite( eq: string, dir: 'left-to-right' | 'right-to-left' = 'left-to-right', ): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eq` | `string` | no |  |
| `dir` | `'left-to-right' \| 'right-to-left'` | yes |  |

### Returns

`Tactic` — 


## `rfl`

> Function · `reasoning/tactic-dsl/tactics.ts:257`

```ts
export function rfl(): Tactic
```

### Returns

`Tactic` — 


## `trivial`

> Function · `reasoning/tactic-dsl/tactics.ts:275`

```ts
export function trivial(): Tactic
```

### Returns

`Tactic` — 


## `split`

> Function · `reasoning/tactic-dsl/tactics.ts:298`

```ts
export function split(): Tactic
```

### Returns

`Tactic` — 


## `left`

> Function · `reasoning/tactic-dsl/tactics.ts:317`

```ts
export function left(): Tactic
```

### Returns

`Tactic` — 


## `right`

> Function · `reasoning/tactic-dsl/tactics.ts:330`

```ts
export function right(): Tactic
```

### Returns

`Tactic` — 


## `destruct`

> Function · `reasoning/tactic-dsl/tactics.ts:348`

```ts
export function destruct(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `induction`

> Function · `reasoning/tactic-dsl/tactics.ts:399`

```ts
export function induction(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `caseAnalysis`

> Function · `reasoning/tactic-dsl/tactics.ts:452`

```ts
export function caseAnalysis(name: string): Tactic
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`Tactic` — 


## `DefDictionary`

> Interface · `reasoning/tactic-dsl/tactics.ts:462`

```ts
export interface DefDictionary
```


## `unfold`

> Function · `reasoning/tactic-dsl/tactics.ts:466`

```ts
export function unfold(def: string, dict: DefDictionary =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `def` | `string` | no |  |
| `dict` | `DefDictionary` | yes |  |

### Returns

`Tactic` — 


## `simp`

> Function · `reasoning/tactic-dsl/tactics.ts:496`

```ts
export function simp(): Tactic
```

### Returns

`Tactic` — 

