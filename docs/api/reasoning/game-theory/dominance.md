# `reasoning/game-theory/dominance.ts`

============================================================ Iterated elimination of (strictly|weakly) dominated strategies ============================================================ Una estrategia pura `s` del jugador `i` está estrictamente dominada si existe otra estrategia pura `s'` tal que para todo perfil de los demás jugadores, u_i(s', t) > u_i(s, t). La versión "weak" usa ≥ con desigualdad estricta en al menos un perfil. Aquí soportamos `strict` (estricta) y la otra.

## Contents

- [`isDominated`](#isdominated) — Function
- [`eliminateDominated`](#eliminatedominated) — Function
- [`bestResponse`](#bestresponse) — Function

## `isDominated`

> Function · `reasoning/game-theory/dominance.ts:20`

Devuelve true si la estrategia pura `strategy` del jugador
`player` está dominada por otra pura. Si `strict` es true exige
dominancia estricta, si no permite weak.

```ts
export function isDominated( game: NormalFormGame, player: number, strategy: number, strict = true, ): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `player` | `number` | no |  |
| `strategy` | `number` | no |  |
| `strict` | `any` | yes |  |

### Returns

`boolean` — 


## `eliminateDominated`

> Function · `reasoning/game-theory/dominance.ts:80`

Aplica eliminación iterada hasta punto fijo. Devuelve un juego
cuyas estrategias son un subconjunto de las originales.

Importante: el resultado siempre tiene al menos 1 estrategia por
jugador (la última no se elimina aunque "técnicamente" lo esté,
porque eliminarla deja el juego vacío y sin sentido).

```ts
export function eliminateDominated(game: NormalFormGame, strict = true): NormalFormGame
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `strict` | `any` | yes |  |

### Returns

`NormalFormGame` — 


## `bestResponse`

> Function · `reasoning/game-theory/dominance.ts:138`

Mejores respuestas puras del jugador `player` dado que los demás
juegan según `opponentStrategies` (debe incluir TODOS los jugadores,
incluyendo el propio — la entrada de `player` se ignora).

Retorna lista de índices de estrategias puras con utilidad máxima
(puede haber empates).

```ts
export function bestResponse( game: NormalFormGame, player: number, opponentStrategies: MixedStrategy[], ): number[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `NormalFormGame` | no |  |
| `player` | `number` | no |  |
| `opponentStrategies` | `MixedStrategy[]` | no |  |

### Returns

`number[]` — 

