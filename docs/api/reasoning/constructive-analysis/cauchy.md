# `reasoning/constructive-analysis/cauchy.ts`

Constructive Cauchy sequences with explicit modulus of convergence.

In Bishop's school, a "Cauchy sequence" without a modulus is not enough
data to extract a limit constructively — one needs an explicit
`modulus(eps)` returning an index N(eps) such that
  for all m, n >= N(eps), |x_m - x_n| < eps.

## Contents

- [`ConstructiveCauchySeq`](#constructivecauchyseq) — Interface
- [`isCauchy`](#iscauchy) — Const
- [`limit`](#limit) — Const
- [`cauchyFrom`](#cauchyfrom) — Const

## `ConstructiveCauchySeq`

> Interface · `reasoning/constructive-analysis/cauchy.ts:12`

```ts
export interface ConstructiveCauchySeq
```


## `isCauchy`

> Const · `reasoning/constructive-analysis/cauchy.ts:34`

Sound (one-sided) check: returns true if the modulus genuinely
witnesses Cauchy-ness at precision `eps` for the first few terms.

Constructively we cannot inspect "all m, n >= N" — we sample a window
and verify the bound holds. If the modulus is correct this will
return true; if it is a counterexample for some sampled pair, false.

`sampleWindow` controls how many terms past N we inspect. Default 8
is enough to expose almost all wrong moduli.

```ts
const isCauchy
```


## `limit`

> Const · `reasoning/constructive-analysis/cauchy.ts:70`

Limit of a Cauchy sequence with modulus.

`bits` (the CReal precision argument) is the number of binary fractional
bits required. We need |limit - approx| < 2^{-bits}.

Strategy: find index N such that the N-th term x_N is within 2^{-(bits+1)}
of the true limit. By the triangle inequality, evaluating x_N at (bits+1)
binary bits gives a result within 2^{-bits} of the limit.

The modulus(eps) guarantees |x_m - x_n| < 1/eps for m,n >= N(eps).
We need 1/eps <= 2^{-(bits+1)}, so eps >= 2^{bits+1}.

```ts
const limit
```


## `cauchyFrom`

> Const · `reasoning/constructive-analysis/cauchy.ts:85`

Convenience: builds a Cauchy seq from a generator + a known rate `1/f(eps)`.
`f(eps)` must return an integer N with |x_m - x_n| < 1/eps for m, n >= N.

```ts
const cauchyFrom
```

