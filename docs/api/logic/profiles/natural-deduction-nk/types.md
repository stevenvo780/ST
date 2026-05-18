# `logic/profiles/natural-deduction-nk/types.ts`

Fórmula proposicional clásica. Misma forma sintáctica que NJ;
la diferencia entre ambas lógicas vive en el sistema de reglas.

## Contents

- [`NKFormula`](#nkformula) — Type
- [`NKRule`](#nkrule) — Type
- [`NKProof`](#nkproof) — Interface
- [`CLASSICAL_ONLY_RULES`](#classical-only-rules) — Const

## `NKFormula`

> Type · `logic/profiles/natural-deduction-nk/types.ts:32`

Fórmula proposicional clásica. Misma forma sintáctica que NJ;
la diferencia entre ambas lógicas vive en el sistema de reglas.

```ts
export type NKFormula = | { kind: 'atom'; name: string } | { kind: 'and'; left: NKFormula; right: NKFormula } | { kind: 'or'; left: NKFormula; right: NKFormula } | { kind: 'implies'; left: NKFormula; right: NKFormula } | { kind: 'not'; arg: NKFormula } | { kind: 'bottom' };
```


## `NKRule`

> Type · `logic/profiles/natural-deduction-nk/types.ts:44`

Reglas de prueba NK. Las primeras son las de NJ; las últimas
cuatro son los "extras" clásicos.

```ts
export type NKRule = | 'assumption' | 'andI' | 'andEL' | 'andER' | 'orIL' | 'orIR' | 'orE' | 'impI' | 'impE' | 'notI' | 'notE' | 'bottomE' | 'doubleNegE' | 'LEM' | 'pierce' | 'rAA';
```


## `NKProof`

> Interface · `logic/profiles/natural-deduction-nk/types.ts:68`

Árbol de prueba NK. Las hipótesis abiertas viven implícitamente
en el contexto del subárbol; `discharged` lista las hipótesis
cerradas por la regla aplicada en este nodo (relevante para →I,
¬I, ∨E y rAA).

```ts
export interface NKProof
```


## `CLASSICAL_ONLY_RULES`

> Const · `logic/profiles/natural-deduction-nk/types.ts:79`

Conjunto de reglas que sólo existen en NK (no en NJ).
Útil para detectar si una prueba NK es trasladable a NJ.

```ts
const CLASSICAL_ONLY_RULES: ReadonlyArray<NKRule>
```

