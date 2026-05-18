# `type-theory/hol/type-system.ts`

============================================================ HOL — Sistema de tipos ============================================================ Tipos simples polimórficos: variables de tipo, constantes y aplicaciones. La función `fun(A, B)` representa el flecha.

## Contents

- [`tvar`](#tvar) — Const
- [`tconst`](#tconst) — Const
- [`tapp`](#tapp) — Const
- [`TyBool`](#tybool) — Const
- [`TyInd`](#tyind) — Const
- [`funTy`](#funty) — Const
- [`funTyN`](#funtyn) — Const
- [`typeEq`](#typeeq) — Function
- [`isFunType`](#isfuntype) — Function
- [`funDomain`](#fundomain) — Function
- [`funCodomain`](#funcodomain) — Function
- [`typeToString`](#typetostring) — Function
- [`substType`](#substtype) — Function
- [`freeTypeVars`](#freetypevars) — Function

## `tvar`

> Const · `type-theory/hol/type-system.ts:11`

Construye una variable de tipo `α`, `β`, etc.

```ts
const tvar
```


## `tconst`

> Const · `type-theory/hol/type-system.ts:14`

Constante de tipo: `bool`, `ind`, ...

```ts
const tconst
```


## `tapp`

> Const · `type-theory/hol/type-system.ts:17`

Aplicación de constructor de tipo (e.g. `fun`, `prod`).

```ts
const tapp
```


## `TyBool`

> Const · `type-theory/hol/type-system.ts:21`

```ts
const TyBool: HOLType
```


## `TyInd`

> Const · `type-theory/hol/type-system.ts:22`

```ts
const TyInd: HOLType
```


## `funTy`

> Const · `type-theory/hol/type-system.ts:25`

`A → B`

```ts
const funTy
```


## `funTyN`

> Const · `type-theory/hol/type-system.ts:28`

Empareja `A → B → ...` de derecha a izquierda.

```ts
const funTyN
```


## `typeEq`

> Function · `type-theory/hol/type-system.ts:46`

Igualdad estructural de tipos. Las variables de tipo se
comparan por nombre (no hay α-renaming sobre tipos en HOL).

```ts
export function typeEq(a: HOLType, b: HOLType): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HOLType` | no |  |
| `b` | `HOLType` | no |  |

### Returns

`boolean` — 


## `isFunType`

> Function · `type-theory/hol/type-system.ts:66`

Devuelve true si `t` es una flecha `A → B`.

```ts
export function isFunType(t: HOLType): t is
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLType` | no |  |

### Returns

`t is { kind: 'tapp'; fn: 'fun'; args: HOLType[] }` — 


## `funDomain`

> Function · `type-theory/hol/type-system.ts:71`

Dominio de una flecha. Lanza si el tipo no es flecha.

```ts
export function funDomain(t: HOLType): HOLType
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLType` | no |  |

### Returns

`HOLType` — 


## `funCodomain`

> Function · `type-theory/hol/type-system.ts:79`

Codominio de una flecha. Lanza si el tipo no es flecha.

```ts
export function funCodomain(t: HOLType): HOLType
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLType` | no |  |

### Returns

`HOLType` — 


## `typeToString`

> Function · `type-theory/hol/type-system.ts:87`

Pretty-printer; útil para mensajes de error y tests.

```ts
export function typeToString(t: HOLType): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLType` | no |  |

### Returns

`string` — 


## `substType`

> Function · `type-theory/hol/type-system.ts:105`

Sustitución sobre variables de tipo. Aplica `subst` a `t`
de manera capture-free (los tipos no tienen binders).

```ts
export function substType(subst: Record<string, HOLType>, t: HOLType): HOLType
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `subst` | `Record<string, HOLType>` | no |  |
| `t` | `HOLType` | no |  |

### Returns

`HOLType` — 


## `freeTypeVars`

> Function · `type-theory/hol/type-system.ts:120`

Recolecta los nombres de las variables de tipo libres en `t`.

```ts
export function freeTypeVars(t: HOLType, out: Set<string> = new Set()): Set<string>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLType` | no |  |
| `out` | `Set<string>` | yes |  |

### Returns

`Set<string>` — 

