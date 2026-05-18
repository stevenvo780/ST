// ============================================================
// lemma-rag — entrypoint público
//
// Sistema RAG semántico sobre la biblioteca de lemas ST.
// Stage 1: HashEmbedding determinístico R^256 (sin deps de red).
// Stage 2 (pendiente): ONNX transformers (MiniLM-L6).
// ============================================================

export type { Embedding, EmbeddedLemma, QueryResult, RAGOptions, EmbeddingProvider, RecallResult } from './types';
export { EMBEDDING_DIM } from './types';

export { hashEmbed, normalizeEmbedding, HashEmbeddingProvider, defaultProvider } from './embedding';

export { IndexStore } from './index-store';

export { cosineSimilarity, bm25Score, hybridScore, retrieveTopK } from './retrieval';

export { LemmaRAG, queryLemmas, globalRAG, resetGlobalRAG } from './query';

export {
  runBenchmark,
  formatBenchmarkResults,
  BENCHMARK_PAIRS,
} from './benchmarks';
export type { BenchmarkPair } from './benchmarks';
