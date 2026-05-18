# `type-theory/curry-howard/types.ts`

============================================================ Curry-Howard — Tipos y términos ============================================================ Correspondencia Curry-Howard:   tipo            ↔  proposición   programa        ↔  prueba   β-reducción     ↔  normalización de pruebas Constructores soportados:   →   (arrow)    →  implicación   ∧   (product)  →  conjunción   ∨   (sum)      →  disyunción   ⊥   (bottom)   →  falso   atom           →  variable proposicional

## Contents

- [`PropType`](#proptype) — Type
- [`LambdaTerm`](#lambdaterm) — Type
- [`ProofRule`](#proofrule) — Type
- [`ProofTree`](#prooftree) — Interface
- [`Context`](#context) — Type
- [`atom`](#atom) — Const
- [`arrow`](#arrow) — Const
- [`product`](#product) — Const
- [`sum`](#sum) — Const
- [`bottom`](#bottom) — Const
- [`vr`](#vr) — Const
- [`app`](#app) — Const
- [`abs`](#abs) — Const
- [`pair`](#pair) — Const
- [`fst`](#fst) — Const
- [`snd`](#snd) — Const
- [`inl`](#inl) — Const
- [`inr`](#inr) — Const
- [`cse`](#cse) — Const
- [`absurd`](#absurd) — Const
- [`eqType`](#eqtype) — Function
- [`typeToString`](#typetostring) — Function
- [`termToString`](#termtostring) — Function

## `PropType`

> Type · `type-theory/curry-howard/types.ts:17`

```ts
export type PropType = | { kind: 'atom'; name: string } | { kind: 'arrow'; from: PropType; to: PropType } | { kind: 'product'; left: PropType; right: PropType } | { kind: 'sum'; left: PropType; right: PropType } | { kind: 'bottom' };
```


## `LambdaTerm`

> Type · `type-theory/curry-howard/types.ts:24`

```ts
export type LambdaTerm = | { kind: 'var'; name: string } | { kind: 'app'; fn: LambdaTerm; arg: LambdaTerm } | { kind: 'abs'; param: string; paramType: PropType; body: LambdaTerm } | { kind: 'pair'; fst: LambdaTerm; snd: LambdaTerm } | { kind: 'fst'; pair: LambdaTerm } | { kind: 'snd'; pair: LambdaTerm } | { kind: 'inl'; left: LambdaTerm; rightType: PropType } | { kind: 'inr'; right: LambdaTerm; leftType: PropType } | { kind: 'case'; scrutinee: LambdaTerm; leftBind: string; leftBody: LambdaTerm; rightBind: string; rightBody: LambdaTerm; } | { kind: 'absurd'; proofOfFalse: LambdaTerm; resultType: PropType };
```


## `ProofRule`

> Type · `type-theory/curry-howard/types.ts:47`

```ts
export type ProofRule = | 'axiom' // hipótesis disponible en contexto (asunción no descargada aquí) | '→I' // implicación-intro (descarga A, deriva A→B desde B) | '→E' // modus ponens | '∧I' // conjunción-intro | '∧E-L' // proyección izquierda | '∧E-R' // proyección derecha | '∨I-L' // disyunción-intro por izquierda | '∨I-R' // disyunción-intro por derecha | '∨E' // eliminación de disyunción (case) | '⊥E';
```


## `ProofTree`

> Interface · `type-theory/curry-howard/types.ts:59`

```ts
export interface ProofTree
```


## `Context`

> Type · `type-theory/curry-howard/types.ts:70`

```ts
export type Context = Record<string, PropType>;
```


## `atom`

> Const · `type-theory/curry-howard/types.ts:73`

```ts
const atom
```


## `arrow`

> Const · `type-theory/curry-howard/types.ts:74`

```ts
const arrow
```


## `product`

> Const · `type-theory/curry-howard/types.ts:75`

```ts
const product
```


## `sum`

> Const · `type-theory/curry-howard/types.ts:80`

```ts
const sum
```


## `bottom`

> Const · `type-theory/curry-howard/types.ts:81`

```ts
const bottom
```


## `vr`

> Const · `type-theory/curry-howard/types.ts:83`

```ts
const vr
```


## `app`

> Const · `type-theory/curry-howard/types.ts:84`

```ts
const app
```


## `abs`

> Const · `type-theory/curry-howard/types.ts:85`

```ts
const abs
```


## `pair`

> Const · `type-theory/curry-howard/types.ts:91`

```ts
const pair
```


## `fst`

> Const · `type-theory/curry-howard/types.ts:96`

```ts
const fst
```


## `snd`

> Const · `type-theory/curry-howard/types.ts:97`

```ts
const snd
```


## `inl`

> Const · `type-theory/curry-howard/types.ts:98`

```ts
const inl
```


## `inr`

> Const · `type-theory/curry-howard/types.ts:103`

```ts
const inr
```


## `cse`

> Const · `type-theory/curry-howard/types.ts:108`

```ts
const cse
```


## `absurd`

> Const · `type-theory/curry-howard/types.ts:122`

```ts
const absurd
```


## `eqType`

> Function · `type-theory/curry-howard/types.ts:129`

```ts
export function eqType(a: PropType, b: PropType): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `PropType` | no |  |
| `b` | `PropType` | no |  |

### Returns

`boolean` — 


## `typeToString`

> Function · `type-theory/curry-howard/types.ts:152`

```ts
export function typeToString(t: PropType): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `PropType` | no |  |

### Returns

`string` — 


## `termToString`

> Function · `type-theory/curry-howard/types.ts:169`

```ts
export function termToString(t: LambdaTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `LambdaTerm` | no |  |

### Returns

`string` — 

