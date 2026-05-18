# `logic/profiles/intuitionistic-nj/formula.ts`

============================================================ Helpers de fórmulas intuicionistas ============================================================

## Contents

- [`formulaKey`](#formulakey) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`formulaToString`](#formulatostring) — Function
- [`collectAtoms`](#collectatoms) — Function
- [`atom`](#atom) — Const
- [`bottom`](#bottom) — Const
- [`not`](#not) — Const
- [`and`](#and) — Const
- [`or`](#or) — Const
- [`implies`](#implies) — Const

## `formulaKey`

> Function · `logic/profiles/intuitionistic-nj/formula.ts:11`

Clave sintáctica estable para deduplicación / memoización.
Determinista y libre de ambigüedades por paréntesis explícitos.

```ts
export function formulaKey(f: IntuitFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IntuitFormula` | no |  |

### Returns

`string` — 


## `formulaEquals`

> Function · `logic/profiles/intuitionistic-nj/formula.ts:28`

```ts
export function formulaEquals(a: IntuitFormula, b: IntuitFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `IntuitFormula` | no |  |
| `b` | `IntuitFormula` | no |  |

### Returns

`boolean` — 


## `formulaToString`

> Function · `logic/profiles/intuitionistic-nj/formula.ts:32`

```ts
export function formulaToString(f: IntuitFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IntuitFormula` | no |  |

### Returns

`string` — 


## `collectAtoms`

> Function · `logic/profiles/intuitionistic-nj/formula.ts:57`

Recolecta los átomos proposicionales (por nombre) que aparecen en `f`.

```ts
export function collectAtoms(f: IntuitFormula, out: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IntuitFormula` | no |  |
| `out` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `atom`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:76`

```ts
const atom
```


## `bottom`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:77`

```ts
const bottom
```


## `not`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:78`

```ts
const not
```


## `and`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:79`

```ts
const and
```


## `or`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:84`

```ts
const or
```


## `implies`

> Const · `logic/profiles/intuitionistic-nj/formula.ts:89`

```ts
const implies
```

