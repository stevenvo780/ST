# `solver/csp/ac3.ts`

============================================================ AC-3 — Arc Consistency #3 (Mackworth, 1977). ============================================================ Mantiene la consistencia de arco binaria: para cada arco (Xi, Xj) y para cada valor v ∈ D(Xi), debe existir al menos un valor w ∈ D(Xj) tal que la restricción binaria entre Xi y Xj acepte la tupla (v, w). Si no existe, v se elimina de D(Xi). Complejidad: O(e · d³) donde e = # de restricciones binarias y d = tamaño máximo de dominio. Suficientemente rápido para CSPs de tamaño moderado (sudoku, n-queens, coloreo de grafos). Las restricciones n-arias (n > 2) NO participan en AC-3: sólo se contraen las binarias. Las n-arias se chequean en backtracking. ============================================================

## Contents

- [`ac3`](#ac3) — Function
- [`ac3InPlace`](#ac3inplace) — Function

## `ac3`

> Function · `solver/csp/ac3.ts:87`

Aplica AC-3 sobre una copia de los dominios del CSP.
Devuelve { consistent, reducedDomains }: si `consistent` es false,
el CSP es UNSAT por consistencia de arco (algún dominio quedó vacío).

La firma deja los dominios originales intactos: el caller decide si
adoptar `reducedDomains` o conservar los originales.

```ts
export function ac3<V, D>( csp: CSP<V, D>, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `csp` | `CSP<V, D>` | no |  |

### Returns

`{   consistent: boolean;   reducedDomains: Map<V, D[]>; }` — 


## `ac3InPlace`

> Function · `solver/csp/ac3.ts:136`

Helper público para uso en backtracking incremental: aplica AC-3
sobre un set de dominios ya provisto (mutación in-place permitida)
y devuelve `true` si los dominios siguen consistentes.

```ts
export function ac3InPlace<V, D>(csp: CSP<V, D>, domains: Map<V, D[]>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `csp` | `CSP<V, D>` | no |  |
| `domains` | `Map<V, D[]>` | no |  |

### Returns

`boolean` — 

