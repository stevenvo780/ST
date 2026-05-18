# `reasoning/constructive-analysis/continuity.ts`

Constructive (uniform) continuity on a compact interval.

Bishop's framework: a function f : [a, b] -> R is continuous iff it
comes with an explicit modulus of uniform continuity
  omega : Q_>0 -> Q_>0
such that |x - y| < omega(eps) implies |f(x) - f(y)| < eps,
for all x, y in [a, b].

On a general (non-compact) domain, "pointwise" continuity is the wrong
notion constructively. We only model uniform continuity on intervals.

Modulus convention: we use `modulus(epsPrecision) -> deltaPrecision`,
both positive integers, encoding `1/eps -> 1/delta`. So
  modulus(k) = m  means  |x - y| < 1/m  =>  |f(x) - f(y)| < 1/k.

## Contents

- [`ConstructiveContinuous`](#constructivecontinuous) — Interface
- [`isUniformlyContinuousOn`](#isuniformlycontinuouson) — Const
- [`composition`](#composition) — Const
- [`constant`](#constant) — Const
- [`identity`](#identity) — Const
- [`lipschitz`](#lipschitz) — Const

## `ConstructiveContinuous`

> Interface · `reasoning/constructive-analysis/continuity.ts:20`

```ts
export interface ConstructiveContinuous
```


## `isUniformlyContinuousOn`

> Const · `reasoning/constructive-analysis/continuity.ts:39`

Sound sampling-based check that the modulus is correct on `[a, b]`.

Constructively, "for all x, y in [a, b]" is not decidable. Instead we
sample `samples` pairs of points at distance ~1/m within [a, b] and
verify the implication holds at each one. If the modulus is correct
this returns true; a wrong modulus gets exposed on any failing sample.

```ts
const isUniformlyContinuousOn
```


## `composition`

> Const · `reasoning/constructive-analysis/continuity.ts:86`

Composition of uniformly continuous functions.

If g has modulus `omega_g` and f has modulus `omega_f`, then `f . g`
has modulus `omega_g . omega_f`:
  |x - y| < 1 / omega_g(omega_f(eps))
    => |g(x) - g(y)| < 1/omega_f(eps)
    => |f(g(x)) - f(g(y))| < 1/eps.

```ts
const composition
```


## `constant`

> Const · `reasoning/constructive-analysis/continuity.ts:97`

Constant function. Modulus is trivial (any positive integer works).

```ts
const constant
```


## `identity`

> Const · `reasoning/constructive-analysis/continuity.ts:105`

Identity. Lipschitz-1, modulus(eps) = eps.

```ts
const identity
```


## `lipschitz`

> Const · `reasoning/constructive-analysis/continuity.ts:116`

Lipschitz function from a JS callback with known Lipschitz constant L.
Useful for tests. Modulus(eps) = ceil(L * eps).

The caller is responsible for the Lipschitz bound being correct.

```ts
const lipschitz
```

