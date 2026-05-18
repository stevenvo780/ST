# `semantics/game-semantics/types.ts`

============================================================ Game semantics para IPC — Tipos ============================================================ Juegos dialógicos al estilo Lorenzen (1958) / Felscher (1985): dos jugadores debaten una fórmula. El Proponente (P) la afirma; el Oponente (O) la ataca. Una fórmula es válida en IPC sii P tiene una estrategia ganadora bajo las reglas estructurales intuicionistas. (Lorenzen, Felscher: equivalencia con NJ.) ADT pública pedida por el spec (sin `not` explícito; `¬φ` se modela como `φ → ⊥`). La conversión a/desde otras representaciones de fórmulas vive en `convert.ts`.

## Contents

- [`IPCFormula`](#ipcformula) — Type
- [`Player`](#player) — Type
- [`Move`](#move) — Type
- [`GameState`](#gamestate) — Interface
- [`ipcAtom`](#ipcatom) — Const
- [`ipcBottom`](#ipcbottom) — Const
- [`ipcAnd`](#ipcand) — Const
- [`ipcOr`](#ipcor) — Const
- [`ipcImplies`](#ipcimplies) — Const
- [`ipcNot`](#ipcnot) — Const
- [`ipcKey`](#ipckey) — Function
- [`ipcEquals`](#ipcequals) — Function
- [`ipcToString`](#ipctostring) — Function

## `IPCFormula`

> Type · `semantics/game-semantics/types.ts:15`

```ts
export type IPCFormula = | { kind: 'atom'; name: string } | { kind: 'and'; left: IPCFormula; right: IPCFormula } | { kind: 'or'; left: IPCFormula; right: IPCFormula } | { kind: 'implies'; left: IPCFormula; right: IPCFormula } | { kind: 'bottom' };
```


## `Player`

> Type · `semantics/game-semantics/types.ts:22`

```ts
export type Player = 'proponent' | 'opponent';
```


## `Move`

> Type · `semantics/game-semantics/types.ts:33`

Movida del juego dialógico:
  - `choose-and`  → ataque a `∧`: O elige qué conjunto pedir.
  - `choose-or`   → defensa de `∨`: P elige qué disyunto afirmar.
  - `attack-implies` → ataque a `→`: O asume el antecedente y
    pide el consecuente.
  - `defend-bottom`  → "no se puede defender ⊥"; usada
    simbólicamente cuando P queda obligado a defender `⊥`.

```ts
export type Move = | { kind: 'choose-and'; side: 'left' | 'right' } | { kind: 'choose-or'; side: 'left' | 'right' } | { kind: 'attack-implies' } | { kind: 'defend-bottom' };
```


## `GameState`

> Interface · `semantics/game-semantics/types.ts:44`

Estado del juego pedido por el spec. `current` es la fórmula
en juego ahora mismo; `context` son las aserciones del Oponente
disponibles para que P las use; `history` traza las movidas.

```ts
export interface GameState
```


## `ipcAtom`

> Const · `semantics/game-semantics/types.ts:52`

```ts
const ipcAtom
```


## `ipcBottom`

> Const · `semantics/game-semantics/types.ts:53`

```ts
const ipcBottom
```


## `ipcAnd`

> Const · `semantics/game-semantics/types.ts:54`

```ts
const ipcAnd
```


## `ipcOr`

> Const · `semantics/game-semantics/types.ts:59`

```ts
const ipcOr
```


## `ipcImplies`

> Const · `semantics/game-semantics/types.ts:64`

```ts
const ipcImplies
```


## `ipcNot`

> Const · `semantics/game-semantics/types.ts:70`

Azúcar: `¬φ` = `φ → ⊥`. Útil para tests pedagógicos.

```ts
const ipcNot
```


## `ipcKey`

> Function · `semantics/game-semantics/types.ts:74`

```ts
export function ipcKey(f: IPCFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IPCFormula` | no |  |

### Returns

`string` — 


## `ipcEquals`

> Function · `semantics/game-semantics/types.ts:89`

```ts
export function ipcEquals(a: IPCFormula, b: IPCFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `IPCFormula` | no |  |
| `b` | `IPCFormula` | no |  |

### Returns

`boolean` — 


## `ipcToString`

> Function · `semantics/game-semantics/types.ts:93`

```ts
export function ipcToString(f: IPCFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `IPCFormula` | no |  |

### Returns

`string` — 

