# `logic/profiles/shared/tableau-engine.ts`

============================================================ ST Tableau Engine — Motor genérico de Labeled Tableau ============================================================ Parametrizable con FrameRules para soportar distintos sistemas modales (K, KD, S4, S5, etc.) sin duplicar código. ============================================================

## Contents

- [`LabeledNode`](#labelednode) — Interface
- [`GammaWatcher`](#gammawatcher) — Interface
- [`Branch`](#branch) — Interface
- [`FrameRules`](#framerules) — Interface
- [`FRAME_K`](#frame-k) — Const
- [`FRAME_KD`](#frame-kd) — Const
- [`FRAME_S5`](#frame-s5) — Const
- [`FRAME_T`](#frame-t) — Const
- [`FRAME_S4`](#frame-s4) — Const
- [`formulaEqual`](#formulaequal) — Function
- [`formulaHash`](#formulahash) — Function
- [`eliminateConnectives`](#eliminateconnectives) — Function
- [`fullNNF`](#fullnnf) — Function
- [`ExpandResult`](#expandresult) — Interface
- [`makeBranch`](#makebranch) — Function
- [`checkTableau`](#checktableau) — Function
- [`isValid`](#isvalid) — Function
- [`isSatisfiable`](#issatisfiable) — Function

## `LabeledNode`

> Interface · `logic/profiles/shared/tableau-engine.ts:13`

```ts
export interface LabeledNode
```


## `GammaWatcher`

> Interface · `logic/profiles/shared/tableau-engine.ts:18`

```ts
export interface GammaWatcher
```


## `Branch`

> Interface · `logic/profiles/shared/tableau-engine.ts:23`

```ts
export interface Branch
```


## `FrameRules`

> Interface · `logic/profiles/shared/tableau-engine.ts:40`

FrameRules parametriza el comportamiento del tableau según
las propiedades de la relación de accesibilidad.

```ts
export interface FrameRules
```


## `FRAME_K`

> Const · `logic/profiles/shared/tableau-engine.ts:71`

K: sin restricciones — gamma solo a accesibles, delta solo instancia watchers del source

```ts
const FRAME_K: FrameRules
```


## `FRAME_KD`

> Const · `logic/profiles/shared/tableau-engine.ts:81`

KD: K + serialidad (todo mundo tiene al menos un sucesor)

```ts
const FRAME_KD: FrameRules
```


## `FRAME_S5`

> Const · `logic/profiles/shared/tableau-engine.ts:120`

S5: relación universal — gamma se instancia en TODOS los mundos

```ts
const FRAME_S5: FrameRules
```


## `FRAME_T`

> Const · `logic/profiles/shared/tableau-engine.ts:131`

T (reflexivo): K + reflexividad

```ts
const FRAME_T: FrameRules
```


## `FRAME_S4`

> Const · `logic/profiles/shared/tableau-engine.ts:144`

S4: reflexivo + transitivo

```ts
const FRAME_S4: FrameRules
```


## `formulaEqual`

> Function · `logic/profiles/shared/tableau-engine.ts:177`

```ts
export function formulaEqual(a: Formula, b: Formula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Formula` | no |  |
| `b` | `Formula` | no |  |

### Returns

`boolean` — 


## `formulaHash`

> Function · `logic/profiles/shared/tableau-engine.ts:246`

```ts
export function formulaHash(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `eliminateConnectives`

> Function · `logic/profiles/shared/tableau-engine.ts:285`

```ts
export function eliminateConnectives(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `fullNNF`

> Function · `logic/profiles/shared/tableau-engine.ts:309`

```ts
export function fullNNF(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `ExpandResult`

> Interface · `logic/profiles/shared/tableau-engine.ts:468`

```ts
export interface ExpandResult
```


## `makeBranch`

> Function · `logic/profiles/shared/tableau-engine.ts:739`

```ts
export function makeBranch(nodes: LabeledNode[]): Branch
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `nodes` | `LabeledNode[]` | no |  |

### Returns

`Branch` — 


## `checkTableau`

> Function · `logic/profiles/shared/tableau-engine.ts:747`

```ts
export function checkTableau( formula: Formula, rules: FrameRules, isValidityCheck: boolean, ): ExpandResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `rules` | `FrameRules` | no |  |
| `isValidityCheck` | `boolean` | no |  |

### Returns

`ExpandResult` — 


## `isValid`

> Function · `logic/profiles/shared/tableau-engine.ts:776`

```ts
export function isValid(formula: Formula, rules: FrameRules): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `rules` | `FrameRules` | no |  |

### Returns

`boolean` — 


## `isSatisfiable`

> Function · `logic/profiles/shared/tableau-engine.ts:780`

```ts
export function isSatisfiable(formula: Formula, rules: FrameRules): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `Formula` | no |  |
| `rules` | `FrameRules` | no |  |

### Returns

`boolean` — 

