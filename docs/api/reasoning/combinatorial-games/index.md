# `reasoning/combinatorial-games/index.ts`

============================================================ ST Combinatorial Games — Sprague-Grundy + Surreal numbers ============================================================ Dos puntas complementarias del análisis de juegos combinatorios:   1. Juegos imparciales (mismas movidas para ambos jugadores) →      Sprague-Grundy theorem: cada estado tiene un único valor      grundy ∈ ℕ. Una posición es perdedora para el jugador a mover      sii grundy = 0. Para juegos compuestos (suma disjunta), el      valor se obtiene como XOR (nim-sum) de los componentes.   2. Juegos partisanos (movidas asimétricas Left/Right) → números      surreales de Conway. Cada juego es un par { L | R } donde L y R      son conjuntos de juegos (sus opciones). De aquí emergen los      enteros, fracciones diádicas, ω, ε, *, ↑, etc. Convenciones:   • Los juegos imparciales se modelan como una interfaz genérica     `ImpartialGame<S>` con función de movidas y predicado terminal.   • Los estados deben ser serializables a string (clave del caché);     se exige una función `key` opcional; default = JSON.stringify.   • Los surreales son recursivos. Sólo soportamos comparación y     aritmética básica (add, negate, compare). Suficiente para     verificar identidades como 1 + 1 = 2, *‖0, etc.   • La simplificación de surreales aquí elimina opciones dominadas     (Left domina a otra Left si es ≥; Right domina si es ≤). No     hacemos "número simplicity" completo — sí suficiente para que     los tests de identidad pasen sin explosión de tamaño. ============================================================ ── Sprague-Grundy ──────────────────────────────────────────

## Contents

- [`ImpartialGame`](#impartialgame) — Interface
- [`mex`](#mex) — Function
- [`grundyValue`](#grundyvalue) — Function
- [`isWinning`](#iswinning) — Function
- [`nimSum`](#nimsum) — Function
- [`multiGameGrundy`](#multigamegrundy) — Function
- [`nim`](#nim) — Function
- [`nim1d`](#nim1d) — Function
- [`chompGame`](#chompgame) — Function
- [`SurrealNumber`](#surrealnumber) — Interface
- [`ZERO`](#zero) — Const
- [`ONE`](#one) — Const
- [`MINUS_ONE`](#minus-one) — Const
- [`STAR`](#star) — Const
- [`fromInt`](#fromint) — Function
- [`negate`](#negate) — Function
- [`add`](#add) — Function
- [`compare`](#compare) — Function
- [`isFuzzy`](#isfuzzy) — Function
- [`simplify`](#simplify) — Function

## `ImpartialGame`

> Interface · `reasoning/combinatorial-games/index.ts:33`

```ts
export interface ImpartialGame<S>
```


## `mex`

> Function · `reasoning/combinatorial-games/index.ts:49`

Minimum Excludant: menor entero ≥ 0 que no está en el conjunto.
mex(∅) = 0, mex({0,1,3}) = 2, mex({1,2}) = 0.

```ts
export function mex(set: Set<number>): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `set` | `Set<number>` | no |  |

### Returns

`number` — 


## `grundyValue`

> Function · `reasoning/combinatorial-games/index.ts:60`

Valor de Grundy del estado dado bajo el juego imparcial.
Define: G(terminal) = 0; G(s) = mex { G(s') : s' ∈ moves(s) }.
Usa caché (compartido entre llamadas) keyed por la clave canónica del estado.

```ts
export function grundyValue<S>( game: ImpartialGame<S>, state: S, cache: Map<string, number> = new Map<string, number>(), ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `ImpartialGame<S>` | no |  |
| `state` | `S` | no |  |
| `cache` | `Map<string, number>` | yes |  |

### Returns

`number` — 


## `isWinning`

> Function · `reasoning/combinatorial-games/index.ts:86`

El jugador a mover gana sii grundy ≠ 0 (juego imparcial con convención
normal: el que no puede mover, pierde).

```ts
export function isWinning<S>(game: ImpartialGame<S>, state: S): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `game` | `ImpartialGame<S>` | no |  |
| `state` | `S` | no |  |

### Returns

`boolean` — 


## `nimSum`

> Function · `reasoning/combinatorial-games/index.ts:94`

Nim-sum: XOR bit a bit de los valores. Identidad del monoide de Grundy
bajo suma disjunta de juegos imparciales.

```ts
export function nimSum(values: number[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `values` | `number[]` | no |  |

### Returns

`number` — 


## `multiGameGrundy`

> Function · `reasoning/combinatorial-games/index.ts:105`

Grundy de la suma disjunta de juegos imparciales independientes:
  G(G1 + G2 + ... + Gn)(s1,...,sn) = G1(s1) ⊕ G2(s2) ⊕ ... ⊕ Gn(sn).
Requiere games.length === states.length.

```ts
export function multiGameGrundy<S>(games: Array<ImpartialGame<S>>, states: S[]): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `games` | `Array<ImpartialGame<S>>` | no |  |
| `states` | `S[]` | no |  |

### Returns

`number` — 


## `nim`

> Function · `reasoning/combinatorial-games/index.ts:127`

Nim clásico: varios montones de piedras, un movimiento = sacar ≥1
piedras de un único montón. Pierde quien no puede mover (todos los
montones a 0). Estado: vector de tamaños (normalizado, sin ceros y
ordenado descendente para que el caché sea efectivo entre simetrías).

```ts
export function nim(piles: number[]): ImpartialGame<number[]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `piles` | `number[]` | no |  |

### Returns

`ImpartialGame<number[]>` — 


## `nim1d`

> Function · `reasoning/combinatorial-games/index.ts:156`

Nim 1D: una sola pila de `stones` piedras; sacar 1..stones. Equivale
a `nim([stones])` pero con estado más compacto (un número).

```ts
export function nim1d(stones: number): ImpartialGame<number>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `stones` | `number` | no |  |

### Returns

`ImpartialGame<number>` — 


## `chompGame`

> Function · `reasoning/combinatorial-games/index.ts:185`

Chomp: tablero rows×cols de "chocolate". Cada movida elige una casilla
viva (true) y "muerde" todo el rectángulo abajo-derecha desde ella. La
casilla (0,0) es veneno: quien la come pierde (convención misère
implementada como: estado terminal cuando solo queda (0,0)).

Estado: matriz booleana rows×cols con true = casilla viva.

Nota: Chomp tiene posición ganadora conocida para el primer jugador
en todo tablero ≥ 2×2 (argumento de robo de estrategia), pero la
estrategia explícita es desconocida en general. Para 1×1 (sólo el
veneno) el jugador a mover pierde, así que grundy = 0.

```ts
export function chompGame(rows: number, cols: number): ImpartialGame<boolean[][]>
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `rows` | `number` | no |  |
| `cols` | `number` | no |  |

### Returns

`ImpartialGame<boolean[][]>` — 


## `SurrealNumber`

> Interface · `reasoning/combinatorial-games/index.ts:243`

```ts
export interface SurrealNumber
```


## `ZERO`

> Const · `reasoning/combinatorial-games/index.ts:253`

0 = { | } — sin opciones para ninguno; "second player wins".

```ts
const ZERO: SurrealNumber
```


## `ONE`

> Const · `reasoning/combinatorial-games/index.ts:256`

1 = { 0 | }.

```ts
const ONE: SurrealNumber
```


## `MINUS_ONE`

> Const · `reasoning/combinatorial-games/index.ts:259`

-1 = { | 0 }.

```ts
const MINUS_ONE: SurrealNumber
```


## `STAR`

> Const · `reasoning/combinatorial-games/index.ts:262`

(star) = { 0 | 0 } — primer jugador gana, no comparable a 0 (fuzzy).

```ts
const STAR: SurrealNumber
```


## `fromInt`

> Function · `reasoning/combinatorial-games/index.ts:270`

Construye el surreal correspondiente al entero `n`.
  0 = { | }
  n = { n-1 | }            (n > 0)
 -n = {     | -(n-1) }     (n < 0)

```ts
export function fromInt(n: number): SurrealNumber
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `n` | `number` | no |  |

### Returns

`SurrealNumber` — 


## `negate`

> Function · `reasoning/combinatorial-games/index.ts:280`

Negación: -G = { -GR | -GL }.

```ts
export function negate(s: SurrealNumber): SurrealNumber
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `SurrealNumber` | no |  |

### Returns

`SurrealNumber` — 


## `add`

> Function · `reasoning/combinatorial-games/index.ts:290`

Suma de juegos: G + H = { GL+H, G+HL  |  GR+H, G+HR }.

```ts
export function add(a: SurrealNumber, b: SurrealNumber): SurrealNumber
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `SurrealNumber` | no |  |
| `b` | `SurrealNumber` | no |  |

### Returns

`SurrealNumber` — 


## `compare`

> Function · `reasoning/combinatorial-games/index.ts:322`

```ts
export function compare(a: SurrealNumber, b: SurrealNumber): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `SurrealNumber` | no |  |
| `b` | `SurrealNumber` | no |  |

### Returns

`-1 \| 0 \| 1` — 


## `isFuzzy`

> Function · `reasoning/combinatorial-games/index.ts:335`

G es fuzzy con 0 sii no satisface G ≤ 0 ni 0 ≤ G — es decir, el
primer jugador gana. * es el ejemplo canónico.

```ts
export function isFuzzy(s: SurrealNumber): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `SurrealNumber` | no |  |

### Returns

`boolean` — 


## `simplify`

> Function · `reasoning/combinatorial-games/index.ts:350`

Simplificación parcial: elimina opciones dominadas en cada lado.

  En la lista Left, una opción L1 domina a L2 si L1 ≥ L2 (entonces
  L2 puede borrarse: el jugador Left preferirá L1).
  En la lista Right, una opción R1 domina a R2 si R1 ≤ R2.

No hace eliminación reversible ("bypass") — eso podría requerirse
para canonicalización completa Conway. Para nuestros tests es
suficiente.

```ts
export function simplify(s: SurrealNumber): SurrealNumber
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `SurrealNumber` | no |  |

### Returns

`SurrealNumber` — 

