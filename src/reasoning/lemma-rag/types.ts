// ============================================================
// lemma-rag — Tipos públicos
//
// Tipos para el sistema RAG semántico sobre la biblioteca de lemas.
// Embeddings determinísticos basados en AST features (Stage 1).
// Stage 2 (ONNX transformers) pendiente de aprobación.
// ============================================================

import type { CuratedLemma } from '../../tooling/lemma-library/types';

/** Dimensión del espacio de embedding (R^DIM). */
export const EMBEDDING_DIM = 256;

/**
 * Vector de embedding: arreglo de DIM floats en R^DIM.
 * Siempre normalizado a norma 1 (L2) antes de ser usado en comparaciones.
 */
export type Embedding = Float32Array;

/** Lema con su embedding pre-calculado. */
export interface EmbeddedLemma {
  lemma: CuratedLemma;
  embedding: Embedding;
  /** BM25 token bag para el componente léxico del scoring híbrido. */
  termFreq: Map<string, number>;
  /** Total de tokens en este documento (para BM25). */
  docLength: number;
}

/** Un resultado de búsqueda con scores desglosados. */
export interface QueryResult {
  lemma: CuratedLemma;
  /** Score híbrido final: 0.7 * cosine + 0.3 * bm25 (normalizado). */
  score: number;
  /** Score cosine (0..1). */
  cosineScore: number;
  /** Score BM25 antes de normalización (≥ 0). */
  bm25Score: number;
}

/** Opciones para la búsqueda RAG. */
export interface RAGOptions {
  /** Top-k resultados a devolver (default 5). */
  k?: number;
  /** Peso del componente cosine en el score híbrido (default 0.7). */
  cosineWeight?: number;
  /** Filtrar por dominio antes de buscar. */
  domain?: string;
  /** Score mínimo para incluir un resultado (default 0). */
  minScore?: number;
}

/** Provider de embeddings (interface para Stage 2). */
export interface EmbeddingProvider {
  embed(text: string): Embedding;
  dim: number;
}

/** Resultado del benchmark de recall. */
export interface RecallResult {
  method: 'keyword' | 'embedding' | 'hybrid';
  recallAt1: number;
  recallAt3: number;
  recallAt5: number;
  totalPairs: number;
}
