# `reasoning/fca/lattice.ts`

============================================================ FCA — diagrama de Hasse del concept lattice. ============================================================ Para un conjunto B(K) de conceptos ordenado por inclusión de extent   (A1, B1) ≤ (A2, B2)  ⇔  A1 ⊆ A2 la relación de cobertura es:   c ≺ p  sii  c < p  y  no existe q con c < q < p. El "diagrama de Hasse" representa B(K) como un DAG con sólo las aristas de cobertura. Implementación O(|B(K)|² · |M|):   1. Por cada par (i, j) con i ≠ j, marcar i < j  ⇔  extent_i ⊊ extent_j.   2. Para cada arista i < j, ver si existe k con i < k < j; si no,      es cobertura. Para retículos de hasta unos pocos miles de conceptos esto es práctico; para tamaños mayores conviene un algoritmo dedicado (e.g. Lindig). ============================================================

## `lattice`

> Function · `reasoning/fca/lattice.ts:38`

Computa el diagrama de Hasse del concept lattice como lista de aristas
de cobertura `[child, parent]` (índices en `concepts`).

La orientación es de "específico" a "general":
  `[i, j]` significa `extent_i ⊊ extent_j` y la inclusión es inmediata.

```ts
export function lattice(concepts: FormalConcept[]): HasseLattice
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `concepts` | `FormalConcept[]` | no |  |

### Returns

`HasseLattice` — 

