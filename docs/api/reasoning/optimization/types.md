# `reasoning/optimization/types.ts`

============================================================ Linear / Integer Programming — tipos de borde. ============================================================ Un LPProblem describe el problema en forma "natural": objetivo (minimizar o maximizar) + lista de restricciones lineales con operador ≤, ≥ o = y RHS escalar. Las cotas por variable son opcionales (default: x ≥ 0, sin cota superior). Las soluciones reportan estado simbólico ('optimal' | 'unbounded' | 'infeasible' | 'iteration_limit') más el vector de variables en el orden original del problema y el valor objetivo evaluado. ============================================================

## Contents

- [`ObjectiveKind`](#objectivekind) — Type
- [`ConstraintOperator`](#constraintoperator) — Type
- [`LPConstraint`](#lpconstraint) — Interface
- [`LPProblem`](#lpproblem) — Interface
- [`LPStatus`](#lpstatus) — Type
- [`LPSolution`](#lpsolution) — Interface
- [`ILPProblem`](#ilpproblem) — Interface
- [`ILPSolution`](#ilpsolution) — Interface
- [`LPOptions`](#lpoptions) — Interface
- [`ILPOptions`](#ilpoptions) — Interface

## `ObjectiveKind`

> Type · `reasoning/optimization/types.ts:14`

```ts
export type ObjectiveKind = 'minimize' | 'maximize';
```


## `ConstraintOperator`

> Type · `reasoning/optimization/types.ts:15`

```ts
export type ConstraintOperator = '<=' | '>=' | '=';
```


## `LPConstraint`

> Interface · `reasoning/optimization/types.ts:17`

```ts
export interface LPConstraint
```


## `LPProblem`

> Interface · `reasoning/optimization/types.ts:23`

```ts
export interface LPProblem
```


## `LPStatus`

> Type · `reasoning/optimization/types.ts:33`

```ts
export type LPStatus = 'optimal' | 'unbounded' | 'infeasible' | 'iteration_limit';
```


## `LPSolution`

> Interface · `reasoning/optimization/types.ts:35`

```ts
export interface LPSolution
```


## `ILPProblem`

> Interface · `reasoning/optimization/types.ts:42`

```ts
export interface ILPProblem extends LPProblem
```


## `ILPSolution`

> Interface · `reasoning/optimization/types.ts:47`

```ts
export interface ILPSolution extends LPSolution
```


## `LPOptions`

> Interface · `reasoning/optimization/types.ts:52`

```ts
export interface LPOptions
```


## `ILPOptions`

> Interface · `reasoning/optimization/types.ts:57`

```ts
export interface ILPOptions
```

