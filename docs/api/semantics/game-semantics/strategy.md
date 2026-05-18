# `semantics/game-semantics/strategy.ts`

============================================================ Game semantics IPC — Búsqueda de estrategia ganadora ============================================================ Implementación basada en juegos dialógicos al estilo Felscher (1985), versión intuicionista. La validez en IPC equivale a la existencia de una estrategia ganadora del Proponente; esto es teorema clásico (Lorenzen-Felscher). Para la *decisión* (¿existe estrategia ganadora?) usamos como oráculo el prover NJ del módulo `profiles/intuitionistic-nj` — está probado-en-tests y es completo para IPC proposicional. Para la *estrategia explícita* hacemos minimax sobre el árbol de juego: P intenta forzar conclusión atómica disponible en su contexto; O ataca cada conector accesible. La estrategia resultante es una función del estado a la próxima movida. Esto no pretende ser un solver de tableau completo: cuando el oráculo dice "no hay estrategia", devolvemos `{ exists: false }` sin función. Cuando dice "sí hay", retornamos una estrategia computable basada en heurísticas dialógicas estándar:   - Si P debe defender `φ ∧ ψ`, responde al ataque del lado     elegido por O.   - Si P debe defender `φ ∨ ψ`, elige el disyunto demostrable.   - Si P debe defender `φ → ψ` (tras ataque O con φ), defiende     ψ con φ añadida al contexto.   - Si P debe defender un átomo, sólo gana si el átomo está en     contexto (regla atómica intuicionista).   - Si P debe defender `⊥`, pierde salvo que pueda re-atacar     una aserción O en contexto cuya cabeza sea ⊥-derivable. La movida producida por la estrategia es válida (los tests lo chequean a través de `play`).

## Contents

- [`WinningStrategyResult`](#winningstrategyresult) — Interface
- [`winningStrategy`](#winningstrategy) — Function
- [`PlayResult`](#playresult) — Interface
- [`play`](#play) — Function
- [`traceToString`](#tracetostring) — Function

## `WinningStrategyResult`

> Interface · `semantics/game-semantics/strategy.ts:73`

```ts
export interface WinningStrategyResult
```


## `winningStrategy`

> Function · `semantics/game-semantics/strategy.ts:84`

Decide si el Proponente tiene estrategia ganadora sobre `phi`
(equivalente a validez en IPC). Si la tiene, retorna además
una estrategia computable.

```ts
export function winningStrategy(phi: IPCFormula): WinningStrategyResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `IPCFormula` | no |  |

### Returns

`WinningStrategyResult` — 


## `PlayResult`

> Interface · `semantics/game-semantics/strategy.ts:133`

```ts
export interface PlayResult
```


## `play`

> Function · `semantics/game-semantics/strategy.ts:153`

Simula una partida con `phi` como tesis del Proponente y una
secuencia fija de movidas del Oponente. El Proponente juega
según la estrategia (si existe); si no, el Proponente pierde
apenas la fórmula falla a ser válida.

Diseño:
  - El juego avanza por *rounds*: O ataca/elige, luego P
    defiende/elige.
  - El estado evoluciona reescribiendo `current` (la fórmula
    bajo defensa actual) y `context` (las concesiones O).
  - La partida termina cuando se llega a un átomo en `current`
    o a `⊥`: P gana si el átomo está en `context` (regla
    atómica); P pierde si llega a `⊥` sin contexto contradictorio.

```ts
export function play(phi: IPCFormula, opponentMoves: Move[]): PlayResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `phi` | `IPCFormula` | no |  |
| `opponentMoves` | `Move[]` | no |  |

### Returns

`PlayResult` — 


## `traceToString`

> Function · `semantics/game-semantics/strategy.ts:359`

```ts
export function traceToString(trace: GameState[]): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `trace` | `GameState[]` | no |  |

### Returns

`string` — 

