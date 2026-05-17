// ============================================================
// Mechanism design — tipos compartidos
// ============================================================
//
// Modelamos mechanism design discreto sobre un conjunto finito de
// outcomes (típicamente: asignar ítems a agentes). Cada agente reporta
// una valuation `Map<outcomeId, number>`. El mechanism elige una
// allocation y cobra pagos.
//
// El bundle de un agente en una allocation es el conjunto de outcomes
// que se le asignan. Modelamos allocation como `Map<agentId, itemId>`
// para el caso single-unit (cada item a un solo agente). Para
// combinatorial auctions se generaliza con bundles, pero el `MechanismOutcome`
// público mantiene el tipo Map<string,string> según contrato.
//
// Los pagos son no-negativos cuando el mechanism es individually
// rational; aceptamos negativos en VCG con bundles porque las pivots
// pueden compensar (típicamente VCG cobra >= 0 si la valuation es
// monotónica, lo que asumimos por construcción de ejemplos).

/**
 * Un agente con valuation sobre outcomes. Cada outcome se identifica
 * con un string (típicamente itemId, pero puede codificar bundles
 * para combinatorial auctions, e.g. "A+B").
 */
export interface Agent {
  id: string;
  /** valuation.get(outcome) = utilidad si recibe ese outcome. Default 0 si missing. */
  valuation: Map<string, number>;
}

/**
 * Resultado de un mechanism: quién se queda con qué y cuánto paga.
 */
export interface MechanismOutcome {
  /** allocation.get(agentId) = item que recibe (o undefined si no recibe). */
  allocation: Map<string, string>;
  /** payments.get(agentId) = pago del agente al mechanism (>= 0 típicamente). */
  payments: Map<string, number>;
}

/**
 * Resultado de una single-item auction.
 */
export interface AuctionResult {
  /** Id del ganador (o '' si nadie supera el reserve / no hay bids). */
  winner: string;
  /** Pago del ganador. 0 si no hubo ganador. */
  payment: number;
}

/**
 * Auction con bids sealed (cada bidder reporta un valor secreto).
 */
export interface SealedBidAuction {
  bids: Map<string, number>;
}

/**
 * Distribución (i.i.d. por bidder) sobre la valuation. Necesitamos CDF
 * y PDF en cerrado para Myerson; el dominio acota el soporte.
 */
export interface BidderDistribution {
  cdf: (v: number) => number;
  pdf: (v: number) => number;
  domain: [number, number];
}
