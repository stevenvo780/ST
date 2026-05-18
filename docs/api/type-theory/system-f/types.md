# `type-theory/system-f/types.ts`

============================================================ System F — Polymorphic lambda calculus (λ²) ============================================================ Extiende el λ-cálculo simplemente tipado con cuantificación universal sobre tipos:   T ::= X | T → T | ∀X. T   t ::= x | λx:T. t | t t | Λ X. t | t [T] Curry-Howard: corresponde a la lógica proposicional intuicionista de segundo orden (cuantificación sobre proposiciones). Convenciones:   - Variables de término: minúsculas (x, y, f).   - Variables de tipo: mayúsculas convencionalmente (X, Y, Z), pero     no impuestas — `atom('foo')` también es legal.   - Λ usa `tabs` (type-abstraction); t [T] usa `tapp`.

## Contents

- [`FType`](#ftype) — Type
- [`FTerm`](#fterm) — Type
- [`fAtom`](#fatom) — Const
- [`fArrow`](#farrow) — Const
- [`fForall`](#fforall) — Const
- [`fVar`](#fvar) — Const
- [`fAbs`](#fabs) — Const
- [`fApp`](#fapp) — Const
- [`fTAbs`](#ftabs) — Const
- [`fTApp`](#ftapp) — Const
- [`freeTypeVars`](#freetypevars) — Function
- [`alphaEqType`](#alphaeqtype) — Function
- [`isWellFormed`](#iswellformed) — Function
- [`fTypeToString`](#ftypetostring) — Function
- [`fTermToString`](#ftermtostring) — Function
- [`FContext`](#fcontext) — Interface
- [`emptyContext`](#emptycontext) — Function
- [`cloneContext`](#clonecontext) — Function

## `FType`

> Type · `type-theory/system-f/types.ts:20`

```ts
export type FType = | { kind: 'atom'; name: string } | { kind: 'arrow'; from: FType; to: FType } | { kind: 'forall'; bind: string; body: FType };
```


## `FTerm`

> Type · `type-theory/system-f/types.ts:25`

```ts
export type FTerm = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; paramType: FType; body: FTerm } | { kind: 'app'; fn: FTerm; arg: FTerm } | { kind: 'tabs'; bind: string; body: FTerm } // Λ X. t | { kind: 'tapp'; fn: FTerm; typeArg: FType };
```


## `fAtom`

> Const · `type-theory/system-f/types.ts:33`

```ts
const fAtom
```


## `fArrow`

> Const · `type-theory/system-f/types.ts:34`

```ts
const fArrow
```


## `fForall`

> Const · `type-theory/system-f/types.ts:35`

```ts
const fForall
```


## `fVar`

> Const · `type-theory/system-f/types.ts:37`

```ts
const fVar
```


## `fAbs`

> Const · `type-theory/system-f/types.ts:38`

```ts
const fAbs
```


## `fApp`

> Const · `type-theory/system-f/types.ts:44`

```ts
const fApp
```


## `fTAbs`

> Const · `type-theory/system-f/types.ts:45`

```ts
const fTAbs
```


## `fTApp`

> Const · `type-theory/system-f/types.ts:46`

```ts
const fTApp
```


## `freeTypeVars`

> Function · `type-theory/system-f/types.ts:49`

```ts
export function freeTypeVars(t: FType, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FType` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `alphaEqType`

> Function · `type-theory/system-f/types.ts:69`

```ts
export function alphaEqType(a: FType, b: FType): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `FType` | no |  |
| `b` | `FType` | no |  |

### Returns

`boolean` — 


## `isWellFormed`

> Function · `type-theory/system-f/types.ts:111`

```ts
export function isWellFormed(type: FType, ctx: Set<string> = new Set()): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `type` | `FType` | no |  |
| `ctx` | `Set<string>` | yes |  |

### Returns

`boolean` — 


## `fTypeToString`

> Function · `type-theory/system-f/types.ts:126`

```ts
export function fTypeToString(t: FType): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FType` | no |  |

### Returns

`string` — 


## `fTermToString`

> Function · `type-theory/system-f/types.ts:142`

```ts
export function fTermToString(t: FTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FTerm` | no |  |

### Returns

`string` — 


## `FContext`

> Interface · `type-theory/system-f/types.ts:163`

```ts
export interface FContext
```


## `emptyContext`

> Function · `type-theory/system-f/types.ts:168`

```ts
export function emptyContext(): FContext
```

### Returns

`FContext` — 


## `cloneContext`

> Function · `type-theory/system-f/types.ts:172`

```ts
export function cloneContext(ctx: FContext): FContext
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FContext` | no |  |

### Returns

`FContext` — 

