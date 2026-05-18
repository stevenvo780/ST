# `tooling/mathlib/instances.ts`

============================================================ ST Mathlib — Instancias estándar Z aditivo, anillo Z, racionales como campo, Z/nZ, S_3. ============================================================

## Contents

- [`intAdditiveGroup`](#intadditivegroup) — Const
- [`intRing`](#intring) — Const
- [`Rational`](#rational) — Interface
- [`rational`](#rational) — Function
- [`rationalEq`](#rationaleq) — Function
- [`rationalsField`](#rationalsfield) — Const
- [`rationalDiv`](#rationaldiv) — Function
- [`zModN`](#zmodn) — Function
- [`zModNElements`](#zmodnelements) — Function
- [`zModNDiv`](#zmodndiv) — Function
- [`Perm3`](#perm3) — Type
- [`sym3Elements`](#sym3elements) — Const
- [`perm3Eq`](#perm3eq) — Function
- [`sym3`](#sym3) — Const

## `intAdditiveGroup`

> Const · `tooling/mathlib/instances.ts:11`

```ts
const intAdditiveGroup: AbelianGroup<bigint>
```


## `intRing`

> Const · `tooling/mathlib/instances.ts:20`

```ts
const intRing: Ring<bigint>
```


## `Rational`

> Interface · `tooling/mathlib/instances.ts:34`

```ts
export interface Rational
```


## `rational`

> Function · `tooling/mathlib/instances.ts:50`

```ts
export function rational(num: bigint, den: bigint): Rational
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `num` | `bigint` | no |  |
| `den` | `bigint` | no |  |

### Returns

`Rational` — 


## `rationalEq`

> Function · `tooling/mathlib/instances.ts:59`

```ts
export function rationalEq(a: Rational, b: Rational): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Rational` | no |  |
| `b` | `Rational` | no |  |

### Returns

`boolean` — 


## `rationalsField`

> Const · `tooling/mathlib/instances.ts:63`

```ts
const rationalsField: Ring<Rational>
```


## `rationalDiv`

> Function · `tooling/mathlib/instances.ts:74`

División en Q. `undefined` solo cuando b = 0/1 (división por cero).

```ts
export function rationalDiv(a: Rational, b: Rational): Rational | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Rational` | no |  |
| `b` | `Rational` | no |  |

### Returns

`Rational \| undefined` — 


## `zModN`

> Function · `tooling/mathlib/instances.ts:87`

```ts
export function zModN(n: bigint): Ring<bigint>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`Ring<bigint>` — 


## `zModNElements`

> Function · `tooling/mathlib/instances.ts:101`

Lista los n representantes canónicos {0, 1, ..., n-1}.

```ts
export function zModNElements(n: bigint): bigint[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`bigint[]` — 


## `zModNDiv`

> Function · `tooling/mathlib/instances.ts:111`

División modular: busca b tal que a · b ≡ 1 (mod n) por fuerza bruta
sobre el dominio finito. Devuelve undefined si no existe inverso.

```ts
export function zModNDiv(n: bigint): (a: bigint, b: bigint) => bigint | undefined
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `bigint` | no |  |

### Returns

`(a: bigint, b: bigint) => bigint \| undefined` — 


## `Perm3`

> Type · `tooling/mathlib/instances.ts:125`

```ts
export type Perm3 = [number, number, number];
```


## `sym3Elements`

> Const · `tooling/mathlib/instances.ts:127`

```ts
const sym3Elements: Perm3[]
```


## `perm3Eq`

> Function · `tooling/mathlib/instances.ts:149`

```ts
export function perm3Eq(a: Perm3, b: Perm3): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Perm3` | no |  |
| `b` | `Perm3` | no |  |

### Returns

`boolean` — 


## `sym3`

> Const · `tooling/mathlib/instances.ts:153`

```ts
const sym3: Group<Perm3>
```

