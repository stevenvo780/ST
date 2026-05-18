# `type-theory/effects/reader.ts`

============================================================ Effect: Reader<R> ============================================================ Una sola operación:   - Reader.ask : () → R

## Contents

- [`READER_ASK`](#reader-ask) — Const
- [`ReaderAsk`](#readerask) — Type
- [`Reader`](#reader) — Type
- [`ask`](#ask) — Function
- [`asks`](#asks) — Function
- [`handleReader`](#handlereader) — Function
- [`runReader`](#runreader) — Function

## `READER_ASK`

> Const · `type-theory/effects/reader.ts:11`

```ts
const READER_ASK
```


## `ReaderAsk`

> Type · `type-theory/effects/reader.ts:13`

```ts
export type ReaderAsk<R> = Effect<typeof READER_ASK, void, R>;
```


## `Reader`

> Type · `type-theory/effects/reader.ts:14`

```ts
export type Reader<R> = ReaderAsk<R>;
```


## `ask`

> Function · `type-theory/effects/reader.ts:17`

Lee el ambiente del Reader.

```ts
export function ask<R>(): Eff<ReaderAsk<R>, R>
```

### Returns

`Eff<ReaderAsk<R>, R>` — 


## `asks`

> Function · `type-theory/effects/reader.ts:22`

Lee el ambiente y aplica una proyección.

```ts
export function asks<R, A>(fn: (r: R) => A): Eff<ReaderAsk<R>, A>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `fn` | `(r: R) => A` | no |  |

### Returns

`Eff<ReaderAsk<R>, A>` — 


## `handleReader`

> Function · `type-theory/effects/reader.ts:30`

Intérprete componible. Reescribe `Reader.ask` proyectando el `env`
fijo y deja otros efectos intactos.

```ts
export function handleReader<R, A, Env>(eff: Eff<unknown, A>, env: Env): Eff<R, A>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `env` | `Env` | no |  |

### Returns

`Eff<R, A>` — 


## `runReader`

> Function · `type-theory/effects/reader.ts:51`

Intérprete terminal: ejecuta el cómputo con un ambiente fijo.
Cualquier `Reader.ask` recibe el mismo `env`. Lanza si encuentra
otra operación sin manejar.

```ts
export function runReader<R, A>(eff: Eff<unknown, A>, env: R): A
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `env` | `R` | no |  |

### Returns

`A` — 

