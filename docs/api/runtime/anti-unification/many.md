# `runtime/anti-unification/many.ts`

============================================================ ST Anti-Unification — n-way lgg ============================================================ La anti-unification se generaliza a n términos plegando con la versión binaria:   lgg(t1, t2, ..., tn) = lgg(lgg(...lgg(t1, t2)..., tn-1), tn) Plotkin demostró que lgg es asociativo y conmutativo módulo renombre de variables: el orden del pliegue no cambia la generalización resultante (salvo nombres de variables). Sin embargo, las substLeft/substRight intermedias acumulan información, así que para el resultado n-ario devolvemos:   - generalization: el lgg de los n términos.   - variables:      las fresh vars introducidas.   - substLeft, substRight: aquí pierden sentido binario; en el     resultado n-ario los reusamos para el PRIMER y ÚLTIMO término     respectivamente. Para acceso completo, los clientes deberían     re-derivar `match(generalization, ti)` para cada i. Para conservar acceso completo a las n sustituciones, exponemos también `antiUnifyManyDetailed` que devuelve un array de mapas.

## Contents

- [`AntiUnificationManyResult`](#antiunificationmanyresult) — Interface
- [`antiUnifyMany`](#antiunifymany) — Function
- [`antiUnifyManyDetailed`](#antiunifymanydetailed) — Function
- [`generalizationOrder`](#generalizationorder) — Function

## `AntiUnificationManyResult`

> Interface · `runtime/anti-unification/many.ts:37`

Variante "detailed" del n-way lgg.

Devuelve la generalización y un array `substs` de longitud n tal
que substs[i] aplicada al generalization reproduce el término i.

```ts
export interface AntiUnificationManyResult
```


## `antiUnifyMany`

> Function · `runtime/anti-unification/many.ts:49`

Anti-unification n-aria. Reduce con la versión binaria.

Para n=0 lanza error (no hay generalización sensata).
Para n=1 devuelve el término sin variables nuevas.

```ts
export function antiUnifyMany(terms: Term[], freshSupply?: FreshSupply): AntiUnificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `terms` | `Term[]` | no |  |
| `freshSupply` | `FreshSupply` | yes |  |

### Returns

`AntiUnificationResult` — 


## `antiUnifyManyDetailed`

> Function · `runtime/anti-unification/many.ts:98`

Versión "detailed" — devuelve las n sustituciones independientes.

Esta es la forma más útil para clientes que quieren ver cómo se
instancia cada uno de los n términos desde la generalización.

```ts
export function antiUnifyManyDetailed( terms: Term[], freshSupply?: FreshSupply, ): AntiUnificationManyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `terms` | `Term[]` | no |  |
| `freshSupply` | `FreshSupply` | yes |  |

### Returns

`AntiUnificationManyResult` — 


## `generalizationOrder`

> Function · `runtime/anti-unification/many.ts:181`

Orden de generalidad entre dos términos.

Definición: g1 ≤ g2 ⇔ existe sustitución σ con σ(g1) = g2.
Es decir, g1 es MÁS GENERAL que g2 (g2 es una instancia de g1).

Resultados:
  - -1  si g1 es ESTRICTAMENTE más general que g2 (g1 < g2 en
        generalidad inversa — equivalente: σ(g1)=g2 pero no
        σ'(g2)=g1).
  -  0  si son equivalentes módulo renombre (cada uno instancia
        del otro vía sustitución de variables).
  - +1  si g2 es estrictamente más general que g1.
  - null si son INCOMPARABLES (no hay σ en ningún sentido).

Nota: la convención del usuario en la spec es
  generalizationOrder(X, f(X)) → -1 (X más general).
Esto es coherente: X es más general que f(X), y devolvemos -1.

```ts
export function generalizationOrder(g1: Term, g2: Term): -1 | 0 | 1 | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `g1` | `Term` | no |  |
| `g2` | `Term` | no |  |

### Returns

`-1 \| 0 \| 1 \| null` — 

