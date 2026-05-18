# `proof-systems/fol-prover-advanced/prover.ts`

## Contents

- [`negateLiteral`](#negateliteral) — Function
- [`negateClause`](#negateclause) — Function
- [`proveAdvanced`](#proveadvanced) — Function
- [`strategyLabel`](#strategylabel) — Function

## `negateLiteral`

> Function · `proof-systems/fol-prover-advanced/prover.ts:29`

Negación lógica de una literal (toggle del flag `negated`).
Útil para construir el goal negado en una refutación.

```ts
export function negateLiteral(l: FOLLiteral): FOLLiteral
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `l` | `FOLLiteral` | no |  |

### Returns

`FOLLiteral` — 


## `negateClause`

> Function · `proof-systems/fol-prover-advanced/prover.ts:33`

```ts
export function negateClause(c: FOLClause): FOLClause[]
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `c` | `FOLClause` | no |  |

### Returns

`FOLClause[]` — 


## `proveAdvanced`

> Function · `proof-systems/fol-prover-advanced/prover.ts:46`

Prover avanzado: refuta `premises ∧ ¬goal` aplicando el refinamiento
elegido. Devuelve un `AdvancedProveResult` con las trazas.

Asumimos que `premises` y `goal` ya están en CNF (cláusulas explícitas
con literales). El caller que quiera convertir fórmulas ricas a CNF debe
hacerlo antes.

```ts
export function proveAdvanced( premises: FOLClause[], goal: FOLClause, opts: AdvancedProveOptions ): AdvancedProveResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `premises` | `FOLClause[]` | no |  |
| `goal` | `FOLClause` | no |  |
| `opts` | `AdvancedProveOptions` | no |  |

### Returns

`AdvancedProveResult` — 


## `strategyLabel`

> Function · `proof-systems/fol-prover-advanced/prover.ts:242`

Helper que mapea `RefinementStrategy` a un short-name legible (sirve para
logs y tests).

```ts
export function strategyLabel(s: RefinementStrategy): string
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `s` | `RefinementStrategy` | no |  |

### Returns

`string` — 

