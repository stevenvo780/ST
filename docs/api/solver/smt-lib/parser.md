# `solver/smt-lib/parser.ts`

============================================================ SMT-LIB v2 — Parser (recursive-descent sobre S-expressions) ============================================================ Convierte el stream de tokens (tokenizer.ts) en árboles `SmtCommand`, `SmtTerm` y `SmtSort`. Estrictamente sintáctico: no valida sorts, aridad de funciones ni que las lógicas sean conocidas — se queda con el árbol y deja la validación semántica al consumidor (backend, traductor, etc.). Filosofía: si la entrada está fuera del subset privilegiado (let, forall, exists, match, !), igualmente colapsa a `{ kind: 'app', fn, args }` con la cabeza preservada como string. Eso garantiza que `parse → emit` no pierde información en programas reales.

## Contents

- [`SmtParserError`](#smtparsererror) — Class
- [`parseSmtLib`](#parsesmtlib) — Function
- [`parseTerm`](#parseterm) — Function
- [`parseSort`](#parsesort) — Function

## `SmtParserError`

> Class · `solver/smt-lib/parser.ts:18`

```ts
export class SmtParserError extends Error
```


## `parseSmtLib`

> Function · `solver/smt-lib/parser.ts:584`

Parse de un script SMT-LIB completo.

```ts
export function parseSmtLib(input: string): SmtCommand[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`SmtCommand[]` — 


## `parseTerm`

> Function · `solver/smt-lib/parser.ts:595`

Parse de un único término. Útil para tests y bridges.

```ts
export function parseTerm(input: string): SmtTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`SmtTerm` — 


## `parseSort`

> Function · `solver/smt-lib/parser.ts:607`

Parse de un único sort.

```ts
export function parseSort(input: string): SmtSort
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `input` | `string` | no |  |

### Returns

`SmtSort` — 

