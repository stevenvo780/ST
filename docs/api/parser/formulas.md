# `parser/formulas.ts`

============================================================ ST Parser — Parsing de formulas con precedencia ============================================================ Precedencia (de menor a mayor):   1. <-> (bicondicional)   2. -> (implicacion, asocia a la derecha)   3. | / xor / nor (disyuncion)   4. U (until temporal, entre disyuncion y conjuncion)   5. & / nand (conjuncion)   6. comparacion (<, >, <=, >=)   7. aditiva (+ -)   8. multiplicativa (* / %)   9. unario (! -unario [] <> forall exists X)  10. postfix (indexacion [...])  11. primary (atomos, parens, predicados, fn calls)

## Contents

- [`MODAL_ALIASES`](#modal-aliases) — Const
- [`parseFormula`](#parseformula) — Function
- [`formulaToString`](#formulatostring) — Function
- [`parseIdList`](#parseidlist) — Function

## `MODAL_ALIASES`

> Const · `parser/formulas.ts:23`

```ts
const MODAL_ALIASES: Record<string, Record<string, 'box' | 'diamond' | 'box_not'>>
```


## `parseFormula`

> Function · `parser/formulas.ts:33`

```ts
export function parseFormula(s: ParserState): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `ParserState` | no |  |

### Returns

`Formula` — 


## `formulaToString`

> Function · `parser/formulas.ts:471`

```ts
export function formulaToString(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `parseIdList`

> Function · `parser/formulas.ts:537`

```ts
export function parseIdList(s: ParserState): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `ParserState` | no |  |

### Returns

`string[]` — 

