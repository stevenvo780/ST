# `type-theory/combinators-ski/types.ts`

============================================================ SKI combinatory logic — Términos y constructores ============================================================ Sistema base de combinadores S, K, I (Schönfinkel / Curry). Es Turing-completo y equivalente al λ-cálculo, pero sin variables ligadas: toda función se construye combinando S, K, I y variables libres mediante aplicación. Las λ-abstracciones se "eliminan" vía bracket abstraction (ver `abstract.ts`). Reglas de reducción:   I x      → x   K x y    → x   S x y z  → x z (y z)

## Contents

- [`CTerm`](#cterm) — Type
- [`S`](#s) — Const
- [`K`](#k) — Const
- [`I`](#i) — Const
- [`cvar`](#cvar) — Const
- [`app`](#app) — Function
- [`ctermEq`](#ctermeq) — Function
- [`termToString`](#termtostring) — Function
- [`freeVars`](#freevars) — Function

## `CTerm`

> Type · `type-theory/combinators-ski/types.ts:16`

```ts
export type CTerm = | { kind: 'S' } | { kind: 'K' } | { kind: 'I' } | { kind: 'var'; name: string } | { kind: 'app'; fn: CTerm; arg: CTerm };
```


## `S`

> Const · `type-theory/combinators-ski/types.ts:24`

```ts
const S
```


## `K`

> Const · `type-theory/combinators-ski/types.ts:25`

```ts
const K
```


## `I`

> Const · `type-theory/combinators-ski/types.ts:26`

```ts
const I
```


## `cvar`

> Const · `type-theory/combinators-ski/types.ts:27`

```ts
const cvar
```


## `app`

> Function · `type-theory/combinators-ski/types.ts:31`

```ts
export function app(...ts: CTerm[]): CTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ts` | `CTerm[]` | no |  |

### Returns

`CTerm` — 


## `ctermEq`

> Function · `type-theory/combinators-ski/types.ts:46`

```ts
export function ctermEq(a: CTerm, b: CTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `CTerm` | no |  |
| `b` | `CTerm` | no |  |

### Returns

`boolean` — 


## `termToString`

> Function · `type-theory/combinators-ski/types.ts:64`

```ts
export function termToString(t: CTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CTerm` | no |  |

### Returns

`string` — 


## `freeVars`

> Function · `type-theory/combinators-ski/types.ts:83`

```ts
export function freeVars(t: CTerm): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `CTerm` | no |  |

### Returns

`Set<string>` — 

