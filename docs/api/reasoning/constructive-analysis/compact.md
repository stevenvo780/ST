# `reasoning/constructive-analysis/compact.ts`

Constructive Heine-Borel: every covering of a compact interval [a, b]
by open rational intervals has a finite subcover.

Bishop's proof is fully constructive: enumerate the cover, and use
uniform continuity of the indicator-as-membership predicate via the
Lebesgue number lemma. We give a direct algorithmic version: walk
from `a` to `b` taking the rightmost reachable endpoint of any
interval that contains the current frontier; if we can always
advance, we accept; if we get stuck, we reject.

The intervals are pairs `[lo, hi]` of CReals; the cover is "open" in
the sense `lo < x < hi` (we work with the open interior).

## Contents

- [`ConstructiveOpenCover`](#constructiveopencover) — Interface
- [`hasFiniteSubcover`](#hasfinitesubcover) — Const

## `ConstructiveOpenCover`

> Interface · `reasoning/constructive-analysis/compact.ts:18`

```ts
export interface ConstructiveOpenCover
```


## `hasFiniteSubcover`

> Const · `reasoning/constructive-analysis/compact.ts:37`

Returns true if `cover` constructively covers `[a, b]` and the algorithm
found a finite subcover (which in this case is just a subset of the
given finite list, so trivially finite — the question is whether the
cover suffices).

Approach: scan with a frontier `x` initialized to `a`. At each step we
search for an interval `(lo, hi)` with `lo < x < hi` (or `lo < x` and
`x <= a + tol` at the start) and advance `x := hi`. If we reach
`x >= b`, we accept. If we cannot advance, we reject.

`tol` is a tiny tolerance for the frontier to handle the fact that we
read CReals as JS numbers. Default 1e-12 (well above floating noise
for the precision range we use).

```ts
const hasFiniteSubcover
```

