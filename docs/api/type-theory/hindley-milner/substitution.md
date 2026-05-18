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

> Type · `type-theory/hindley-milner/substitution.ts:23`

Sustitución de variables de tipo: mapea nombre de tvar → Type.

```ts
export type Substitution = Map<string, Type>;
```


## `emptySubst`

> Const · `type-theory/hindley-milner/substitution.ts:26`

Crea una sustitución vacía (identidad).

```ts
const emptySubst
```


## `applySubst`

> Function · `type-theory/hindley-milner/substitution.ts:32`

Aplica la sustitución `s` al tipo `t`, siguiendo cadenas de tvars.
Si `s` está vacía retorna `t` sin copiar.

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

> Function · `type-theory/hindley-milner/substitution.ts:68`

Aplica `s` a un esquema de tipos, evitando sustituir las variables
ligadas por el cuantificador ∀.

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

> Function · `type-theory/hindley-milner/substitution.ts:85`

Composición `s1 ∘ s2`: primero aplica `s2`, luego `s1`.
Implementado como: aplicar `s1` a los valores de `s2` y luego añadir
las entradas de `s1` que `s2` no tocó.

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

> Function · `type-theory/hindley-milner/substitution.ts:101`

Reinicia el contador global de variables frescas (útil para tests reproducibles).

```ts
export function resetFreshSupply(): void
```

### Returns

`void` — 


## `freshTypeVar`

> Function · `type-theory/hindley-milner/substitution.ts:109`

Genera una nueva variable de tipo con nombre `prefix0`, `prefix1`, …
El contador es global al módulo; usar `resetFreshSupply()` en tests.

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

> Function · `type-theory/hindley-milner/substitution.ts:121`

Comprueba si la variable `name` aparece en `t` como subtérmino.
Unificarlos sin este check crearía un tipo recursivo infinito.

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

> Type · `type-theory/hindley-milner/substitution.ts:138`

Resultado de unificación: sustitución MGU o descriptor de error.

```ts
export type UnifyResult = Substitution | { error: string };
```


## `isUnifyError`

> Function · `type-theory/hindley-milner/substitution.ts:141`

Type guard para detectar un resultado de error de unificación.

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

> Function · `type-theory/hindley-milner/substitution.ts:149`

Unificación de primer orden Robinson con occurs-check.

```ts
export function unify(t1: Type, t2: Type): UnifyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Type` | no |  |
| `t2` | `Type` | no |  |

### Returns

`UnifyResult` — La sustitución MGU `u` tal que `u(t1) ≡ u(t2)`, o `{ error }` si no unifica.


## `generalize`

> Function · `type-theory/hindley-milner/substitution.ts:227`

Generaliza `t` cerrando las variables libres que no están en el entorno.
Solo debe llamarse al tipar la RHS de un `let`.

```ts
export function generalize(envFreeVars: Set<string>, t: Type): TypeScheme
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `envFreeVars` | `Set<string>` | no | Variables libres presentes en el entorno actual. |
| `t` | `Type` | no |  |

### Returns

`TypeScheme` — 


## `instantiate`

> Function · `type-theory/hindley-milner/substitution.ts:242`

Abre un esquema polimórfico reemplazando cada cuantificador con una
variable de tipo fresca. Usada cuando se usa una variable polimórfica.

```ts
export function instantiate(sc: TypeScheme): Type
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `sc` | `TypeScheme` | no |  |

### Returns

`Type` — 

