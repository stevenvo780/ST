// ============================================================
// Single-item auctions: first/second-price sealed, English, Dutch
// ============================================================
//
// Convención: bids con valor <= 0 se ignoran (no participa). Si no hay
// bidders válidos, devolvemos { winner: '', payment: 0 }. Empates se
// rompen lexicográficamente por id (determinista, testeable).

import type { AuctionResult } from './types';

/** Tie-breaking determinista: max bid, ties por id ascendente. */
function pickWinner(bids: Map<string, number>): { winner: string; bid: number } {
  let winner = '';
  let bestBid = -Infinity;
  // Orden lexicográfico de ids para empates reproducibles.
  const ids = [...bids.keys()].sort();
  for (const id of ids) {
    const b = bids.get(id) ?? 0;
    if (b > bestBid) {
      bestBid = b;
      winner = id;
    }
  }
  if (bestBid <= 0 || winner === '') return { winner: '', bid: 0 };
  return { winner, bid: bestBid };
}

/**
 * First-price sealed-bid: el ganador paga su propio bid.
 *
 * No es strategy-proof — el bidder racional shadea su bid bajo su
 * valuation. Pero la regla es lo más simple del mundo.
 */
export function firstPriceSealed(bids: Map<string, number>): AuctionResult {
  const { winner, bid } = pickWinner(bids);
  if (winner === '') return { winner: '', payment: 0 };
  return { winner, payment: bid };
}

/**
 * Second-price sealed-bid (Vickrey): el ganador paga el segundo bid más
 * alto. Es DSIC: bidding truthful es dominante.
 *
 * Si solo hay un bidder válido, paga 0 (no hay segundo precio). Esa es
 * la convención estándar; en variantes con reserve, el reserve actúa
 * como segundo precio si no hay otro bidder por encima.
 */
export function secondPriceSealed(bids: Map<string, number>): AuctionResult {
  const ids = [...bids.keys()].sort();
  if (ids.length === 0) return { winner: '', payment: 0 };

  // Localizamos el primero y segundo bid más alto.
  let winner = '';
  let first = -Infinity;
  let second = 0;
  for (const id of ids) {
    const b = bids.get(id) ?? 0;
    if (b > first) {
      second = first === -Infinity ? 0 : first;
      first = b;
      winner = id;
    } else if (b > second) {
      second = b;
    }
  }
  if (first <= 0 || winner === '') return { winner: '', payment: 0 };
  // Si no hubo "segundo" real (todos los otros 0 o ausentes), pagan 0.
  if (second < 0) second = 0;
  return { winner, payment: second };
}

/**
 * English ascending auction: simulamos un reloj que sube en pasos de
 * `increment`. Cada bidder sigue activo mientras el precio no supere
 * su valuation. Cuando solo queda 1 activo, termina y paga el precio
 * actual.
 *
 * Bajo bidders racionales (cada uno dropea exactamente en su valuation),
 * el resultado es equivalente a second-price (el ganador paga ~ segundo
 * valor más alto, módulo `increment`).
 *
 * Implementación: en vez de simular reloj, calculamos directo:
 *   winner = bidder con max valuation
 *   payment = ceil(secondHighest / increment) * increment   ≈ second + un step
 *
 * Para los tests usamos increment=1, lo que da payment ≈ second.
 */
export function englishAuction(bids: Map<string, number>, increment: number): AuctionResult {
  if (increment <= 0) throw new Error('English auction increment must be > 0');
  const ids = [...bids.keys()].sort();
  if (ids.length === 0) return { winner: '', payment: 0 };

  let winner = '';
  let first = -Infinity;
  let second = 0;
  for (const id of ids) {
    const b = bids.get(id) ?? 0;
    if (b > first) {
      second = first === -Infinity ? 0 : first;
      first = b;
      winner = id;
    } else if (b > second) {
      second = b;
    }
  }
  if (first <= 0 || winner === '') return { winner: '', payment: 0 };
  if (second < 0) second = 0;

  // El reloj cruzó el step inmediatamente sobre `second`. Si second cae
  // exactamente en un múltiplo de increment, el segundo bidder dropea
  // justo y el ganador paga `second`. Si no, paga el siguiente step.
  let payment: number;
  const steps = Math.floor(second / increment);
  const onGrid = Math.abs(second - steps * increment) < 1e-9;
  if (onGrid) {
    payment = second;
  } else {
    payment = (steps + 1) * increment;
  }
  if (payment > first) payment = first;
  return { winner, payment };
}

/**
 * Dutch descending auction: reloj baja desde `initialPrice` con pasos
 * `decrement`. El primer bidder en aceptar (precio ≤ su valuation)
 * gana y paga ese precio.
 *
 * Estratégicamente, Dutch ≡ first-price sealed: cada bidder elige a qué
 * precio aceptar, equivalente a elegir su bid. Implementamos via
 * simulación discreta.
 *
 * `bidders.get(id)` = valor máximo que el bidder está dispuesto a pagar
 * (su bid efectivo en el equivalente sealed). El primero en alcanzar
 * un precio ≤ a su bid gana.
 */
export function dutchAuction(
  initialPrice: number,
  bidders: Map<string, number>,
  decrement: number,
): AuctionResult {
  if (decrement <= 0) throw new Error('Dutch auction decrement must be > 0');
  if (initialPrice < 0) throw new Error('Dutch auction initialPrice must be >= 0');
  const ids = [...bidders.keys()].sort();
  if (ids.length === 0) return { winner: '', payment: 0 };

  let price = initialPrice;
  // Tolerancia para no caer en loops infinitos por floating-point.
  const maxSteps = Math.ceil(initialPrice / decrement) + 1;
  for (let step = 0; step <= maxSteps; step++) {
    // Snapshot del precio actual; bidders elegibles = bid >= price.
    let candidate = '';
    let candidateBid = -Infinity;
    for (const id of ids) {
      const b = bidders.get(id) ?? 0;
      if (b >= price - 1e-12 && b > candidateBid) {
        candidateBid = b;
        candidate = id;
      }
    }
    if (candidate !== '') {
      // El primero en aceptar paga el precio actual (clamp a >= 0).
      const payment = Math.max(0, price);
      return { winner: candidate, payment };
    }
    price -= decrement;
    if (price < 0) break;
  }
  return { winner: '', payment: 0 };
}
