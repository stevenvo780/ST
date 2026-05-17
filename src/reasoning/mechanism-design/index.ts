// ============================================================
// Mechanism design — barrel público
// ============================================================
//
// Implementación de los mecanismos canónicos de la teoría:
//
//   - VCG (Vickrey-Clarke-Groves): allocation que maximiza welfare,
//     pagos por externalidad. DSIC.
//   - First-price sealed-bid: ganador paga su bid.
//   - Second-price sealed-bid (Vickrey): ganador paga el segundo
//     precio. DSIC. Coincide con VCG para 1 item.
//   - English ascending: reloj sube, sale el último parado.
//   - Dutch descending: reloj baja, gana el primero en aceptar.
//   - Myerson optimal auction: maximiza expected revenue via virtual
//     valuations + reserve price.
//
// Helpers:
//   - socialWelfare, isStrategyProof (empírico)
//   - virtualValuation, expectedRevenue (Monte Carlo)

export type {
  Agent,
  MechanismOutcome,
  AuctionResult,
  SealedBidAuction,
  BidderDistribution,
} from './types';

export { vcgMechanism, socialWelfare, isStrategyProof } from './vcg';

export { firstPriceSealed, secondPriceSealed, englishAuction, dutchAuction } from './auctions';

export {
  myersonOptimal,
  virtualValuation,
  findReserve,
  expectedRevenue,
  sampleFromDistribution,
  uniformDistribution,
} from './myerson';
