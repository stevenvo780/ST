# `type-theory/lambda-cube/rules.ts`

============================================================ Lambda Cube — Pure Type System rules per vértice ============================================================ Cada sistema del cubo se identifica por su conjunto de reglas de formación (s1, s2): bajo qué sorts es legal formar `Π x:A. B` donde `A : s1` y `B : s2`. La regla común a todos los sistemas es (*, *) — la flecha sobre términos del λ-cálculo simplemente tipado. Las otras tres se "encienden" según la posición en el cubo:   eje X  (◻, *) — polimorfismo: cuantificar sobre tipos   eje Y  (◻, ◻) — operadores de tipo: funciones type→type   eje Z  (*, ◻) — tipos dependientes: tipo que depende de un valor Cualquier subconjunto que contenga (*, *) da un PTS coherente. El número total de vértices es 2^3 = 8.

## Contents

- [`FormationRule`](#formationrule) — Interface
- [`CubeRules`](#cuberules) — Interface
- [`SYSTEMS`](#systems) — Const
- [`hasRule`](#hasrule) — Function
- [`rulesOf`](#rulesof) — Function
- [`AXIOMS`](#axioms) — Const
- [`axiomFor`](#axiomfor) — Function

## `FormationRule`

> Interface · `type-theory/lambda-cube/rules.ts:22`

```ts
export interface FormationRule
```


## `CubeRules`

> Interface · `type-theory/lambda-cube/rules.ts:27`

```ts
export interface CubeRules
```


## `SYSTEMS`

> Const · `type-theory/lambda-cube/rules.ts:36`

```ts
const SYSTEMS: Record<CubeSystem, CubeRules>
```


## `hasRule`

> Function · `type-theory/lambda-cube/rules.ts:48`

¿El par (s1, s2) está en las reglas de formación de `system`?

```ts
export function hasRule(system: CubeSystem, from: Sort, to: Sort): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `system` | `CubeSystem` | no |  |
| `from` | `Sort` | no |  |
| `to` | `Sort` | no |  |

### Returns

`boolean` — 


## `rulesOf`

> Function · `type-theory/lambda-cube/rules.ts:57`

Conjunto de pares de formación de un sistema, en orden canónico.

```ts
export function rulesOf(system: CubeSystem): FormationRule[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `system` | `CubeSystem` | no |  |

### Returns

`FormationRule[]` — 


## `AXIOMS`

> Const · `type-theory/lambda-cube/rules.ts:68`

Reglas de axioma. En el cubo Barendregt clásico el único axioma es
  * : ◻
(no hay jerarquía de universos: ◻ no tiene tipo propio, por eso los
términos del cubo no pueden anidar ◻ : ?). Si se intentara tipar ◻
directamente, el typechecker reportará error.

```ts
const AXIOMS: Array<{ sort: Sort; type: Sort }>
```


## `axiomFor`

> Function · `type-theory/lambda-cube/rules.ts:70`

```ts
export function axiomFor(sort: Sort): Sort | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sort` | `Sort` | no |  |

### Returns

`Sort \| undefined` — 

