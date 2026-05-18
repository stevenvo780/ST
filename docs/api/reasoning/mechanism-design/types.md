# `reasoning/mechanism-design/types.ts`

Un agente con valuation sobre outcomes. Cada outcome se identifica
con un string (típicamente itemId, pero puede codificar bundles
para combinatorial auctions, e.g. "A+B").

## Contents

- [`Agent`](#agent) — Interface
- [`MechanismOutcome`](#mechanismoutcome) — Interface
- [`AuctionResult`](#auctionresult) — Interface
- [`SealedBidAuction`](#sealedbidauction) — Interface
- [`BidderDistribution`](#bidderdistribution) — Interface

## `Agent`

> Interface · `reasoning/mechanism-design/types.ts:26`

Un agente con valuation sobre outcomes. Cada outcome se identifica
con un string (típicamente itemId, pero puede codificar bundles
para combinatorial auctions, e.g. "A+B").

```ts
export interface Agent
```


## `MechanismOutcome`

> Interface · `reasoning/mechanism-design/types.ts:35`

Resultado de un mechanism: quién se queda con qué y cuánto paga.

```ts
export interface MechanismOutcome
```


## `AuctionResult`

> Interface · `reasoning/mechanism-design/types.ts:45`

Resultado de una single-item auction.

```ts
export interface AuctionResult
```


## `SealedBidAuction`

> Interface · `reasoning/mechanism-design/types.ts:55`

Auction con bids sealed (cada bidder reporta un valor secreto).

```ts
export interface SealedBidAuction
```


## `BidderDistribution`

> Interface · `reasoning/mechanism-design/types.ts:63`

Distribución (i.i.d. por bidder) sobre la valuation. Necesitamos CDF
y PDF en cerrado para Myerson; el dominio acota el soporte.

```ts
export interface BidderDistribution
```

