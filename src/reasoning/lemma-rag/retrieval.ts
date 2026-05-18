// ============================================================
// Retrieval — cosine similarity + BM25 hybrid scoring
//
// Implementa:
//   - cosineSimilarity(a, b): dot product de vectores ya normalizados
//   - bm25Score(query, doc, store): BM25 Okapi sobre el inverted index
//   - hybridScore: 0.7 * cosine + 0.3 * bm25_normalizado
// ============================================================

import type { Embedding, EmbeddedLemma, QueryResult } from './types';
import type { IndexStore } from './index-store';
import { tokenize } from '../../tooling/lemma-library/tokenize';

// BM25 parámetros estándar
const BM25_K1 = 1.5;
const BM25_B = 0.75;

/**
 * Cosine similarity entre dos vectores NORMALIZADOS (norma L2 = 1).
 * En ese caso, es simplemente el producto punto.
 * Devuelve un valor en [-1, 1], saturado a [0, 1] para usarse como score.
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  // saturar a [0, 1] — embeddings de texto raramente son negativos
  return Math.max(0, Math.min(1, dot));
}

/**
 * IDF suavizado estándar: log((N - df + 0.5) / (df + 0.5) + 1)
 * Siempre positivo.
 */
function idf(df: number, N: number): number {
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

/**
 * BM25 Okapi score de una query contra un documento en el store.
 * Devuelve un score ≥ 0.
 */
export function bm25Score(queryText: string, doc: EmbeddedLemma, store: IndexStore): number {
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0) return 0;

  const N = store.totalDocs();
  if (N === 0) return 0;
  const avgdl = store.avgDocLength();
  const dl = doc.docLength;

  let score = 0;
  const seen = new Set<string>();

  for (const tok of queryTokens) {
    if (seen.has(tok)) continue;
    seen.add(tok);

    const tf = doc.termFreq.get(tok) ?? 0;
    if (tf === 0) continue;

    const df = store.getDocFreq(tok);
    const termIdf = idf(df, N);

    // BM25 TF component: tf * (k1 + 1) / (tf + k1 * (1 - b + b * dl/avgdl))
    const tfComp = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (dl / avgdl)));

    score += termIdf * tfComp;
  }

  return score;
}

/**
 * Score híbrido: `cosineWeight * cosine + (1 - cosineWeight) * bm25_norm`.
 *
 * BM25 se normaliza dividiendo por `maxBm25` (máximo observado en el batch).
 * Si maxBm25 === 0, el componente BM25 aporta 0.
 */
export function hybridScore(
  cosine: number,
  bm25: number,
  maxBm25: number,
  cosineWeight: number,
): number {
  const bm25Norm = maxBm25 > 0 ? bm25 / maxBm25 : 0;
  return cosineWeight * cosine + (1 - cosineWeight) * bm25Norm;
}

/**
 * Recupera los top-k lemas del store para una query dada.
 *
 * @param queryText  - Texto de la query (fórmula o descripción)
 * @param queryVec   - Embedding pre-calculado de queryText
 * @param store      - IndexStore con los lemas indexados
 * @param k          - Número de resultados
 * @param cosineWeight - Peso del componente cosine (default 0.7)
 * @param domain     - Filtro opcional de dominio
 * @param minScore   - Score mínimo para incluir
 */
export function retrieveTopK(
  queryText: string,
  queryVec: Embedding,
  store: IndexStore,
  k: number,
  cosineWeight: number,
  domain?: string,
  minScore = 0,
): QueryResult[] {
  const candidates = domain ? store.byDomain(domain) : store.all();
  if (candidates.length === 0) return [];

  // Paso 1: calcular scores individuales
  const intermediate: Array<{
    entry: EmbeddedLemma;
    cosine: number;
    bm25: number;
  }> = [];

  let maxBm25 = 0;
  for (const entry of candidates) {
    const cos = cosineSimilarity(queryVec, entry.embedding);
    const bm = bm25Score(queryText, entry, store);
    if (bm > maxBm25) maxBm25 = bm;
    intermediate.push({ entry, cosine: cos, bm25: bm });
  }

  // Paso 2: calcular score híbrido y filtrar
  const results: QueryResult[] = [];
  for (const { entry, cosine, bm25: bm } of intermediate) {
    const score = hybridScore(cosine, bm, maxBm25, cosineWeight);
    if (score >= minScore) {
      results.push({
        lemma: entry.lemma,
        score,
        cosineScore: cosine,
        bm25Score: bm,
      });
    }
  }

  // Paso 3: ordenar por score desc, desempate por id
  results.sort((a, b) => b.score - a.score || a.lemma.id.localeCompare(b.lemma.id));
  return results.slice(0, k);
}
