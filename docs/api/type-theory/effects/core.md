# `type-theory/effects/core.ts`

============================================================ Algebraic effects — Constructores y combinadores del free monad ============================================================

## Contents

- [`pure`](#pure) — Function
- [`perform`](#perform) — Function
- [`bind`](#bind) — Function
- [`map`](#map) — Function
- [`sequence`](#sequence) — Function
- [`handle`](#handle) — Function
- [`run`](#run) — Function

## `pure`

> Function · `type-theory/effects/core.ts:8`

Inyecta un valor puro en la mónada.

```ts
export function pure<A>(value: A): Eff<never, A>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `value` | `A` | no |  |

### Returns

`Eff<never, A>` — 


## `perform`

> Function · `type-theory/effects/core.ts:17`

Construye una computación que ejecuta una operación `tag` con `input`
y entrega su resultado al consumidor. La continuación es la identidad:
"haz la operación y devuelve su salida".

```ts
export function perform<EName extends string, I, O>( tag: EName, input: I, ): Eff<Effect<EName, I, O>, O>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `tag` | `EName` | no |  |
| `input` | `I` | no |  |

### Returns

`Eff<Effect<EName, I, O>, O>` — 


## `bind`

> Function · `type-theory/effects/core.ts:30`

Bind monádico (>>= en notación de Haskell).

```ts
export function bind<E, A, B>(eff: Eff<E, A>, fn: (a: A) => Eff<E, B>): Eff<E, B>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<E, A>` | no |  |
| `fn` | `(a: A) => Eff<E, B>` | no |  |

### Returns

`Eff<E, B>` — 


## `map`

> Function · `type-theory/effects/core.ts:42`

Alias funtorial: aplica una función pura al resultado.

```ts
export function map<E, A, B>(eff: Eff<E, A>, fn: (a: A) => B): Eff<E, B>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<E, A>` | no |  |
| `fn` | `(a: A) => B` | no |  |

### Returns

`Eff<E, B>` — 


## `sequence`

> Function · `type-theory/effects/core.ts:47`

Secuencia una lista de computaciones y colecta sus resultados.

```ts
export function sequence<E, A>(effs: ReadonlyArray<Eff<E, A>>): Eff<E, A[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `effs` | `ReadonlyArray<Eff<E, A>>` | no |  |

### Returns

`Eff<E, A[]>` — 


## `handle`

> Function · `type-theory/effects/core.ts:59`

Interpreta un efecto concreto. Recorre el árbol: las hojas `pure`
pasan tal cual; los nodos `impure` cuyo `tag` coincida con el
handler son delegados a `handle`; el resto se propaga.

```ts
export function handle<E1, E2, A>( eff: Eff<E1, A>, handler: Handler<string, unknown, unknown, E2, A>, ): Eff<E2, A>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<E1, A>` | no |  |
| `handler` | `Handler<string, unknown, unknown, E2, A>` | no |  |

### Returns

`Eff<E2, A>` — 


## `run`

> Function · `type-theory/effects/core.ts:83`

Extrae el valor de una computación 100% pura. Lanza si quedan efectos
sin interpretar — útil tras componer todos los handlers.

```ts
export function run<A>(eff: Eff<never, A>): A
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `eff` | `Eff<never, A>` | no |  |

### Returns

`A` — 

