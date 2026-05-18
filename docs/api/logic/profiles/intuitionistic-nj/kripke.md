# `logic/profiles/intuitionistic-nj/kripke.ts`

============================================================ Kripke counter-models para IPC ============================================================ IPC es completa respecto a frames de Kripke finitos (Kripke 1965). Una fórmula no es un teorema intuicionista sii existe un modelo de Kripke finito (preorden + forcing persistente) cuya raíz no la fuerza. Estrategia: enumeración acotada de preórdenes sobre {w0,...,w_{k-1}} y todas las valuaciones persistentes (subconjuntos upward-closed por cada átomo). Para refutar contraejemplos clásicos típicos (¬¬P → P, P ∨ ¬P, Peirce) bastan 2-3 mundos.

## Contents

- [`kripkeCounterModel`](#kripkecountermodel) — Function
- [`isIPCValid`](#isipcvalid) — Function

## `kripkeCounterModel`

> Function · `logic/profiles/intuitionistic-nj/kripke.ts:190`

API pública: si `formula` NO es válida intuicionistamente,
devuelve un modelo Kripke cuya raíz (w0) la refuta. Si es
válida, devuelve `null`.

El budget máximo (mundos) se ajusta a la cantidad de átomos.

```ts
export function kripkeCounterModel( formula: IntuitFormula, options: { maxWorlds?: number } =
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `IntuitFormula` | no |  |
| `options` | `{ maxWorlds?: number }` | yes |  |

### Returns

`KripkeIntuitModel \| null` — 


## `isIPCValid`

> Function · `logic/profiles/intuitionistic-nj/kripke.ts:208`

Helper: ¿la fórmula es válida intuicionistamente bajo modelos
de tamaño ≤ `maxWorlds`? Útil en tests para cruzar con el prover.

```ts
export function isIPCValid(formula: IntuitFormula, maxWorlds = 3): boolean
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `formula` | `IntuitFormula` | no |  |
| `maxWorlds` | `any` | yes |  |

### Returns

`boolean` — 

