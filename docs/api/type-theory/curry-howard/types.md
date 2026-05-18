# `type-theory/curry-howard/types.ts`

Tipo proposicional / tipo simple en la correspondencia Curry-Howard: átomo, flecha →, producto ∧, suma ∨ y ⊥.

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

> Type · `type-theory/curry-howard/types.ts:18`

Tipo proposicional / tipo simple en la correspondencia Curry-Howard: átomo, flecha →, producto ∧, suma ∨ y ⊥.

```ts
export type PropType = | { kind: 'atom'; name: string } | { kind: 'arrow'; from: PropType; to: PropType } | { kind: 'product'; left: PropType; right: PropType } | { kind: 'sum'; left: PropType; right: PropType } | { kind: 'bottom' };
```


## `LambdaTerm`

> Type · `type-theory/curry-howard/types.ts:26`

Término del λ-cálculo con tipos simples (Curry-Howard): variable, aplicación, abstracción, pares, sumas y absurdo.

```ts
export type LambdaTerm = | { kind: 'var'; name: string } | { kind: 'app'; fn: LambdaTerm; arg: LambdaTerm } | { kind: 'abs'; param: string; paramType: PropType; body: LambdaTerm } | { kind: 'pair'; fst: LambdaTerm; snd: LambdaTerm } | { kind: 'fst'; pair: LambdaTerm } | { kind: 'snd'; pair: LambdaTerm } | { kind: 'inl'; left: LambdaTerm; rightType: PropType } | { kind: 'inr'; right: LambdaTerm; leftType: PropType } | { kind: 'case'; scrutinee: LambdaTerm; leftBind: string; leftBody: LambdaTerm; rightBind: string; rightBody: LambdaTerm; } | { kind: 'absurd'; proofOfFalse: LambdaTerm; resultType: PropType };
```


## `ProofRule`

> Type · `type-theory/curry-howard/types.ts:50`

Reglas de deducción natural del sistema proposicional (Curry-Howard).
`'axiom'` = hipótesis del contexto; `'→I'`/`'→E'` = implicación; `'∧I'`/`'∧E-*'` = conjunción;
`'∨I-*'`/`'∨E'` = disyunción; `'⊥E'` = ex falso quodlibet.

```ts
export type ProofRule = | 'axiom' // hipótesis disponible en contexto (asunción no descargada aquí) | '→I' // implicación-intro (descarga A, deriva A→B desde B) | '→E' // modus ponens | '∧I' // conjunción-intro | '∧E-L' // proyección izquierda | '∧E-R' // proyección derecha | '∨I-L' // disyunción-intro por izquierda | '∨I-R' // disyunción-intro por derecha | '∨E' // eliminación de disyunción (case) | '⊥E';
```


## `ProofTree`

> Interface · `type-theory/curry-howard/types.ts:63`

Árbol de prueba en deducción natural: cada nodo lleva la regla, la conclusión y sub-árboles (premisas).

```ts
export interface ProofTree
```


## `Context`

> Type · `type-theory/curry-howard/types.ts:75`

Contexto de tipado: mapa de nombres de variables a tipos proposicionales.

```ts
export type Context = Record<string, PropType>;
```


## `atom`

> Const · `type-theory/curry-howard/types.ts:79`

Tipo atómico (variable proposicional).

```ts
const atom
```


## `arrow`

> Const · `type-theory/curry-howard/types.ts:81`

Tipo flecha `from → to` (implicación).

```ts
const arrow
```


## `product`

> Const · `type-theory/curry-howard/types.ts:83`

Tipo producto `left ∧ right` (conjunción).

```ts
const product
```


## `sum`

> Const · `type-theory/curry-howard/types.ts:89`

Tipo suma `left ∨ right` (disyunción).

```ts
const sum
```


## `bottom`

> Const · `type-theory/curry-howard/types.ts:91`

Tipo bottom `⊥` (falsedad / tipo vacío).

```ts
const bottom
```


## `vr`

> Const · `type-theory/curry-howard/types.ts:94`

Variable λ.

```ts
const vr
```


## `app`

> Const · `type-theory/curry-howard/types.ts:96`

Aplicación de función (modus ponens).

```ts
const app
```


## `abs`

> Const · `type-theory/curry-howard/types.ts:98`

Abstracción λ (implicación-intro): `λparam:paramType. body`.

```ts
const abs
```


## `pair`

> Const · `type-theory/curry-howard/types.ts:105`

Par `⟨f, s⟩` (conjunción-intro).

```ts
const pair
```


## `fst`

> Const · `type-theory/curry-howard/types.ts:111`

Proyección izquierda `fst(p)` (∧E-L).

```ts
const fst
```


## `snd`

> Const · `type-theory/curry-howard/types.ts:113`

Proyección derecha `snd(p)` (∧E-R).

```ts
const snd
```


## `inl`

> Const · `type-theory/curry-howard/types.ts:115`

Inyección izquierda `inl(left)` (∨I-L); requiere el tipo del lado derecho.

```ts
const inl
```


## `inr`

> Const · `type-theory/curry-howard/types.ts:121`

Inyección derecha `inr(right)` (∨I-R); requiere el tipo del lado izquierdo.

```ts
const inr
```


## `cse`

> Const · `type-theory/curry-howard/types.ts:127`

Eliminación de disyunción `case scrutinee of inl(lb)→leftBody | inr(rb)→rightBody` (∨E).

```ts
const cse
```


## `absurd`

> Const · `type-theory/curry-howard/types.ts:142`

Ex falso: dado `proofOfFalse : ⊥`, produce cualquier tipo `resultType` (⊥E).

```ts
const absurd
```


## `eqType`

> Function · `type-theory/curry-howard/types.ts:150`

Igualdad estructural entre dos tipos proposicionales.

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

> Function · `type-theory/curry-howard/types.ts:174`

Serializa un tipo proposicional a texto con notación estándar (→, ∧, ∨, ⊥).

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

> Function · `type-theory/curry-howard/types.ts:192`

Serializa un término λ a texto con notación estándar (λ, fst, snd, inl, inr, case, absurd).

```ts
export function termToString(t: LambdaTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `LambdaTerm` | no |  |

### Returns

`string` — 

