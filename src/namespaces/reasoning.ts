/**
 * Namespace: Reasoning
 *
 * Razonamiento no-monótono, probabilístico, abductivo y herramientas
 * de manipulación simbólica. Argumentación Dung, revisión de creencias AGM,
 * abducción, lógica de Markov, redes Bayesianas, citation reasoning,
 * análisis hyperreal, cache de teoremas, anti-unificación, term-rewriting.
 *
 * Importa así:
 *   import { Reasoning } from '@stevenvo780/st-lang';
 *   const ext = Reasoning.argumentation.computeExtensions(af, 'grounded');
 *   const cited = Reasoning.citationReasoning.deriveWithCitations(claims, ev);
 */

import * as argumentation from '../argumentation';
import * as beliefRevision from '../belief-revision';
import * as abduction from '../runtime/abduction';
import * as markovLogic from '../runtime/markov-logic';
import * as bayesian from '../runtime/bayesian';
import * as citationReasoning from '../citation-reasoning';
import * as hyperreal from '../hyperreal';
import * as antiUnification from '../runtime/anti-unification';
import * as termRewriting from '../runtime/term-rewriting';

export {
  argumentation,
  beliefRevision,
  abduction,
  markovLogic,
  bayesian,
  citationReasoning,
  hyperreal,
  antiUnification,
  termRewriting,
};

// Theorem cache (proof reuse persistente) — re-export plano por uso frecuente.
export { TheoremCache, tryReuseProof } from '../runtime/theorem-cache';
export type {
  CachedTheorem,
  CacheOptions as TheoremCacheOptions,
  CacheStats as TheoremCacheStats,
  ReuseResult as TheoremReuseResult,
} from '../runtime/theorem-cache';
