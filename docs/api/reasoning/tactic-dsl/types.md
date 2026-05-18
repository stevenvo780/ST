# `reasoning/tactic-dsl/types.ts`

============================================================ Tactic DSL — tipos, parser y normalizador de fórmulas ============================================================ El DSL trabaja con fórmulas como strings (legibles para el user) y un AST interno mínimo (`Formula`) que se usa para destructurar goals y reducir hipótesis. El parser soporta:   atom: identificador alfanumérico (P, Q, n, x_1, Nat).   implicación  P -> Q   (right-assoc, menor precedencia)   disyunción   P \/ Q    (right-assoc)   conjunción   P /\ Q    (right-assoc, mayor prec. que \/)   negación     ~P   constantes   True, False   función      f(arg1, arg2)         — opaco, se trata como atom   paréntesis   (...) El parser es deliberadamente pequeño: nos importa poder destructurar las fórmulas que los tactics manipulan, no parsear FOL completa. Para cosas como `rewrite`, la igualdad se acepta como string `lhs = rhs`.

## Contents

- [`Formula`](#formula) — Type
- [`Goal`](#goal) — Interface
- [`ProofState`](#proofstate) — Interface
- [`TacticInvocation`](#tacticinvocation) — Interface
- [`Tactic`](#tactic) — Type
- [`TacticError`](#tacticerror) — Class
- [`parseFormula`](#parseformula) — Function
- [`formulaToString`](#formulatostring) — Function
- [`normalizeFormula`](#normalizeformula) — Function
- [`formulaEq`](#formulaeq) — Function
- [`substitute`](#substitute) — Function

## `Formula`

> Type · `reasoning/tactic-dsl/types.ts:22`

```ts
export type Formula = | { kind: 'atom'; name: string } | { kind: 'true' } | { kind: 'false' } | { kind: 'not'; body: Formula } | { kind: 'and'; left: Formula; right: Formula } | { kind: 'or'; left: Formula; right: Formula } | { kind: 'imp'; left: Formula; right: Formula } | { kind: 'eq'; left: Formula; right: Formula };
```


## `Goal`

> Interface · `reasoning/tactic-dsl/types.ts:32`

```ts
export interface Goal
```


## `ProofState`

> Interface · `reasoning/tactic-dsl/types.ts:38`

```ts
export interface ProofState
```


## `TacticInvocation`

> Interface · `reasoning/tactic-dsl/types.ts:44`

```ts
export interface TacticInvocation
```


## `Tactic`

> Type · `reasoning/tactic-dsl/types.ts:51`

```ts
export type Tactic = (state: ProofState) => ProofState;
```


## `TacticError`

> Class · `reasoning/tactic-dsl/types.ts:53`

```ts
export class TacticError extends Error
```


## `parseFormula`

> Function · `reasoning/tactic-dsl/types.ts:198`

```ts
export function parseFormula(src: string): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `src` | `string` | no |  |

### Returns

`Formula` — 


## `formulaToString`

> Function · `reasoning/tactic-dsl/types.ts:213`

```ts
export function formulaToString(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 


## `normalizeFormula`

> Function · `reasoning/tactic-dsl/types.ts:236`

```ts
export function normalizeFormula(src: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `src` | `string` | no |  |

### Returns

`string` — 


## `formulaEq`

> Function · `reasoning/tactic-dsl/types.ts:244`

```ts
export function formulaEq(a: string, b: string): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `string` | no |  |
| `b` | `string` | no |  |

### Returns

`boolean` — 


## `substitute`

> Function · `reasoning/tactic-dsl/types.ts:255`

```ts
export function substitute(target: string, lhs: string, rhs: string): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `target` | `string` | no |  |
| `lhs` | `string` | no |  |
| `rhs` | `string` | no |  |

### Returns

`string` — 

