# `type-theory/effects/types.ts`

Firma de un efecto algebraico: nombre, payload, resultado esperado.

## Contents

- [`Effect`](#effect) — Type
- [`Operation`](#operation) — Interface
- [`Eff`](#eff) — Type
- [`Handler`](#handler) — Interface
- [`Monoid`](#monoid) — Interface
- [`ExceptionResult`](#exceptionresult) — Type

## `Effect`

> Type · `type-theory/effects/types.ts:21`

Firma de un efecto algebraico: nombre, payload, resultado esperado.

```ts
export type Effect<Name extends string, In, Out> = { readonly tag: Name; readonly input: In; /** Phantom: usado sólo a nivel de tipos para inferir la respuesta. */ readonly output: Out; };
```


## `Operation`

> Interface · `type-theory/effects/types.ts:29`

Operación cruda almacenada en un nodo `impure`.

```ts
export interface Operation
```


## `Eff`

> Type · `type-theory/effects/types.ts:35`

Computación con efectos `E` y resultado `A`.

```ts
export type Eff<E, A> = | { readonly kind: 'pure'; readonly value: A } | { readonly kind: 'impure'; readonly effect: Operation; readonly continuation: (value: never) => Eff<E, A>; };
```


## `Handler`

> Interface · `type-theory/effects/types.ts:49`

Handler de un efecto concreto. Recibe el input crudo y una
continuación que, dado el resultado de la operación, produce el
resto del cómputo. Devuelve un cómputo (posiblemente con otros
efectos `R`) y resultado final `A`.

```ts
export interface Handler<EName extends string, I, O, R, A>
```


## `Monoid`

> Interface · `type-theory/effects/types.ts:55`

Monoide para `runWriter`.

```ts
export interface Monoid<W>
```


## `ExceptionResult`

> Type · `type-theory/effects/types.ts:61`

Resultado de `runException`.

```ts
export type ExceptionResult<E, A> = { kind: 'ok'; value: A } | { kind: 'error'; error: E };
```

