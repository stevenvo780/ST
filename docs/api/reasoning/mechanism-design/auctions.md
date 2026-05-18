# `reasoning/mechanism-design/auctions.ts`

============================================================ Single-item auctions: first/second-price sealed, English, Dutch ============================================================ Convención: bids con valor <= 0 se ignoran (no participa). Si no hay bidders válidos, devolvemos { winner: '', payment: 0 }. Empates se rompen lexicográficamente por id (determinista, testeable).

## Contents

- [`firstPriceSealed`](#firstpricesealed) — Function
- [`secondPriceSealed`](#secondpricesealed) — Function
- [`englishAuction`](#englishauction) — Function
- [`dutchAuction`](#dutchauction) — Function

## `firstPriceSealed`

> Function · `reasoning/mechanism-design/auctions.ts:34`

First-price sealed-bid: el ganador paga su propio bid.

No es strategy-proof — el bidder racional shadea su bid bajo su
valuation. Pero la regla es lo más simple del mundo.

```ts
export function firstPriceSealed(bids: Map<string, number>): AuctionResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bids` | `Map<string, number>` | no |  |

### Returns

`AuctionResult` — 


## `secondPriceSealed`

> Function · `reasoning/mechanism-design/auctions.ts:48`

Second-price sealed-bid (Vickrey): el ganador paga el segundo bid más
alto. Es DSIC: bidding truthful es dominante.

Si solo hay un bidder válido, paga 0 (no hay segundo precio). Esa es
la convención estándar; en variantes con reserve, el reserve actúa
como segundo precio si no hay otro bidder por encima.

```ts
export function secondPriceSealed(bids: Map<string, number>): AuctionResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bids` | `Map<string, number>` | no |  |

### Returns

`AuctionResult` — 


## `englishAuction`

> Function · `reasoning/mechanism-design/auctions.ts:88`

English ascending auction: simulamos un reloj que sube en pasos de
`increment`. Cada bidder sigue activo mientras el precio no supere
su valuation. Cuando solo queda 1 activo, termina y paga el precio
actual.

Bajo bidders racionales (cada uno dropea exactamente en su valuation),
el resultado es equivalente a second-price (el ganador paga ~ segundo
valor más alto, módulo `increment`).

Implementación: en vez de simular reloj, calculamos directo:
  winner = bidder con max valuation
  payment = ceil(secondHighest / increment) * increment   ≈ second + un step

Para los tests usamos increment=1, lo que da payment ≈ second.

```ts
export function englishAuction(bids: Map<string, number>, increment: number): AuctionResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `bids` | `Map<string, number>` | no |  |
| `increment` | `number` | no |  |

### Returns

`AuctionResult` — 


## `dutchAuction`

> Function · `reasoning/mechanism-design/auctions.ts:137`

Dutch descending auction: reloj baja desde `initialPrice` con pasos
`decrement`. El primer bidder en aceptar (precio ≤ su valuation)
gana y paga ese precio.

Estratégicamente, Dutch ≡ first-price sealed: cada bidder elige a qué
precio aceptar, equivalente a elegir su bid. Implementamos via
simulación discreta.

`bidders.get(id)` = valor máximo que el bidder está dispuesto a pagar
(su bid efectivo en el equivalente sealed). El primero en alcanzar
un precio ≤ a su bid gana.

```ts
export function dutchAuction( initialPrice: number, bidders: Map<string, number>, decrement: number, ): AuctionResult
```

### Parameters

| Name | Type | Optional | Description |
| ---- | ---- | -------- | ----------- |
| `initialPrice` | `number` | no |  |
| `bidders` | `Map<string, number>` | no |  |
| `decrement` | `number` | no |  |

### Returns

`AuctionResult` — 

