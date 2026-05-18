# `logic/profiles/many-valued/index.ts`

============================================================ ST Many-valued logics — Łukasiewicz, Gödel, Product ============================================================ Tres lógicas borrosas / multivaluadas con valores en [0, 1]. Cada sistema define sus propias conectivas, con un núcleo común: T-norm + T-conorm + implicación residuada + negación. Sistemas:   * lukasiewicz: t-norm = max(0, p+q-1), s-norm = min(1, p+q),                  imp = min(1, 1-p+q), neg = 1-p (involutiva).   * godel:       t-norm = min(p, q), s-norm = max(p, q),                  imp = 1 si p<=q, q en otro caso;                  neg(p) = 1 si p=0, 0 en otro caso.   * product:     t-norm = p*q, s-norm = p + q - p*q,                  imp = 1 si p<=q, q/p en otro caso;                  neg(p) = 1 si p=0, 0 en otro caso. Una tautología es una fórmula cuyo valor es 1 para toda asignación; aquí "toda asignación" se aproxima por sampling en una rejilla finita (resolution puntos por átomo). ============================================================

## Contents

- [`FuzzyOperator`](#fuzzyoperator) — Type
- [`FuzzyFormula`](#fuzzyformula) — Interface
- [`atom`](#atom) — Function
- [`not`](#not) — Function
- [`and`](#and) — Function
- [`or`](#or) — Function
- [`implies`](#implies) — Function
- [`collectFuzzyAtoms`](#collectfuzzyatoms) — Function
- [`evaluate`](#evaluate) — Function
- [`isTautology`](#istautology) — Function
- [`isContradiction`](#iscontradiction) — Function
- [`findValuation`](#findvaluation) — Function

## `FuzzyOperator`

> Type · `logic/profiles/many-valued/index.ts:23`

```ts
export type FuzzyOperator = 'lukasiewicz' | 'godel' | 'product';
```


## `FuzzyFormula`

> Interface · `logic/profiles/many-valued/index.ts:25`

```ts
export interface FuzzyFormula
```


## `atom`

> Function · `logic/profiles/many-valued/index.ts:92`

```ts
export function atom(name: string): FuzzyFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |

### Returns

`FuzzyFormula` — 


## `not`

> Function · `logic/profiles/many-valued/index.ts:96`

```ts
export function not(arg: FuzzyFormula): FuzzyFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `arg` | `FuzzyFormula` | no |  |

### Returns

`FuzzyFormula` — 


## `and`

> Function · `logic/profiles/many-valued/index.ts:100`

```ts
export function and(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `FuzzyFormula` | no |  |
| `right` | `FuzzyFormula` | no |  |

### Returns

`FuzzyFormula` — 


## `or`

> Function · `logic/profiles/many-valued/index.ts:104`

```ts
export function or(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `FuzzyFormula` | no |  |
| `right` | `FuzzyFormula` | no |  |

### Returns

`FuzzyFormula` — 


## `implies`

> Function · `logic/profiles/many-valued/index.ts:108`

```ts
export function implies(left: FuzzyFormula, right: FuzzyFormula): FuzzyFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `left` | `FuzzyFormula` | no |  |
| `right` | `FuzzyFormula` | no |  |

### Returns

`FuzzyFormula` — 


## `collectFuzzyAtoms`

> Function · `logic/profiles/many-valued/index.ts:114`

```ts
export function collectFuzzyAtoms(formula: FuzzyFormula): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `FuzzyFormula` | no |  |

### Returns

`string[]` — 


## `evaluate`

> Function · `logic/profiles/many-valued/index.ts:142`

Evalúa una fórmula borrosa bajo un environment que asigna
un valor en [0,1] a cada átomo (átomos sin asignar valen 0).

```ts
export function evaluate( formula: FuzzyFormula, env: Record<string, number>, system: FuzzyOperator, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `FuzzyFormula` | no |  |
| `env` | `Record<string, number>` | no |  |
| `system` | `FuzzyOperator` | no |  |

### Returns

`number` — 


## `isTautology`

> Function · `logic/profiles/many-valued/index.ts:243`

Devuelve true si la fórmula evalúa a 1 (módulo EPSILON) en
todos los puntos de la rejilla [0,1]^n con `resolution` puntos
por átomo. Default: 11 puntos (0, 0.1, ..., 1).

Aviso: es una aproximación por sampling. Algunas tautologías
"casi" (verdaderas excepto en un conjunto de medida cero)
pueden seguir clasificándose correctamente, pero contraejemplos
sutiles requieren resolución mayor.

```ts
export function isTautology( formula: FuzzyFormula, system: FuzzyOperator, resolution: number = 11, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `FuzzyFormula` | no |  |
| `system` | `FuzzyOperator` | no |  |
| `resolution` | `number` | yes |  |

### Returns

`boolean` — 


## `isContradiction`

> Function · `logic/profiles/many-valued/index.ts:260`

Verdadera si la fórmula evalúa a 0 en toda la rejilla.

```ts
export function isContradiction( formula: FuzzyFormula, system: FuzzyOperator, resolution: number = 11, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `FuzzyFormula` | no |  |
| `system` | `FuzzyOperator` | no |  |
| `resolution` | `number` | yes |  |

### Returns

`boolean` — 


## `findValuation`

> Function · `logic/profiles/many-valued/index.ts:281`

Busca una valuación (en la rejilla con `resolution` puntos por
átomo) tal que `|evaluate(formula) - target| <= tolerance`.
Devuelve null si no encuentra ninguna.

```ts
export function findValuation( formula: FuzzyFormula, system: FuzzyOperator, target: number, tolerance: number = 1e-6, resolution: number = 11, ): Record<string, number> | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `FuzzyFormula` | no |  |
| `system` | `FuzzyOperator` | no |  |
| `target` | `number` | no |  |
| `tolerance` | `number` | yes |  |
| `resolution` | `number` | yes |  |

### Returns

`Record<string, number> \| null` — 

