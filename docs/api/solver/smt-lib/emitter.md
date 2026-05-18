# `solver/smt-lib/emitter.ts`

============================================================ SMT-LIB v2 — Emitter ============================================================ Produce texto SMT-LIB v2 a partir de un árbol `SmtCommand[]`. La salida está pensada para ser parseable por solvers reales (z3, cvc5, yices) y para round-trip estable (parse → emit → parse → emit = idempotente). Convenciones:   - paréntesis canónicos, espacio entre tokens.   - identificadores se citan con `|...|` si contienen caracteres no     simples (espacios, caracteres reservados, vacío, empieza con dígito).   - strings emiten escape doble-comilla (SMT-LIB v2.6 §3.1).   - hex/binary preservan los prefijos `#x` / `#b`.

## Contents

- [`quoteSymbol`](#quotesymbol) — Function
- [`emitSort`](#emitsort) — Function
- [`emitTerm`](#emitterm) — Function
- [`emitCommand`](#emitcommand) — Function
- [`emitSmtLib`](#emitsmtlib) — Function

## `quoteSymbol`

> Function · `solver/smt-lib/emitter.ts:21`

Cita un identificador si no es un simple-symbol válido.

```ts
export function quoteSymbol(name: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`string` — 


## `emitSort`

> Function · `solver/smt-lib/emitter.ts:34`

Emite un sort SMT-LIB.

```ts
export function emitSort(sort: SmtSort): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sort` | `SmtSort` | no |  |

### Returns

`string` — 


## `emitTerm`

> Function · `solver/smt-lib/emitter.ts:61`

Emite un término SMT-LIB.

```ts
export function emitTerm(term: SmtTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `SmtTerm` | no |  |

### Returns

`string` — 


## `emitCommand`

> Function · `solver/smt-lib/emitter.ts:112`

Emite un único comando SMT-LIB.

```ts
export function emitCommand(cmd: SmtCommand): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cmd` | `SmtCommand` | no |  |

### Returns

`string` — 


## `emitSmtLib`

> Function · `solver/smt-lib/emitter.ts:168`

Emite un script entero (1 comando por línea).

```ts
export function emitSmtLib(commands: SmtCommand[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `commands` | `SmtCommand[]` | no |  |

### Returns

`string` — 

