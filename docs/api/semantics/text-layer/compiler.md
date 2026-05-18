# `semantics/text-layer/compiler.ts`

ST Text Layer — Compilador texto -> formula/claim

## Contents

- [`createTextLayerState`](#createtextlayerstate) — Function
- [`parseAnchorPath`](#parseanchorpath) — Function
- [`registerPassage`](#registerpassage) — Function
- [`registerFormalization`](#registerformalization) — Function
- [`registerClaim`](#registerclaim) — Function
- [`registerSupport`](#registersupport) — Function
- [`registerConfidence`](#registerconfidence) — Function
- [`registerContext`](#registercontext) — Function
- [`compileClaimsToTheory`](#compileclaimstotheory) — Function
- [`registerDefinition`](#registerdefinition) — Function
- [`registerSource`](#registersource) — Function
- [`registerInterpretation`](#registerinterpretation) — Function

## `createTextLayerState`

> Function · `semantics/text-layer/compiler.ts:18`

```ts
export function createTextLayerState(): TextLayerState
```

### Returns

`TextLayerState` — 


## `parseAnchorPath`

> Function · `semantics/text-layer/compiler.ts:38`

```ts
export function parseAnchorPath(raw: string): Anchor
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `raw` | `string` | no |  |

### Returns

`Anchor` — 


## `registerPassage`

> Function · `semantics/text-layer/compiler.ts:74`

```ts
export function registerPassage( state: TextLayerState, name: string, anchorPath: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `anchorPath` | `string` | no |  |

### Returns

`Diagnostic[]` — 


## `registerFormalization`

> Function · `semantics/text-layer/compiler.ts:91`

```ts
export function registerFormalization( state: TextLayerState, name: string, passageName: string, formula: Formula, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `passageName` | `string` | no |  |
| `formula` | `Formula` | no |  |

### Returns

`Diagnostic[]` — 


## `registerClaim`

> Function · `semantics/text-layer/compiler.ts:111`

```ts
export function registerClaim( state: TextLayerState, name: string, formula?: Formula, formalizationRef?: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `name` | `string` | no |  |
| `formula` | `Formula` | yes |  |
| `formalizationRef` | `string` | yes |  |

### Returns

`Diagnostic[]` — 


## `registerSupport`

> Function · `semantics/text-layer/compiler.ts:135`

```ts
export function registerSupport( state: TextLayerState, claimName: string, sourceName: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `sourceName` | `string` | no |  |

### Returns

`Diagnostic[]` — 


## `registerConfidence`

> Function · `semantics/text-layer/compiler.ts:161`

```ts
export function registerConfidence( state: TextLayerState, claimName: string, value: number, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `value` | `number` | no |  |

### Returns

`Diagnostic[]` — 


## `registerContext`

> Function · `semantics/text-layer/compiler.ts:193`

```ts
export function registerContext( state: TextLayerState, claimName: string, text: string, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `claimName` | `string` | no |  |
| `text` | `string` | no |  |

### Returns

`Diagnostic[]` — 


## `compileClaimsToTheory`

> Function · `semantics/text-layer/compiler.ts:218`

```ts
export function compileClaimsToTheory(state: TextLayerState, theory: Theory): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `theory` | `Theory` | no |  |

### Returns

`Diagnostic[]` — 


## `registerDefinition`

> Function · `semantics/text-layer/compiler.ts:242`

```ts
export function registerDefinition(state: TextLayerState, entry: DefinitionEntry): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `entry` | `DefinitionEntry` | no |  |

### Returns

`Diagnostic[]` — 


## `registerSource`

> Function · `semantics/text-layer/compiler.ts:255`

```ts
export function registerSource(state: TextLayerState, source: SourceInfo): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `source` | `SourceInfo` | no |  |

### Returns

`Diagnostic[]` — 


## `registerInterpretation`

> Function · `semantics/text-layer/compiler.ts:268`

```ts
export function registerInterpretation( state: TextLayerState, key: string, entry: InterpretationEntry, ): Diagnostic[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `TextLayerState` | no |  |
| `key` | `string` | no |  |
| `entry` | `InterpretationEntry` | no |  |

### Returns

`Diagnostic[]` — 

