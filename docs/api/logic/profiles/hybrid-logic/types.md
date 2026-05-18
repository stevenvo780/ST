# `logic/profiles/hybrid-logic/types.ts`

Constructores sintácticos del fragmento.

## Contents

- [`HybridFormulaKind`](#hybridformulakind) — Type
- [`HybridFormula`](#hybridformula) — Type
- [`HybridFrame`](#hybridframe) — Interface
- [`atom`](#atom) — Function
- [`nominal`](#nominal) — Function
- [`not`](#not) — Function
- [`and`](#and) — Function
- [`or`](#or) — Function
- [`implies`](#implies) — Function
- [`box`](#box) — Function
- [`diamond`](#diamond) — Function
- [`at`](#at) — Function
- [`down`](#down) — Function
- [`existsWorld`](#existsworld) — Function
- [`formulaToString`](#formulatostring) — Function

## `HybridFormulaKind`

> Type · `logic/profiles/hybrid-logic/types.ts:15`

Constructores sintácticos del fragmento.

```ts
export type HybridFormulaKind = | 'atom' | 'nominal' | 'not' | 'and' | 'or' | 'implies' | 'box' | 'diamond' | 'at' | 'down' | 'exists-world';
```


## `HybridFormula`

> Type · `logic/profiles/hybrid-logic/types.ts:35`

AST de fórmulas híbridas.

Las "variables de mundo" producidas por ↓ y ∃ comparten espacio de
nombres con los nominales libres; ambas se resuelven al mismo
mundo del frame en tiempo de evaluación (vía `env`).

```ts
export type HybridFormula = | { kind: 'atom'; name: string } | { kind: 'nominal'; name: string } | { kind: 'not'; arg: HybridFormula } | { kind: 'and'; args: HybridFormula[] } | { kind: 'or'; args: HybridFormula[] } | { kind: 'implies'; left: HybridFormula; right: HybridFormula } | { kind: 'box'; arg: HybridFormula } | { kind: 'diamond'; arg: HybridFormula } | { kind: 'at'; nominal: string; arg: HybridFormula } | { kind: 'down'; bind: string; arg: HybridFormula } | { kind: 'exists-world'; bind: string; arg: HybridFormula };
```


## `HybridFrame`

> Interface · `logic/profiles/hybrid-logic/types.ts:59`

Modelo de Kripke enriquecido con asignación de nominales.

- `worlds`        : identificadores de los mundos.
- `accessibility` : relación R ⊆ W × W (pares ordenados).
- `nominals`      : nominal-name → world-id (función parcial total
                    sobre los nominales libres usados por la
                    fórmula que se evalúa).
- `valuation`     : atom-name → set de mundos donde el átomo es
                    verdadero.

```ts
export interface HybridFrame
```


## `atom`

> Function · `logic/profiles/hybrid-logic/types.ts:68`

```ts
export function atom(name: string): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`HybridFormula` — 


## `nominal`

> Function · `logic/profiles/hybrid-logic/types.ts:72`

```ts
export function nominal(name: string): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`HybridFormula` — 


## `not`

> Function · `logic/profiles/hybrid-logic/types.ts:76`

```ts
export function not(arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `and`

> Function · `logic/profiles/hybrid-logic/types.ts:80`

```ts
export function and(...args: HybridFormula[]): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `HybridFormula[]` | no |  |

### Returns

`HybridFormula` — 


## `or`

> Function · `logic/profiles/hybrid-logic/types.ts:86`

```ts
export function or(...args: HybridFormula[]): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `args` | `HybridFormula[]` | no |  |

### Returns

`HybridFormula` — 


## `implies`

> Function · `logic/profiles/hybrid-logic/types.ts:92`

```ts
export function implies(left: HybridFormula, right: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `HybridFormula` | no |  |
| `right` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `box`

> Function · `logic/profiles/hybrid-logic/types.ts:96`

```ts
export function box(arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `diamond`

> Function · `logic/profiles/hybrid-logic/types.ts:100`

```ts
export function diamond(arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `at`

> Function · `logic/profiles/hybrid-logic/types.ts:104`

```ts
export function at(nominalName: string, arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `nominalName` | `string` | no |  |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `down`

> Function · `logic/profiles/hybrid-logic/types.ts:108`

```ts
export function down(bind: string, arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bind` | `string` | no |  |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `existsWorld`

> Function · `logic/profiles/hybrid-logic/types.ts:112`

```ts
export function existsWorld(bind: string, arg: HybridFormula): HybridFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bind` | `string` | no |  |
| `arg` | `HybridFormula` | no |  |

### Returns

`HybridFormula` — 


## `formulaToString`

> Function · `logic/profiles/hybrid-logic/types.ts:117`

Renderiza una fórmula híbrida en notación textual estándar.

```ts
export function formulaToString(phi: HybridFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `HybridFormula` | no |  |

### Returns

`string` — 

