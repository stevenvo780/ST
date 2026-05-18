# `proof-systems/fol-prover-advanced/ordering.ts`

## Contents

- [`kboGreater`](#kbogreater) — Function
- [`lpoGreater`](#lpogreater) — Function
- [`maximalLiterals`](#maximalliterals) — Function

## `kboGreater`

> Function · `proof-systems/fol-prover-advanced/ordering.ts:50`

`kboGreater(t1, t2, weights)` ⇔ t1 >_KBO t2.

Invariantes (simplificadas; suficientes para el tablero de pruebas):
1. Cada variable de t2 ocurre en t1 al menos tantas veces.
2. weight(t1) > weight(t2), o
3. weight(t1) == weight(t2) y t1 domina léxicamente (top-symbol > top-symbol
   según precedencia derivada de pesos, o argumentos comparados).

```ts
export function kboGreater(t1: FOLTerm, t2: FOLTerm, weights: Map<string, number>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `FOLTerm` | no |  |
| `t2` | `FOLTerm` | no |  |
| `weights` | `Map<string, number>` | no |  |

### Returns

`boolean` — 


## `lpoGreater`

> Function · `proof-systems/fol-prover-advanced/ordering.ts:90`

`lpoGreater(t1, t2, precedence)` ⇔ t1 >_LPO t2.

Reglas estándar:
- Si t2 es variable, t1 > t2 ⇔ t2 ocurre en t1 y t1 ≠ t2.
- Si top(t1) > top(t2) (vía `precedence`) y t1 > cada subterm de t2.
- Si top(t1) = top(t2), comparación lexicográfica de argumentos y t1 > cada
  subterm de t2.
- Si algún subterm de t1 ≥ t2.

```ts
export function lpoGreater(t1: FOLTerm, t2: FOLTerm, precedence: Map<string, number>): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `t1` | `FOLTerm` | no |  |
| `t2` | `FOLTerm` | no |  |
| `precedence` | `Map<string, number>` | no |  |

### Returns

`boolean` — 


## `maximalLiterals`

> Function · `proof-systems/fol-prover-advanced/ordering.ts:160`

Calcula las literales máximas de una cláusula bajo el ordering dado.
Sólo esas pueden usarse como "literal seleccionada" en ordered resolution.

Convertimos cada literal en un término representativo
`f_pred(args)` (con signo codificado vía precedencia para que la negación no
altere el orden) y comparamos.

```ts
export function maximalLiterals( clause:
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `clause` | `{ literals: FOLLiteral[] }` | no |  |
| `ordering` | `'KBO' \| 'LPO' \| 'none'` | no |  |
| `weights` | `Map<string, number>` | no |  |
| `precedence` | `Map<string, number>` | no |  |

### Returns

`number[]` — 

