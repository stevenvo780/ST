# `solver/csp/builtins.ts`

============================================================ CSPs predefinidos: graph coloring y N-queens. ============================================================ Ambos se modelan como CSPs binarios estándar para que AC-3 sea directamente aplicable. ============================================================

## Contents

- [`graphColoring`](#graphcoloring) — Function
- [`nQueens`](#nqueens) — Function

## `graphColoring`

> Function · `solver/csp/builtins.ts:21`

k-coloreo de un grafo no dirigido.

Variables: nodos del grafo.
Dominios:  {0, 1, ..., numColors-1}.
Restricción binaria por arista (u, v): color(u) ≠ color(v).

Devuelve un mapeo nodo → color o `null` si el grafo no es
k-coloreable.

```ts
export function graphColoring( graph:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `graph` | `{ nodes: string[]; edges: Array<[string, string]> }` | no |  |
| `numColors` | `number` | no |  |

### Returns

`Map<string, number> \| null` — 


## `nQueens`

> Function · `solver/csp/builtins.ts:69`

N-queens. Modelo CSP estándar:
  Variables: row 0..n-1 (una reina por fila).
  Dominio: columna ∈ {0, ..., n-1}.
  Restricción binaria entre filas (i, j):
    col(i) ≠ col(j)            (no misma columna)
    |col(i) - col(j)| ≠ |i-j|  (no misma diagonal)

Devuelve un array `cols` donde `cols[r]` es la columna de la
reina en la fila r, o `null` si no hay solución (n=2, n=3).

```ts
export function nQueens(n: number): number[] | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`number[] \| null` — 

