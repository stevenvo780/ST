# `logic/profiles/default-logic/extensions.ts`

============================================================ ST Default Logic (Reiter) — Cálculo de extensiones ============================================================

## Contents

- [`normalizeLiteral`](#normalizeliteral) — Function
- [`negate`](#negate) — Function
- [`isConsistent`](#isconsistent) — Function
- [`isJustificationConsistent`](#isjustificationconsistent) — Function
- [`computeExtensions`](#computeextensions) — Function

## `normalizeLiteral`

> Function · `logic/profiles/default-logic/extensions.ts:23`

Normaliza un literal a forma canónica:
  "P", "p"           → "P"
  "¬P", "!P", "~P",
  "not P", " ¬  P "  → "¬P"
Quita espacios extra; preserva mayúsculas/minúsculas internas
tras el primer carácter (case-sensitive para predicados FOL como
"flies(tweety)" vs "Flies(tweety)").

```ts
export function normalizeLiteral(lit: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `string` | no |  |

### Returns

`string` — 


## `negate`

> Function · `logic/profiles/default-logic/extensions.ts:68`

Devuelve la negación canónica de un literal normalizado.

```ts
export function negate(lit: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lit` | `string` | no |  |

### Returns

`string` — 


## `isConsistent`

> Function · `logic/profiles/default-logic/extensions.ts:74`

Verifica si un conjunto de literales es consistente (no contiene L y ¬L).

```ts
export function isConsistent(beliefs: ReadonlySet<string>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `beliefs` | `ReadonlySet<string>` | no |  |

### Returns

`boolean` — 


## `isJustificationConsistent`

> Function · `logic/profiles/default-logic/extensions.ts:85`

Comprueba si una justificación β es consistente con las creencias:
basta con que ¬β no esté en el conjunto.

```ts
export function isJustificationConsistent( justification: string, beliefs: ReadonlySet<string>, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `justification` | `string` | no |  |
| `beliefs` | `ReadonlySet<string>` | no |  |

### Returns

`boolean` — 


## `computeExtensions`

> Function · `logic/profiles/default-logic/extensions.ts:241`

Calcula todas las extensiones de la teoría enumerando órdenes de
aplicación de defaults y verificando que el resultado sea un punto
fijo del operador Γ_T.

Estrategia: para cada subconjunto de defaults, intentamos aplicarlos
en algún orden. Como en v1 trabajamos con literales y la aplicación
de un default no se desbloquea por reordering una vez fijado el
subconjunto consistente, basta enumerar subconjuntos maximales
generables por forward-close empezando desde cada permutación
heurística. Para acotar costo: probamos todas las permutaciones
cuando |defaults| ≤ 6, y un sampling determinista si excede.

```ts
export function computeExtensions(T: DefaultTheory, options: ComputeOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `T` | `DefaultTheory` | no |  |
| `options` | `ComputeOptions` | yes |  |

### Returns

`Extension[]` — 

