# `type-theory/lambda-calc/substitution.ts`

============================================================ λ-cálculo untyped — Variables libres, α-renombrado, sustitución capture-avoiding ============================================================

## Contents

- [`freeVars`](#freevars) — Function
- [`makeFreshSupply`](#makefreshsupply) — Function
- [`alphaRename`](#alpharename) — Function
- [`substitute`](#substitute) — Function

## `freeVars`

> Function · `type-theory/lambda-calc/substitution.ts:9`

```ts
export function freeVars(t: Term): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |

### Returns

`Set<string>` — 


## `makeFreshSupply`

> Function · `type-theory/lambda-calc/substitution.ts:53`

```ts
export function makeFreshSupply(seed = 0): () => string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `seed` | `any` | yes |  |

### Returns

`() => string` — 


## `alphaRename`

> Function · `type-theory/lambda-calc/substitution.ts:72`

```ts
export function alphaRename(t: Term, freshSupply: () => string): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `freshSupply` | `() => string` | no |  |

### Returns

`Term` — 


## `substitute`

> Function · `type-theory/lambda-calc/substitution.ts:94`

```ts
export function substitute(t: Term, varName: string, replacement: Term): Term
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Term` | no |  |
| `varName` | `string` | no |  |
| `replacement` | `Term` | no |  |

### Returns

`Term` — 

