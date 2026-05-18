# `logic/profiles/temporal/ltl.ts`

============================================================ ST Temporal LTL — Lógica Temporal Lineal ============================================================ Operadores temporales mapeados a modales:   G(φ) = [](φ)  — "siempre" (Globally)   F(φ) = <>(φ)  — "eventualmente" (Finally)   X(φ)          — "en el siguiente estado" (Next)   φ U ψ         — "φ vale hasta que ψ" (Until)   Dualidad: F(φ) ≡ ¬G(¬φ),  G(φ) ≡ ¬F(¬φ) Frame: transitivo (S4 sin simetría) — el futuro es irreversible. X y U se soportan como operadores nativos del parser. ============================================================

## `TemporalLTL`

> Class · `logic/profiles/temporal/ltl.ts:25`

```ts
export class TemporalLTL extends BaseTableauProfile
```

