# `logic/profiles/sequent-lj/index.ts`

AST de fórmulas proposicionales intuicionistas para el cálculo LJ.

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

> Type · `logic/profiles/sequent-lj/index.ts:41`

AST de fórmulas proposicionales intuicionistas para el cálculo LJ.

```ts
export type LJFormula = | { kind: 'atom'; name: string } | { kind: 'not'; arg: LJFormula } | { kind: 'and'; left: LJFormula; right: LJFormula } | { kind: 'or'; left: LJFormula; right: LJFormula } | { kind: 'implies'; left: LJFormula; right: LJFormula } | { kind: 'bottom' };
```


## `LJRule`

> Type · `logic/profiles/sequent-lj/index.ts:50`

Nombres de las reglas del cálculo de secuentes LJ de Gentzen.

```ts
export type LJRule = | 'axiom' | 'cut' | 'weakL' | 'contrL' | 'exL' | 'notL' | 'notR' | 'andL' | 'andR' | 'orL' | 'orR-l' | 'orR-r' | 'impL' | 'impR' | 'bottomL';
```


## `LJSequent`

> Interface · `logic/profiles/sequent-lj/index.ts:72`

Secuente intuicionista. `right === null` modela el succedente
vacio (necesario para regla `notR` y `bottomL` sin formula
conclusion).

```ts
export interface LJSequent
```


## `LJProof`

> Interface · `logic/profiles/sequent-lj/index.ts:81`

Árbol de derivación LJ.
Cada nodo registra el secuente meta, la regla aplicada y las sub-derivaciones.

```ts
export interface LJProof
```


## `proveLJ`

> Function · `logic/profiles/sequent-lj/index.ts:422`

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

> Function · `logic/profiles/sequent-lj/index.ts:437`

Atajo: intenta derivar ⊢ φ en LJ (secuente con antecedente vacío).

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

> Function · `logic/profiles/sequent-lj/index.ts:449`

Verifica estructuralmente que un árbol de derivación LJ es correcto.

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

> Function · `logic/profiles/sequent-lj/index.ts:628`

Devuelve `true` si el árbol de derivación contiene alguna aplicación de la regla cut.

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

> Function · `logic/profiles/sequent-lj/index.ts:769`

Elimina cortes de una derivación LJ (Hauptsatz de Gentzen).
Usa reducciones principales para los casos estructurales y el prover
cut-free como oráculo para los casos permutativos restantes.

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

> Function · `logic/profiles/sequent-lj/index.ts:834`

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

> Function · `logic/profiles/sequent-lj/index.ts:854`

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

> Function · `logic/profiles/sequent-lj/index.ts:946`

```ts
export function glivenkoEmbed(formula: LJFormula): LJFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `LJFormula` | no |  |

### Returns

`LJFormula` — 

