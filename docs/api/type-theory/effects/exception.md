# `type-theory/effects/exception.ts`

============================================================ Effect: Exception<E> ============================================================ Una sola operación:   - Exception.throw : E → never La continuación nunca se invoca: tirar aborta el cómputo y `runException` devuelve `{ kind: 'error', error }`.

## Contents

- [`EXCEPTION_THROW`](#exception-throw) — Const
- [`ExceptionThrow`](#exceptionthrow) — Type
- [`Exception`](#exception) — Type
- [`throw_`](#throw) — Function
- [`handleException`](#handleexception) — Function
- [`runException`](#runexception) — Function

## `EXCEPTION_THROW`

> Const · `type-theory/effects/exception.ts:14`

```ts
const EXCEPTION_THROW
```


## `ExceptionThrow`

> Type · `type-theory/effects/exception.ts:16`

```ts
export type ExceptionThrow<E> = Effect<typeof EXCEPTION_THROW, E, never>;
```


## `Exception`

> Type · `type-theory/effects/exception.ts:17`

```ts
export type Exception<E> = ExceptionThrow<E>;
```


## `throw_`

> Function · `type-theory/effects/exception.ts:20`

Lanza una excepción algebraica. La continuación se descarta.

```ts
export function throw_<E>(error: E): Eff<ExceptionThrow<E>, never>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `error` | `E` | no |  |

### Returns

`Eff<ExceptionThrow<E>, never>` — 


## `handleException`

> Function · `type-theory/effects/exception.ts:29`

Intérprete componible. Si el cómputo lanza, corta el árbol y emite
`{ kind: 'error', error }`. Si finaliza puro, emite `{ kind: 'ok', value }`.
Otros efectos se propagan tal cual.

```ts
export function handleException<R, E, A>(eff: Eff<unknown, A>): Eff<R, ExceptionResult<E, A>>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |

### Returns

`Eff<R, ExceptionResult<E, A>>` — 


## `runException`

> Function · `type-theory/effects/exception.ts:49`

Intérprete terminal: ejecuta el cómputo y captura una eventual
excepción. Lanza si encuentra otra operación sin manejar.

```ts
export function runException<E, A>(eff: Eff<unknown, A>): ExceptionResult<E, A>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |

### Returns

`ExceptionResult<E, A>` — 

