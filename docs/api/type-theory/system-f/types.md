# `type-theory/system-f/types.ts`

Tipo en System F: variable atómica, función o cuantificación universal ∀X.

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

> Type · `type-theory/system-f/types.ts:21`

Tipo en System F: variable atómica, función o cuantificación universal ∀X.

```ts
export type FType = | { kind: 'atom'; name: string } | { kind: 'arrow'; from: FType; to: FType } | { kind: 'forall'; bind: string; body: FType };
```


## `FTerm`

> Type · `type-theory/system-f/types.ts:27`

Término en System F: variable, abstracción, aplicación, Λ-abstracción y aplicación de tipo.

```ts
export type FTerm = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; paramType: FType; body: FTerm } | { kind: 'app'; fn: FTerm; arg: FTerm } | { kind: 'tabs'; bind: string; body: FTerm } // Λ X. t | { kind: 'tapp'; fn: FTerm; typeArg: FType };
```


## `fAtom`

> Const · `type-theory/system-f/types.ts:36`

Crea una variable de tipo atómica con nombre `name`.

```ts
const fAtom
```


## `fArrow`

> Const · `type-theory/system-f/types.ts:38`

Crea el tipo función `from → to`.

```ts
const fArrow
```


## `fForall`

> Const · `type-theory/system-f/types.ts:40`

Crea el tipo `∀bind. body`.

```ts
const fForall
```


## `fVar`

> Const · `type-theory/system-f/types.ts:43`

Crea una referencia a variable de término.

```ts
const fVar
```


## `fAbs`

> Const · `type-theory/system-f/types.ts:45`

Crea una abstracción `λparam:paramType. body`.

```ts
const fAbs
```


## `fApp`

> Const · `type-theory/system-f/types.ts:52`

Crea una aplicación de término `fn arg`.

```ts
const fApp
```


## `fTAbs`

> Const · `type-theory/system-f/types.ts:54`

Crea una abstracción de tipo `Λbind. body`.

```ts
const fTAbs
```


## `fTApp`

> Const · `type-theory/system-f/types.ts:56`

Crea una aplicación de tipo `fn [typeArg]`.

```ts
const fTApp
```


## `freeTypeVars`

> Function · `type-theory/system-f/types.ts:63`

Calcula el conjunto de variables de tipo libres en `t`.

```ts
export function freeTypeVars(t: FType, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FType` | no |  |
| `acc` | `Set<string>` | yes | Acumulador (se modifica in-place y se retorna). |

### Returns

`Set<string>` — 


## `alphaEqType`

> Function · `type-theory/system-f/types.ts:86`

Comprueba α-equivalencia entre dos tipos de System F.
`∀X. T` y `∀Y. T[X:=Y]` se consideran iguales.

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

> Function · `type-theory/system-f/types.ts:130`

Indica si `type` está bien formado: todas sus variables libres están
declaradas en el contexto de tipos `ctx`.

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

> Function · `type-theory/system-f/types.ts:146`

Serializa un `FType` en notación matemática (`∀X. …`, `A → B`).

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

> Function · `type-theory/system-f/types.ts:163`

Serializa un `FTerm` en notación legible para debugging y mensajes de error.

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

> Interface · `type-theory/system-f/types.ts:186`

Contexto de tipado de System F.
Contiene variables de término (con su tipo) y variables de tipo declaradas (Λ las introduce).

```ts
export interface FContext
```


## `emptyContext`

> Function · `type-theory/system-f/types.ts:192`

Crea un contexto de tipado vacío.

```ts
export function emptyContext(): FContext
```

### Returns

`FContext` — 


## `cloneContext`

> Function · `type-theory/system-f/types.ts:197`

Crea una copia independiente del contexto para extensiones locales.

```ts
export function cloneContext(ctx: FContext): FContext
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `FContext` | no |  |

### Returns

`FContext` — 

