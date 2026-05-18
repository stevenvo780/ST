# `reasoning/number-theory/gcd.ts`

============================================================ gcd, lcm y algoritmo extendido sobre bigint. ============================================================ gcd(a,b) por Euclides binario-aritmético, siempre no-negativo. extendedGcd devuelve coeficientes Bézout (x,y) con a·x + b·y = gcd. Convención: para a=b=0 el gcd es 0 (consistente con álgebra conmutativa: el único divisor común es 0).

## Contents

- [`gcd`](#gcd) — Function
- [`lcm`](#lcm) — Function
- [`extendedGcd`](#extendedgcd) — Function

## `gcd`

> Function · `reasoning/number-theory/gcd.ts:11`

```ts
export function gcd(a: bigint, b: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `b` | `bigint` | no |  |

### Returns

`bigint` — 


## `lcm`

> Function · `reasoning/number-theory/gcd.ts:22`

```ts
export function lcm(a: bigint, b: bigint): bigint
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `b` | `bigint` | no |  |

### Returns

`bigint` — 


## `extendedGcd`

> Function · `reasoning/number-theory/gcd.ts:31`

```ts
export function extendedGcd(a: bigint, b: bigint):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `bigint` | no |  |
| `b` | `bigint` | no |  |

### Returns

`{ gcd: bigint; x: bigint; y: bigint }` — 

