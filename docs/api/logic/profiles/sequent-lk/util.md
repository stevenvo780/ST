# `logic/profiles/sequent-lk/util.ts`

============================================================ LK — Utilidades sintacticas locales ============================================================

## Contents

- [`lkKey`](#lkkey) — Function
- [`eq`](#eq) — Function
- [`cloneSeq`](#cloneseq) — Function
- [`removeAt`](#removeat) — Function
- [`removeFirstByKey`](#removefirstbykey) — Function
- [`removeAllByKey`](#removeallbykey) — Function
- [`containsKey`](#containskey) — Function
- [`depth`](#depth) — Function

## `lkKey`

> Function · `logic/profiles/sequent-lk/util.ts:11`

Clave canonica de una formula LK. Sirve para comparar igualdad
sintactica entre formulas y construir conjuntos/multisets.

```ts
export function lkKey(f: LKFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LKFormula` | no |  |

### Returns

`string` — 


## `eq`

> Function · `logic/profiles/sequent-lk/util.ts:26`

```ts
export function eq(a: LKFormula, b: LKFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `LKFormula` | no |  |
| `b` | `LKFormula` | no |  |

### Returns

`boolean` — 


## `cloneSeq`

> Function · `logic/profiles/sequent-lk/util.ts:31`

Devuelve una copia superficial: util para construir premisas sin alias.

```ts
export function cloneSeq<T>(xs: T[]): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `T[]` | no |  |

### Returns

`T[]` — 


## `removeAt`

> Function · `logic/profiles/sequent-lk/util.ts:35`

```ts
export function removeAt<T>(xs: T[], idx: number): T[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `T[]` | no |  |
| `idx` | `number` | no |  |

### Returns

`T[]` — 


## `removeFirstByKey`

> Function · `logic/profiles/sequent-lk/util.ts:42`

Quita la primera ocurrencia de una formula identificable por `key`.

```ts
export function removeFirstByKey(xs: LKFormula[], key: string): LKFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `LKFormula[]` | no |  |
| `key` | `string` | no |  |

### Returns

`LKFormula[]` — 


## `removeAllByKey`

> Function · `logic/profiles/sequent-lk/util.ts:49`

Quita todas las ocurrencias de una formula identificable por `key`.

```ts
export function removeAllByKey(xs: LKFormula[], key: string): LKFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `LKFormula[]` | no |  |
| `key` | `string` | no |  |

### Returns

`LKFormula[]` — 


## `containsKey`

> Function · `logic/profiles/sequent-lk/util.ts:53`

```ts
export function containsKey(xs: LKFormula[], key: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `xs` | `LKFormula[]` | no |  |
| `key` | `string` | no |  |

### Returns

`boolean` — 


## `depth`

> Function · `logic/profiles/sequent-lk/util.ts:58`

Profundidad de una formula (sub-formulas estrictas).

```ts
export function depth(f: LKFormula): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `LKFormula` | no |  |

### Returns

`number` — 

