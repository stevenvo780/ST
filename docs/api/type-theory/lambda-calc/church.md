# `type-theory/lambda-calc/church.ts`

============================================================ λ-cálculo untyped — Church numerals y operaciones aritméticas ============================================================ n̄ = λf.λx. f (f ... (f x) ... )    con n aplicaciones de f. 0̄ = λf.λx.x 1̄ = λf.λx.f x SUCC = λn.λf.λx. f (n f x) PLUS = λm.λn.λf.λx. m f (n f x) MULT = λm.λn.λf. m (n f)

## Contents

- [`churchNumeral`](#churchnumeral) — Function
- [`decodeChurch`](#decodechurch) — Function
- [`evalChurch`](#evalchurch) — Function
- [`churchSucc`](#churchsucc) — Const
- [`churchAdd`](#churchadd) — Const
- [`churchMul`](#churchmul) — Const

## `churchNumeral`

> Function · `type-theory/lambda-calc/church.ts:18`

```ts
export function churchNumeral(n: number): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`Term` — 


## `decodeChurch`

> Function · `type-theory/lambda-calc/church.ts:30`

```ts
export function decodeChurch(t: Term): number | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`number \| null` — 


## `evalChurch`

> Function · `type-theory/lambda-calc/church.ts:49`

```ts
export function evalChurch(t: Term, maxSteps = 5000): number | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`number \| null` — 


## `churchSucc`

> Const · `type-theory/lambda-calc/church.ts:56`

```ts
const churchSucc: Term
```


## `churchAdd`

> Const · `type-theory/lambda-calc/church.ts:62`

```ts
const churchAdd: Term
```


## `churchMul`

> Const · `type-theory/lambda-calc/church.ts:68`

```ts
const churchMul: Term
```

