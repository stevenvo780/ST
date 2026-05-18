# `type-theory/lambda-cube/types.ts`

Sort del cubo λ: `'*'` (tipo/proposición) o `'◻'` (kind/tipo de tipos).

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

> Type · `type-theory/lambda-cube/types.ts:40`

Sort del cubo λ: `'*'` (tipo/proposición) o `'◻'` (kind/tipo de tipos).

```ts
export type Sort = '*' | '◻';
```


## `CubeSystem`

> Type · `type-theory/lambda-cube/types.ts:43`

Uno de los 8 sistemas del cubo λ de Barendregt, identificado por su nombre canónico.

```ts
export type CubeSystem = | 'lambda' | 'lambda2' | 'lambda-omega-bar' | 'lambda-omega' | 'lambda-P' | 'lambda-P2' | 'lambda-P-omega' | 'lambda-C';
```


## `CubeTerm`

> Type · `type-theory/lambda-cube/types.ts:54`

Término de un Pure Type System del cubo λ: variable, sort, Π-tipo, λ-abstracción o aplicación.

```ts
export type CubeTerm = | { kind: 'var'; name: string } | { kind: 'sort'; sort: Sort } | { kind: 'pi'; bind: string; domain: CubeTerm; codomain: CubeTerm } | { kind: 'lam'; bind: string; domain: CubeTerm; body: CubeTerm } | { kind: 'app'; fn: CubeTerm; arg: CubeTerm };
```


## `cVar`

> Const · `type-theory/lambda-cube/types.ts:64`

Variable de término o tipo.

```ts
const cVar
```


## `cSort`

> Const · `type-theory/lambda-cube/types.ts:66`

Sort arbitrario `'*'` o `'◻'`.

```ts
const cSort
```


## `cStar`

> Const · `type-theory/lambda-cube/types.ts:68`

Sort `*` (tipo/proposición).

```ts
const cStar: CubeTerm
```


## `cBox`

> Const · `type-theory/lambda-cube/types.ts:70`

Sort `◻` (kind / tipo de tipos).

```ts
const cBox: CubeTerm
```


## `cPi`

> Const · `type-theory/lambda-cube/types.ts:72`

Π-tipo dependiente `Π bind:domain. codomain`.

```ts
const cPi
```


## `cLam`

> Const · `type-theory/lambda-cube/types.ts:79`

Abstracción dependiente `λ bind:domain. body`.

```ts
const cLam
```


## `cApp`

> Const · `type-theory/lambda-cube/types.ts:86`

Aplicación `fn arg`.

```ts
const cApp
```


## `cArrow`

> Const · `type-theory/lambda-cube/types.ts:89`

Flecha no-dependiente: Π (_ : A). B, cuando B no menciona el binder.

```ts
const cArrow
```


## `occursFree`

> Function · `type-theory/lambda-cube/types.ts:94`

Devuelve `true` si `name` ocurre libre en `term`.

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

> Function · `type-theory/lambda-cube/types.ts:113`

Acumula en `acc` (o devuelve un nuevo Set) el conjunto de variables libres del término.

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

> Function · `type-theory/lambda-cube/types.ts:139`

Serializa un término del cubo λ a texto legible (Π, λ, →, sorts).

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

> Function · `type-theory/lambda-cube/types.ts:172`

α-equivalencia entre dos términos del cubo λ (renombra binders a índices canónicos).

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

> Type · `type-theory/lambda-cube/types.ts:224`

Contexto de tipado del cubo λ: mapa de variables a sus tipos.

```ts
export type CubeContext = Map<string, CubeTerm>;
```


## `emptyContext`

> Function · `type-theory/lambda-cube/types.ts:227`

Crea un contexto vacío para el cubo λ.

```ts
export function emptyContext(): CubeContext
```

### Returns

`CubeContext` — 


## `extendContext`

> Function · `type-theory/lambda-cube/types.ts:232`

Extiende el contexto con `name : type`. Devuelve un nuevo mapa (no muta el original).

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

