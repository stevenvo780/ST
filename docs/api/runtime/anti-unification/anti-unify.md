# `runtime/anti-unification/anti-unify.ts`

============================================================ ST Anti-Unification — Algoritmo de Plotkin (lgg) ============================================================ Algoritmo (Plotkin 1970):   au(t1, t2, table):     si t1 ≡ t2 estructuralmente:       return t1     si ambos son func/const con mismo nombre y misma aridad:       return func(name, [au(t1.args[i], t2.args[i]) for i])     // desacuerdo: introducimos fresh var, reusando si ya existe     // una asignada al MISMO par (t1, t2) — esto es clave para que     // la generalización sea LEAST (most specific).     si table tiene (t1, t2) → v entonces return v     v := freshSupply()     table[(t1, t2)] := v     return v La tabla de correspondencias se mantiene globalmente durante la recursión para que múltiples ocurrencias del mismo desacuerdo reciban la misma fresh var. Sin esta tabla obtendríamos una generalización menos específica (e.g., au(p(a,a), p(b,b)) daría p(X, Y) en vez de p(X, X)).

## Contents

- [`defaultFreshSupply`](#defaultfreshsupply) — Function
- [`antiUnify`](#antiunify) — Function

## `defaultFreshSupply`

> Function · `runtime/anti-unification/anti-unify.ts:35`

Fuente default de variables frescas: _g0, _g1, _g2, …

Se devuelve una NUEVA instancia por llamada para evitar estado
compartido entre invocaciones de antiUnify.

```ts
export function defaultFreshSupply(prefix: string = '_g'): FreshSupply
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `prefix` | `string` | yes |  |

### Returns

`FreshSupply` — 


## `antiUnify`

> Function · `runtime/anti-unification/anti-unify.ts:52`

Anti-unification de dos términos.

Devuelve el lgg (least general generalization) junto con las
sustituciones de izquierda y derecha que reconstruyen los
términos originales.

Complejidad: O(|t1| + |t2|) tiempo si la tabla se implementa con
hashing O(1). Usamos `termKey` que serializa, así que es
O((|t1| + |t2|)·k) donde k es el tamaño del subtérmino más grande
que aparezca en un desacuerdo.

```ts
export function antiUnify(t1: Term, t2: Term, freshSupply?: FreshSupply): AntiUnificationResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `Term` | no |  |
| `t2` | `Term` | no |  |
| `freshSupply` | `FreshSupply` | yes |  |

### Returns

`AntiUnificationResult` — 

