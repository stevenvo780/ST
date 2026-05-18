# `type-theory/system-f/reduce.ts`

============================================================ System F — β-reducción + type-β ============================================================ Reglas:   (λx:T. M) N      ↦  M[x := N]            (β a nivel término)   (Λ X. M) [T]     ↦  M[X := T]            (type-β) Estrategia: leftmost-outermost (call-by-name) en términos y tipos. `reduceBeta` aplica UN paso (devuelve el mismo término por identidad referencial si no había redex). `normalize` itera hasta forma normal con guardia anti-loop.

## Contents

- [`freeVars`](#freevars) — Function
- [`termTypeVars`](#termtypevars) — Function
- [`substType`](#substtype) — Function
- [`substTypeInTerm`](#substtypeinterm) — Function
- [`substTerm`](#substterm) — Function
- [`reduceBeta`](#reducebeta) — Function
- [`isNormal`](#isnormal) — Function
- [`NormalizeResult`](#normalizeresult) — Interface
- [`normalize`](#normalize) — Function

## `freeVars`

> Function · `type-theory/system-f/reduce.ts:18`

```ts
export function freeVars(t: FTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `termTypeVars`

> Function · `type-theory/system-f/reduce.ts:45`

```ts
export function termTypeVars(t: FTerm, acc: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `FTerm` | no |  |
| `acc` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 


## `substType`

> Function · `type-theory/system-f/reduce.ts:78`

```ts
export function substType(target: FType, name: string, replacement: FType): FType
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `target` | `FType` | no |  |
| `name` | `string` | no |  |
| `replacement` | `FType` | no |  |

### Returns

`FType` — 


## `substTypeInTerm`

> Function · `type-theory/system-f/reduce.ts:104`

```ts
export function substTypeInTerm(term: FTerm, name: string, replacement: FType): FTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |
| `name` | `string` | no |  |
| `replacement` | `FType` | no |  |

### Returns

`FTerm` — 


## `substTerm`

> Function · `type-theory/system-f/reduce.ts:142`

```ts
export function substTerm(term: FTerm, name: string, value: FTerm): FTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |
| `name` | `string` | no |  |
| `value` | `FTerm` | no |  |

### Returns

`FTerm` — 


## `reduceBeta`

> Function · `type-theory/system-f/reduce.ts:198`

```ts
export function reduceBeta(term: FTerm): FTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |

### Returns

`FTerm` — 


## `isNormal`

> Function · `type-theory/system-f/reduce.ts:234`

```ts
export function isNormal(term: FTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |

### Returns

`boolean` — 


## `NormalizeResult`

> Interface · `type-theory/system-f/reduce.ts:238`

```ts
export interface NormalizeResult
```


## `normalize`

> Function · `type-theory/system-f/reduce.ts:244`

```ts
export function normalize(term: FTerm, maxSteps = 1000): NormalizeResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `term` | `FTerm` | no |  |
| `maxSteps` | `any` | yes |  |

### Returns

`NormalizeResult` — 

