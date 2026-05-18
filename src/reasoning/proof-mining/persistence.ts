// ============================================================
// ST Proof Mining — Persistencia en theorem-cache
// ============================================================
//
// Bridge entre los MinedLemma y el TheoremCache existente. La idea:
// los lemmas extraídos viven con primera clase en el cache, igual
// que cualquier teorema probado, y se benefician del α-canonical
// hashing + LRU + persistencia a disco.
//
// El mapping es directo:
//
//   MinedLemma.id        ← TheoremCache id (recalculado)
//   MinedLemma.statement → CachedTheorem.formula
//   MinedLemma.proof     → CachedTheorem.proof (estructura completa)
//   profile              → CachedTheorem.profile
//   metadata.provedBy    = 'proof-mining'
//   metadata.ms          = subproof.cost
//
// `persistLemmas(lemmas, cache)` guarda. `recoverLemmas(cache,
// profile)` recupera todos los mined-lemmas de ese profile.

import { TheoremCache, type CachedTheorem } from '../../runtime/theorem-cache';
import type { MinedLemma } from './types';

/**
 * Marca metadata.provedBy que identifica un lemma como minado.
 */
export const MINED_LEMMA_PROVER = 'proof-mining';

/**
 * Guarda una lista de lemmas minados en el cache. Devuelve los ids
 * (post-hash del cache, que puede diferir si el cache normaliza la
 * fórmula de forma distinta).
 *
 * `now` es inyectable para tests deterministas (default `Date.now()`).
 */
export function persistLemmas(
  lemmas: MinedLemma[],
  cache: TheoremCache,
  now: () => number = Date.now,
): string[] {
  const ids: string[] = [];
  for (const l of lemmas) {
    const cached: Omit<CachedTheorem, 'id'> = {
      formula: l.statement,
      normalizedFormula: cache.canonicalize(l.statement),
      profile: l.proof.profile,
      proof: {
        // Estructura del proof completo, sin perder metadata de mining.
        steps: l.proof.steps,
        conclusion: l.proof.conclusion,
        premises: l.proof.premises,
        abstractionLevel: l.abstractionLevel,
        usageCount: l.usageCount,
        savings: l.savings,
        sourceProofs: l.sourceProofs,
      },
      verifier: undefined,
      metadata: {
        provedAt: new Date(now()).toISOString(),
        ms: Math.round(l.proof.cost),
        provedBy: MINED_LEMMA_PROVER,
      },
    };
    const id = cache.store(cached);
    ids.push(id);
  }
  return ids;
}

/**
 * Reconstruye un MinedLemma desde una entry cacheada (best-effort).
 * Si la entry no fue persistida vía `persistLemmas`, devuelve
 * `undefined`.
 */
export function recoverLemmaFromCache(theorem: CachedTheorem): MinedLemma | undefined {
  if (theorem.metadata.provedBy !== MINED_LEMMA_PROVER) return undefined;
  const proof = theorem.proof as {
    steps?: unknown;
    conclusion?: unknown;
    premises?: unknown;
    abstractionLevel?: unknown;
    usageCount?: unknown;
    savings?: unknown;
    sourceProofs?: unknown;
  };
  if (
    !proof ||
    typeof proof !== 'object' ||
    !Array.isArray(proof.steps) ||
    typeof proof.conclusion !== 'string' ||
    !Array.isArray(proof.premises) ||
    typeof proof.abstractionLevel !== 'number' ||
    typeof proof.usageCount !== 'number' ||
    typeof proof.savings !== 'number' ||
    !Array.isArray(proof.sourceProofs)
  ) {
    return undefined;
  }
  return {
    id: theorem.id,
    statement: theorem.formula,
    proof: {
      id: theorem.id,
      conclusion: proof.conclusion,
      premises: proof.premises as string[],
      profile: theorem.profile,
      steps: proof.steps as MinedLemma['proof']['steps'],
      cost: theorem.metadata.ms,
    },
    abstractionLevel: proof.abstractionLevel,
    usageCount: proof.usageCount,
    savings: proof.savings,
    sourceProofs: proof.sourceProofs as string[],
  };
}

/**
 * Recupera lemmas minados desde el cache a partir de una lista de
 * statements canónicos esperados. Para cada `(statement, profile)`
 * que efectivamente esté cacheado por `persistLemmas`, devuelve el
 * MinedLemma reconstruido.
 *
 * Esta API existe porque `TheoremCache` no expone iteración total
 * por design (LRU + persistencia). El caller que persistió los
 * lemmas conoce sus statements; los pasa aquí para recuperarlos.
 */
export function recoverLemmas(
  cache: TheoremCache,
  entries: Array<{ statement: string; profile: string }>,
): MinedLemma[] {
  const out: MinedLemma[] = [];
  for (const e of entries) {
    const th = cache.retrieve(e.statement, e.profile);
    if (th === undefined) continue;
    const recovered = recoverLemmaFromCache(th);
    if (recovered !== undefined) out.push(recovered);
  }
  return out;
}
