// ============================================================
// Myerson optimal auction + revenue equivalence
// ============================================================
//
// Myerson (1981): para vender 1 item a `n` bidders independientes con
// valuations privadas de distribuciones regulares F_i, el mechanism
// óptimo en expected revenue es:
//
//   1. Calcular virtual valuation φ_i(v) = v - (1 - F_i(v)) / f_i(v).
//   2. Asignar al bidder con MAYOR φ_i (si > 0, si no, no asignar →
//      reserve price implícito r_i tal que φ_i(r_i) = 0).
//   3. Cobrar al ganador el menor bid que lo habría hecho ganar
//      (Vickrey-style payment sobre virtual valuations).
//
// Para distribuciones simétricas (todos los bidders i.i.d. con misma
// F), φ es la misma función para todos; el mechanism colapsa a una
// second-price auction con reserve price r = φ^(-1)(0).
//
// Revenue equivalence theorem: en cualquier mechanism que (a) asigne
// al bidder con mayor valuation y (b) dé utilidad 0 al bidder con
// valuation 0 ("regularity boundary"), el expected revenue es el
// mismo. → 1st-price y 2nd-price tienen igual revenue esperado bajo
// IID.

import type { BidderDistribution, AuctionResult } from './types';

/**
 * Virtual valuation φ(v) = v - (1 - F(v)) / f(v).
 *
 * Si f(v) ≈ 0 retornamos +Infinity (límite del término penalty).
 * Si v cae fuera del dominio, devolvemos -Infinity (no participa).
 */
export function virtualValuation(v: number, dist: BidderDistribution): number {
  const [lo, hi] = dist.domain;
  if (v < lo || v > hi) return -Infinity;
  const f = dist.pdf(v);
  if (!Number.isFinite(f) || Math.abs(f) < 1e-15) {
    // En el borde superior, F(v) = 1 → (1-F)/f = 0/0; tomamos v como límite.
    if (Math.abs(1 - dist.cdf(v)) < 1e-12) return v;
    return v;
  }
  const F = dist.cdf(v);
  return v - (1 - F) / f;
}

/**
 * Resuelve φ(r) = 0 por bisección en el dominio de la distribución.
 *
 * Si φ(lo) >= 0, devuelve lo. Si φ(hi) <= 0, devuelve hi. Si no, busca
 * con tolerancia 1e-8 en 80 iteraciones.
 *
 * Asume regularidad de la distribución (φ monótona creciente). En
 * uniform[0,1]: φ(v) = 2v - 1, raíz en 1/2. ✔
 */
export function findReserve(dist: BidderDistribution): number {
  const [lo, hi] = dist.domain;
  const phiLo = virtualValuation(lo, dist);
  const phiHi = virtualValuation(hi, dist);
  if (phiLo >= 0) return lo;
  if (phiHi <= 0) return hi;

  let l = lo;
  let h = hi;
  for (let i = 0; i < 80; i++) {
    const m = (l + h) / 2;
    const phi = virtualValuation(m, dist);
    if (phi > 0) h = m;
    else l = m;
    if (h - l < 1e-9) break;
  }
  return (l + h) / 2;
}

/**
 * Myerson optimal auction (single-item).
 *
 * - Si todos los φ_i(bid_i) son negativos → no se vende. winner='',
 *   payment=0, reserve = φ_i^(-1)(0) del primer bidder (referencia).
 *
 * - Si el ganador es bidder i (max φ), paga el menor v' tal que
 *   reportar v' lo habría hecho ganar:
 *
 *     paymentValue = max( reserve_i, min_v { v : φ_i(v) >= max_{j≠i} φ_j(bid_j) } )
 *
 *   En el caso IID con simétria, esto es:
 *     paymentValue = max( reserve, secondHighestBid )
 *
 *   que es exactamente Vickrey con reserve.
 */
export function myersonOptimal(
  bids: Map<string, number>,
  distributions: Map<string, BidderDistribution>,
): { winner: string; payment: number; reserve: number } {
  const ids = [...bids.keys()].sort();
  if (ids.length === 0) {
    return { winner: '', payment: 0, reserve: 0 };
  }

  // Buscamos el bidder con mayor virtual valuation positivo.
  let winner = '';
  let bestPhi = 0; // estricto > 0 — el reserve viene de φ(r) = 0
  let secondPhi = 0;
  for (const id of ids) {
    const b = bids.get(id) ?? 0;
    const dist = distributions.get(id);
    if (!dist) continue;
    const phi = virtualValuation(b, dist);
    if (phi > bestPhi) {
      secondPhi = bestPhi;
      bestPhi = phi;
      winner = id;
    } else if (phi > secondPhi) {
      secondPhi = phi;
    }
  }

  // Reserve de referencia: del primer bidder (todos los i.i.d. comparten).
  const firstDist = distributions.get(ids[0]);
  if (!firstDist) {
    return { winner: '', payment: 0, reserve: 0 };
  }
  const referenceReserve = findReserve(firstDist);

  if (winner === '') {
    return { winner: '', payment: 0, reserve: referenceReserve };
  }

  const winnerDist = distributions.get(winner);
  if (!winnerDist) {
    return { winner: '', payment: 0, reserve: referenceReserve };
  }
  const winnerReserve = findReserve(winnerDist);

  // Pago: el menor valor v* tal que φ_winner(v*) >= max(secondPhi, 0).
  // En IID: φ es monótona, así que invertimos por bisección.
  const targetPhi = Math.max(secondPhi, 0);
  let payment = invertVirtual(winnerDist, targetPhi);
  if (payment < winnerReserve) payment = winnerReserve;

  // Sanity: el pago no puede exceder el bid del ganador.
  const winnerBid = bids.get(winner) ?? 0;
  if (payment > winnerBid) payment = winnerBid;

  return { winner, payment, reserve: winnerReserve };
}

/**
 * Inverte φ: encuentra v* tal que φ(v*) = target. Asume regularidad.
 * Si target <= φ(lo), devuelve lo. Si target >= φ(hi), devuelve hi.
 */
function invertVirtual(dist: BidderDistribution, target: number): number {
  const [lo, hi] = dist.domain;
  const phiLo = virtualValuation(lo, dist);
  const phiHi = virtualValuation(hi, dist);
  if (target <= phiLo) return lo;
  if (target >= phiHi) return hi;

  let l = lo;
  let h = hi;
  for (let i = 0; i < 80; i++) {
    const m = (l + h) / 2;
    const phi = virtualValuation(m, dist);
    if (phi >= target) h = m;
    else l = m;
    if (h - l < 1e-9) break;
  }
  return (l + h) / 2;
}

/**
 * Muestrea una valuation de una distribución por inverse-CDF
 * sampling. Usamos bisección sobre F.
 */
export function sampleFromDistribution(dist: BidderDistribution, u: number): number {
  // u ∈ [0,1]. Encontrar v con F(v) = u.
  const [lo, hi] = dist.domain;
  if (u <= 0) return lo;
  if (u >= 1) return hi;
  let l = lo;
  let h = hi;
  for (let i = 0; i < 80; i++) {
    const m = (l + h) / 2;
    if (dist.cdf(m) > u) h = m;
    else l = m;
    if (h - l < 1e-9) break;
  }
  return (l + h) / 2;
}

/**
 * Expected revenue de un mechanism via Monte Carlo: muestreamos
 * `samples` perfiles de bids (cada bidder draw de su distribución
 * independientemente, asumiendo truthful bidding para 2nd-price /
 * Myerson, o equilibrium bidding aproximado para 1st-price), corremos
 * el mechanism y promediamos el payment del ganador.
 *
 * Nota: para 1st-price con IID uniform[0,1] y n bidders, el bid
 * de equilibrio es b(v) = (n-1)/n · v. El caller debe pasar un
 * mechanism que ya implemente ese mapping si quiere comparar contra
 * 2nd-price truthful.
 */
export function expectedRevenue(
  mechanism: (bids: Map<string, number>) => AuctionResult,
  distributions: Map<string, BidderDistribution>,
  samples: number = 5000,
): number {
  const ids = [...distributions.keys()].sort();
  let totalRevenue = 0;
  for (let s = 0; s < samples; s++) {
    const bids = new Map<string, number>();
    for (const id of ids) {
      const dist = distributions.get(id);
      if (!dist) continue;
      const u = Math.random();
      bids.set(id, sampleFromDistribution(dist, u));
    }
    const r = mechanism(bids);
    totalRevenue += r.payment;
  }
  return totalRevenue / samples;
}

/**
 * Helper: distribución uniform sobre [a, b]. Útil para tests.
 * (No exportada en index — solo helper interno aquí; los tests
 * pueden importarlo directamente.)
 */
export function uniformDistribution(a: number, b: number): BidderDistribution {
  if (b <= a) throw new Error('uniformDistribution: b must be > a');
  const span = b - a;
  return {
    domain: [a, b],
    cdf: (v: number) => {
      if (v <= a) return 0;
      if (v >= b) return 1;
      return (v - a) / span;
    },
    pdf: (v: number) => {
      if (v < a || v > b) return 0;
      return 1 / span;
    },
  };
}
