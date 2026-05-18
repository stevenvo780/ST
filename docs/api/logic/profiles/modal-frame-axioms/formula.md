# `logic/profiles/modal-frame-axioms/formula.ts`

============================================================ Helpers de fórmulas modales ============================================================ La estructura {@link ModalFormula} admite tanto campos específicos (`arg`, `left`, `right`) como un `args` n-ario para flexibilidad. Aquí se normaliza el acceso: las funciones de extracción aceptan ambos formatos y los constructores producen la forma canónica con campos específicos (+ `args` espejo).

## Contents

- [`atom`](#atom) — Const
- [`not`](#not) — Const
- [`and`](#and) — Const
- [`or`](#or) — Const
- [`implies`](#implies) — Const
- [`box`](#box) — Const
- [`diamond`](#diamond) — Const
- [`formulaKey`](#formulakey) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`formulaToString`](#formulatostring) — Function
- [`collectAtoms`](#collectatoms) — Function
- [`subUnary`](#subunary) — Const
- [`subLeft`](#subleft) — Const
- [`subRight`](#subright) — Const

## `atom`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:39`

```ts
const atom
```


## `not`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:41`

```ts
const not
```


## `and`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:43`

```ts
const and
```


## `or`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:50`

```ts
const or
```


## `implies`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:57`

```ts
const implies
```


## `box`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:64`

```ts
const box
```


## `diamond`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:66`

```ts
const diamond
```


## `formulaKey`

> Function · `logic/profiles/modal-frame-axioms/formula.ts:79`

Clave sintáctica determinista para deduplicación.

```ts
export function formulaKey(f: ModalFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `ModalFormula` | no |  |

### Returns

`string` — 


## `formulaEquals`

> Function · `logic/profiles/modal-frame-axioms/formula.ts:98`

```ts
export function formulaEquals(a: ModalFormula, b: ModalFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `ModalFormula` | no |  |
| `b` | `ModalFormula` | no |  |

### Returns

`boolean` — 


## `formulaToString`

> Function · `logic/profiles/modal-frame-axioms/formula.ts:102`

```ts
export function formulaToString(f: ModalFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `ModalFormula` | no |  |

### Returns

`string` — 


## `collectAtoms`

> Function · `logic/profiles/modal-frame-axioms/formula.ts:134`

```ts
export function collectAtoms(f: ModalFormula, out: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `ModalFormula` | no |  |
| `out` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `subUnary`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:153`

```ts
const subUnary
```


## `subLeft`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:154`

```ts
const subLeft
```


## `subRight`

> Const · `logic/profiles/modal-frame-axioms/formula.ts:155`

```ts
const subRight
```

