# `reasoning/constructive-analysis/index.ts`

Bishop-style constructive real analysis.

Re-exports the four pillars:
  - Cauchy sequences with explicit modulus (`./cauchy`)
  - Uniform continuity on compact intervals (`./continuity`)
  - Bishop integral (`./integral`)
  - Heine-Borel compactness (`./compact`)
  - Intermediate value + mean value approximations (`./ivt`)

All operations are constructive: no LEM, no unrestricted choice, and
every claim of convergence/continuity is backed by an explicit
modulus function. The CReal primitive lives in
`../constructive-reals`.
