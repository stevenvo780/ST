# `reasoning/markov-logic/grounding.ts`

============================================================ Markov Logic — Grounding de fórmulas ============================================================ `ground(theory)` produce TODAS las instancias cerradas (sin variables libres) de cada fórmula de la teoría, una por combinación de constantes compatible con los tipos del predicado en el que aparece la variable. La inferencia de tipos por variable se hace en una primera pasada sobre la fórmula: por cada átomo `Pred(x, y, ...)` consultamos `predicates[Pred].types` y asignamos el tipo de cada argumento a la variable correspondiente. Si la misma variable aparece en dos posiciones tipadas distintamente, se reporta error (typing claro como pide la convención del workspace).

## Contents

- [`atomKey`](#atomkey) — Function
- [`evaluateGround`](#evaluateground) — Function
- [`renderGround`](#renderground) — Function
- [`groundFormula`](#groundformula) — Function
- [`ground`](#ground) — Function
- [`allGroundAtoms`](#allgroundatoms) — Function

## `atomKey`

> Function · `reasoning/markov-logic/grounding.ts:106`

Canonical key para un ground atom: "Pred(a1,a2,...)".

```ts
export function atomKey(predicate: string, args: string[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `predicate` | `string` | no |  |
| `args` | `string[]` | no |  |

### Returns

`string` — 


## `evaluateGround`

> Function · `reasoning/markov-logic/grounding.ts:129`

Evalúa un nodo ya groundeado contra un mundo.

```ts
export function evaluateGround(node: FOLNode, world: MLNWorld): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `node` | `FOLNode` | no |  |
| `world` | `MLNWorld` | no |  |

### Returns

`boolean` — 


## `renderGround`

> Function · `reasoning/markov-logic/grounding.ts:147`

Renderiza un nodo groundeado a string canónico.

```ts
export function renderGround(node: FOLNode): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `node` | `FOLNode` | no |  |

### Returns

`string` — 


## `groundFormula`

> Function · `reasoning/markov-logic/grounding.ts:204`

Groundea una sola fórmula.

```ts
export function groundFormula( formula: MLNFormula, predMap: PredicateMap, constants: Record<string, string[]>, ): GroundedFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `MLNFormula` | no |  |
| `predMap` | `PredicateMap` | no |  |
| `constants` | `Record<string, string[]>` | no |  |

### Returns

`GroundedFormula[]` — 


## `ground`

> Function · `reasoning/markov-logic/grounding.ts:231`

Groundea TODAS las fórmulas de la teoría.

```ts
export function ground(theory: MLNTheory): GroundedFormula[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |

### Returns

`GroundedFormula[]` — 


## `allGroundAtoms`

> Function · `reasoning/markov-logic/grounding.ts:247`

Enumera TODOS los ground atoms de la teoría (Herbrand base).

```ts
export function allGroundAtoms(theory: MLNTheory): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `theory` | `MLNTheory` | no |  |

### Returns

`string[]` — 

