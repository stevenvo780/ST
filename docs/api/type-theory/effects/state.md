# `type-theory/effects/state.ts`

============================================================ Effect: State<S> ============================================================ Dos operaciones canónicas:   - State.get  : ()  → S      (lee el estado actual)   - State.put  : S   → undefined (sobrescribe el estado) `modify` se deriva como get >>= (s -> put (fn s)). Dos formas de interpretar:   - `runState`        : intérprete terminal. Devuelve {result, state}.                         Útil cuando State es el único efecto.   - `handleState`     : intérprete componible. Transforma                         Eff<State<S> | R, A> en Eff<R, [A, S]>.                         Útil para stack de efectos.

## Contents

- [`STATE_GET`](#state-get) — Const
- [`STATE_PUT`](#state-put) — Const
- [`StateGet`](#stateget) — Type
- [`StatePut`](#stateput) — Type
- [`State`](#state) — Type
- [`getState`](#getstate) — Function
- [`putState`](#putstate) — Function
- [`modify`](#modify) — Function
- [`handleState`](#handlestate) — Function
- [`runState`](#runstate) — Function

## `STATE_GET`

> Const · `type-theory/effects/state.ts:21`

```ts
const STATE_GET
```


## `STATE_PUT`

> Const · `type-theory/effects/state.ts:22`

```ts
const STATE_PUT
```


## `StateGet`

> Type · `type-theory/effects/state.ts:24`

```ts
export type StateGet<S> = Effect<typeof STATE_GET, void, S>;
```


## `StatePut`

> Type · `type-theory/effects/state.ts:25`

```ts
export type StatePut<S> = Effect<typeof STATE_PUT, S, undefined>;
```


## `State`

> Type · `type-theory/effects/state.ts:26`

```ts
export type State<S> = StateGet<S> | StatePut<S>;
```


## `getState`

> Function · `type-theory/effects/state.ts:29`

Lee el estado actual.

```ts
export function getState<S>(): Eff<StateGet<S>, S>
```

### Returns

`Eff<StateGet<S>, S>` — 


## `putState`

> Function · `type-theory/effects/state.ts:34`

Sobrescribe el estado completo.

```ts
export function putState<S>(s: S): Eff<StatePut<S>, undefined>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `S` | no |  |

### Returns

`Eff<StatePut<S>, undefined>` — 


## `modify`

> Function · `type-theory/effects/state.ts:39`

Modifica el estado aplicando una función pura.

```ts
export function modify<S>(fn: (s: S) => S): Eff<State<S>, undefined>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `(s: S) => S` | no |  |

### Returns

`Eff<State<S>, undefined>` — 


## `handleState`

> Function · `type-theory/effects/state.ts:48`

Intérprete componible. Reescribe `State.get`/`State.put` en términos
de un acumulador transportado por la continuación, dejando otros
efectos intactos en la salida.

```ts
export function handleState<R, S, A>( eff: Eff<unknown, A>, initial: S, ): Eff<R,
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `initial` | `S` | no |  |

### Returns

`Eff<R, { result: A; state: S }>` — 


## `runState`

> Function · `type-theory/effects/state.ts:78`

Intérprete terminal: ejecuta el cómputo asumiendo que sólo tiene
efectos State. Devuelve `{ result, state }`. Lanza si encuentra
otra operación sin manejar.

```ts
export function runState<S, A>(eff: Eff<unknown, A>, initial: S):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `initial` | `S` | no |  |

### Returns

`{ result: A; state: S }` — 

