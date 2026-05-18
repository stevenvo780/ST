# `runtime/known-theorems.ts`

## Contents

- [`KnownTheorem`](#knowntheorem) — Interface
- [`MODAL_THEOREMS`](#modal-theorems) — Const
- [`identifyTheorem`](#identifytheorem) — Function

## `KnownTheorem`

> Interface · `runtime/known-theorems.ts:5`

```ts
export interface KnownTheorem
```


## `MODAL_THEOREMS`

> Const · `runtime/known-theorems.ts:14`

```ts
const MODAL_THEOREMS: KnownTheorem[]
```


## `identifyTheorem`

> Function · `runtime/known-theorems.ts:151`

```ts
export function identifyTheorem(f: Formula, system: string): KnownTheorem | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |
| `system` | `string` | no |  |

### Returns

`KnownTheorem \| undefined` — 

