# `reasoning/game-theory/support-enumeration.ts`

============================================================ Support enumeration — algoritmo para enumerar TODOS los Nash equilibria de un juego 2-player. ============================================================ Idea (Dickhaut–Kaplan, generalizado): un equilibrio mixto está soportado por dos subconjuntos S_1 ⊆ [n], S_2 ⊆ [m] de igual cardinalidad (por el Lemma de complementariedad). Para cada par (S_1, S_2) del mismo tamaño k:   - jugador 1 mezcla solo en S_1 con probs p_i (i ∈ S_1)   - jugador 2 mezcla solo en S_2 con probs q_j (j ∈ S_2)   - p, q deben volver indiferente al rival en su soporte:       sum_i p_i * a[i][j]  = u_2  para todo j ∈ S_2       sum_j q_j * a'[i][j] = u_1  para todo i ∈ S_1     (donde a' = pagos de player 1, a = pagos de player 2)   - p, q ≥ 0, suman 1   - mejores fuera del soporte no deben superar el pago de equilibrio Resolvemos el sistema lineal y filtramos. Para juegos chicos (n*m ≤ ~10) la enumeración es trivial: 2^n * 2^m subsets.

## `enumerateAllNash`

> Function · `reasoning/game-theory/support-enumeration.ts:29`

```ts
export function enumerateAllNash(game: NormalFormGame, maxSize?: number): NashEquilibrium[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `maxSize` | `number` | yes |  |

### Returns

`NashEquilibrium[]` — 

