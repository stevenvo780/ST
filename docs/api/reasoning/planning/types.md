# `reasoning/planning/types.ts`

Un hecho atómico ground. Lo representamos como string opaque al
motor — el formato típico es `predicate(arg1, arg2, …)` o simplemente
`predicate-arg1-arg2`. El motor solo compara igualdad de strings.

## Contents

- [`Fact`](#fact) — Type
- [`STRIPSAction`](#stripsaction) — Interface
- [`STRIPSProblem`](#stripsproblem) — Interface
- [`GroundedAction`](#groundedaction) — Interface
- [`PlanStep`](#planstep) — Interface
- [`Plan`](#plan) — Interface
- [`Heuristic`](#heuristic) — Type
- [`CostFunction`](#costfunction) — Type
- [`PlannerOptions`](#planneroptions) — Interface
- [`AStarOptions`](#astaroptions) — Interface

## `Fact`

> Type · `reasoning/planning/types.ts:26`

Un hecho atómico ground. Lo representamos como string opaque al
motor — el formato típico es `predicate(arg1, arg2, …)` o simplemente
`predicate-arg1-arg2`. El motor solo compara igualdad de strings.

```ts
export type Fact = string;
```


## `STRIPSAction`

> Interface · `reasoning/planning/types.ts:45`

Una acción STRIPS (puede ser lifted con `?` en los parámetros).

Convención: los parámetros se nombran con prefijo `?` dentro de
los strings de preconditions/addList/delList. Ejemplo:

  {
    name: 'move',
    parameters: ['?from', '?to'],
    preconditions: ['at(?from)', 'connected(?from, ?to)'],
    addList: ['at(?to)'],
    delList: ['at(?from)'],
  }

Para acciones ya ground, `parameters` puede ser `[]` y los strings
no contienen `?`.

```ts
export interface STRIPSAction
```


## `STRIPSProblem`

> Interface · `reasoning/planning/types.ts:67`

Problema de planificación STRIPS.

- `predicates`: lista declarativa (puramente documental — no se
  valida internamente, pero sirve para introspección).
- `objects`: mapa de `tipo → valores`. Si no usás tipos, podés
  usar `{ object: [...] }` y referir `object` como el "tipo" en los
  parámetros si quisieras, pero el grounding por defecto enumera
  todos los objetos para cada parámetro (sin filtrar por tipo).
- `actions`: schemas de acciones (lifted o ground).
- `initialState`: hechos verdaderos en S₀ (closed-world assumption).
- `goal`: hechos que deben estar en el estado final. Si goal ⊆ S
  entonces S satisface el goal.

```ts
export interface STRIPSProblem
```


## `GroundedAction`

> Interface · `reasoning/planning/types.ts:79`

Una acción ya instanciada (ground) — el resultado de aplicar un
binding concreto a un schema lifted.

```ts
export interface GroundedAction
```


## `PlanStep`

> Interface · `reasoning/planning/types.ts:86`

Un paso del plan: el schema + el binding que lo grounded.

```ts
export interface PlanStep
```


## `Plan`

> Interface · `reasoning/planning/types.ts:98`

Plan completo.

- `actions`: secuencia ordenada de pasos.
- `length`: número de pasos (= actions.length).
- `cost`: costo total. Por default = length (cada acción cuesta 1).

```ts
export interface Plan
```


## `Heuristic`

> Type · `reasoning/planning/types.ts:109`

Heurística admisible: estima el costo restante desde `state` hasta
algún estado que satisfaga `goal`. Para A* admisible, debe ser
≤ costo real (no sobreestimar).

```ts
export type Heuristic = (state: Set<Fact>, goal: Set<Fact>) => number;
```


## `CostFunction`

> Type · `reasoning/planning/types.ts:112`

Costo por acción (default: 1). Permite acciones de costo variable.

```ts
export type CostFunction = (step: PlanStep) => number;
```


## `PlannerOptions`

> Interface · `reasoning/planning/types.ts:114`

```ts
export interface PlannerOptions
```


## `AStarOptions`

> Interface · `reasoning/planning/types.ts:126`

```ts
export interface AStarOptions extends PlannerOptions
```

