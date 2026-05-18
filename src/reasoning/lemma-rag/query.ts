// ============================================================
// query.ts — API pública del sistema RAG
//
// Expone:
//   - LemmaRAG: clase principal que encapsula store + retrieval
//   - queryLemmas: función de conveniencia stateless (instancia lazy)
// ============================================================

import type { CuratedLemma } from '../../tooling/lemma-library/types';
import type { EmbeddingProvider, QueryResult, RAGOptions } from './types';
import { IndexStore } from './index-store';
import { retrieveTopK } from './retrieval';
import { defaultProvider } from './embedding';

const DEFAULT_K = 5;
const DEFAULT_COSINE_WEIGHT = 0.7;

/**
 * LemmaRAG — instancia principal del sistema RAG.
 *
 * Flujo de uso:
 *   const rag = new LemmaRAG();
 *   rag.index(lemmas);
 *   const results = rag.query('negation implies double negation', { k: 3 });
 */
export class LemmaRAG {
  private store: IndexStore;

  constructor(provider: EmbeddingProvider = defaultProvider) {
    this.store = new IndexStore(provider);
  }

  /** Indexa una lista de lemas. Idempotente por id. */
  index(lemmas: CuratedLemma[]): void {
    this.store.addAll(lemmas);
  }

  /** Número de lemas indexados. */
  size(): number {
    return this.store.size();
  }

  /**
   * Realiza una búsqueda semántica híbrida.
   *
   * Flujo:
   *   1. Embed(query) → query_vec
   *   2. Cosine similarity contra todos los vectores en el store
   *   3. BM25 sobre los tokens de la query
   *   4. Score híbrido: 0.7 * cosine + 0.3 * bm25_norm
   *   5. Top-k con score ≥ minScore
   */
  query(queryText: string, opts: RAGOptions = {}): QueryResult[] {
    const k = opts.k ?? DEFAULT_K;
    const cosineWeight = opts.cosineWeight ?? DEFAULT_COSINE_WEIGHT;
    const minScore = opts.minScore ?? 0;

    if (this.store.size() === 0) return [];

    const queryVec = this.store.embedQuery(queryText);

    return retrieveTopK(queryText, queryVec, this.store, k, cosineWeight, opts.domain, minScore);
  }

  /** Acceso directo al IndexStore (para tests y benchmarks). */
  getStore(): IndexStore {
    return this.store;
  }
}

// --------------- Instancia lazy global (stateful) ----------------------

let _globalRAG: LemmaRAG | undefined;

/**
 * Retorna (creando si necesario) la instancia global del RAG.
 * Útil para uso quick-start sin gestionar el ciclo de vida.
 */
export function globalRAG(): LemmaRAG {
  if (!_globalRAG) _globalRAG = new LemmaRAG();
  return _globalRAG;
}

/** Resetea la instancia global (útil en tests). */
export function resetGlobalRAG(): void {
  _globalRAG = undefined;
}

/**
 * Función de conveniencia: indexa lemas en la instancia global y
 * ejecuta la query. Si `rag` no se pasa, usa la global.
 *
 * @example
 *   const results = queryLemmas(standardLibrary().all(), 'double negation');
 */
export function queryLemmas(
  lemmas: CuratedLemma[],
  queryText: string,
  opts: RAGOptions = {},
  rag?: LemmaRAG,
): QueryResult[] {
  const instance = rag ?? new LemmaRAG();
  instance.index(lemmas);
  return instance.query(queryText, opts);
}
