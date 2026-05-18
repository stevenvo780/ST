# `type-theory/nbe/types.ts`

============================================================ NbE para STLC — Tipos sintácticos y dominio semántico ============================================================ Términos del λ-cálculo simplemente tipado (STLC) y los valores semánticos sobre los que evaluamos. La separación entre sintaxis (Term, Type) y semántica (Value, Neutral) es lo que hace al algoritmo NbE limpio: evaluar produce valores; reificar los baja otra vez a términos en forma normal η-larga.

## Contents

- [`Type`](#type) — Type
- [`Term`](#term) — Type
- [`Value`](#value) — Type
- [`Neutral`](#neutral) — Type
- [`Env`](#env) — Type
- [`tBase`](#tbase) — Const
- [`tArr`](#tarr) — Const
- [`v`](#v) — Const
- [`lam`](#lam) — Const
- [`ap`](#ap) — Const
- [`apN`](#apn) — Const
- [`vNeutralVar`](#vneutralvar) — Const
- [`vNeutral`](#vneutral) — Const
- [`vClosure`](#vclosure) — Const
- [`alphaEq`](#alphaeq) — Function
- [`typeEq`](#typeeq) — Function
- [`typeToString`](#typetostring) — Function
- [`termToString`](#termtostring) — Function

## `Type`

> Type · `type-theory/nbe/types.ts:11`

```ts
export type Type = { kind: 'base'; name: string } | { kind: 'arrow'; from: Type; to: Type };
```


## `Term`

> Type · `type-theory/nbe/types.ts:13`

```ts
export type Term = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; paramType: Type; body: Term } | { kind: 'app'; fn: Term; arg: Term };
```


## `Value`

> Type · `type-theory/nbe/types.ts:22`

```ts
export type Value = | { kind: 'neutral'; head: Neutral } | { kind: 'closure'; env: Env; param: string; paramType: Type; body: Term };
```


## `Neutral`

> Type · `type-theory/nbe/types.ts:26`

```ts
export type Neutral = { kind: 'var'; name: string } | { kind: 'app'; head: Neutral; arg: Value };
```


## `Env`

> Type · `type-theory/nbe/types.ts:28`

```ts
export type Env = Map<string, Value>;
```


## `tBase`

> Const · `type-theory/nbe/types.ts:31`

```ts
const tBase
```


## `tArr`

> Const · `type-theory/nbe/types.ts:32`

```ts
const tArr
```


## `v`

> Const · `type-theory/nbe/types.ts:34`

```ts
const v
```


## `lam`

> Const · `type-theory/nbe/types.ts:35`

```ts
const lam
```


## `ap`

> Const · `type-theory/nbe/types.ts:41`

```ts
const ap
```


## `apN`

> Const · `type-theory/nbe/types.ts:42`

```ts
const apN
```


## `vNeutralVar`

> Const · `type-theory/nbe/types.ts:45`

```ts
const vNeutralVar
```


## `vNeutral`

> Const · `type-theory/nbe/types.ts:49`

```ts
const vNeutral
```


## `vClosure`

> Const · `type-theory/nbe/types.ts:50`

```ts
const vClosure
```


## `alphaEq`

> Function · `type-theory/nbe/types.ts:60`

```ts
export function alphaEq(a: Term, b: Term): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Term` | no |  |
| `b` | `Term` | no |  |

### Returns

`boolean` — 


## `typeEq`

> Function · `type-theory/nbe/types.ts:100`

```ts
export function typeEq(a: Type, b: Type): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `Type` | no |  |
| `b` | `Type` | no |  |

### Returns

`boolean` — 


## `typeToString`

> Function · `type-theory/nbe/types.ts:110`

```ts
export function typeToString(t: Type): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Type` | no |  |

### Returns

`string` — 


## `termToString`

> Function · `type-theory/nbe/types.ts:117`

```ts
export function termToString(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 

