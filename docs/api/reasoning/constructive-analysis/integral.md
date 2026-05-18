# `reasoning/constructive-analysis/integral.ts`

Constructive Bishop integral on a compact interval.

For uniformly continuous f on [a, b], the integral
  I = ∫_a^b f(x) dx
is computed as the limit of Riemann sums. The explicit modulus of
uniform continuity gives us the rate.

Specifically: given a partition of mesh h, and any choice of sample
points, the Riemann sum S_h satisfies
  |S_h - I| <= (b - a) * sup{ |f(x) - f(y)| : |x - y| <= h }

If we want |S_h - I| < 1/N, pick eps with eps * (b - a) < 1/N, i.e.
eps > N * (b - a). Then choose h < 1/omega_f(eps).

## `bishopIntegral`

> Const · `reasoning/constructive-analysis/integral.ts:32`

Bishop integral of `f` over `[from, to]`.

`precision` is a positive integer N; the result is a rational `q` with
  |q - ∫_from^to f| < 1/N.

Implementation: midpoint rule with mesh < 1/m where
  m = omega_f(ceil(N * length) + 1)

which guarantees the bound above. We then wrap the rational in a CReal
for compositionality (the same precision N is exposed as 1/N error).

```ts
const bishopIntegral
```

