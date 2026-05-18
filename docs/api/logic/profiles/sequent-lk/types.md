# `logic/profiles/sequent-lk/types.ts`

Sintaxis proposicional minima del perfil LK.

## Contents

- [`LKFormula`](#lkformula) — Type
- [`LKRule`](#lkrule) — Type
- [`LKSequent`](#lksequent) — Interface
- [`LKProof`](#lkproof) — Interface

## `LKFormula`

> Type · `logic/profiles/sequent-lk/types.ts:18`

Sintaxis proposicional minima del perfil LK.

```ts
export type LKFormula = | { kind: 'atom'; name: string } | { kind: 'not'; arg: LKFormula } | { kind: 'and'; left: LKFormula; right: LKFormula } | { kind: 'or'; left: LKFormula; right: LKFormula } | { kind: 'implies'; left: LKFormula; right: LKFormula };
```


## `LKRule`

> Type · `logic/profiles/sequent-lk/types.ts:45`

Reglas del calculo LK clasico (proposicional).

  axiom   : A ⊢ A
  cut     : Γ ⊢ Δ, A   y   A, Σ ⊢ Π   ⟹   Γ, Σ ⊢ Δ, Π
  weakL   : Γ ⊢ Δ                       ⟹   A, Γ ⊢ Δ
  weakR   : Γ ⊢ Δ                       ⟹   Γ ⊢ Δ, A
  contrL  : A, A, Γ ⊢ Δ                ⟹   A, Γ ⊢ Δ
  contrR  : Γ ⊢ Δ, A, A                ⟹   Γ ⊢ Δ, A
  exL     : permuta una formula a la izquierda
  exR     : permuta una formula a la derecha
  notL    : Γ ⊢ Δ, A                   ⟹   ¬A, Γ ⊢ Δ
  notR    : A, Γ ⊢ Δ                   ⟹   Γ ⊢ Δ, ¬A
  andL    : A, B, Γ ⊢ Δ                ⟹   A∧B, Γ ⊢ Δ
  andR    : Γ ⊢ Δ, A   y   Γ ⊢ Δ, B    ⟹   Γ ⊢ Δ, A∧B
  orL     : A, Γ ⊢ Δ   y   B, Γ ⊢ Δ    ⟹   A∨B, Γ ⊢ Δ
  orR     : Γ ⊢ Δ, A, B                ⟹   Γ ⊢ Δ, A∨B
  impL    : Γ ⊢ Δ, A   y   B, Γ ⊢ Δ    ⟹   A→B, Γ ⊢ Δ
  impR    : A, Γ ⊢ Δ, B                ⟹   Γ ⊢ Δ, A→B

```ts
export type LKRule = | 'axiom' | 'cut' | 'weakL' | 'weakR' | 'contrL' | 'contrR' | 'exL' | 'exR' | 'notL' | 'notR' | 'andL' | 'andR' | 'orL' | 'orR' | 'impL' | 'impR';
```


## `LKSequent`

> Interface · `logic/profiles/sequent-lk/types.ts:63`

```ts
export interface LKSequent
```


## `LKProof`

> Interface · `logic/profiles/sequent-lk/types.ts:68`

```ts
export interface LKProof
```

