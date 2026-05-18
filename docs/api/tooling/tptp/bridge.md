# `tooling/tptp/bridge.ts`

============================================================ TPTP — Bridge a fol-prover ============================================================ Convierte una TptpFormula al tipo `Formula` que entiende `src/fol-prover` (y por extensión los demás solvers FOL del repo). Mapeo:   atom p(t1,...,tn) → kind:'predicate', name:'p', params:[term-strings]   atom prop (sin args) → kind:'atom', name:prop   eq a b → kind:'equals', args:[a, b]  (consumido por fol-prover-equality)   neq a b → kind:'not', args:[ eq a b ]   ~F → kind:'not', args:[F]   F & G → kind:'and', args:[F,G]   F | G → kind:'or', args:[F,G]   F => G → kind:'implies', args:[F,G]   F <=> G → kind:'biconditional', args:[F,G]   F <~> G → ~(F <=> G)   ![X,Y]:F → forall X. forall Y. F   ?[X,Y]:F → exists X. exists Y. F   $true / $false → kind:'true' / kind:'false' `params`/`terms` en Formula es `string[]`; los términos no-variables (constantes/funciones) se serializan como string usando una convención estable: `f(a,b)`, `c`, `X`.

## Contents

- [`tptpFormulaToFol`](#tptpformulatofol) — Function
- [`FolProverBridgeOutput`](#folproverbridgeoutput) — Interface
- [`toFolProverFormat`](#tofolproverformat) — Function
- [`annotatedToFol`](#annotatedtofol) — Function

## `tptpFormulaToFol`

> Function · `tooling/tptp/bridge.ts:36`

```ts
export function tptpFormulaToFol(f: TptpFormula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `TptpFormula` | no |  |

### Returns

`Formula` — 


## `FolProverBridgeOutput`

> Interface · `tooling/tptp/bridge.ts:107`

```ts
export interface FolProverBridgeOutput
```


## `toFolProverFormat`

> Function · `tooling/tptp/bridge.ts:115`

```ts
export function toFolProverFormat(problem: TptpProblem): FolProverBridgeOutput
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `problem` | `TptpProblem` | no |  |

### Returns

`FolProverBridgeOutput` — 


## `annotatedToFol`

> Function · `tooling/tptp/bridge.ts:153`

Helper para `TptpAnnotated` individual.

```ts
export function annotatedToFol(a: TptpAnnotated): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `TptpAnnotated` | no |  |

### Returns

`Formula` — 

