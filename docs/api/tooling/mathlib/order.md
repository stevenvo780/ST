# `tooling/mathlib/order.ts`

============================================================ ST Mathlib — Order theory Reflexividad, antisimetría, transitividad y lattice check. ============================================================

## Contents

- [`isReflexive`](#isreflexive) — Function
- [`isAntisymmetric`](#isantisymmetric) — Function
- [`isTransitive`](#istransitive) — Function
- [`isLattice`](#islattice) — Function
- [`verifyPartialOrder`](#verifypartialorder) — Function

## `isReflexive`

> Function · `tooling/mathlib/order.ts:11`

Para todo a en `elements`: a ≤ a.

```ts
export function isReflexive<T>(po: PartialOrder<T>, elements: T[]): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `po` | `PartialOrder<T>` | no |  |
| `elements` | `T[]` | no |  |

### Returns

`boolean` — 


## `isAntisymmetric`

> Function · `tooling/mathlib/order.ts:23`

Para todo a,b: a ≤ b ∧ b ≤ a ⇒ a = b.
La igualdad se decide con `===` para tipos primitivos; para
tipos compuestos se acepta un `eq` custom.

```ts
export function isAntisymmetric<T>( po: PartialOrder<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `po` | `PartialOrder<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `isTransitive`

> Function · `tooling/mathlib/order.ts:39`

Para todo a,b,c: a ≤ b ∧ b ≤ c ⇒ a ≤ c.

```ts
export function isTransitive<T>(po: PartialOrder<T>, elements: T[]): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `po` | `PartialOrder<T>` | no |  |
| `elements` | `T[]` | no |  |

### Returns

`boolean` — 


## `isLattice`

> Function · `tooling/mathlib/order.ts:55`

Un poset es lattice si cada par {a,b} tiene supremo (join) e
ínfimo (meet) dentro de `elements`. Esto verifica existencia
estructural usando el orden parcial (no requiere ops explícitas).

```ts
export function isLattice<T>( po: PartialOrder<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `po` | `PartialOrder<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `verifyPartialOrder`

> Function · `tooling/mathlib/order.ts:84`

Reporte completo del orden parcial sobre el conjunto dado.

```ts
export function verifyPartialOrder<T>( po: PartialOrder<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `po` | `PartialOrder<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`{ valid: boolean; failures: string[] }` — 

