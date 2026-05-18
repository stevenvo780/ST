# `logic/profiles/substructural/types.ts`

Formulas del lenguaje lineal/afin. Los atomos son neutrales y se
comparan por nombre.

## Contents

- [`LinearFormula`](#linearformula) — Type
- [`SequentRule`](#sequentrule) — Type
- [`LinearSequent`](#linearsequent) — Interface
- [`LinearProof`](#linearproof) — Interface
- [`SubstructuralMode`](#substructuralmode) — Type

## `LinearFormula`

> Type · `logic/profiles/substructural/types.ts:30`

Formulas del lenguaje lineal/afin. Los atomos son neutrales y se
comparan por nombre.

```ts
export type LinearFormula = | { kind: 'atom'; name: string } | { kind: 'one' } | { kind: 'tensor'; left: LinearFormula; right: LinearFormula } | { kind: 'lollipop'; left: LinearFormula; right: LinearFormula } | { kind: 'with'; left: LinearFormula; right: LinearFormula } | { kind: 'plus'; left: LinearFormula; right: LinearFormula } | { kind: 'bang'; arg: LinearFormula } | { kind: 'whynot'; arg: LinearFormula };
```


## `SequentRule`

> Type · `logic/profiles/substructural/types.ts:56`

Reglas del calculo (intuicionistico) de secuentes que usamos.

El sistema implementado es un calculo de secuentes ILL (Intuitionistic
Linear Logic) restringido a un unico sucedente (Γ ⊢ A). Suficiente
para los enunciados pedidos en el bench: A ⊸ A, conmutatividad,
weakening solo en afin, contraction solo via bang, etc.

Notas:
  - `weakening` y `contraction` aparecen como reglas estructurales
    explicitas; en linear puro estan deshabilitadas. En afin,
    `weakening` esta habilitada (no asi `contraction`). En ambos,
    `!` da contraction/weakening "locales" sobre el sub-recurso.
  - `oneR` cierra el secuente ⊢ 1; `oneL` permite eliminar 1 a
    izquierda.

```ts
export type SequentRule = | 'axiom' | 'cut' | 'oneR' | 'oneL' | 'tensorR' | 'tensorL' | 'lollipopR' | 'lollipopL' | 'withR' | 'withL1' | 'withL2' | 'plusR1' | 'plusR2' | 'plusL' | 'bangR' | 'bangL' | 'derelictionL' | 'weakening' | 'contraction';
```


## `LinearSequent`

> Interface · `logic/profiles/substructural/types.ts:83`

Secuente intuicionistico Γ ⊢ Δ. En el fragmento que probamos,
`right` es de longitud 1 (un solo sucedente); se permite array
para preservar simetria con G3 y futuras extensiones a Linear Logic
clasica con multiples sucedentes.

```ts
export interface LinearSequent
```


## `LinearProof`

> Interface · `logic/profiles/substructural/types.ts:88`

```ts
export interface LinearProof
```


## `SubstructuralMode`

> Type · `logic/profiles/substructural/types.ts:100`

Modo de prueba que controla las reglas estructurales.

  - 'linear': ni contraction ni weakening (excepto via `!`).
  - 'affine': weakening si, contraction no (excepto via `!`).

```ts
export type SubstructuralMode = 'linear' | 'affine';
```

