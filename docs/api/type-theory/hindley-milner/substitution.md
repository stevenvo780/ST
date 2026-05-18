# `type-theory/hindley-milner/substitution.ts`

============================================================ Hindley-Milner — Sustituciones, unificación, fresh vars ============================================================ Sustitución σ : tvar → Type. Aplicar σ a un tipo reemplaza las variables libres que aparezcan en su dominio. composeSubsts(s1, s2) calcula s1 ∘ s2 : primero aplica s2, luego s1. El truco habitual es:    (s1 ∘ s2)(α) = s1 (s2 α) Implementado como: aplicar s1 a los valores de s2, y añadir las entradas de s1 que s2 no tocó. Unificación es la unificación de primer orden Robinson, con occurs-check para impedir tipos infinitos (`α ≡ α → α` falla).

## Contents

- [`Substitution`](#substitution) — Type
- [`emptySubst`](#emptysubst) — Const
- [`applySubst`](#applysubst) — Function
- [`applySubstScheme`](#applysubstscheme) — Function
- [`composeSubsts`](#composesubsts) — Function
- [`resetFreshSupply`](#resetfreshsupply) — Function
- [`freshTypeVar`](#freshtypevar) — Function
- [`occursIn`](#occursin) — Function
- [`UnifyResult`](#unifyresult) — Type
- [`isUnifyError`](#isunifyerror) — Function
- [`unify`](#unify) — Function
- [`generalize`](#generalize) — Function
- [`instantiate`](#instantiate) — Function

## `Substitution`

> Type · `type-theory/hindley-milner/substitution.ts:22`

```ts
export type Substitution = Map<string, Type>;
```


## `emptySubst`

> Const · `type-theory/hindley-milner/substitution.ts:24`

```ts
const emptySubst
```


## `applySubst`

> Function · `type-theory/hindley-milner/substitution.ts:26`

```ts
export function applySubst(t: Type, s: Substitution): Type
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `Type` | no |  |
| `s` | `Substitution` | no |  |

### Returns

`Type` — 


## `applySubstScheme`

> Function · `type-theory/hindley-milner/substitution.ts:58`

```ts
export function applySubstScheme(sc: TypeScheme, s: Substitution): TypeScheme
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sc` | `TypeScheme` | no |  |
| `s` | `Substitution` | no |  |

### Returns

`TypeScheme` — 


## `composeSubsts`

> Function · `type-theory/hindley-milner/substitution.ts:70`

```ts
export function composeSubsts(s1: Substitution, s2: Substitution): Substitution
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s1` | `Substitution` | no |  |
| `s2` | `Substitution` | no |  |

### Returns

`Substitution` — 


## `resetFreshSupply`

> Function · `type-theory/hindley-milner/substitution.ts:85`

```ts
export function resetFreshSupply(): void
```

### Returns

`void` — 


## `freshTypeVar`

> Function · `type-theory/hindley-milner/substitution.ts:89`

```ts
export function freshTypeVar(prefix = 't'): Type
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `prefix` | `any` | yes |  |

### Returns

`Type` — 


## `occursIn`

> Function · `type-theory/hindley-milner/substitution.ts:97`

```ts
export function occursIn(name: string, t: Type): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `t` | `Type` | no |  |

### Returns

`boolean` — 


## `UnifyResult`

> Type · `type-theory/hindley-milner/substitution.ts:113`

```ts
export type UnifyResult = Substitution | { error: string };
```


## `isUnifyError`

> Function · `type-theory/hindley-milner/substitution.ts:115`

```ts
export function isUnifyError(r: UnifyResult): r is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `r` | `UnifyResult` | no |  |

### Returns

`r is { error: string }` — 


## `unify`

> Function · `type-theory/hindley-milner/substitution.ts:119`

```ts
export function unify(t1: Type, t2: Type): UnifyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Type` | no |  |
| `t2` | `Type` | no |  |

### Returns

`UnifyResult` — 


## `generalize`

> Function · `type-theory/hindley-milner/substitution.ts:192`

```ts
export function generalize(envFreeVars: Set<string>, t: Type): TypeScheme
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `envFreeVars` | `Set<string>` | no |  |
| `t` | `Type` | no |  |

### Returns

`TypeScheme` — 


## `instantiate`

> Function · `type-theory/hindley-milner/substitution.ts:203`

```ts
export function instantiate(sc: TypeScheme): Type
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sc` | `TypeScheme` | no |  |

### Returns

`Type` — 

