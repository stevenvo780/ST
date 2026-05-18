# `semantics/categorical/functor.ts`

============================================================ ST Categorical — Functor y NaturalTransformation ============================================================ Wrappers genéricos para construir functores entre categorías arbitrarias y verificar sus leyes vía muestreo sobre los morfismos del dominio. ============================================================

## Contents

- [`mkFunctor`](#mkfunctor) — Function
- [`identityFunctor`](#identityfunctor) — Function
- [`composeFunctors`](#composefunctors) — Function
- [`mkNaturalTransformation`](#mknaturaltransformation) — Function
- [`identityNT`](#identitynt) — Function

## `mkFunctor`

> Function · `semantics/categorical/functor.ts:16`

Crea un functor verificable. El cliente pasa los mapeos a
objetos/morfismos; las verificaciones de leyes se derivan
recorriendo los `morphisms` de la categoría fuente.

```ts
export function mkFunctor<O1, M1, O2, M2>(opts:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `opts` | `{   name: string;   source: Category<O1, M1>;   target: Category<O2, M2>;   onObjects: (o: O1) => O2;   onMorphisms: (m: M1) => M2; }` | no |  |

### Returns

`Functor<O1, M1, O2, M2>` — 


## `identityFunctor`

> Function · `semantics/categorical/functor.ts:68`

Functor identidad `Id_C : C → C`. Útil para tests y como elemento
neutro de la composición de functores.

```ts
export function identityFunctor<O, M>(cat: Category<O, M>): Functor<O, M, O, M>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `cat` | `Category<O, M>` | no |  |

### Returns

`Functor<O, M, O, M>` — 


## `composeFunctors`

> Function · `semantics/categorical/functor.ts:82`

Composición de functores F ; G = G ∘ F. La firma respeta la
categoría source/target original sin perder información de tipos.

```ts
export function composeFunctors<O1, M1, O2, M2, O3, M3>( G: Functor<O2, M2, O3, M3>, F: Functor<O1, M1, O2, M2>, ): Functor<O1, M1, O3, M3>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `G` | `Functor<O2, M2, O3, M3>` | no |  |
| `F` | `Functor<O1, M1, O2, M2>` | no |  |

### Returns

`Functor<O1, M1, O3, M3>` — 


## `mkNaturalTransformation`

> Function · `semantics/categorical/functor.ts:105`

Crea una transformación natural η : F ⇒ G verificando su
naturalidad por muestreo. El cliente pasa la familia de
componentes `component(a) : F(a) → G(a)`.

```ts
export function mkNaturalTransformation<O1, M1, O2, M2>(opts:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `opts` | `{   name: string;   source: Functor<O1, M1, O2, M2>;   target: Functor<O1, M1, O2, M2>;   component: (o: O1) => M2; }` | no |  |

### Returns

`NaturalTransformation<O1, M1, O2, M2>` — 


## `identityNT`

> Function · `semantics/categorical/functor.ts:144`

Transformación natural identidad `id_F : F ⇒ F` con componentes
`id_{F(a)}`. Sirve como elemento neutro de composición vertical.

```ts
export function identityNT<O1, M1, O2, M2>( F: Functor<O1, M1, O2, M2>, ): NaturalTransformation<O1, M1, O2, M2>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `F` | `Functor<O1, M1, O2, M2>` | no |  |

### Returns

`NaturalTransformation<O1, M1, O2, M2>` — 

