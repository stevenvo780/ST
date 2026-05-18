# `tooling/tptp/parser.ts`

============================================================ TPTP — Parser ============================================================ Parser para FOF / CNF / TFF light. Gramática simplificada:   tptp_input := annotated_formula | include   annotated_formula := language '(' name ',' role ',' formula ')' '.'   include := 'include' '(' single_quoted ')' '.'   formula := iff_expr   iff_expr := imp_expr (('<=>' | '<~>') imp_expr)?   imp_expr := or_expr (('=>' | '<=') imp_expr)?   or_expr := and_expr ('|' and_expr)*   and_expr := unary_expr ('&' unary_expr)*   unary_expr := '~' unary_expr | quantified | atom_or_paren   quantified := ('!' | '?') '[' var (',' var)* ']' ':' unary_expr   atom_or_paren := '(' formula ')' | atom | term_eq   atom := lower_word ('(' term (',' term)* ')')?   term_eq := term ('=' | '!=') term   term := variable | lower_word ('(' term (',' term)* ')')? TFF light: aceptamos type annotations en argumentos (`![X : $i] : ...`) pero las descartamos para construir la fórmula FOL.

## Contents

- [`TptpParserError`](#tptpparsererror) — Class
- [`parseTptp`](#parsetptp) — Function
- [`parseFormula`](#parseformula) — Function
- [`parseTerm`](#parseterm) — Function

## `TptpParserError`

> Class · `tooling/tptp/parser.ts:37`

```ts
export class TptpParserError extends Error
```


## `parseTptp`

> Function · `tooling/tptp/parser.ts:103`

```ts
export function parseTptp(input: string): TptpProblem
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`TptpProblem` — 


## `parseFormula`

> Function · `tooling/tptp/parser.ts:210`

```ts
export function parseFormula(input: string, lang: TptpLanguage): TptpFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |
| `lang` | `TptpLanguage` | no |  |

### Returns

`TptpFormula` — 


## `parseTerm`

> Function · `tooling/tptp/parser.ts:449`

```ts
export function parseTerm(cur: Cursor | string): TptpTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cur` | `Cursor \| string` | no |  |

### Returns

`TptpTerm` — 

