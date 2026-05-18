# `type-theory/mltt/types.ts`

============================================================ Martin-Löf Type Theory (MLTT) — Términos y tipos dependientes ============================================================ Sistema base con:   - Universos jerárquicos:        Type 0 : Type 1 : Type 2 : ...   - Funciones dependientes:       Π (x : A). B(x)   - Pares dependientes:           Σ (x : A). B(x)   - Tipo identidad:               Id(A, a, b), constructor refl(a)   - Naturales como tipo base:     Nat, zero, succ En MLTT no hay distinción sintáctica entre términos y tipos: los tipos *son* términos (de algún universo). Por eso un solo constructor `MLTTTerm` cubre ambos roles. Convenciones:   - `bind` es el nombre del binder (Π, Σ, lam).   - `domain` es el tipo del binder.   - `codomain` (Π) y `second` (Σ) pueden depender de `bind`.   - α-equivalencia se trata vía sustitución capture-avoiding.

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

> Type · `type-theory/mltt/types.ts:22`

```ts
export type MLTTTerm = | { kind: 'var'; name: string } | { kind: 'universe'; level: number } | { kind: 'pi'; bind: string; domain: MLTTTerm; codomain: MLTTTerm } | { kind: 'lam'; bind: string; domain: MLTTTerm; body: MLTTTerm } | { kind: 'app'; fn: MLTTTerm; arg: MLTTTerm } | { kind: 'sigma'; bind: string; first: MLTTTerm; second: MLTTTerm } | { kind: 'pair'; fst: MLTTTerm; snd: MLTTTerm } | { kind: 'fst'; pair: MLTTTerm } | { kind: 'snd'; pair: MLTTTerm } | { kind: 'identity'; type: MLTTTerm; left: MLTTTerm; right: MLTTTerm } | { kind: 'refl'; term: MLTTTerm } | { kind: 'nat' } | { kind: 'zero' } | { kind: 'succ'; arg: MLTTTerm };
```


## `mVar`

> Const · `type-theory/mltt/types.ts:40`

```ts
const mVar
```


## `mUniverse`

> Const · `type-theory/mltt/types.ts:41`

```ts
const mUniverse
```


## `mPi`

> Const · `type-theory/mltt/types.ts:42`

```ts
const mPi
```


## `mLam`

> Const · `type-theory/mltt/types.ts:48`

```ts
const mLam
```


## `mApp`

> Const · `type-theory/mltt/types.ts:54`

```ts
const mApp
```


## `mSigma`

> Const · `type-theory/mltt/types.ts:55`

```ts
const mSigma
```


## `mPair`

> Const · `type-theory/mltt/types.ts:61`

```ts
const mPair
```


## `mFst`

> Const · `type-theory/mltt/types.ts:62`

```ts
const mFst
```


## `mSnd`

> Const · `type-theory/mltt/types.ts:63`

```ts
const mSnd
```


## `mId`

> Const · `type-theory/mltt/types.ts:64`

```ts
const mId
```


## `mRefl`

> Const · `type-theory/mltt/types.ts:70`

```ts
const mRefl
```


## `mNat`

> Const · `type-theory/mltt/types.ts:71`

```ts
const mNat
```


## `mZero`

> Const · `type-theory/mltt/types.ts:72`

```ts
const mZero
```


## `mSucc`

> Const · `type-theory/mltt/types.ts:73`

```ts
const mSucc
```


## `mArrow`

> Const · `type-theory/mltt/types.ts:76`

```ts
const mArrow
```


## `occursFree`

> Function · `type-theory/mltt/types.ts:81`

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

> Function · `type-theory/mltt/types.ts:120`

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

> Function · `type-theory/mltt/types.ts:175`

```ts
export function termToString(t: MLTTTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `MLTTTerm` | no |  |

### Returns

`string` — 

