# `logic/profiles/sequent-lj/index.ts`

============================================================ LJ Sequent Calculus — Calculo de secuentes intuicionista ============================================================ LJ de Gentzen (1934) para logica intuicionista proposicional. A diferencia de LK clasico, LJ admite a lo sumo UNA formula en el succedente: secuentes de la forma Γ ⊢ φ (con succedente no vacio) o Γ ⊢ (succedente vacio). Esta restriccion es lo que hace que LJ NO derive ¬¬P → P ni P ∨ ¬P (LEM/DNE clasicas). Reglas (proposicionales):   axiom   : A, Γ ⊢ A   cut     : Γ ⊢ A     A, Σ ⊢ C    ⟹   Γ, Σ ⊢ C   weakL   : Γ ⊢ C                  ⟹   A, Γ ⊢ C   contrL  : A, A, Γ ⊢ C            ⟹   A, Γ ⊢ C   exL     : permuta a la izquierda   notL    : Γ ⊢ A                  ⟹   ¬A, Γ ⊢ C   notR    : A, Γ ⊢                 ⟹   Γ ⊢ ¬A     (succedente vacio)   andL    : A, B, Γ ⊢ C            ⟹   A∧B, Γ ⊢ C   andR    : Γ ⊢ A   y   Γ ⊢ B      ⟹   Γ ⊢ A∧B   orL     : A, Γ ⊢ C  y  B, Γ ⊢ C  ⟹   A∨B, Γ ⊢ C   orR-l   : Γ ⊢ A                  ⟹   Γ ⊢ A∨B   orR-r   : Γ ⊢ B                  ⟹   Γ ⊢ A∨B   impL    : Γ ⊢ A   y   B, Γ ⊢ C   ⟹   A→B, Γ ⊢ C   impR    : A, Γ ⊢ B               ⟹   Γ ⊢ A→B   bottomL : ⊥, Γ ⊢ C               (ex falso quodlibet) Glivenko (1929): Γ ⊢_LK φ  sii  Γ ⊢_LJ ¬¬φ. La funcion `glivenkoEmbed` traduce una formula clasica a su lectura intuicionista doble-negada.   import { proveLJ, hasCut, eliminateCut, isValid, ljToLk, lkToLj, glivenkoEmbed }     from 'src/profiles/sequent-lj'; ============================================================ Sintaxis ============================================================

## Contents

- [`LJFormula`](#ljformula) — Type
- [`LJRule`](#ljrule) — Type
- [`LJSequent`](#ljsequent) — Interface
- [`LJProof`](#ljproof) — Interface
- [`proveLJ`](#provelj) — Function
- [`proveLJFormula`](#proveljformula) — Function
- [`isValid`](#isvalid) — Function
- [`hasCut`](#hascut) — Function
- [`eliminateCut`](#eliminatecut) — Function
- [`ljToLk`](#ljtolk) — Function
- [`lkToLj`](#lktolj) — Function
- [`glivenkoEmbed`](#glivenkoembed) — Function

## `LJFormula`

> Type · `logic/profiles/sequent-lj/index.ts:40`

```ts
export type LJFormula = | { kind: 'atom'; name: string } | { kind: 'not'; arg: LJFormula } | { kind: 'and'; left: LJFormula; right: LJFormula } | { kind: 'or'; left: LJFormula; right: LJFormula } | { kind: 'implies'; left: LJFormula; right: LJFormula } | { kind: 'bottom' };
```


## `LJRule`

> Type · `logic/profiles/sequent-lj/index.ts:48`

```ts
export type LJRule = | 'axiom' | 'cut' | 'weakL' | 'contrL' | 'exL' | 'notL' | 'notR' | 'andL' | 'andR' | 'orL' | 'orR-l' | 'orR-r' | 'impL' | 'impR' | 'bottomL';
```


## `LJSequent`

> Interface · `logic/profiles/sequent-lj/index.ts:70`

Secuente intuicionista. `right === null` modela el succedente
vacio (necesario para regla `notR` y `bottomL` sin formula
conclusion).

```ts
export interface LJSequent
```


## `LJProof`

> Interface · `logic/profiles/sequent-lj/index.ts:75`

```ts
export interface LJProof
```


## `proveLJ`

> Function · `logic/profiles/sequent-lj/index.ts:416`

Demuestra el secuente `seq` en LJ intuicionista (sin cortes).
Devuelve `null` si no encuentra derivacion dentro del budget.

```ts
export function proveLJ(seq: LJSequent, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seq` | `LJSequent` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`LJProof \| null` — 


## `proveLJFormula`

> Function · `logic/profiles/sequent-lj/index.ts:430`

Atajo: ⊢ φ en LJ.

```ts
export function proveLJFormula( formula: LJFormula, options: { budget?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `LJFormula` | no |  |
| `options` | `{ budget?: number }` | yes |  |

### Returns

`LJProof \| null` — 


## `isValid`

> Function · `logic/profiles/sequent-lj/index.ts:441`

```ts
export function isValid(proof: LJProof): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LJProof` | no |  |

### Returns

`boolean` — 


## `hasCut`

> Function · `logic/profiles/sequent-lj/index.ts:619`

```ts
export function hasCut(proof: LJProof): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LJProof` | no |  |

### Returns

`boolean` — 


## `eliminateCut`

> Function · `logic/profiles/sequent-lj/index.ts:755`

```ts
export function eliminateCut(proof: LJProof): LJProof
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LJProof` | no |  |

### Returns

`LJProof` — 


## `ljToLk`

> Function · `logic/profiles/sequent-lj/index.ts:820`

Toda derivacion LJ es tambien una derivacion LK (con succedente
a lo sumo unitario). La conversion es estructural: copia el arbol,
usa right = [φ] o [] segun el secuente intuicionista, y mapea
orR-l/orR-r → orR.

```ts
export function ljToLk(proof: LJProof): unknown
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `proof` | `LJProof` | no |  |

### Returns

`unknown` — 


## `lkToLj`

> Function · `logic/profiles/sequent-lj/index.ts:840`

Conversion LK → LJ. Falla cuando la derivacion LK usa
multisuccedente esencial (ej. LEM, doble negacion clasica).
Estrategia: validar que cada secuente del arbol LK tenga
succedente |Δ| ≤ 1; si no, rechazar con motivo.

```ts
export function lkToLj(lkProof: unknown): LJProof |
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `lkProof` | `unknown` | no |  |

### Returns

`LJProof \| { rejected: string }` — 


## `glivenkoEmbed`

> Function · `logic/profiles/sequent-lj/index.ts:932`

```ts
export function glivenkoEmbed(formula: LJFormula): LJFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `LJFormula` | no |  |

### Returns

`LJFormula` — 

