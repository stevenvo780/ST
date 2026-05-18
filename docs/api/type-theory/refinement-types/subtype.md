# `type-theory/refinement-types/subtype.ts`

============================================================ Refinement types — Subtipado por implicación ============================================================ Definición:   { x : B | P(x) } <: { y : B | Q(y) }     ⟺  B = B'  ∧  ∀x. P(x) ⇒ Q[x/y] Para tipos arrow se aplica contravarianza en el parámetro y covarianza en el resultado, como en sistemas refinados estándar.

## Contents

- [`SubtypeOpts`](#subtypeopts) — Interface
- [`isSubtype`](#issubtype) — Function

## `SubtypeOpts`

> Interface · `type-theory/refinement-types/subtype.ts:16`

```ts
export interface SubtypeOpts extends SolverOpts
```


## `isSubtype`

> Function · `type-theory/refinement-types/subtype.ts:27`

isSubtype — devuelve true si T1 <: T2 bajo las suposiciones del contexto.

- Para tipos base iguales: chequea P(x) ⇒ Q(x) renombrando el binding.
- Para arrows: contravarianza en `from`, covarianza en `to`.

```ts
export function isSubtype(t1: RefType, t2: RefType, opts: SubtypeOpts =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `RefType` | no |  |
| `t2` | `RefType` | no |  |
| `opts` | `SubtypeOpts` | yes |  |

### Returns

`boolean` — 

