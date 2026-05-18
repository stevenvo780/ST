# `type-theory/refinement-types/types.ts`

Tipo base de un tipo refinado: primitivo o flecha entre tipos refinados.

## Contents

- [`BaseType`](#basetype) — Type
- [`RefType`](#reftype) — Interface
- [`RTerm`](#rterm) — Type
- [`tInt`](#tint) — Const
- [`tBool`](#tbool) — Const
- [`tString`](#tstring) — Const
- [`tArrow`](#tarrow) — Const
- [`refine`](#refine) — Const
- [`rLit`](#rlit) — Const
- [`rVar`](#rvar) — Const
- [`rBinop`](#rbinop) — Const
- [`rIf`](#rif) — Const
- [`rLam`](#rlam) — Const
- [`rApp`](#rapp) — Const
- [`rLet`](#rlet) — Const
- [`eqBase`](#eqbase) — Function
- [`eqRefType`](#eqreftype) — Function
- [`baseToString`](#basetostring) — Function
- [`refTypeToString`](#reftypetostring) — Function
- [`termToString`](#termtostring) — Function

## `BaseType`

> Type · `type-theory/refinement-types/types.ts:17`

Tipo base de un tipo refinado: primitivo o flecha entre tipos refinados.

```ts
export type BaseType = 'Int' | 'Bool' | 'String' | { kind: 'arrow'; from: RefType; to: RefType };
```


## `RefType`

> Interface · `type-theory/refinement-types/types.ts:20`

Tipo refinado `{ binding : base | predicate }`.

```ts
export interface RefType
```


## `RTerm`

> Type · `type-theory/refinement-types/types.ts:29`

Término del lenguaje de refinamiento (AST).

```ts
export type RTerm = | { kind: 'lit'; value: number | boolean | string } | { kind: 'var'; name: string } | { kind: 'binop'; op: '+' | '-' | '*' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||'; left: RTerm; right: RTerm; } | { kind: 'if'; cond: RTerm; then: RTerm; else: RTerm } | { kind: 'lam'; param: string; paramType: RefType; body: RTerm } | { kind: 'app'; fn: RTerm; arg: RTerm } | { kind: 'let'; bind: string; bindType?: RefType; value: RTerm; body: RTerm };
```


## `tInt`

> Const · `type-theory/refinement-types/types.ts:46`

Construye el tipo refinado `{ binding : Int | predicate }`.

```ts
const tInt
```


## `tBool`

> Const · `type-theory/refinement-types/types.ts:53`

Construye el tipo refinado `{ binding : Bool | predicate }`.

```ts
const tBool
```


## `tString`

> Const · `type-theory/refinement-types/types.ts:60`

Construye el tipo refinado `{ binding : String | predicate }`.

```ts
const tString
```


## `tArrow`

> Const · `type-theory/refinement-types/types.ts:71`

Construye un tipo refinado flecha `{ binding : (from -> to) | predicate }`.

```ts
const tArrow
```


## `refine`

> Const · `type-theory/refinement-types/types.ts:88`

Construye un tipo refinado a partir de sus partes.

```ts
const refine
```


## `rLit`

> Const · `type-theory/refinement-types/types.ts:97`

Crea un literal (número, booleano o cadena).

```ts
const rLit
```


## `rVar`

> Const · `type-theory/refinement-types/types.ts:99`

Crea una referencia a variable por nombre.

```ts
const rVar
```


## `rBinop`

> Const · `type-theory/refinement-types/types.ts:104`

Crea una expresión binaria con operador `op`.

```ts
const rBinop
```


## `rIf`

> Const · `type-theory/refinement-types/types.ts:110`

Crea una expresión condicional `if cond then t else e`.

```ts
const rIf
```


## `rLam`

> Const · `type-theory/refinement-types/types.ts:117`

Crea una abstracción lambda con tipo refinado para el parámetro.

```ts
const rLam
```


## `rApp`

> Const · `type-theory/refinement-types/types.ts:124`

Crea una aplicación de función a argumento.

```ts
const rApp
```


## `rLet`

> Const · `type-theory/refinement-types/types.ts:126`

Crea un `let bind = value in body` con anotación de tipo opcional.

```ts
const rLet
```


## `eqBase`

> Function · `type-theory/refinement-types/types.ts:140`

Comprueba igualdad estructural de dos `BaseType`.
Para flechas, delega en `eqRefType` para los subtipos.

```ts
export function eqBase(a: BaseType, b: BaseType): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `BaseType` | no |  |
| `b` | `BaseType` | no |  |

### Returns

`boolean` — 


## `eqRefType`

> Function · `type-theory/refinement-types/types.ts:150`

Comprueba igualdad estructural de dos `RefType` (ignora predicados;
la equivalencia semántica la maneja el subtipado).

```ts
export function eqRefType(a: RefType, b: RefType): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `RefType` | no |  |
| `b` | `RefType` | no |  |

### Returns

`boolean` — 


## `baseToString`

> Function · `type-theory/refinement-types/types.ts:160`

Serializa un `BaseType` en notación legible (e.g. `Int`, `(T) -> (U)`).

```ts
export function baseToString(b: BaseType): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `b` | `BaseType` | no |  |

### Returns

`string` — 


## `refTypeToString`

> Function · `type-theory/refinement-types/types.ts:166`

Serializa un `RefType` como `{ v : B | P }` (sin predicado si es trivial).

```ts
export function refTypeToString(t: RefType): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `RefType` | no |  |

### Returns

`string` — 


## `termToString`

> Function · `type-theory/refinement-types/types.ts:175`

Serializa un `RTerm` en notación legible para debugging y mensajes de error.

```ts
export function termToString(t: RTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `RTerm` | no |  |

### Returns

`string` — 

