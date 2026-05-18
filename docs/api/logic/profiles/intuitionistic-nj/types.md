# `logic/profiles/intuitionistic-nj/types.ts`

Fórmula proposicional intuicionista. No incluye `true` explícito
(irrelevante; usar `bottom → bottom` si hace falta).

## Contents

- [`IntuitFormula`](#intuitformula) — Type
- [`ProofRule`](#proofrule) — Type
- [`NJProof`](#njproof) — Interface
- [`KripkeIntuitModel`](#kripkeintuitmodel) — Interface

## `IntuitFormula`

> Type · `logic/profiles/intuitionistic-nj/types.ts:24`

Fórmula proposicional intuicionista. No incluye `true` explícito
(irrelevante; usar `bottom → bottom` si hace falta).

```ts
export type IntuitFormula = | { kind: 'atom'; name: string } | { kind: 'and'; left: IntuitFormula; right: IntuitFormula } | { kind: 'or'; left: IntuitFormula; right: IntuitFormula } | { kind: 'implies'; left: IntuitFormula; right: IntuitFormula } | { kind: 'not'; arg: IntuitFormula } | { kind: 'bottom' };
```


## `ProofRule`

> Type · `logic/profiles/intuitionistic-nj/types.ts:36`

Reglas de prueba NJ. Cada nodo del árbol marca la regla aplicada
para llegar a su `conclusion` desde sus `premises`.

```ts
export type ProofRule = | 'assumption' | 'andI' | 'andEL' | 'andER' | 'orIL' | 'orIR' | 'orE' | 'impI' | 'impE' | 'notI' | 'notE' | 'bottomE';
```


## `NJProof`

> Interface · `logic/profiles/intuitionistic-nj/types.ts:56`

Árbol de prueba NJ. Las hipótesis abiertas viven implícitamente
en el contexto del subárbol; `discharged` lista las hipótesis
cerradas por la regla aplicada en este nodo (relevante para →I,
¬I y ∨E).

```ts
export interface NJProof
```


## `KripkeIntuitModel`

> Interface · `logic/profiles/intuitionistic-nj/types.ts:68`

Modelo de Kripke para IPC: preorden de mundos con valuación
persistente. La accesibilidad debe ser reflexiva y transitiva;
`forcing` es monótona (si w ⊩ p y w ≤ v entonces v ⊩ p).

```ts
export interface KripkeIntuitModel
```

