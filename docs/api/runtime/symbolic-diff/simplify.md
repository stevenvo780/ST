# `runtime/symbolic-diff/simplify.ts`

## Contents

- [`simplify`](#simplify) — Function
- [`exprEquals`](#exprequals) — Function

## `simplify`

> Function · `runtime/symbolic-diff/simplify.ts:37`

Simplificación algebraica: constant folding + identidades básicas
(x+0=x, x*1=x, x*0=0, x^0=1, x^1=x, neg(neg(x))=x).

No intenta factorización ni canonicalización total (eso sería CAS).
Aplica recursivamente hasta punto fijo (máx 10 pases).

```ts
export function simplify(expr: Expr): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |

### Returns

`Expr` — 


## `exprEquals`

> Function · `runtime/symbolic-diff/simplify.ts:156`

```ts
export function exprEquals(a: Expr, b: Expr): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Expr` | no |  |
| `b` | `Expr` | no |  |

### Returns

`boolean` — 

