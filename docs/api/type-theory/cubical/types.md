# `type-theory/cubical/types.ts`

============================================================ Cubical Type Theory (CTT-Lite) — términos y constructores ============================================================ Subset pedagógico de Cubical Type Theory. La diferencia esencial con HoTT (homotopy type theory) es que aquí univalence pasa a ser COMPUTACIONAL via:   - Un intervalo formal I con dos extremos i0, i1 y conexiones     (∧ min, ∨ max) más involutiva (1 - i).   - PathP A x y = caminos con familia dependiente sobre I.   - Path-abstracción y aplicación (λi. t) @ i con reducción por     sustitución de la variable de intervalo.   - Glue como precursor sintáctico de transport sobre ua. Re-empaquetamos las construcciones MLTT mínimas que el subset necesita (Π, λ, app, var, universo). Para evitar conflictos de tipos con HoTT, este módulo es autocontenido: CubicalTerm vive en su propio universo de tipos. API mínima compatible con MLTT/HoTT:   inferType / normalize / isIntervalExpr / evalInterval

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

> Type · `type-theory/cubical/types.ts:24`

```ts
export type CubicalTerm = // ── Intervalo I ────────────────────────────────────────── | { kind: 'i0' } | { kind: 'i1' } | { kind: 'iVar'; name: string } | { kind: 'iMin'; left: CubicalTerm; right: CubicalTerm } | { kind: 'iMax'; left: CubicalTerm; right: CubicalTerm } | { kind: 'iNeg'; arg: CubicalTerm } // ── PathP, abstracción y aplicación de path ────────────── | { kind: 'pathP'; family: CubicalTerm; left: CubicalTerm; right: CubicalTerm } | { kind: 'pLam'; bind: string; body: CubicalTerm } | { kind: 'pApp'; path: CubicalTerm; arg: CubicalTerm } // ── Glue (univalence computacional precursora) ─────────── | { kind: 'glue'; equiv: CubicalTerm; partial: CubicalTerm } // ── MLTT base ──────────────────────────────────────────── | { kind: 'var'; name: string } | { kind: 'universe'; level: number } | { kind: 'pi'; bind: string; domain: CubicalTerm; codomain: CubicalTerm } | { kind: 'lam'; bind: string; domain: CubicalTerm; body: CubicalTerm } | { kind: 'app'; fn: CubicalTerm; arg: CubicalTerm };
```


## `cI0`

> Const · `type-theory/cubical/types.ts:47`

```ts
const cI0
```


## `cI1`

> Const · `type-theory/cubical/types.ts:48`

```ts
const cI1
```


## `cIVar`

> Const · `type-theory/cubical/types.ts:49`

```ts
const cIVar
```


## `cIMin`

> Const · `type-theory/cubical/types.ts:50`

```ts
const cIMin
```


## `cIMax`

> Const · `type-theory/cubical/types.ts:55`

```ts
const cIMax
```


## `cINeg`

> Const · `type-theory/cubical/types.ts:60`

```ts
const cINeg
```


## `cPathP`

> Const · `type-theory/cubical/types.ts:62`

```ts
const cPathP
```


## `cPLam`

> Const · `type-theory/cubical/types.ts:72`

```ts
const cPLam
```


## `cPApp`

> Const · `type-theory/cubical/types.ts:77`

```ts
const cPApp
```


## `cGlue`

> Const · `type-theory/cubical/types.ts:83`

```ts
const cGlue
```


## `cVar`

> Const · `type-theory/cubical/types.ts:89`

```ts
const cVar
```


## `cUniverse`

> Const · `type-theory/cubical/types.ts:90`

```ts
const cUniverse
```


## `cPi`

> Const · `type-theory/cubical/types.ts:91`

```ts
const cPi
```


## `cLam`

> Const · `type-theory/cubical/types.ts:97`

```ts
const cLam
```


## `cApp`

> Const · `type-theory/cubical/types.ts:103`

```ts
const cApp
```


## `cArrow`

> Const · `type-theory/cubical/types.ts:104`

```ts
const cArrow
```


## `isIntervalExpr`

> Function · `type-theory/cubical/types.ts:108`

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

> Function · `type-theory/cubical/types.ts:126`

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

> Function · `type-theory/cubical/types.ts:168`

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

> Function · `type-theory/cubical/types.ts:229`

```ts
export function termToStringCubical(t: CubicalTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CubicalTerm` | no |  |

### Returns

`string` — 

