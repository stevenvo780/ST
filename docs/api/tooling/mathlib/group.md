# `tooling/mathlib/group.ts`

============================================================ ST Mathlib — Group theory Axiomas: asociatividad, identidad, inversos, conmutatividad. ============================================================

## Contents

- [`isAssociative`](#isassociative) — Function
- [`isCommutative`](#iscommutative) — Function
- [`hasIdentity`](#hasidentity) — Function
- [`hasInverses`](#hasinverses) — Function
- [`verifyGroup`](#verifygroup) — Function
- [`verifyAbelianGroup`](#verifyabeliangroup) — Function

## `isAssociative`

> Function · `tooling/mathlib/group.ts:11`

(a · b) · c = a · (b · c) para todo a,b,c en el muestreo.

```ts
export function isAssociative<T>( m: Magma<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `m` | `Magma<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `isCommutative`

> Function · `tooling/mathlib/group.ts:31`

a · b = b · a para todo a,b. Falla rápido si encuentra contraejemplo.

```ts
export function isCommutative<T>( m: Magma<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `m` | `Magma<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `hasIdentity`

> Function · `tooling/mathlib/group.ts:47`

Para todo a: id · a = a ∧ a · id = a.

```ts
export function hasIdentity<T>( m: Magma<T>, elements: T[], id: T, eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `m` | `Magma<T>` | no |  |
| `elements` | `T[]` | no |  |
| `id` | `T` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `hasInverses`

> Function · `tooling/mathlib/group.ts:63`

Para todo a: a · a⁻¹ = id ∧ a⁻¹ · a = id.

```ts
export function hasInverses<T>( g: Group<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g` | `Group<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`boolean` — 


## `verifyGroup`

> Function · `tooling/mathlib/group.ts:80`

Verifica los 4 axiomas de grupo: clausura (implícita en el tipo),
asociatividad, identidad e inversos. Reporta qué axiomas fallaron.

```ts
export function verifyGroup<T>( g: Group<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): VerificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g` | `Group<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`VerificationResult` — 


## `verifyAbelianGroup`

> Function · `tooling/mathlib/group.ts:95`

Verifica que un grupo es abeliano (verifyGroup + conmutatividad).

```ts
export function verifyAbelianGroup<T>( g: Group<T>, elements: T[], eq: (a: T, b: T) => boolean = (a, b) => a === b, ): VerificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g` | `Group<T>` | no |  |
| `elements` | `T[]` | no |  |
| `eq` | `(a: T, b: T) => boolean` | yes |  |

### Returns

`VerificationResult` — 

