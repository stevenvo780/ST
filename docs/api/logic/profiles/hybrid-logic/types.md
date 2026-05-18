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

> Function · `logic/profiles/hybrid-logic/types.ts:69`

Crea un átomo proposicional híbrido.

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

> Function · `logic/profiles/hybrid-logic/types.ts:74`

Crea un nominal (proposición que denota un único mundo).

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

> Function · `logic/profiles/hybrid-logic/types.ts:79`

Negación: ¬φ.

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

> Function · `logic/profiles/hybrid-logic/types.ts:87`

Conjunción n-aria: φ₁ ∧ … ∧ φₙ.

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

> Function · `logic/profiles/hybrid-logic/types.ts:97`

Disyunción n-aria: φ₁ ∨ … ∨ φₙ.

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

> Function · `logic/profiles/hybrid-logic/types.ts:104`

Implicación: left → right.

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

> Function · `logic/profiles/hybrid-logic/types.ts:109`

Operador □ (necesidad modal).

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

> Function · `logic/profiles/hybrid-logic/types.ts:114`

Operador ◇ (posibilidad modal).

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

> Function · `logic/profiles/hybrid-logic/types.ts:119`

Operador de satisfacción: @i φ ("φ en el mundo i").

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

> Function · `logic/profiles/hybrid-logic/types.ts:124`

Operador de ligadura: ↓bind. φ (bind el mundo actual).

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

> Function · `logic/profiles/hybrid-logic/types.ts:129`

Cuantificador de mundo: ∃bind. φ (existe un mundo bind donde φ).

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

> Function · `logic/profiles/hybrid-logic/types.ts:134`

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

