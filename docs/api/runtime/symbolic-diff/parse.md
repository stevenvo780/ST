# `runtime/symbolic-diff/parse.ts`

## `parse`

> Function · `runtime/symbolic-diff/parse.ts:18`

Parser de expresiones algebraicas/trascendentales.

Gramática (precedencia ascendente):
  expr    := term (('+' | '-') term)*
  term    := factor (('*' | '/') factor)*
  factor  := unary ('^' factor)?     // ^ right-assoc
  unary   := '-' unary | atom
  atom    := number | ident '(' expr ')' | ident | '(' expr ')'

Soporta funciones: sin, cos, tan, log, exp.
Implícito *: NO se soporta (escribir `2*x`, no `2x`).

```ts
export function parse(input: string): Expr
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`Expr` — 

