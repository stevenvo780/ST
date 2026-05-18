# `type-theory/lambda-cube/erase.ts`

============================================================ Lambda Cube — Erasure a λ-cálculo no tipado ============================================================ La función de borrado (erasure / type-erasure) traduce un término del cubo a un λ-término puro:   |x|            = x   |s|            = ⊥  (sorts no tienen representante runtime)   |λ x:A. b|     = λ x. |b|   |Π x:A. B|     = ⊥  (los Π son tipos, no se ejecutan)   |f a|          = |f| |a| El erasure preserva β: si `t →β t'` en el cubo entonces `|t| →β |t'|` en λ-untyped. Esa es la base de la "phase distinction" estándar de los sistemas de tipos polimórficos.

## Contents

- [`UntypedTerm`](#untypedterm) — Type
- [`EraseError`](#eraseerror) — Interface
- [`isEraseError`](#iseraseerror) — Function
- [`erase`](#erase) — Function
- [`untypedToString`](#untypedtostring) — Function

## `UntypedTerm`

> Type · `type-theory/lambda-cube/erase.ts:20`

```ts
export type UntypedTerm = | { kind: 'var'; name: string } | { kind: 'abs'; param: string; body: UntypedTerm } | { kind: 'app'; fn: UntypedTerm; arg: UntypedTerm };
```


## `EraseError`

> Interface · `type-theory/lambda-cube/erase.ts:25`

```ts
export interface EraseError
```


## `isEraseError`

> Function · `type-theory/lambda-cube/erase.ts:29`

```ts
export function isEraseError(r: UntypedTerm | EraseError): r is EraseError
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `UntypedTerm \| EraseError` | no |  |

### Returns

`r is EraseError` — 


## `erase`

> Function · `type-theory/lambda-cube/erase.ts:38`

Borrado total a λ-cálculo no tipado. Sorts y Π no tienen
representante runtime — si aparecen como sub-término principal,
el resultado es un error de borrado.

```ts
export function erase(term: CubeTerm): UntypedTerm | EraseError
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `CubeTerm` | no |  |

### Returns

`UntypedTerm \| EraseError` — 


## `untypedToString`

> Function · `type-theory/lambda-cube/erase.ts:62`

Serialización legible del λ-untyped.

```ts
export function untypedToString(t: UntypedTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `UntypedTerm` | no |  |

### Returns

`string` — 

