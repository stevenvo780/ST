# `type-theory/nbe/types.ts`

Tipo del STLC para NbE: tipo base `base` o flecha `from → to`.

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

> Type · `type-theory/nbe/types.ts:12`

Tipo del STLC para NbE: tipo base `base` o flecha `from → to`.

```ts
export type Type = { kind: 'base'; name: string } | { kind: 'arrow'; from: Type; to: Type };
```


## `Term`

> Type · `type-theory/nbe/types.ts:15`

Término sintáctico del STLC: variable, abstracción λ o aplicación.

```ts
export type Term = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; paramType: Type; body: Term } | { kind: 'app'; fn: Term; arg: Term };
```


## `Value`

> Type · `type-theory/nbe/types.ts:24`

Valor semántico del NbE para STLC.
`'neutral'` = variable libre o aplicación bloqueada; `'closure'` = λ capturada con entorno léxico.

```ts
export type Value = | { kind: 'neutral'; head: Neutral } | { kind: 'closure'; env: Env; param: string; paramType: Type; body: Term };
```


## `Neutral`

> Type · `type-theory/nbe/types.ts:29`

Término neutral: variable libre o aplicación cuya cabeza es neutral.

```ts
export type Neutral = { kind: 'var'; name: string } | { kind: 'app'; head: Neutral; arg: Value };
```


## `Env`

> Type · `type-theory/nbe/types.ts:32`

Entorno léxico para NbE: mapa de variables a valores semánticos.

```ts
export type Env = Map<string, Value>;
```


## `tBase`

> Const · `type-theory/nbe/types.ts:36`

Tipo base (primitivo) con nombre.

```ts
const tBase
```


## `tArr`

> Const · `type-theory/nbe/types.ts:38`

Tipo flecha `from → to`.

```ts
const tArr
```


## `v`

> Const · `type-theory/nbe/types.ts:41`

Variable sintáctica.

```ts
const v
```


## `lam`

> Const · `type-theory/nbe/types.ts:43`

Abstracción λ sintáctica.

```ts
const lam
```


## `ap`

> Const · `type-theory/nbe/types.ts:50`

Aplicación binaria `fn arg`.

```ts
const ap
```


## `apN`

> Const · `type-theory/nbe/types.ts:52`

Aplicación n-aria: `apN(f, a, b, c)` = `((f a) b) c`.

```ts
const apN
```


## `vNeutralVar`

> Const · `type-theory/nbe/types.ts:56`

Valor neutral de una variable libre `name`.

```ts
const vNeutralVar
```


## `vNeutral`

> Const · `type-theory/nbe/types.ts:61`

Valor neutral a partir de una cabeza neutral.

```ts
const vNeutral
```


## `vClosure`

> Const · `type-theory/nbe/types.ts:63`

Valor closure (λ semántica) con entorno léxico.

```ts
const vClosure
```


## `alphaEq`

> Function · `type-theory/nbe/types.ts:73`

Igualdad α-equivalente entre términos STLC (renombra binders a posiciones canónicas).

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

> Function · `type-theory/nbe/types.ts:114`

Igualdad estructural entre dos tipos STLC.

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

> Function · `type-theory/nbe/types.ts:125`

Serializa un tipo STLC a texto (flechas asociativas a la derecha).

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

> Function · `type-theory/nbe/types.ts:133`

Serializa un término STLC a texto legible.

```ts
export function termToString(t: Term): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`string` — 

