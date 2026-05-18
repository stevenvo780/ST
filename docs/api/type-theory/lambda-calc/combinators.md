# `type-theory/lambda-calc/combinators.ts`

============================================================ λ-cálculo untyped — Combinadores clásicos ============================================================   I  = λx.x   K  = λx.λy.x   S  = λx.λy.λz.(xz)(yz)   Y  = λf.(λx.f(xx))(λx.f(xx))             (fixpoint, diverge en cbv)   ω  = λx.xx   Ω  = ωω = (λx.xx)(λx.xx)                  (canónico divergente)

## Contents

- [`I`](#i) — Const
- [`K`](#k) — Const
- [`S`](#s) — Const
- [`Y`](#y) — Const
- [`omegaSmall`](#omegasmall) — Const
- [`omega`](#omega) — Const

## `I`

> Const · `type-theory/lambda-calc/combinators.ts:15`

```ts
const I: Term
```


## `K`

> Const · `type-theory/lambda-calc/combinators.ts:17`

```ts
const K: Term
```


## `S`

> Const · `type-theory/lambda-calc/combinators.ts:19`

```ts
const S: Term
```


## `Y`

> Const · `type-theory/lambda-calc/combinators.ts:22`

```ts
const Y: Term
```


## `omegaSmall`

> Const · `type-theory/lambda-calc/combinators.ts:28`

```ts
const omegaSmall: Term
```


## `omega`

> Const · `type-theory/lambda-calc/combinators.ts:31`

```ts
const omega: Term
```

