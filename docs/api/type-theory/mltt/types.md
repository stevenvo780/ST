# `type-theory/mltt/types.ts`

Término de Martin-Löf Type Theory (MLTT): tipos y términos comparten el mismo universo.
Cubre variables, universos jerárquicos, Π, Σ, λ, app, pares, identidad, Nat y constructores numéricos.

## Contents

- [`MLTTTerm`](#mlttterm) — Type
- [`mVar`](#mvar) — Const
- [`mUniverse`](#muniverse) — Const
- [`mPi`](#mpi) — Const
- [`mLam`](#mlam) — Const
- [`mApp`](#mapp) — Const
- [`mSigma`](#msigma) — Const
- [`mPair`](#mpair) — Const
- [`mFst`](#mfst) — Const
- [`mSnd`](#msnd) — Const
- [`mId`](#mid) — Const
- [`mRefl`](#mrefl) — Const
- [`mNat`](#mnat) — Const
- [`mZero`](#mzero) — Const
- [`mSucc`](#msucc) — Const
- [`mArrow`](#marrow) — Const
- [`occursFree`](#occursfree) — Function
- [`freeVars`](#freevars) — Function
- [`termToString`](#termtostring) — Function

## `MLTTTerm`

> Type · `type-theory/mltt/types.ts:26`

Término de Martin-Löf Type Theory (MLTT): tipos y términos comparten el mismo universo.
Cubre variables, universos jerárquicos, Π, Σ, λ, app, pares, identidad, Nat y constructores numéricos.

```ts
export type MLTTTerm = | { kind: 'var'; name: string } | { kind: 'universe'; level: number } | { kind: 'pi'; bind: string; domain: MLTTTerm; codomain: MLTTTerm } | { kind: 'lam'; bind: string; domain: MLTTTerm; body: MLTTTerm } | { kind: 'app'; fn: MLTTTerm; arg: MLTTTerm } | { kind: 'sigma'; bind: string; first: MLTTTerm; second: MLTTTerm } | { kind: 'pair'; fst: MLTTTerm; snd: MLTTTerm } | { kind: 'fst'; pair: MLTTTerm } | { kind: 'snd'; pair: MLTTTerm } | { kind: 'identity'; type: MLTTTerm; left: MLTTTerm; right: MLTTTerm } | { kind: 'refl'; term: MLTTTerm } | { kind: 'nat' } | { kind: 'zero' } | { kind: 'succ'; arg: MLTTTerm };
```


## `mVar`

> Const · `type-theory/mltt/types.ts:45`

Variable.

```ts
const mVar
```


## `mUniverse`

> Const · `type-theory/mltt/types.ts:47`

Universo `Type level`.

```ts
const mUniverse
```


## `mPi`

> Const · `type-theory/mltt/types.ts:49`

Tipo Π dependiente `Π bind:domain. codomain`.

```ts
const mPi
```


## `mLam`

> Const · `type-theory/mltt/types.ts:56`

Abstracción dependiente `λ bind:domain. body`.

```ts
const mLam
```


## `mApp`

> Const · `type-theory/mltt/types.ts:63`

Aplicación `fn arg`.

```ts
const mApp
```


## `mSigma`

> Const · `type-theory/mltt/types.ts:65`

Tipo Σ dependiente `Σ bind:first. second`.

```ts
const mSigma
```


## `mPair`

> Const · `type-theory/mltt/types.ts:72`

Par dependiente `⟨fst, snd⟩`.

```ts
const mPair
```


## `mFst`

> Const · `type-theory/mltt/types.ts:74`

Proyección izquierda `fst pair`.

```ts
const mFst
```


## `mSnd`

> Const · `type-theory/mltt/types.ts:76`

Proyección derecha `snd pair`.

```ts
const mSnd
```


## `mId`

> Const · `type-theory/mltt/types.ts:78`

Tipo identidad `Id(type, left, right)`.

```ts
const mId
```


## `mRefl`

> Const · `type-theory/mltt/types.ts:85`

Prueba de reflexividad `refl(term)`.

```ts
const mRefl
```


## `mNat`

> Const · `type-theory/mltt/types.ts:87`

Tipo de los números naturales `Nat`.

```ts
const mNat
```


## `mZero`

> Const · `type-theory/mltt/types.ts:89`

Constructor `zero : Nat`.

```ts
const mZero
```


## `mSucc`

> Const · `type-theory/mltt/types.ts:91`

Sucesor `succ(arg) : Nat`.

```ts
const mSucc
```


## `mArrow`

> Const · `type-theory/mltt/types.ts:94`

Flecha no-dependiente `from → to` (azúcar: `Π _ : from. to`).

```ts
const mArrow
```


## `occursFree`

> Function · `type-theory/mltt/types.ts:99`

¿`name` aparece libre en `term`?

```ts
export function occursFree(name: string, term: MLTTTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `term` | `MLTTTerm` | no |  |

### Returns

`boolean` — 


## `freeVars`

> Function · `type-theory/mltt/types.ts:138`

Conjunto de variables libres.

```ts
export function freeVars(term: MLTTTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `MLTTTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `termToString`

> Function · `type-theory/mltt/types.ts:193`

```ts
export function termToString(t: MLTTTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `MLTTTerm` | no |  |

### Returns

`string` — 

