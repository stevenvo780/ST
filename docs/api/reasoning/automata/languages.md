# `reasoning/automata/languages.ts`

============================================================ ST Automata — Lenguajes estándar de fábrica ============================================================ DFAs / regex de ejemplo, útiles para tests y demos:   · dfaEvenZeros()   — palabras sobre {0,1} con número par de '0'.   · dfaContainsAB()  — palabras sobre {a,b,c} que contienen "ab".   · regexEmail()     — regex simplificada de email. ============================================================

## Contents

- [`dfaEvenZeros`](#dfaevenzeros) — Function
- [`dfaContainsAB`](#dfacontainsab) — Function
- [`regexEmail`](#regexemail) — Function

## `dfaEvenZeros`

> Function · `reasoning/automata/languages.ts:15`

Palabras sobre {0,1} con un número par de ceros.

```ts
export function dfaEvenZeros(): DFA
```

### Returns

`DFA` — 


## `dfaContainsAB`

> Function · `reasoning/automata/languages.ts:43`

Palabras sobre {a,b,c} que contienen "ab" como subcadena.

```ts
export function dfaContainsAB(): DFA
```

### Returns

`DFA` — 


## `regexEmail`

> Function · `reasoning/automata/languages.ts:83`

Regex simplificada de email: letras+ '@' letras+ '.' letras+
 (ASCII inferior, sin números / símbolos). Es deliberadamente
 pedagógica; no aspira a RFC 5322.

```ts
export function regexEmail(): Regex
```

### Returns

`Regex` — 

