# `type-theory/refinement-types/types.ts`

============================================================ Refinement types — AST, tipos refinados y términos ============================================================ Un tipo refinado expresa { x : B | P(x) } donde:   - B es un tipo base (Int / Bool / String / arrow)   - x es la variable de binding   - P(x) es un predicado escrito como expresión sintáctica     (cadenas de la forma "x > 0 && x < 100"). El módulo es minimalista (al estilo Liquid Haskell didáctico): el solver de VCs no es Z3 — es un evaluador/SAT-search sobre enteros y booleanos suficiente para los predicados que se construyen en los tests y para casos pequeños de subtipado.

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

> Type · `type-theory/refinement-types/types.ts:16`

```ts
export type BaseType = 'Int' | 'Bool' | 'String' | { kind: 'arrow'; from: RefType; to: RefType };
```


## `RefType`

> Interface · `type-theory/refinement-types/types.ts:18`

```ts
export interface RefType
```


## `RTerm`

> Type · `type-theory/refinement-types/types.ts:26`

```ts
export type RTerm = | { kind: 'lit'; value: number | boolean | string } | { kind: 'var'; name: string } | { kind: 'binop'; op: '+' | '-' | '*' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||'; left: RTerm; right: RTerm; } | { kind: 'if'; cond: RTerm; then: RTerm; else: RTerm } | { kind: 'lam'; param: string; paramType: RefType; body: RTerm } | { kind: 'app'; fn: RTerm; arg: RTerm } | { kind: 'let'; bind: string; bindType?: RefType; value: RTerm; body: RTerm };
```


## `tInt`

> Const · `type-theory/refinement-types/types.ts:42`

```ts
const tInt
```


## `tBool`

> Const · `type-theory/refinement-types/types.ts:48`

```ts
const tBool
```


## `tString`

> Const · `type-theory/refinement-types/types.ts:54`

```ts
const tString
```


## `tArrow`

> Const · `type-theory/refinement-types/types.ts:60`

```ts
const tArrow
```


## `refine`

> Const · `type-theory/refinement-types/types.ts:71`

```ts
const refine
```


## `rLit`

> Const · `type-theory/refinement-types/types.ts:79`

```ts
const rLit
```


## `rVar`

> Const · `type-theory/refinement-types/types.ts:80`

```ts
const rVar
```


## `rBinop`

> Const · `type-theory/refinement-types/types.ts:81`

```ts
const rBinop
```


## `rIf`

> Const · `type-theory/refinement-types/types.ts:86`

```ts
const rIf
```


## `rLam`

> Const · `type-theory/refinement-types/types.ts:92`

```ts
const rLam
```


## `rApp`

> Const · `type-theory/refinement-types/types.ts:98`

```ts
const rApp
```


## `rLet`

> Const · `type-theory/refinement-types/types.ts:99`

```ts
const rLet
```


## `eqBase`

> Function · `type-theory/refinement-types/types.ts:109`

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

> Function · `type-theory/refinement-types/types.ts:115`

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

> Function · `type-theory/refinement-types/types.ts:124`

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

> Function · `type-theory/refinement-types/types.ts:129`

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

> Function · `type-theory/refinement-types/types.ts:137`

```ts
export function termToString(t: RTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `RTerm` | no |  |

### Returns

`string` — 

