# `reasoning/constructive-analysis/ivt.ts`

Constructive Intermediate Value Theorem and Mean Value approximation.

Classically: if f is continuous on [a, b] and f(a) <= target <= f(b),
then there exists c in [a, b] with f(c) = target. Constructively the
exact statement is unprovable without LEM (deciding equality on R is
not decidable), but the *approximate* IVT is fully constructive:

  Given precision N, we can compute c in [a, b] with |f(c) - target| < 1/N.

Algorithm (bisection with explicit witness):
  - require f(a) and f(b) to bracket `target` (with a tolerance);
  - bisect, picking the half where the target still lies between the
    endpoints' images at sufficient precision;
  - stop when |f(c) - target| < 1/N (witnessed at precision 4N).

Mean value (constructive): for uniformly continuous f, the average
value `(1/(b-a)) * ∫_a^b f` is a real in the closure of the image of f.
The constructive MVT-approximation finds c in [a, b] with
  |f(c) - average| < 1/N.

## Contents

- [`intermediateValueTheorem`](#intermediatevaluetheorem) — Const
- [`meanValueConstructive`](#meanvalueconstructive) — Const

## `intermediateValueTheorem`

> Const · `reasoning/constructive-analysis/ivt.ts:36`

Returns a CReal `c` with |f(c) - target| < 1/precision, or null if no
such c is bracketed in [a, b] at the given precision.

Requires f(a) <= target <= f(b) or the reverse (we don't assume a
specific direction; we use a generalized sign test).

```ts
const intermediateValueTheorem
```


## `meanValueConstructive`

> Const · `reasoning/constructive-analysis/ivt.ts:103`

Constructive mean value approximation: find c in [a, b] with
  |f(c) - (1/(b-a)) * ∫_a^b f(x) dx| < 1/precision,
if such c is bracketed at this precision; null otherwise.

Strategy: compute the average via Bishop integral, then call IVT to
locate c.

```ts
const meanValueConstructive
```

