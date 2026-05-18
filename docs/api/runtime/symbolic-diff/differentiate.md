# `runtime/symbolic-diff/differentiate.ts`

## Contents

- [`differentiate`](#differentiate) — Function
- [`gradient`](#gradient) — Function
- [`variable`](#variable) — Const

## `differentiate`

> Function · `runtime/symbolic-diff/differentiate.ts:31`

Diferenciación simbólica respecto a `varName`.

Reglas:
- Linealidad: d/dx(f+g) = f' + g'
- Producto: d/dx(f*g) = f'*g + f*g'  (generalizado a N factores)
- Cociente: d/dx(f/g) = (f'*g - f*g') / g^2
- Cadena: d/dx(f(g(x))) = f'(g(x)) * g'(x)
- Potencia general: d/dx(f^g) = f^g * (g'*ln(f) + g*f'/f)
  (caso especial: exponente constante → g*f^(g-1)*f')

El resultado se simplifica antes de devolverse.

```ts
export function differentiate(expr: Expr, varName: string): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |
| `varName` | `string` | no |  |

### Returns

`Expr` — 


## `gradient`

> Function · `runtime/symbolic-diff/differentiate.ts:124`

Gradiente: lista de derivadas parciales por variable.

```ts
export function gradient(expr: Expr, vars: string[]): Expr[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `expr` | `Expr` | no |  |
| `vars` | `string[]` | no |  |

### Returns

`Expr[]` — 


## `variable`

> Const · `runtime/symbolic-diff/differentiate.ts:129`

```ts
const variable
```

