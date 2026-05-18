# `type-theory/refinement-types/solver.ts`

============================================================ Refinement types — Solver bounded de VCs ============================================================ Las VCs (verification conditions) son listas de predicados que se conjuntan. checkVC(P) responde:   - satisfiable: ¿existe asignación que haga ⋀P verdadero?   - counter:     dicha asignación si la hay (testigo). Algoritmo: enumeración acotada sobre Int en [-bound, +bound] y sobre Bool. Es deliberadamente simple — Liquid Haskell usa Z3, nosotros usamos búsqueda finita suficiente para los tests del módulo y para subtipado de rangos pequeños. Para chequear "P ⇒ Q" (validez del implicador), se busca un contraejemplo a "P ∧ ¬Q": si NO se halla en el dominio acotado, se reporta válido.

## Contents

- [`SolverOpts`](#solveropts) — Interface
- [`CheckResult`](#checkresult) — Interface
- [`checkVC`](#checkvc) — Function
- [`implies`](#implies) — Function

## `SolverOpts`

> Interface · `type-theory/refinement-types/solver.ts:28`

```ts
export interface SolverOpts
```


## `CheckResult`

> Interface · `type-theory/refinement-types/solver.ts:35`

```ts
export interface CheckResult
```


## `checkVC`

> Function · `type-theory/refinement-types/solver.ts:146`

checkVC — devuelve si la conjunción de predicados es satisfacible.
Si lo es, incluye un testigo `counter` con la asignación encontrada.
El nombre "counter" se conserva por compatibilidad con la firma
típica de verificadores que buscan contraejemplos de implicaciones.

```ts
export function checkVC(predicates: string[], opts: SolverOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `predicates` | `string[]` | no |  |
| `opts` | `SolverOpts` | yes |  |

### Returns

`CheckResult` — 


## `implies`

> Function · `type-theory/refinement-types/solver.ts:221`

implies — chequea si `premises ⇒ conclusion` es válido en el dominio
acotado. Implementado como búsqueda de contraejemplo a
`premises ∧ ¬conclusion`.

```ts
export function implies(premises: string[], conclusion: string, opts: SolverOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `string[]` | no |  |
| `conclusion` | `string` | no |  |
| `opts` | `SolverOpts` | yes |  |

### Returns

`boolean` — 

