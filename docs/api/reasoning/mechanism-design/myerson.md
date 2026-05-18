# `reasoning/mechanism-design/myerson.ts`

============================================================ Myerson optimal auction + revenue equivalence ============================================================ Myerson (1981): para vender 1 item a `n` bidders independientes con valuations privadas de distribuciones regulares F_i, el mechanism óptimo en expected revenue es:   1. Calcular virtual valuation φ_i(v) = v - (1 - F_i(v)) / f_i(v).   2. Asignar al bidder con MAYOR φ_i (si > 0, si no, no asignar →      reserve price implícito r_i tal que φ_i(r_i) = 0).   3. Cobrar al ganador el menor bid que lo habría hecho ganar      (Vickrey-style payment sobre virtual valuations). Para distribuciones simétricas (todos los bidders i.i.d. con misma F), φ es la misma función para todos; el mechanism colapsa a una second-price auction con reserve price r = φ^(-1)(0). Revenue equivalence theorem: en cualquier mechanism que (a) asigne al bidder con mayor valuation y (b) dé utilidad 0 al bidder con valuation 0 ("regularity boundary"), el expected revenue es el mismo. → 1st-price y 2nd-price tienen igual revenue esperado bajo IID.

## Contents

- [`virtualValuation`](#virtualvaluation) — Function
- [`findReserve`](#findreserve) — Function
- [`myersonOptimal`](#myersonoptimal) — Function
- [`sampleFromDistribution`](#samplefromdistribution) — Function
- [`expectedRevenue`](#expectedrevenue) — Function
- [`uniformDistribution`](#uniformdistribution) — Function

## `virtualValuation`

> Function · `reasoning/mechanism-design/myerson.ts:33`

Virtual valuation φ(v) = v - (1 - F(v)) / f(v).

Si f(v) ≈ 0 retornamos +Infinity (límite del término penalty).
Si v cae fuera del dominio, devolvemos -Infinity (no participa).

```ts
export function virtualValuation(v: number, dist: BidderDistribution): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `v` | `number` | no |  |
| `dist` | `BidderDistribution` | no |  |

### Returns

`number` — 


## `findReserve`

> Function · `reasoning/mechanism-design/myerson.ts:55`

Resuelve φ(r) = 0 por bisección en el dominio de la distribución.

Si φ(lo) >= 0, devuelve lo. Si φ(hi) <= 0, devuelve hi. Si no, busca
con tolerancia 1e-8 en 80 iteraciones.

Asume regularidad de la distribución (φ monótona creciente). En
uniform[0,1]: φ(v) = 2v - 1, raíz en 1/2. ✔

```ts
export function findReserve(dist: BidderDistribution): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `BidderDistribution` | no |  |

### Returns

`number` — 


## `myersonOptimal`

> Function · `reasoning/mechanism-design/myerson.ts:90`

Myerson optimal auction (single-item).

- Si todos los φ_i(bid_i) son negativos → no se vende. winner='',
  payment=0, reserve = φ_i^(-1)(0) del primer bidder (referencia).

- Si el ganador es bidder i (max φ), paga el menor v' tal que
  reportar v' lo habría hecho ganar:

    paymentValue = max( reserve_i, min_v { v : φ_i(v) >= max_{j≠i} φ_j(bid_j) } )

  En el caso IID con simétria, esto es:
    paymentValue = max( reserve, secondHighestBid )

  que es exactamente Vickrey con reserve.

```ts
export function myersonOptimal( bids: Map<string, number>, distributions: Map<string, BidderDistribution>, ):
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bids` | `Map<string, number>` | no |  |
| `distributions` | `Map<string, BidderDistribution>` | no |  |

### Returns

`{ winner: string; payment: number; reserve: number }` — 


## `sampleFromDistribution`

> Function · `reasoning/mechanism-design/myerson.ts:174`

Muestrea una valuation de una distribución por inverse-CDF
sampling. Usamos bisección sobre F.

```ts
export function sampleFromDistribution(dist: BidderDistribution, u: number): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `dist` | `BidderDistribution` | no |  |
| `u` | `number` | no |  |

### Returns

`number` — 


## `expectedRevenue`

> Function · `reasoning/mechanism-design/myerson.ts:202`

Expected revenue de un mechanism via Monte Carlo: muestreamos
`samples` perfiles de bids (cada bidder draw de su distribución
independientemente, asumiendo truthful bidding para 2nd-price /
Myerson, o equilibrium bidding aproximado para 1st-price), corremos
el mechanism y promediamos el payment del ganador.

Nota: para 1st-price con IID uniform[0,1] y n bidders, el bid
de equilibrio es b(v) = (n-1)/n · v. El caller debe pasar un
mechanism que ya implemente ese mapping si quiere comparar contra
2nd-price truthful.

```ts
export function expectedRevenue( mechanism: (bids: Map<string, number>) => AuctionResult, distributions: Map<string, BidderDistribution>, samples: number = 5000, ): number
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `mechanism` | `(bids: Map<string, number>) => AuctionResult` | no |  |
| `distributions` | `Map<string, BidderDistribution>` | no |  |
| `samples` | `number` | yes |  |

### Returns

`number` — 


## `uniformDistribution`

> Function · `reasoning/mechanism-design/myerson.ts:228`

Helper: distribución uniform sobre [a, b]. Útil para tests.
(No exportada en index — solo helper interno aquí; los tests
pueden importarlo directamente.)

```ts
export function uniformDistribution(a: number, b: number): BidderDistribution
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `a` | `number` | no |  |
| `b` | `number` | no |  |

### Returns

`BidderDistribution` — 

