# `type-theory/refinement-types/checker.ts`

============================================================ Refinement types — Type checker bidireccional ============================================================ El checker es bidireccional en el sentido estándar:   - synth : term → RefType    (inferir el tipo)   - check : term × RefType    (chequear contra un tipo esperado) Genera predicados de verificación (VCs) cuando es necesario:   - Aplicación: el argumento debe cumplir la precondición del parámetro.   - Anotación let: el valor debe cumplir el predicado anotado.   - Anotación contra `expected`: el tipo inferido debe ser subtipo. Las VCs se descargan con el solver acotado.

## Contents

- [`TypeCheckResult`](#typecheckresult) — Interface
- [`RCtx`](#rctx) — Type
- [`typeCheck`](#typecheck) — Function
- [`generateVC`](#generatevc) — Function

## `TypeCheckResult`

> Interface · `type-theory/refinement-types/checker.ts:29`

```ts
export interface TypeCheckResult
```


## `RCtx`

> Type · `type-theory/refinement-types/checker.ts:36`

```ts
export type RCtx = Map<string, RefType>;
```


## `typeCheck`

> Function · `type-theory/refinement-types/checker.ts:248`

typeCheck — API principal: chequea o sintetiza el tipo de `term`.
Si `expected` se provee, valida contra ese tipo.

```ts
export function typeCheck(term: RTerm, expected?: RefType, ctx: RCtx = new Map()): TypeCheckResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `RTerm` | no |  |
| `expected` | `RefType` | yes |  |
| `ctx` | `RCtx` | yes |  |

### Returns

`TypeCheckResult` — 


## `generateVC`

> Function · `type-theory/refinement-types/checker.ts:263`

generateVC — colecta los predicados que deben mantenerse para que
`term` sea bien tipado en `ctx`. Útil para inspección / debugging.

```ts
export function generateVC(term: RTerm, ctx: RCtx = new Map()): string[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `RTerm` | no |  |
| `ctx` | `RCtx` | yes |  |

### Returns

`string[]` — 

