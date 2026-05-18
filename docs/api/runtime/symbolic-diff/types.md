# `runtime/symbolic-diff/types.ts`

## Contents

- [`UnaryFn`](#unaryfn) — Type
- [`Expr`](#expr) — Type
- [`UNARY_FUNCTIONS`](#unary-functions) — Const
- [`isUnaryFn`](#isunaryfn) — Function

## `UnaryFn`

> Type · `runtime/symbolic-diff/types.ts:1`

```ts
export type UnaryFn = 'sin' | 'cos' | 'tan' | 'log' | 'exp';
```


## `Expr`

> Type · `runtime/symbolic-diff/types.ts:3`

```ts
export type Expr = | { kind: 'const'; value: number } | { kind: 'var'; name: string } | { kind: 'add'; args: Expr[] } | { kind: 'mul'; args: Expr[] } | { kind: 'sub'; left: Expr; right: Expr } | { kind: 'div'; left: Expr; right: Expr } | { kind: 'pow'; base: Expr; exp: Expr } | { kind: 'neg'; arg: Expr } | { kind: UnaryFn; arg: Expr };
```


## `UNARY_FUNCTIONS`

> Const · `runtime/symbolic-diff/types.ts:14`

```ts
const UNARY_FUNCTIONS: readonly UnaryFn[]
```


## `isUnaryFn`

> Function · `runtime/symbolic-diff/types.ts:16`

```ts
export function isUnaryFn(kind: string): kind is UnaryFn
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `kind` | `string` | no |  |

### Returns

`kind is UnaryFn` — 

