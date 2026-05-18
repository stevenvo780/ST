# `logic/profiles/ltl-sat/types.ts`

AST de fórmulas LTL.

Operadores temporales: X (next), F (eventually), G (globally),
U (until), R (release). W (weak-until) se codifica como `or(until, globally)`.

## Contents

- [`LTLFormula`](#ltlformula) — Type
- [`atom`](#atom) — Const
- [`not`](#not) — Const
- [`and`](#and) — Const
- [`or`](#or) — Const
- [`next`](#next) — Const
- [`eventually`](#eventually) — Const
- [`globally`](#globally) — Const
- [`until`](#until) — Const
- [`release`](#release) — Const
- [`weakUntil`](#weakuntil) — Const
- [`implies`](#implies) — Const
- [`Witness`](#witness) — Interface
- [`SatResult`](#satresult) — Interface
- [`formulaToString`](#formulatostring) — Function
- [`formulaKey`](#formulakey) — Function

## `LTLFormula`

> Type · `logic/profiles/ltl-sat/types.ts:18`

AST de fórmulas LTL.

Operadores temporales: X (next), F (eventually), G (globally),
U (until), R (release). W (weak-until) se codifica como `or(until, globally)`.

```ts
export type LTLFormula = | { kind: 'atom'; name: string } | { kind: 'not'; arg: LTLFormula } | { kind: 'and'; args: LTLFormula[] } | { kind: 'or'; args: LTLFormula[] } | { kind: 'X'; arg: LTLFormula } | { kind: 'F'; arg: LTLFormula } | { kind: 'G'; arg: LTLFormula } | { kind: 'U'; left: LTLFormula; right: LTLFormula } | { kind: 'R'; left: LTLFormula; right: LTLFormula };
```


## `atom`

> Const · `logic/profiles/ltl-sat/types.ts:30`

```ts
const atom
```


## `not`

> Const · `logic/profiles/ltl-sat/types.ts:31`

```ts
const not
```


## `and`

> Const · `logic/profiles/ltl-sat/types.ts:32`

```ts
const and
```


## `or`

> Const · `logic/profiles/ltl-sat/types.ts:33`

```ts
const or
```


## `next`

> Const · `logic/profiles/ltl-sat/types.ts:34`

```ts
const next
```


## `eventually`

> Const · `logic/profiles/ltl-sat/types.ts:35`

```ts
const eventually
```


## `globally`

> Const · `logic/profiles/ltl-sat/types.ts:36`

```ts
const globally
```


## `until`

> Const · `logic/profiles/ltl-sat/types.ts:37`

```ts
const until
```


## `release`

> Const · `logic/profiles/ltl-sat/types.ts:42`

```ts
const release
```


## `weakUntil`

> Const · `logic/profiles/ltl-sat/types.ts:48`

```ts
const weakUntil
```


## `implies`

> Const · `logic/profiles/ltl-sat/types.ts:52`

```ts
const implies
```


## `Witness`

> Interface · `logic/profiles/ltl-sat/types.ts:55`

Modelo lasso que satisface una fórmula LTL: prefijo + lazo infinito.

```ts
export interface Witness
```


## `SatResult`

> Interface · `logic/profiles/ltl-sat/types.ts:66`

Resultado de la decisión de satisfacibilidad LTL.
Si `sat` es verdadero, `witness` contiene un modelo lasso.

```ts
export interface SatResult
```


## `formulaToString`

> Function · `logic/profiles/ltl-sat/types.ts:72`

Renderiza una fórmula LTL en notación textual estándar.

```ts
export function formulaToString(f: LTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`string` — 


## `formulaKey`

> Function · `logic/profiles/ltl-sat/types.ts:102`

Clave canónica determinista de una fórmula LTL, usada para hashing en sets/maps.

```ts
export function formulaKey(f: LTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`string` — 

