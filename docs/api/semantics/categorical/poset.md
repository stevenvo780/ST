# `semantics/categorical/poset.ts`

============================================================ ST Categorical — Poset como categoría ============================================================ Un poset (P, ≤) genera una categoría con un único morfismo a→b por cada par (a, b) tal que a ≤ b. La identidad es a ≤ a y la composición es transitividad. Reflexividad y transitividad están validadas por construcción. ============================================================

## Contents

- [`PosetMor`](#posetmor) — Interface
- [`Poset`](#poset) — Function

## `PosetMor`

> Interface · `semantics/categorical/poset.ts:13`

Morfismo del poset: par origen/destino. Único entre dos objetos.

```ts
export interface PosetMor
```


## `Poset`

> Function · `semantics/categorical/poset.ts:24`

Construye la categoría poset. `elements` define los objetos y
`leq` los pares a≤b explícitos. La clausura reflexivo-transitiva
se calcula y se realiza como morfismos del Category resultante.

```ts
export function Poset( elements: ReadonlyArray<string>, leq: ReadonlyArray<readonly [string, string]>, ): Category<string, PosetMor>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `elements` | `ReadonlyArray<string>` | no |  |
| `leq` | `ReadonlyArray<readonly [string, string]>` | no |  |

### Returns

`Category<string, PosetMor>` — 

