# `type-theory/effects/writer.ts`

============================================================ Effect: Writer<W> ============================================================ Una sola operación:   - Writer.tell : W → undefined

## Contents

- [`WRITER_TELL`](#writer-tell) — Const
- [`WriterTell`](#writertell) — Type
- [`Writer`](#writer) — Type
- [`tell`](#tell) — Function
- [`handleWriter`](#handlewriter) — Function
- [`runWriter`](#runwriter) — Function
- [`listMonoid`](#listmonoid) — Function
- [`stringMonoid`](#stringmonoid) — Const
- [`sumMonoid`](#summonoid) — Const

## `WRITER_TELL`

> Const · `type-theory/effects/writer.ts:11`

```ts
const WRITER_TELL
```


## `WriterTell`

> Type · `type-theory/effects/writer.ts:13`

```ts
export type WriterTell<W> = Effect<typeof WRITER_TELL, W, undefined>;
```


## `Writer`

> Type · `type-theory/effects/writer.ts:14`

```ts
export type Writer<W> = WriterTell<W>;
```


## `tell`

> Function · `type-theory/effects/writer.ts:17`

Acumula un mensaje en el log.

```ts
export function tell<W>(w: W): Eff<WriterTell<W>, undefined>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `w` | `W` | no |  |

### Returns

`Eff<WriterTell<W>, undefined>` — 


## `handleWriter`

> Function · `type-theory/effects/writer.ts:25`

Intérprete componible. Acumula los `tell` con el monoide y deja
otros efectos intactos.

```ts
export function handleWriter<R, W, A>( eff: Eff<unknown, A>, monoid: Monoid<W>, ): Eff<R,
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `monoid` | `Monoid<W>` | no |  |

### Returns

`Eff<R, { result: A; log: W }>` — 


## `runWriter`

> Function · `type-theory/effects/writer.ts:50`

Intérprete terminal: ejecuta combinando todos los `tell` con el
monoide dado. Devuelve `{ result, log }`. Lanza si encuentra otra
operación sin manejar.

```ts
export function runWriter<W, A>(eff: Eff<unknown, A>, monoid: Monoid<W>):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<unknown, A>` | no |  |
| `monoid` | `Monoid<W>` | no |  |

### Returns

`{ result: A; log: W }` — 


## `listMonoid`

> Function · `type-theory/effects/writer.ts:68`

Monoide concatenación de listas.

```ts
export function listMonoid<W>(): Monoid<W[]>
```

### Returns

`Monoid<W[]>` — 


## `stringMonoid`

> Const · `type-theory/effects/writer.ts:76`

Monoide concatenación de strings.

```ts
const stringMonoid: Monoid<string>
```


## `sumMonoid`

> Const · `type-theory/effects/writer.ts:82`

Monoide aditivo sobre números.

```ts
const sumMonoid: Monoid<number>
```

