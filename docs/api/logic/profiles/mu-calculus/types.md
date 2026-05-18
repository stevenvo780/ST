# `logic/profiles/mu-calculus/types.ts`

Variable proposicional ligada por μ/ν.

## Contents

- [`MuVarName`](#muvarname) — Type
- [`MuFormula`](#muformula) — Type
- [`KripkeStructure`](#kripkestructure) — Interface
- [`muToString`](#mutostring) — Function

## `MuVarName`

> Type · `logic/profiles/mu-calculus/types.ts:18`

Variable proposicional ligada por μ/ν.

```ts
export type MuVarName = string;
```


## `MuFormula`

> Type · `logic/profiles/mu-calculus/types.ts:21`

AST del modal μ-calculus.

```ts
export type MuFormula = | { kind: 'atom'; name: string } | { kind: 'var'; name: MuVarName } | { kind: 'not'; arg: MuFormula } | { kind: 'and'; left: MuFormula; right: MuFormula } | { kind: 'or'; left: MuFormula; right: MuFormula } | { kind: 'box'; arg: MuFormula } | { kind: 'diamond'; arg: MuFormula } | { kind: 'mu'; bind: MuVarName; body: MuFormula } | { kind: 'nu'; bind: MuVarName; body: MuFormula };
```


## `KripkeStructure`

> Interface · `logic/profiles/mu-calculus/types.ts:40`

Estructura de Kripke en el formato pedido por la API pública del
perfil. `labelling[stateId]` es el conjunto de proposiciones que
se cumplen en ese estado.

El algoritmo asume estructuras finitas. Estados sin sucesores son
"deadlocks": `□φ` se cumple trivialmente, `◇φ` es falso.

```ts
export interface KripkeStructure
```


## `muToString`

> Function · `logic/profiles/mu-calculus/types.ts:47`

Renderiza una fórmula μ-cálculo a notación textual estándar.

```ts
export function muToString(phi: MuFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `MuFormula` | no |  |

### Returns

`string` — 

