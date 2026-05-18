# `reasoning/game-theory/pure-nash.ts`

============================================================ Pure-strategy Nash equilibria ============================================================ Un perfil puro (s_1, ..., s_n) es Nash sii cada s_i es best response del jugador i contra (s_{-i}). Lo verificamos enumerando todos los perfiles y comprobando la condición.

## `findPureNash`

> Function · `reasoning/game-theory/pure-nash.ts:18`

```ts
export function findPureNash(game: NormalFormGame): NashEquilibrium[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |

### Returns

`NashEquilibrium[]` — 

