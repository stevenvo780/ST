# `type-theory/cubical/types.ts`

Término de la Teoría de Tipos Cubical (CTT-Lite).
Cubre el intervalo I con extremos i0/i1, operaciones ∧/∨/~, caminos PathP,
abstracción/aplicación de path, glue (univalencia computacional) y MLTT base (Π, λ, app, universo).

## Contents

- [`CubicalTerm`](#cubicalterm) — Type
- [`cI0`](#ci0) — Const
- [`cI1`](#ci1) — Const
- [`cIVar`](#civar) — Const
- [`cIMin`](#cimin) — Const
- [`cIMax`](#cimax) — Const
- [`cINeg`](#cineg) — Const
- [`cPathP`](#cpathp) — Const
- [`cPLam`](#cplam) — Const
- [`cPApp`](#cpapp) — Const
- [`cGlue`](#cglue) — Const
- [`cVar`](#cvar) — Const
- [`cUniverse`](#cuniverse) — Const
- [`cPi`](#cpi) — Const
- [`cLam`](#clam) — Const
- [`cApp`](#capp) — Const
- [`cArrow`](#carrow) — Const
- [`isIntervalExpr`](#isintervalexpr) — Function
- [`occursFreeCubical`](#occursfreecubical) — Function
- [`freeVarsCubical`](#freevarscubical) — Function
- [`termToStringCubical`](#termtostringcubical) — Function

## `CubicalTerm`

> Type · `type-theory/cubical/types.ts:29`

Término de la Teoría de Tipos Cubical (CTT-Lite).
Cubre el intervalo I con extremos i0/i1, operaciones ∧/∨/~, caminos PathP,
abstracción/aplicación de path, glue (univalencia computacional) y MLTT base (Π, λ, app, universo).

```ts
export type CubicalTerm = // ── Intervalo I ────────────────────────────────────────── | { kind: 'i0' } | { kind: 'i1' } | { kind: 'iVar'; name: string } | { kind: 'iMin'; left: CubicalTerm; right: CubicalTerm } | { kind: 'iMax'; left: CubicalTerm; right: CubicalTerm } | { kind: 'iNeg'; arg: CubicalTerm } // ── PathP, abstracción y aplicación de path ────────────── | { kind: 'pathP'; family: CubicalTerm; left: CubicalTerm; right: CubicalTerm } | { kind: 'pLam'; bind: string; body: CubicalTerm } | { kind: 'pApp'; path: CubicalTerm; arg: CubicalTerm } // ── Glue (univalence computacional precursora) ─────────── | { kind: 'glue'; equiv: CubicalTerm; partial: CubicalTerm } // ── MLTT base ──────────────────────────────────────────── | { kind: 'var'; name: string } | { kind: 'universe'; level: number } | { kind: 'pi'; bind: string; domain: CubicalTerm; codomain: CubicalTerm } | { kind: 'lam'; bind: string; domain: CubicalTerm; body: CubicalTerm } | { kind: 'app'; fn: CubicalTerm; arg: CubicalTerm };
```


## `cI0`

> Const · `type-theory/cubical/types.ts:53`

Extremo inferior del intervalo `i0 : I`.

```ts
const cI0
```


## `cI1`

> Const · `type-theory/cubical/types.ts:55`

Extremo superior del intervalo `i1 : I`.

```ts
const cI1
```


## `cIVar`

> Const · `type-theory/cubical/types.ts:57`

Variable de intervalo `name : I`.

```ts
const cIVar
```


## `cIMin`

> Const · `type-theory/cubical/types.ts:59`

Mínimo de intervalo `left ∧ right` (conexión).

```ts
const cIMin
```


## `cIMax`

> Const · `type-theory/cubical/types.ts:65`

Máximo de intervalo `left ∨ right` (conexión).

```ts
const cIMax
```


## `cINeg`

> Const · `type-theory/cubical/types.ts:71`

Negación de intervalo `~arg` (involución: `~i0 = i1`).

```ts
const cINeg
```


## `cPathP`

> Const · `type-theory/cubical/types.ts:74`

`PathP family left right` — tipo de caminos dependientes sobre la familia `family`.

```ts
const cPathP
```


## `cPLam`

> Const · `type-theory/cubical/types.ts:85`

Abstracción de camino `λi. body` donde `bind` es la variable de intervalo.

```ts
const cPLam
```


## `cPApp`

> Const · `type-theory/cubical/types.ts:91`

Aplicación de camino `path @ arg` (evaluación en un punto del intervalo).

```ts
const cPApp
```


## `cGlue`

> Const · `type-theory/cubical/types.ts:98`

Glue: construcción precursora de univalencia computacional con equivalencia `equiv` y parcial `partial`.

```ts
const cGlue
```


## `cVar`

> Const · `type-theory/cubical/types.ts:105`

Variable del cálculo de tipos.

```ts
const cVar
```


## `cUniverse`

> Const · `type-theory/cubical/types.ts:107`

Universo de tipos de nivel `level` (default 0).

```ts
const cUniverse
```


## `cPi`

> Const · `type-theory/cubical/types.ts:109`

Tipo Π dependiente `Π (bind : domain). codomain`.

```ts
const cPi
```


## `cLam`

> Const · `type-theory/cubical/types.ts:116`

Abstracción dependiente `λ (bind : domain). body`.

```ts
const cLam
```


## `cApp`

> Const · `type-theory/cubical/types.ts:123`

Aplicación de término `fn arg`.

```ts
const cApp
```


## `cArrow`

> Const · `type-theory/cubical/types.ts:125`

Flecha no dependiente `from → to` (azúcar para `cPi('_', from, to)`).

```ts
const cArrow
```


## `isIntervalExpr`

> Function · `type-theory/cubical/types.ts:130`

Devuelve `true` si el término `t` es una expresión pura del intervalo I (i0, i1, iVar, iMin, iMax, iNeg).

```ts
export function isIntervalExpr(t: CubicalTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubicalTerm` | no |  |

### Returns

`boolean` — 


## `occursFreeCubical`

> Function · `type-theory/cubical/types.ts:149`

Devuelve `true` si `name` ocurre libre en `term`.

```ts
export function occursFreeCubical(name: string, term: CubicalTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `term` | `CubicalTerm` | no |  |

### Returns

`boolean` — 


## `freeVarsCubical`

> Function · `type-theory/cubical/types.ts:192`

Acumula en `acc` (o devuelve un nuevo Set) el conjunto de variables libres del término.

```ts
export function freeVarsCubical(term: CubicalTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubicalTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `termToStringCubical`

> Function · `type-theory/cubical/types.ts:254`

Serializa un término CTT-Lite a su representación textual estándar.

```ts
export function termToStringCubical(t: CubicalTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubicalTerm` | no |  |

### Returns

`string` — 

