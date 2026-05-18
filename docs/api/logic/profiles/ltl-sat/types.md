# `logic/profiles/ltl-sat/types.ts`

============================================================ ST LTL-SAT — Tipos para el procedimiento de decisión de LTL ============================================================ AST nativo de LTL para el decisor por tableau:   atom, not, and, or, X (next), F (eventually), G (globally),   U (until), R (release). La operación derivada W (weak until) se traduce a R en la normalización: φ W ψ ≡ ψ R (φ ∨ ψ) ≡ (G φ) ∨ (φ U ψ). ============================================================

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

> Type · `logic/profiles/ltl-sat/types.ts:12`

```ts
export type LTLFormula = | { kind: 'atom'; name: string } | { kind: 'not'; arg: LTLFormula } | { kind: 'and'; args: LTLFormula[] } | { kind: 'or'; args: LTLFormula[] } | { kind: 'X'; arg: LTLFormula } | { kind: 'F'; arg: LTLFormula } | { kind: 'G'; arg: LTLFormula } | { kind: 'U'; left: LTLFormula; right: LTLFormula } | { kind: 'R'; left: LTLFormula; right: LTLFormula };
```


## `atom`

> Const · `logic/profiles/ltl-sat/types.ts:24`

```ts
const atom
```


## `not`

> Const · `logic/profiles/ltl-sat/types.ts:25`

```ts
const not
```


## `and`

> Const · `logic/profiles/ltl-sat/types.ts:26`

```ts
const and
```


## `or`

> Const · `logic/profiles/ltl-sat/types.ts:27`

```ts
const or
```


## `next`

> Const · `logic/profiles/ltl-sat/types.ts:28`

```ts
const next
```


## `eventually`

> Const · `logic/profiles/ltl-sat/types.ts:29`

```ts
const eventually
```


## `globally`

> Const · `logic/profiles/ltl-sat/types.ts:30`

```ts
const globally
```


## `until`

> Const · `logic/profiles/ltl-sat/types.ts:31`

```ts
const until
```


## `release`

> Const · `logic/profiles/ltl-sat/types.ts:36`

```ts
const release
```


## `weakUntil`

> Const · `logic/profiles/ltl-sat/types.ts:42`

```ts
const weakUntil
```


## `implies`

> Const · `logic/profiles/ltl-sat/types.ts:46`

```ts
const implies
```


## `Witness`

> Interface · `logic/profiles/ltl-sat/types.ts:48`

```ts
export interface Witness
```


## `SatResult`

> Interface · `logic/profiles/ltl-sat/types.ts:53`

```ts
export interface SatResult
```


## `formulaToString`

> Function · `logic/profiles/ltl-sat/types.ts:58`

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

> Function · `logic/profiles/ltl-sat/types.ts:88`

```ts
export function formulaKey(f: LTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LTLFormula` | no |  |

### Returns

`string` — 

