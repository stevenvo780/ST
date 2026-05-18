# `reasoning/automata/regex.ts`

============================================================ ST Automata — Regex parsing + Thompson construction ============================================================ Gramática soportada (precedencia: postfix > concat > '|'):   expr   := term ( '|' term )*   term   := factor*                (concatenación implícita)   factor := atom ( '*' | '+' | '?' )*   atom   := char | '(' expr ')' | '∅' (vacío) | 'ε' Caracteres reservados: ( ) | * + ?  → escapar con '\'. '∅' y 'ε' son atómicos opcionales (no son obligatorios para parsear). `regexToNfa` construye un NFA por la construcción de Thompson: para cada operador un fragmento con un único initial y un único accept. ============================================================

## Contents

- [`parseRegex`](#parseregex) — Function
- [`regexToNfa`](#regextonfa) — Function
- [`regexMatches`](#regexmatches) — Function

## `parseRegex`

> Function · `reasoning/automata/regex.ts:114`

```ts
export function parseRegex(s: string): Regex
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `string` | no |  |

### Returns

`Regex` — 


## `regexToNfa`

> Function · `reasoning/automata/regex.ts:237`

```ts
export function regexToNfa(r: Regex): NFA
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `Regex` | no |  |

### Returns

`NFA` — 


## `regexMatches`

> Function · `reasoning/automata/regex.ts:280`

Atajo: ¿la expresión regular `r` matchea exactamente `s`?

```ts
export function regexMatches(r: Regex, s: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `Regex` | no |  |
| `s` | `string` | no |  |

### Returns

`boolean` — 

