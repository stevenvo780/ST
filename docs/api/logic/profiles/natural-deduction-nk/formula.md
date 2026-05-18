# `logic/profiles/natural-deduction-nk/formula.ts`

============================================================ Helpers de fórmulas clásicas (NK) ============================================================ Estructuralmente idéntico al de NJ; la diferencia con la lógica intuicionista no está en la sintaxis sino en las reglas admisibles.

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

> Function · `logic/profiles/natural-deduction-nk/formula.ts:14`

Clave sintáctica estable para deduplicación / memoización.

```ts
export function formulaKey(f: NKFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `NKFormula` | no |  |

### Returns

`string` — 


## `formulaEquals`

> Function · `logic/profiles/natural-deduction-nk/formula.ts:32`

Igualdad sintáctica entre dos fórmulas NK por comparación de claves.

```ts
export function formulaEquals(a: NKFormula, b: NKFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `NKFormula` | no |  |
| `b` | `NKFormula` | no |  |

### Returns

`boolean` — 


## `formulaToString`

> Function · `logic/profiles/natural-deduction-nk/formula.ts:37`

Renderiza una fórmula NK en notación textual (¬, ∧, ∨, →, ⊥).

```ts
export function formulaToString(f: NKFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `NKFormula` | no |  |

### Returns

`string` — 


## `collectAtoms`

> Function · `logic/profiles/natural-deduction-nk/formula.ts:62`

Recolecta los átomos proposicionales que aparecen en `f`.

```ts
export function collectAtoms(f: NKFormula, out: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `NKFormula` | no |  |
| `out` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `atom`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:82`

Átomo proposicional clásico.

```ts
const atom
```


## `bottom`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:84`

Constante de falsedad ⊥.

```ts
const bottom
```


## `not`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:86`

Negación: ¬φ.

```ts
const not
```


## `and`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:88`

Conjunción: left ∧ right.

```ts
const and
```


## `or`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:94`

Disyunción: left ∨ right.

```ts
const or
```


## `implies`

> Const · `logic/profiles/natural-deduction-nk/formula.ts:100`

Implicación: left → right.

```ts
const implies
```

