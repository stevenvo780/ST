# `tooling/tptp/tokenizer.ts`

============================================================ TPTP — Tokenizer ============================================================

## Contents

- [`TptpTokenKind`](#tptptokenkind) — Type
- [`TptpToken`](#tptptoken) — Interface
- [`TptpTokenizerError`](#tptptokenizererror) — Class
- [`tokenize`](#tokenize) — Function

## `TptpTokenKind`

> Type · `tooling/tptp/tokenizer.ts:5`

```ts
export type TptpTokenKind = | 'lparen' | 'rparen' | 'lbracket' | 'rbracket' | 'comma' | 'dot' | 'colon' | 'lower_word' // p, fof, axiom, modus_ponens | 'upper_word' // X, Y, Variable123 | 'single_quoted' // 'tptp/SET001.ax' | 'distinct_object' // "string" | 'integer' | 'op_not' // ~ | 'op_and' // & | 'op_or' // | | 'op_implies' // => | 'op_iff' // <=> | 'op_xor' // <~> | 'op_nimplies' // <= | 'op_forall' // ! | 'op_exists' // ? | 'op_eq' // = | 'op_neq';
```


## `TptpToken`

> Interface · `tooling/tptp/tokenizer.ts:30`

```ts
export interface TptpToken
```


## `TptpTokenizerError`

> Class · `tooling/tptp/tokenizer.ts:37`

```ts
export class TptpTokenizerError extends Error
```


## `tokenize`

> Function · `tooling/tptp/tokenizer.ts:53`

```ts
export function tokenize(input: string): TptpToken[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`TptpToken[]` — 

