/**
 * MDX bridge — tipos públicos para conversión bidireccional Claim[] ↔ MDX.
 *
 * Una Claim se serializa en MDX con dos formatos posibles:
 *
 *   1. "comment" (compacto, una sola línea, atributos HTML):
 *      <!-- st:claim id="c1" profile="classical.propositional" formula="A->B" deps="c0" -->
 *
 *   2. "fence" (legible, multi-línea):
 *      ```st-claim id=c1 profile=classical.propositional deps=c0
 *      A->B
 *      ```
 *
 * En ambos formatos los IDs son únicos por documento. El parser conserva el
 * texto crudo del bloque en `rawBlock` para poder reescribir o comparar.
 */

import type { Claim } from '../types';

export interface MDXClaim extends Claim {
  /** Texto completo del bloque tal como apareció en el MDX original. */
  rawBlock: string;
}

export type MDXClaimTemplate = 'comment' | 'fence';

export interface ClaimsToMDXOptions {
  /** Formato a emitir. Default: 'fence'. */
  template?: MDXClaimTemplate;
}

export interface MDXDelta {
  added: Claim[];
  removed: string[]; // claim ids removidos
  modified: Array<{ id: string; before: Claim; after: Claim }>;
}

/**
 * Warning emitido por el parser cuando encuentra un bloque malformado.
 * El parser no lanza excepciones: ignora el bloque problemático y acumula
 * warnings para diagnóstico.
 */
export interface MDXParseWarning {
  /** Posición aproximada (offset en el string de entrada). */
  offset: number;
  /** Mensaje legible describiendo qué falló. */
  message: string;
  /** Snippet del texto problemático (truncado). */
  snippet: string;
}

export interface MDXParseResult {
  claims: MDXClaim[];
  warnings: MDXParseWarning[];
}
