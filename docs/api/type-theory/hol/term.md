# `type-theory/hol/term.ts`

============================================================ HOL — Operaciones sobre términos ============================================================ Type inference, α-equivalencia, sustitución capture-free, detección de variables libres, etc.

## Contents

- [`mkVar`](#mkvar) — Const
- [`mkConst`](#mkconst) — Const
- [`mkComb`](#mkcomb) — Const
- [`mkAbs`](#mkabs) — Const
- [`typeOf`](#typeof) — Function
- [`alphaEq`](#alphaeq) — Function
- [`freeVars`](#freevars) — Function
- [`occursFree`](#occursfree) — Function
- [`freshName`](#freshname) — Function
- [`substTerm`](#substterm) — Function
- [`instTypeInTerm`](#insttypeinterm) — Function
- [`termToString`](#termtostring) — Function
- [`eqConst`](#eqconst) — Function
- [`mkEq`](#mkeq) — Function
- [`destEq`](#desteq) — Function
- [`isEq`](#iseq) — Function
- [`isIff`](#isiff) — Function

## `mkVar`

> Const · `type-theory/hol/term.ts:22`

```ts
const mkVar
```


## `mkConst`

> Const · `type-theory/hol/term.ts:24`

```ts
const mkConst
```


## `mkComb`

> Const · `type-theory/hol/term.ts:26`

```ts
const mkComb
```


## `mkAbs`

> Const · `type-theory/hol/term.ts:45`

```ts
const mkAbs
```


## `typeOf`

> Function · `type-theory/hol/term.ts:58`

Calcula el tipo de un término bien formado. Lanza si el
término está mal tipado (combinación con dominios disjuntos).

```ts
export function typeOf(t: HOLTerm): HOLType
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`HOLType` — 


## `alphaEq`

> Function · `type-theory/hol/term.ts:90`

Igualdad estructural módulo α-renaming. Implementación con
dos mapas de profundidad (de Bruijn implícito sobre nombres).

```ts
export function alphaEq(a: HOLTerm, b: HOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `HOLTerm` | no |  |
| `b` | `HOLTerm` | no |  |

### Returns

`boolean` — 


## `freeVars`

> Function · `type-theory/hol/term.ts:152`

Devuelve las variables libres de `t` con su tipo. Una variable
con mismo nombre pero distinto tipo aparece dos veces.

```ts
export function freeVars(t: HOLTerm, out: VarEntry[] = []): VarEntry[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |
| `out` | `VarEntry[]` | yes |  |

### Returns

`VarEntry[]` — 


## `occursFree`

> Function · `type-theory/hol/term.ts:186`

Devuelve true si `name` aparece libre en `term` con tipo `ty`.

```ts
export function occursFree(name: string, ty: HOLType, term: HOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `ty` | `HOLType` | no |  |
| `term` | `HOLTerm` | no |  |

### Returns

`boolean` — 


## `freshName`

> Function · `type-theory/hol/term.ts:191`

Genera un nombre fresco respecto a un conjunto de nombres prohibidos.

```ts
export function freshName(base: string, forbidden: Set<string>): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `base` | `string` | no |  |
| `forbidden` | `Set<string>` | no |  |

### Returns

`string` — 


## `substTerm`

> Function · `type-theory/hol/term.ts:204`

Sustituye [v := value] en `term`. Renombra binders si haría
falta para evitar captura. `v` se identifica por nombre + tipo.

```ts
export function substTerm(name: string, ty: HOLType, value: HOLTerm, term: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `name` | `string` | no |  |
| `ty` | `HOLType` | no |  |
| `value` | `HOLTerm` | no |  |
| `term` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `instTypeInTerm`

> Function · `type-theory/hol/term.ts:304`

```ts
export function instTypeInTerm(subst: Record<string, HOLType>, term: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `subst` | `Record<string, HOLType>` | no |  |
| `term` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `termToString`

> Function · `type-theory/hol/term.ts:328`

```ts
export function termToString(t: HOLTerm): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`string` — 


## `eqConst`

> Function · `type-theory/hol/term.ts:347`

Constructor de igualdad polimórfica `= : α → α → bool`.
Devuelve la `const` `=` instanciada al tipo del término.

```ts
export function eqConst(ty: HOLType): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `ty` | `HOLType` | no |  |

### Returns

`HOLTerm` — 


## `mkEq`

> Function · `type-theory/hol/term.ts:352`

Construye el término `l = r` (chequea que sus tipos coincidan).

```ts
export function mkEq(l: HOLTerm, r: HOLTerm): HOLTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `l` | `HOLTerm` | no |  |
| `r` | `HOLTerm` | no |  |

### Returns

`HOLTerm` — 


## `destEq`

> Function · `type-theory/hol/term.ts:361`

Descompone `l = r` en `[l, r]` o null si no es igualdad.

```ts
export function destEq(t: HOLTerm): [HOLTerm, HOLTerm] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`[HOLTerm, HOLTerm] \| null` — 


## `isEq`

> Function · `type-theory/hol/term.ts:371`

True si `t` es una igualdad de la forma `l = r`.

```ts
export function isEq(t: HOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`boolean` — 


## `isIff`

> Function · `type-theory/hol/term.ts:376`

True si `t` es una bi-implicación bool ↔ bool (sintácticamente `=` sobre bool).

```ts
export function isIff(t: HOLTerm): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t` | `HOLTerm` | no |  |

### Returns

`boolean` — 

