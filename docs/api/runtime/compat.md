# `runtime/compat.ts`

## Contents

- [`ReplCompatState`](#replcompatstate) — Interface
- [`ReplCompatContext`](#replcompatcontext) — Interface
- [`ReplTransformResult`](#repltransformresult) — Type
- [`normalizeSTSource`](#normalizestsource) — Function
- [`createReplCompatState`](#createreplcompatstate) — Function
- [`transformReplInput`](#transformreplinput) — Function

## `ReplCompatState`

> Interface · `runtime/compat.ts:20`

```ts
export interface ReplCompatState
```


## `ReplCompatContext`

> Interface · `runtime/compat.ts:29`

```ts
export interface ReplCompatContext
```


## `ReplTransformResult`

> Type · `runtime/compat.ts:33`

```ts
export type ReplTransformResult = | { kind: 'buffered'; source: string; message: string } | { kind: 'execute'; source: string } | { kind: 'executeSingle'; source: string };
```


## `normalizeSTSource`

> Function · `runtime/compat.ts:821`

```ts
export function normalizeSTSource(source: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |

### Returns

`string` — 


## `createReplCompatState`

> Function · `runtime/compat.ts:878`

```ts
export function createReplCompatState(): ReplCompatState
```

### Returns

`ReplCompatState` — 


## `transformReplInput`

> Function · `runtime/compat.ts:962`

```ts
export function transformReplInput( source: string, state: ReplCompatState, context?: ReplCompatContext, ): ReplTransformResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `source` | `string` | no |  |
| `state` | `ReplCompatState` | no |  |
| `context` | `ReplCompatContext` | yes |  |

### Returns

`ReplTransformResult` — 

