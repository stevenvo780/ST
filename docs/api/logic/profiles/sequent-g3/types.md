# `logic/profiles/sequent-g3/types.ts`

============================================================ G3 Sequent Calculus — Types ============================================================ Calculo de secuentes G3 (Gentzen reformulado por Kleene) para logica proposicional clasica. Sus reglas son invertibles, las premisas son sub-formulas de la conclusion y el sistema admite eliminacion del corte (cut elimination), por lo que la busqueda hacia atras es completa y terminante. Convencion: un secuente Γ ⊢ Δ se representa con `left` y `right` como multisets (arrays con duplicados permitidos). El orden no importa logicamente pero se preserva para reproducibilidad.

## Contents

- [`SequentRule`](#sequentrule) — Type
- [`Sequent`](#sequent) — Interface
- [`ProofTree`](#prooftree) — Interface
- [`ProveResult`](#proveresult) — Interface

## `SequentRule`

> Type · `logic/profiles/sequent-g3/types.ts:28`

Reglas del calculo G3 (proposicional clasico).

- `axiom`        : Γ, A ⊢ A, Δ   (A atomico)
- `andL` / `andR`: descomposicion de ∧ a izquierda / derecha
- `orL`  / `orR` : descomposicion de ∨
- `impL` / `impR`: descomposicion de →
- `notL` / `notR`: descomposicion de ¬
- `falseL`       : Γ, ⊥ ⊢ Δ es axioma
- `trueR`        : Γ ⊢ ⊤, Δ es axioma

```ts
export type SequentRule = | 'axiom' | 'falseL' | 'trueR' | 'andL' | 'andR' | 'orL' | 'orR' | 'impL' | 'impR' | 'notL' | 'notR';
```


## `Sequent`

> Interface · `logic/profiles/sequent-g3/types.ts:41`

```ts
export interface Sequent
```


## `ProofTree`

> Interface · `logic/profiles/sequent-g3/types.ts:46`

```ts
export interface ProofTree
```


## `ProveResult`

> Interface · `logic/profiles/sequent-g3/types.ts:55`

```ts
export interface ProveResult
```

