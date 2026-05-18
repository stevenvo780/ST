# `type-theory/hott/types.ts`

Término del lenguaje HoTT: cubre MLTT (Π, Σ, Nat), tipos identidad como espacios de caminos, HITs pedagógicos (S¹, Σ) y el axioma de univalencia.

## Contents

- [`HoTTTerm`](#hottterm) — Type
- [`hVar`](#hvar) — Const
- [`hUniverse`](#huniverse) — Const
- [`hPi`](#hpi) — Const
- [`hLam`](#hlam) — Const
- [`hApp`](#happ) — Const
- [`hSigma`](#hsigma) — Const
- [`hPair`](#hpair) — Const
- [`hFst`](#hfst) — Const
- [`hSnd`](#hsnd) — Const
- [`hNat`](#hnat) — Const
- [`hZero`](#hzero) — Const
- [`hSucc`](#hsucc) — Const
- [`hPath`](#hpath) — Const
- [`hRefl`](#hrefl) — Const
- [`hTransport`](#htransport) — Const
- [`hPathSym`](#hpathsym) — Const
- [`hPathConcat`](#hpathconcat) — Const
- [`hAp`](#hap) — Const
- [`hJElim`](#hjelim) — Const
- [`hCircle`](#hcircle) — Const
- [`hBaseOfCircle`](#hbaseofcircle) — Const
- [`hLoopOfCircle`](#hloopofcircle) — Const
- [`hSuspension`](#hsuspension) — Const
- [`hNorth`](#hnorth) — Const
- [`hSouth`](#hsouth) — Const
- [`hMeridian`](#hmeridian) — Const
- [`hUa`](#hua) — Const
- [`hArrow`](#harrow) — Const
- [`occursFreeHoTT`](#occursfreehott) — Function
- [`freeVarsHoTT`](#freevarshott) — Function
- [`termToStringHoTT`](#termtostringhott) — Function

## `HoTTTerm`

> Type · `type-theory/hott/types.ts:27`

Término del lenguaje HoTT: cubre MLTT (Π, Σ, Nat), tipos identidad como espacios de caminos, HITs pedagógicos (S¹, Σ) y el axioma de univalencia.

```ts
export type HoTTTerm = // ── MLTT base ──────────────────────────────────────────── | { kind: 'var'; name: string } | { kind: 'universe'; level: number } | { kind: 'pi'; bind: string; domain: HoTTTerm; codomain: HoTTTerm } | { kind: 'lam'; bind: string; domain: HoTTTerm; body: HoTTTerm } | { kind: 'app'; fn: HoTTTerm; arg: HoTTTerm } | { kind: 'sigma'; bind: string; first: HoTTTerm; second: HoTTTerm } | { kind: 'pair'; fst: HoTTTerm; snd: HoTTTerm } | { kind: 'fst'; pair: HoTTTerm } | { kind: 'snd'; pair: HoTTTerm } | { kind: 'nat' } | { kind: 'zero' } | { kind: 'succ'; arg: HoTTTerm } // ── Tipos identidad como espacios ──────────────────────── | { kind: 'path'; type: HoTTTerm; left: HoTTTerm; right: HoTTTerm } | { kind: 'refl'; term: HoTTTerm } // ── Operaciones sobre caminos ──────────────────────────── | { kind: 'transport'; family: HoTTTerm; path: HoTTTerm; term: HoTTTerm } | { kind: 'pathSym'; path: HoTTTerm } | { kind: 'pathConcat'; left: HoTTTerm; right: HoTTTerm } | { kind: 'ap'; fn: HoTTTerm; path: HoTTTerm } | { kind: 'jElim'; motive: HoTTTerm; baseCase: HoTTTerm; path: HoTTTerm } // ── HITs (subconjunto) ─────────────────────────────────── | { kind: 'circle' } | { kind: 'baseOfCircle' } | { kind: 'loopOfCircle' } | { kind: 'suspension'; type: HoTTTerm } | { kind: 'north'; type: HoTTTerm } | { kind: 'south'; type: HoTTTerm } | { kind: 'meridian'; type: HoTTTerm; point: HoTTTerm } // ── Univalence (axioma, no computacional) ──────────────── | { kind: 'ua'; equiv: HoTTTerm };
```


## `hVar`

> Const · `type-theory/hott/types.ts:64`

Constructor de variable HoTT referenciada por nombre.

```ts
const hVar
```


## `hUniverse`

> Const · `type-theory/hott/types.ts:66`

Constructor del universo jerárquico Typeₙ (default: Type₀).

```ts
const hUniverse
```


## `hPi`

> Const · `type-theory/hott/types.ts:68`

Constructor del tipo Π (función dependiente): `Π(bind : domain). codomain`.

```ts
const hPi
```


## `hLam`

> Const · `type-theory/hott/types.ts:75`

Constructor de lambda con dominio anotado: `λ(bind : domain). body`.

```ts
const hLam
```


## `hApp`

> Const · `type-theory/hott/types.ts:82`

Constructor de aplicación de función: `fn arg`.

```ts
const hApp
```


## `hSigma`

> Const · `type-theory/hott/types.ts:84`

Constructor del tipo Σ (par dependiente): `Σ(bind : first). second`.

```ts
const hSigma
```


## `hPair`

> Const · `type-theory/hott/types.ts:91`

Constructor de par dependiente: `⟨fst, snd⟩`.

```ts
const hPair
```


## `hFst`

> Const · `type-theory/hott/types.ts:93`

Proyección de la primera componente de un par dependiente.

```ts
const hFst
```


## `hSnd`

> Const · `type-theory/hott/types.ts:95`

Proyección de la segunda componente de un par dependiente.

```ts
const hSnd
```


## `hNat`

> Const · `type-theory/hott/types.ts:97`

Tipo de los números naturales en HoTT (tipo inductivo).

```ts
const hNat
```


## `hZero`

> Const · `type-theory/hott/types.ts:99`

Constante cero del tipo Nat en HoTT.

```ts
const hZero
```


## `hSucc`

> Const · `type-theory/hott/types.ts:101`

Constructor sucesor del tipo Nat en HoTT.

```ts
const hSucc
```


## `hPath`

> Const · `type-theory/hott/types.ts:104`

Constructor del tipo de caminos: `Path type left right` (espacio de caminos entre `left` y `right`).

```ts
const hPath
```


## `hRefl`

> Const · `type-theory/hott/types.ts:111`

Camino reflexivo (constante): `refl(term) : Path A term term`.

```ts
const hRefl
```


## `hTransport`

> Const · `type-theory/hott/types.ts:113`

Transporte a lo largo de un camino: mueve `term` de la fibra `family left` a `family right`.

```ts
const hTransport
```


## `hPathSym`

> Const · `type-theory/hott/types.ts:120`

Inversión de camino: dado `p : Path A x y` produce `p⁻¹ : Path A y x`.

```ts
const hPathSym
```


## `hPathConcat`

> Const · `type-theory/hott/types.ts:122`

Concatenación de caminos: `p · q : Path A x z` dado `p : Path A x y` y `q : Path A y z`.

```ts
const hPathConcat
```


## `hAp`

> Const · `type-theory/hott/types.ts:128`

Functorialidad: `ap f p : Path B (f x) (f y)` dado `f : A → B` y `p : Path A x y`.

```ts
const hAp
```


## `hJElim`

> Const · `type-theory/hott/types.ts:130`

Eliminador J: principio inductivo del tipo identidad en HoTT.

```ts
const hJElim
```


## `hCircle`

> Const · `type-theory/hott/types.ts:138`

HIT S¹: el círculo, tipo inductivo superior con un punto base y un loop.

```ts
const hCircle
```


## `hBaseOfCircle`

> Const · `type-theory/hott/types.ts:140`

Punto base de S¹: `base : S¹`.

```ts
const hBaseOfCircle
```


## `hLoopOfCircle`

> Const · `type-theory/hott/types.ts:142`

Generador del loop de S¹: `loop : Path S¹ base base`.

```ts
const hLoopOfCircle
```


## `hSuspension`

> Const · `type-theory/hott/types.ts:144`

Tipo suspensión ΣA (HIT): colapsa `A` añadiendo dos polos y meridianos.

```ts
const hSuspension
```


## `hNorth`

> Const · `type-theory/hott/types.ts:146`

Polo norte de la suspensión de `type`.

```ts
const hNorth
```


## `hSouth`

> Const · `type-theory/hott/types.ts:148`

Polo sur de la suspensión de `type`.

```ts
const hSouth
```


## `hMeridian`

> Const · `type-theory/hott/types.ts:150`

Meridiano de la suspensión: `meridian a : Path north south` para cada `a : type`.

```ts
const hMeridian
```


## `hUa`

> Const · `type-theory/hott/types.ts:157`

Axioma de univalencia: `ua(equiv) : Path U A B` dada una equivalencia `equiv : A ≃ B`.

```ts
const hUa
```


## `hArrow`

> Const · `type-theory/hott/types.ts:160`

Tipo flecha no-dependiente: `from → to` (azúcar sobre Π con bind ignorado).

```ts
const hArrow
```


## `occursFreeHoTT`

> Function · `type-theory/hott/types.ts:165`

Comprueba si la variable `name` ocurre libre en el término HoTT `term`.

```ts
export function occursFreeHoTT(name: string, term: HoTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `term` | `HoTTTerm` | no |  |

### Returns

`boolean` — 


## `freeVarsHoTT`

> Function · `type-theory/hott/types.ts:235`

Recolecta el conjunto de variables libres del término HoTT dado.

```ts
export function freeVarsHoTT(term: HoTTTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `HoTTTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `termToStringHoTT`

> Function · `type-theory/hott/types.ts:327`

Serializa un término HoTT a una cadena legible usando notación matemática estándar.

```ts
export function termToStringHoTT(t: HoTTTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HoTTTerm` | no |  |

### Returns

`string` — 

