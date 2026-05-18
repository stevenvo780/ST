# `reasoning/game-theory/lemke-howson.ts`

============================================================ Lemke-Howson — algoritmo de pivot para Nash de 2-player games ============================================================ Versión clásica con tableros. Idea:   - Normalizamos pagos para que sean estrictamente positivos     (sumando un constante grande). Esto no cambia los Nash.   - Trabajamos con dos sistemas en variables x ∈ R^n, y ∈ R^m     más slacks r ∈ R^n, s ∈ R^m:         B^T x + r = 1   con x ≥ 0, r ≥ 0         A   y + s = 1   con y ≥ 0, s ≥ 0     donde A es la matriz de pagos del jugador 1 (NxM) y B la     de pagos del jugador 2 (NxM).   - Cada variable tiene una "etiqueta" en {1..n+m}. En un     vértice completamente etiquetado (Nash), para cada label l     o bien la variable es no-básica (= 0) o su complemento lo es.   - Empezar en el vértice trivial (x=0, y=0; r=s=1) — todas las     etiquetas están "cubiertas" por las variables no-básicas.     Soltamos una etiqueta `startLabel` y pivotamos hasta volver     a un vértice completamente etiquetado. Este algoritmo encuentra UN equilibrio (no necesariamente todos). Cambiar `startLabel` puede llevar a equilibria distintos. Implementación pedagógica: O(n+m) pivotes en práctica. El soporte que ya teníamos (support enumeration) sirve para juegos chicos. Lemke-Howson es alternativa para tamaños medios o cuando uno quiere "algún" Nash rápido.

## `lemkeHowson`

> Function · `reasoning/game-theory/lemke-howson.ts:36`

```ts
export function lemkeHowson(game: NormalFormGame, startLabel = 0): NashEquilibrium | null
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `startLabel` | `any` | yes |  |

### Returns

`NashEquilibrium \| null` — 

