# `logic/profiles/aristotelian/syllogistic.ts`

============================================================ ST Aristotelian Syllogistic — Silogística Categórica ============================================================ Formaliza los 24 silogismos válidos de Aristóteles. Usa cuantificadores de primer orden internamente:   "Todo S es P"     → ∀x(S(x) → P(x))   "Ningún S es P"   → ∀x(S(x) → ¬P(x))   "Algún S es P"    → ∃x(S(x) ∧ P(x))   "Algún S no es P" → ∃x(S(x) ∧ ¬P(x)) No usa tableau modal; implementa validación directa de figuras y modos silogísticos. ============================================================

## `AristotelianSyllogistic`

> Class · `logic/profiles/aristotelian/syllogistic.ts:267`

```ts
export class AristotelianSyllogistic implements LogicProfile
```

