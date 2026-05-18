// ============================================================
// ST Proof Mining — Ranking de lemmas extraídos
// ============================================================
//
// Score de un lemma = combinación lineal de:
//   - usefulness  : usageCount (cuánto se reusa)
//   - savings     : sum(cost) ahorrado por reusos
//   - generality  : abstractionLevel (cuán abstracto es)
//
// Default weights privilegian savings (impacto directo en tiempo),
// luego frecuencia (señal de reuso real), luego generalidad
// (un lemma muy abstracto es valioso aunque su saving inmediato
// sea bajo, porque admite más instancias).
//
// El caller puede sobreescribir pesos para experimentar.

import type { MinedLemma } from './types';

export interface RankingWeights {
  /** Peso del saving total. Default 0.5. */
  savings?: number;
  /** Peso del usage count (normalizado log). Default 0.3. */
  usage?: number;
  /** Peso del abstraction level. Default 0.2. */
  generality?: number;
}

const DEFAULT_WEIGHTS: Required<RankingWeights> = {
  savings: 0.5,
  usage: 0.3,
  generality: 0.2,
};

function resolveWeights(w?: RankingWeights): Required<RankingWeights> {
  return {
    savings: w?.savings ?? DEFAULT_WEIGHTS.savings,
    usage: w?.usage ?? DEFAULT_WEIGHTS.usage,
    generality: w?.generality ?? DEFAULT_WEIGHTS.generality,
  };
}

/**
 * Score numérico de un lemma según los pesos. Mayor = mejor.
 *
 * Normalizaciones:
 *   - savings: log(1 + savings)
 *   - usage:   log(1 + usageCount)
 *   - generality: abstractionLevel (raw)
 */
export function scoreLemma(lemma: MinedLemma, weights?: RankingWeights): number {
  const w = resolveWeights(weights);
  const sv = Math.log1p(Math.max(0, lemma.savings));
  const uc = Math.log1p(Math.max(0, lemma.usageCount));
  const ab = Math.max(0, lemma.abstractionLevel);
  return w.savings * sv + w.usage * uc + w.generality * ab;
}

/**
 * Ordena los lemmas de mayor a menor score. NO muta el array
 * original. En empates: usageCount desc, luego id asc para
 * determinismo.
 */
export function rankLemmas(lemmas: MinedLemma[], weights?: RankingWeights): MinedLemma[] {
  const w = resolveWeights(weights);
  const decorated = lemmas.map((l) => ({ l, s: scoreLemma(l, w) }));
  decorated.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    if (b.l.usageCount !== a.l.usageCount) return b.l.usageCount - a.l.usageCount;
    return a.l.id.localeCompare(b.l.id);
  });
  return decorated.map((d) => d.l);
}

/**
 * Filtra los top-K lemmas por score.
 */
export function topK(lemmas: MinedLemma[], k: number, weights?: RankingWeights): MinedLemma[] {
  return rankLemmas(lemmas, weights).slice(0, Math.max(0, k));
}
