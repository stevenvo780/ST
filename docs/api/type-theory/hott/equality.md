# `type-theory/hott/equality.ts`

============================================================ HoTT — α-equivalencia e igualdad definicional (αβ) ============================================================

## Contents

- [`alphaEqHoTT`](#alphaeqhott) — Function
- [`alphaBetaEqHoTT`](#alphabetaeqhott) — Function

## `alphaEqHoTT`

> Function · `type-theory/hott/equality.ts:11`

```ts
export function alphaEqHoTT(a: HoTTTerm, b: HoTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HoTTTerm` | no |  |
| `b` | `HoTTTerm` | no |  |

### Returns

`boolean` — 


## `alphaBetaEqHoTT`

> Function · `type-theory/hott/equality.ts:113`

```ts
export function alphaBetaEqHoTT(a: HoTTTerm, b: HoTTTerm, _ctx?: Map<string, HoTTTerm>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HoTTTerm` | no |  |
| `b` | `HoTTTerm` | no |  |
| `_ctx` | `Map<string, HoTTTerm>` | yes |  |

### Returns

`boolean` — 

