# `reasoning/ban-logic/terms.ts`

============================================================ BAN Logic — Constructores y equality de términos/fórmulas ============================================================

## Contents

- [`principal`](#principal) — Const
- [`key`](#key) — Const
- [`nonce`](#nonce) — Const
- [`atom`](#atom) — Const
- [`message`](#message) — Const
- [`encrypted`](#encrypted) — Const
- [`hashed`](#hashed) — Const
- [`compound`](#compound) — Const
- [`believes`](#believes) — Const
- [`sees`](#sees) — Const
- [`said`](#said) — Const
- [`saidMessage`](#saidmessage) — Const
- [`jurisdiction`](#jurisdiction) — Const
- [`fresh`](#fresh) — Const
- [`sharedKey`](#sharedkey) — Const
- [`publicKey`](#publickey) — Const
- [`sharedSecret`](#sharedsecret) — Const
- [`controls`](#controls) — Const
- [`formulaAnd`](#formulaand) — Const
- [`termEquals`](#termequals) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`hasFormula`](#hasformula) — Function
- [`termToString`](#termtostring) — Function
- [`formulaToString`](#formulatostring) — Function

## `principal`

> Const · `reasoning/ban-logic/terms.ts:9`

```ts
const principal
```


## `key`

> Const · `reasoning/ban-logic/terms.ts:11`

```ts
const key
```


## `nonce`

> Const · `reasoning/ban-logic/terms.ts:14`

```ts
const nonce
```


## `atom`

> Const · `reasoning/ban-logic/terms.ts:16`

```ts
const atom
```


## `message`

> Const · `reasoning/ban-logic/terms.ts:18`

```ts
const message
```


## `encrypted`

> Const · `reasoning/ban-logic/terms.ts:20`

```ts
const encrypted
```


## `hashed`

> Const · `reasoning/ban-logic/terms.ts:26`

```ts
const hashed
```


## `compound`

> Const · `reasoning/ban-logic/terms.ts:28`

```ts
const compound
```


## `believes`

> Const · `reasoning/ban-logic/terms.ts:32`

```ts
const believes
```


## `sees`

> Const · `reasoning/ban-logic/terms.ts:38`

```ts
const sees
```


## `said`

> Const · `reasoning/ban-logic/terms.ts:44`

```ts
const said
```


## `saidMessage`

> Const · `reasoning/ban-logic/terms.ts:50`

```ts
const saidMessage
```


## `jurisdiction`

> Const · `reasoning/ban-logic/terms.ts:56`

```ts
const jurisdiction
```


## `fresh`

> Const · `reasoning/ban-logic/terms.ts:62`

```ts
const fresh
```


## `sharedKey`

> Const · `reasoning/ban-logic/terms.ts:64`

```ts
const sharedKey
```


## `publicKey`

> Const · `reasoning/ban-logic/terms.ts:71`

```ts
const publicKey
```


## `sharedSecret`

> Const · `reasoning/ban-logic/terms.ts:77`

```ts
const sharedSecret
```


## `controls`

> Const · `reasoning/ban-logic/terms.ts:84`

```ts
const controls
```


## `formulaAnd`

> Const · `reasoning/ban-logic/terms.ts:90`

```ts
const formulaAnd
```


## `termEquals`

> Function · `reasoning/ban-logic/terms.ts:98`

```ts
export function termEquals(a: BANTerm, b: BANTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `BANTerm` | no |  |
| `b` | `BANTerm` | no |  |

### Returns

`boolean` — 


## `formulaEquals`

> Function · `reasoning/ban-logic/terms.ts:149`

```ts
export function formulaEquals(a: BANFormula, b: BANFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `BANFormula` | no |  |
| `b` | `BANFormula` | no |  |

### Returns

`boolean` — 


## `hasFormula`

> Function · `reasoning/ban-logic/terms.ts:204`

```ts
export function hasFormula(state: ReadonlyArray<BANFormula>, target: BANFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `state` | `ReadonlyArray<BANFormula>` | no |  |
| `target` | `BANFormula` | no |  |

### Returns

`boolean` — 


## `termToString`

> Function · `reasoning/ban-logic/terms.ts:210`

```ts
export function termToString(t: BANTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `BANTerm` | no |  |

### Returns

`string` — 


## `formulaToString`

> Function · `reasoning/ban-logic/terms.ts:229`

```ts
export function formulaToString(f: BANFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `BANFormula` | no |  |

### Returns

`string` — 

