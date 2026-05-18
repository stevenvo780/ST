# `logic/profiles/sequent-g3/normalize.ts`

============================================================ G3 — Normalizacion de formulas a {atom, not, and, or, implies} ============================================================ El nucleo G3 razona sobre 5 conectivos. Las formulas con biconditional, xor, nand, nor se reescriben a esa base; tambien se expanden cuantificadores y operadores aritmeticos no soportados (devolviendo error semantico via NaN-formula).

## Contents

- [`normalizeForG3`](#normalizeforg3) — Function
- [`formulaKey`](#formulakey) — Function

## `normalizeForG3`

> Function · `logic/profiles/sequent-g3/normalize.ts:18`

Reescribe la formula al nucleo {atom, true, false, not, and, or, implies}
preservando las locaciones. Las formulas no proposicionales se dejan tal
cual: el prover las tratara como atomicas y normalmente no podra cerrar
la prueba salvo coincidencia sintactica exacta.

```ts
export function normalizeForG3(f: Formula): Formula
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`Formula` — 


## `formulaKey`

> Function · `logic/profiles/sequent-g3/normalize.ts:89`

Canoniza una formula a una representacion textual estable que ignora
`source` y normaliza orden interno donde aplica. Sirve como clave para
comparar formulas en multisets.

```ts
export function formulaKey(f: Formula): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `f` | `Formula` | no |  |

### Returns

`string` — 

