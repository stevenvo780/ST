# `logic/profiles/ctl/types.ts`

Estado de una estructura de Kripke.
 - `id`     identificador único del estado.
 - `labels` proposiciones atómicas que se cumplen en el estado.

## Contents

- [`KripkeState`](#kripkestate) — Interface
- [`KripkeStructure`](#kripkestructure) — Interface
- [`CTLFormula`](#ctlformula) — Type
- [`ctlToString`](#ctltostring) — Function

## `KripkeState`

> Interface · `logic/profiles/ctl/types.ts:21`

Estado de una estructura de Kripke.
 - `id`     identificador único del estado.
 - `labels` proposiciones atómicas que se cumplen en el estado.

```ts
export interface KripkeState
```


## `KripkeStructure`

> Interface · `logic/profiles/ctl/types.ts:32`

Estructura de Kripke: M = (S, R, L, S0).
 - `states`      conjunto de estados con sus etiquetas.
 - `transitions` relación R ⊆ S × S codificada como pares [from, to].
 - `initial`     subconjunto de estados iniciales (S0).

```ts
export interface KripkeStructure
```


## `CTLFormula`

> Type · `logic/profiles/ctl/types.ts:42`

AST de Computation Tree Logic. Cubre los 8 operadores temporales
estándar: EX/AX, EF/AF, EG/AG, EU/AU.

```ts
export type CTLFormula = | { kind: 'atom'; name: string } | { kind: 'true' } | { kind: 'false' } | { kind: 'not'; arg: CTLFormula } | { kind: 'and'; args: CTLFormula[] } | { kind: 'or'; args: CTLFormula[] } | { kind: 'implies'; left: CTLFormula; right: CTLFormula } | { kind: 'EX'; arg: CTLFormula } | { kind: 'AX'; arg: CTLFormula } | { kind: 'EF'; arg: CTLFormula } | { kind: 'AF'; arg: CTLFormula } | { kind: 'EG'; arg: CTLFormula } | { kind: 'AG'; arg: CTLFormula } | { kind: 'EU'; left: CTLFormula; right: CTLFormula } | { kind: 'AU'; left: CTLFormula; right: CTLFormula };
```


## `ctlToString`

> Function · `logic/profiles/ctl/types.ts:60`

Renderiza una fórmula CTL a notación textual estándar.

```ts
export function ctlToString(f: CTLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `CTLFormula` | no |  |

### Returns

`string` — 

