# `logic/profiles/default-logic/entailment.ts`

============================================================ ST Default Logic (Reiter) — Entailment credulous/skeptical ============================================================

## Contents

- [`isInExtension`](#isinextension) — Function
- [`isSkepticallyEntailed`](#isskepticallyentailed) — Function
- [`isCredulouslyEntailed`](#iscredulouslyentailed) — Function

## `isInExtension`

> Function · `logic/profiles/default-logic/entailment.ts:9`

Comprueba si el literal está en la extensión dada.

```ts
export function isInExtension(formula: string, ext: Extension): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |
| `ext` | `Extension` | no |  |

### Returns

`boolean` — 


## `isSkepticallyEntailed`

> Function · `logic/profiles/default-logic/entailment.ts:18`

Entailment escéptico: el literal está en TODAS las extensiones.
Si la teoría no tiene extensiones, devuelve false (entailment vacuo
tampoco — la convención usual es no afirmar nada sin testigos).

```ts
export function isSkepticallyEntailed( formula: string, T: DefaultTheory, options: ComputeOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |
| `T` | `DefaultTheory` | no |  |
| `options` | `ComputeOptions` | yes |  |

### Returns

`boolean` — 


## `isCredulouslyEntailed`

> Function · `logic/profiles/default-logic/entailment.ts:32`

Entailment crédulo: el literal está en AL MENOS una extensión.

```ts
export function isCredulouslyEntailed( formula: string, T: DefaultTheory, options: ComputeOptions =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `string` | no |  |
| `T` | `DefaultTheory` | no |  |
| `options` | `ComputeOptions` | yes |  |

### Returns

`boolean` — 

