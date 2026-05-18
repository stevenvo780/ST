# `type-theory/hott/path-algebra.ts`

============================================================ HoTT — Álgebra de caminos (grupoide ∞) ============================================================ Operaciones de alto nivel para construir caminos sin tocar el AST directamente, con normalización inmediata de identidades (refl).

## Contents

- [`refl`](#refl) — Function
- [`pathInverse`](#pathinverse) — Function
- [`pathCompose`](#pathcompose) — Function
- [`isHEquivalence`](#ishequivalence) — Function
- [`UnivalenceWitness`](#univalencewitness) — Interface
- [`univalence`](#univalence) — Function
- [`univalenceWitness`](#univalencewitness) — Function

## `refl`

> Function · `type-theory/hott/path-algebra.ts:13`

```ts
export function refl(x: HoTTTerm): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `x` | `HoTTTerm` | no |  |

### Returns

`HoTTTerm` — 


## `pathInverse`

> Function · `type-theory/hott/path-algebra.ts:17`

```ts
export function pathInverse(path: HoTTTerm): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `path` | `HoTTTerm` | no |  |

### Returns

`HoTTTerm` — 


## `pathCompose`

> Function · `type-theory/hott/path-algebra.ts:25`

```ts
export function pathCompose(p: HoTTTerm, q: HoTTTerm): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `p` | `HoTTTerm` | no |  |
| `q` | `HoTTTerm` | no |  |

### Returns

`HoTTTerm` — 


## `isHEquivalence`

> Function · `type-theory/hott/path-algebra.ts:38`

Chequeo heurístico de h-equivalencia.
Una equivalencia verdadera requiere isContr de las fibras, que aquí
NO computamos. Aceptamos pares ⟨A, B⟩ : Σ Type. Type con A αβ= B
(equivalencia trivial), o cualquier término marcado explícitamente
con la estructura ⟨f, ⟨g, ⟨α, β⟩⟩⟩ y posponemos verificación.

```ts
export function isHEquivalence(f: HoTTTerm, ctx?: InferContextHoTT): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `HoTTTerm` | no |  |
| `ctx` | `InferContextHoTT` | yes |  |

### Returns

`boolean` — 


## `UnivalenceWitness`

> Interface · `type-theory/hott/path-algebra.ts:52`

```ts
export interface UnivalenceWitness
```


## `univalence`

> Function · `type-theory/hott/path-algebra.ts:62`

Postula un path desde una equivalencia. No es computacional:
normalizar `transport(P, ua(e), x)` no reduce — eso requiere
cubical type theory.

```ts
export function univalence(equiv: HoTTTerm): HoTTTerm
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `equiv` | `HoTTTerm` | no |  |

### Returns

`HoTTTerm` — 


## `univalenceWitness`

> Function · `type-theory/hott/path-algebra.ts:66`

```ts
export function univalenceWitness(equiv: HoTTTerm): UnivalenceWitness
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `equiv` | `HoTTTerm` | no |  |

### Returns

`UnivalenceWitness` — 

