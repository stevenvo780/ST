# `type-theory/lambda-cube/types.ts`

============================================================ Lambda Cube (Barendregt) — Términos como Pure Type System (PTS) ============================================================ El cubo λ de Barendregt presenta 8 sistemas de tipos puros como activaciones de 3 ejes ortogonales sobre el λ-cálculo simplemente tipado:        polymorphism             ──   ∀ sobre términos     (λ2, λω, λC ...)        type operators           ──   funciones a nivel tipo (λω, λC ...)        dependent types          ──   tipos que dependen de términos (λP, λC ...) Cada combinación es un PTS con dos sorts:        * (Set / Prop)     y     ◻ (Type / Kind) y un conjunto de reglas de formación (s1, s2) para Π. La sintaxis unificada usada en este módulo:        t ::= x            | s                 sort (* | ◻)            | Π x:t. t          producto dependiente            | λ x:t. t          abstracción            | t t               aplicación Las reglas de formación de cada vértice del cubo deciden qué abstracciones son legales. Por ejemplo:   λ→         (*, *)                              STLC   λ2         (*, *) (◻, *)                       System F   λω̄         (*, *) (◻, ◻)                       λω débil   λω         (*, *) (◻, *) (◻, ◻)                System Fω   λP         (*, *) (*, ◻)                       LF / λΠ   λP2        (*, *) (◻, *) (*, ◻)   λPω̄        (*, *) (*, ◻) (◻, ◻)   λC         (*, *) (◻, *) (*, ◻) (◻, ◻)         Calculus of Constructions

## Contents

- [`Sort`](#sort) — Type
- [`CubeSystem`](#cubesystem) — Type
- [`CubeTerm`](#cubeterm) — Type
- [`cVar`](#cvar) — Const
- [`cSort`](#csort) — Const
- [`cStar`](#cstar) — Const
- [`cBox`](#cbox) — Const
- [`cPi`](#cpi) — Const
- [`cLam`](#clam) — Const
- [`cApp`](#capp) — Const
- [`cArrow`](#carrow) — Const
- [`occursFree`](#occursfree) — Function
- [`freeVars`](#freevars) — Function
- [`termToString`](#termtostring) — Function
- [`alphaEq`](#alphaeq) — Function
- [`CubeContext`](#cubecontext) — Type
- [`emptyContext`](#emptycontext) — Function
- [`extendContext`](#extendcontext) — Function

## `Sort`

> Type · `type-theory/lambda-cube/types.ts:39`

```ts
export type Sort = '*' | '◻';
```


## `CubeSystem`

> Type · `type-theory/lambda-cube/types.ts:41`

```ts
export type CubeSystem = | 'lambda' | 'lambda2' | 'lambda-omega-bar' | 'lambda-omega' | 'lambda-P' | 'lambda-P2' | 'lambda-P-omega' | 'lambda-C';
```


## `CubeTerm`

> Type · `type-theory/lambda-cube/types.ts:51`

```ts
export type CubeTerm = | { kind: 'var'; name: string } | { kind: 'sort'; sort: Sort } | { kind: 'pi'; bind: string; domain: CubeTerm; codomain: CubeTerm } | { kind: 'lam'; bind: string; domain: CubeTerm; body: CubeTerm } | { kind: 'app'; fn: CubeTerm; arg: CubeTerm };
```


## `cVar`

> Const · `type-theory/lambda-cube/types.ts:60`

```ts
const cVar
```


## `cSort`

> Const · `type-theory/lambda-cube/types.ts:61`

```ts
const cSort
```


## `cStar`

> Const · `type-theory/lambda-cube/types.ts:62`

```ts
const cStar: CubeTerm
```


## `cBox`

> Const · `type-theory/lambda-cube/types.ts:63`

```ts
const cBox: CubeTerm
```


## `cPi`

> Const · `type-theory/lambda-cube/types.ts:64`

```ts
const cPi
```


## `cLam`

> Const · `type-theory/lambda-cube/types.ts:70`

```ts
const cLam
```


## `cApp`

> Const · `type-theory/lambda-cube/types.ts:76`

```ts
const cApp
```


## `cArrow`

> Const · `type-theory/lambda-cube/types.ts:79`

Flecha no-dependiente: Π (_ : A). B, cuando B no menciona el binder.

```ts
const cArrow
```


## `occursFree`

> Function · `type-theory/lambda-cube/types.ts:83`

```ts
export function occursFree(name: string, term: CubeTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `term` | `CubeTerm` | no |  |

### Returns

`boolean` — 


## `freeVars`

> Function · `type-theory/lambda-cube/types.ts:101`

```ts
export function freeVars(term: CubeTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `termToString`

> Function · `type-theory/lambda-cube/types.ts:126`

```ts
export function termToString(t: CubeTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubeTerm` | no |  |

### Returns

`string` — 


## `alphaEq`

> Function · `type-theory/lambda-cube/types.ts:158`

```ts
export function alphaEq(a: CubeTerm, b: CubeTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CubeTerm` | no |  |
| `b` | `CubeTerm` | no |  |

### Returns

`boolean` — 


## `CubeContext`

> Type · `type-theory/lambda-cube/types.ts:209`

```ts
export type CubeContext = Map<string, CubeTerm>;
```


## `emptyContext`

> Function · `type-theory/lambda-cube/types.ts:211`

```ts
export function emptyContext(): CubeContext
```

### Returns

`CubeContext` — 


## `extendContext`

> Function · `type-theory/lambda-cube/types.ts:215`

```ts
export function extendContext(ctx: CubeContext, name: string, type: CubeTerm): CubeContext
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ctx` | `CubeContext` | no |  |
| `name` | `string` | no |  |
| `type` | `CubeTerm` | no |  |

### Returns

`CubeContext` — 

