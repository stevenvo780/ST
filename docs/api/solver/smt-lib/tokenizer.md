# `solver/smt-lib/tokenizer.ts`

============================================================ SMT-LIB v2 — Tokenizer ============================================================ Genera una secuencia plana de tokens a partir de un script SMT-LIB v2. Soporta:   - paréntesis `(` `)`   - comentarios de línea `; ...`   - símbolos simples (`x`, `+`, `<=`, `+foo!`)   - símbolos pipe-quoted `|x con espacios|`   - keywords `:keyword`   - numerales `123`   - decimales `1.5`   - hex `#xAB12`   - binary `#b1010`   - strings `"..."` con escape de comilla `""` El tokenizer no decide semántica: distingue numerales y decimales, pero `+ 1 2` queda como tres tokens-symbol y dos numerales — el parser decide.

## Contents

- [`SmtTokenKind`](#smttokenkind) — Type
- [`SmtToken`](#smttoken) — Interface
- [`SmtTokenizerError`](#smttokenizererror) — Class
- [`tokenize`](#tokenize) — Function

## `SmtTokenKind`

> Type · `solver/smt-lib/tokenizer.ts:21`

```ts
export type SmtTokenKind = | 'lparen' | 'rparen' | 'symbol' | 'keyword' | 'numeral' | 'decimal' | 'hex' | 'binary' | 'string';
```


## `SmtToken`

> Interface · `solver/smt-lib/tokenizer.ts:32`

```ts
export interface SmtToken
```


## `SmtTokenizerError`

> Class · `solver/smt-lib/tokenizer.ts:41`

```ts
export class SmtTokenizerError extends Error
```


## `tokenize`

> Function · `solver/smt-lib/tokenizer.ts:58`

```ts
export function tokenize(input: string): SmtToken[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`SmtToken[]` — 

