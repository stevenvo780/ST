# `reasoning/number-theory/symbols.ts`

============================================================ Símbolos de Legendre y Jacobi. ============================================================ legendreSymbol(a, p): a^((p-1)/2) mod p, normalizado a {-1, 0, 1}.                      Requiere p primo impar. jacobiSymbol(a, n):  generalización a n impar > 0 vía reciprocidad                      cuadrática. Coincide con Legendre cuando n es                      primo y siempre satisface jacobi(a,n) ∈ {-1,0,1}.

## Contents

- [`legendreSymbol`](#legendresymbol) — Function
- [`jacobiSymbol`](#jacobisymbol) — Function

## `legendreSymbol`

> Function · `reasoning/number-theory/symbols.ts:12`

```ts
export function legendreSymbol(a: bigint, p: bigint): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `p` | `bigint` | no |  |

### Returns

`-1 \| 0 \| 1` — 


## `jacobiSymbol`

> Function · `reasoning/number-theory/symbols.ts:26`

```ts
export function jacobiSymbol(a: bigint, n: bigint): -1 | 0 | 1
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `n` | `bigint` | no |  |

### Returns

`-1 \| 0 \| 1` — 

