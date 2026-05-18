# `proof-systems/proof-nets/types.ts`

============================================================ Proof Nets — Tipos para MLL (Multiplicative Linear Logic) ============================================================ Proof nets de Girard: representación gráfica de pruebas en linear logic sin "bureaucracy" de orden estructural. Para MLL puro sólo aparecen dos conectivos:   ⊗  (tensor)  — multiplicativo positivo   ⅋  (par)     — multiplicativo negativo Los átomos llevan polaridad explícita (A vs A⊥); la dualidad satisface (A⊥)⊥ = A, (A⊗B)⊥ = A⊥ ⅋ B⊥, (A⅋B)⊥ = A⊥ ⊗ B⊥. Un nodo del net es la ocurrencia de una fórmula en algún punto del grafo. Un link une nodos con la semántica habitual:   axiom    : dos nodos duales, frescos como hojas del net.   cut      : dos nodos duales, no aportan a la conclusión.   tensor   : tres nodos {premisa-izq, premisa-der, conclusión}.   par      : tres nodos {premisa-izq, premisa-der, conclusión}. Las conclusiones del net son los ids de los nodos que viven en el "borde": ni premisa de tensor/par, ni participan en un cut.

## Contents

- [`Polarity`](#polarity) — Type
- [`MLLFormula`](#mllformula) — Type
- [`LinkKind`](#linkkind) — Type
- [`ProofNetLink`](#proofnetlink) — Interface
- [`ProofNetNode`](#proofnetnode) — Interface
- [`ProofNet`](#proofnet) — Interface
- [`atomPos`](#atompos) — Const
- [`atomNeg`](#atomneg) — Const
- [`tensor`](#tensor) — Const
- [`par`](#par) — Const
- [`dual`](#dual) — Function
- [`formulaEquals`](#formulaequals) — Function
- [`formulaToString`](#formulatostring) — Function

## `Polarity`

> Type · `proof-systems/proof-nets/types.ts:25`

```ts
export type Polarity = 'pos' | 'neg';
```


## `MLLFormula`

> Type · `proof-systems/proof-nets/types.ts:27`

```ts
export type MLLFormula = | { kind: 'atom'; name: string; polarity: Polarity } | { kind: 'tensor'; left: MLLFormula; right: MLLFormula } | { kind: 'par'; left: MLLFormula; right: MLLFormula };
```


## `LinkKind`

> Type · `proof-systems/proof-nets/types.ts:32`

```ts
export type LinkKind = 'axiom' | 'cut' | 'tensor' | 'par';
```


## `ProofNetLink`

> Interface · `proof-systems/proof-nets/types.ts:39`

```ts
export interface ProofNetLink
```


## `ProofNetNode`

> Interface · `proof-systems/proof-nets/types.ts:44`

```ts
export interface ProofNetNode
```


## `ProofNet`

> Interface · `proof-systems/proof-nets/types.ts:49`

```ts
export interface ProofNet
```


## `atomPos`

> Const · `proof-systems/proof-nets/types.ts:57`

```ts
const atomPos
```


## `atomNeg`

> Const · `proof-systems/proof-nets/types.ts:63`

```ts
const atomNeg
```


## `tensor`

> Const · `proof-systems/proof-nets/types.ts:69`

```ts
const tensor
```


## `par`

> Const · `proof-systems/proof-nets/types.ts:75`

```ts
const par
```


## `dual`

> Function · `proof-systems/proof-nets/types.ts:82`

```ts
export function dual(f: MLLFormula): MLLFormula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `MLLFormula` | no |  |

### Returns

`MLLFormula` — 


## `formulaEquals`

> Function · `proof-systems/proof-nets/types.ts:93`

```ts
export function formulaEquals(a: MLLFormula, b: MLLFormula): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `MLLFormula` | no |  |
| `b` | `MLLFormula` | no |  |

### Returns

`boolean` — 


## `formulaToString`

> Function · `proof-systems/proof-nets/types.ts:106`

```ts
export function formulaToString(f: MLLFormula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `MLLFormula` | no |  |

### Returns

`string` — 

