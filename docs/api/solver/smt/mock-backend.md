# `solver/smt/mock-backend.ts`

============================================================ ST SMT — Mock backend in-process (resuelve casos triviales sin solver real) ============================================================

## `MockSMTBackend`

> Class · `solver/smt/mock-backend.ts:24`

MockSMTBackend resuelve un subconjunto del SMT-LIB v2 sin solver externo:
 - constantes booleanas con asserts directos (P, ¬P, P→P, P∧¬P)
 - lineales triviales en una sola variable (x > c, x < c, x = c)
 - combinaciones con `and` / `or` / `not` recursivas

No pretende ser completo. Devuelve `unknown` cuando no sabe.

```ts
export class MockSMTBackend implements SMTBackend
```

