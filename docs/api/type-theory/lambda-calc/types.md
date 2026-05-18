# `type-theory/lambda-calc/types.ts`

============================================================ λ-cálculo untyped — Términos, constructores y serialización ============================================================ Distinto al módulo curry-howard (typed λ-cálculo con conexión a deducción natural): aquí trabajamos λ puro, sin tipos, con β/η-reducción, varias estrategias de normalización y los combinadores clásicos (I, K, S, Y) + Church numerals.

## Contents

- [`Term`](#term) — Type
- [`v`](#v) — Const
- [`lam`](#lam) — Const
- [`ap`](#ap) — Const
- [`apN`](#apn) — Const
- [`alphaEq`](#alphaeq) — Function
- [`termToString`](#termtostring) — Function

## `Term`

> Type · `type-theory/lambda-calc/types.ts:10`

```ts
export type Term = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; body: Term } | { kind: 'app'; fn: Term; arg: Term };
```


## `v`

> Const · `type-theory/lambda-calc/types.ts:16`

```ts
const v
```


## `lam`

> Const · `type-theory/lambda-calc/types.ts:17`

```ts
const lam
```


## `ap`

> Const · `type-theory/lambda-calc/types.ts:18`

```ts
const ap
```


## `apN`

> Const · `type-theory/lambda-calc/types.ts:21`

```ts
const apN
```


## `alphaEq`

> Function · `type-theory/lambda-calc/types.ts:25`

```ts
export function alphaEq(a: Term, b: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Term` | no |  |
| `b` | `Term` | no |  |

### Returns

`boolean` — 


## `termToString`

> Function · `type-theory/lambda-calc/types.ts:66`

```ts
export function termToString(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 

