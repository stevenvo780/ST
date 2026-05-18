# `type-theory/cubical/path-algebra.ts`

============================================================ Cubical — Álgebra de caminos sobre el intervalo ============================================================ Operaciones de alto nivel para construir caminos cúbicos sin tocar el AST manualmente. Las identidades estándar:   reflPath x       ≡ λi. x   pathInverse p    ≡ λi. p @ (~ i)   pathCompose p q  : composición vía hcomp (aquí: encadenamiento                      sintáctico — primer paso pedagógico). `glue` se importa de types pero lo re-exportamos como función de alto nivel firmada igual que en la misión.

## Contents

- [`reflPath`](#reflpath) — Function
- [`pathInverse`](#pathinverse) — Function
- [`pathCompose`](#pathcompose) — Function
- [`glue`](#glue) — Function

## `reflPath`

> Function · `type-theory/cubical/path-algebra.ts:19`

```ts
export function reflPath(x: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 


## `pathInverse`

> Function · `type-theory/cubical/path-algebra.ts:24`

```ts
export function pathInverse(p: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 


## `pathCompose`

> Function · `type-theory/cubical/path-algebra.ts:33`

```ts
export function pathCompose(p: CubicalTerm, q: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `CubicalTerm` | no |  |
| `q` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 


## `glue`

> Function · `type-theory/cubical/path-algebra.ts:59`

Glue: convierte una equivalencia A ≃ B (codificada como par Σ con
dominio y codominio) en un Path en el universo. Es el precursor
sintáctico de la computación de ua en CTT — aquí no implementamos
la regla de cómputo full, sólo la introducción del término.

```ts
export function glue(equiv: CubicalTerm, partial: CubicalTerm): CubicalTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `equiv` | `CubicalTerm` | no |  |
| `partial` | `CubicalTerm` | no |  |

### Returns

`CubicalTerm` — 

