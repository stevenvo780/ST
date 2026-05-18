// ============================================================
// IndexStore — índice in-memory de lemas embebidos
//
// Almacena EmbeddedLemma[] + inverted index de tokens para BM25.
// Soporta inserción, borrado y búsqueda por embedding o por token.
// ============================================================

import type { CuratedLemma } from '../../tooling/lemma-library/types';
import type { EmbeddedLemma, Embedding, EmbeddingProvider } from './types';
import { tokenize } from '../../tooling/lemma-library/tokenize';

/** Construye el term-frequency bag para un lema (name + tags + statement). */
function buildTermFreq(lemma: CuratedLemma): { termFreq: Map<string, number>; docLength: number } {
  const tokens = [
    ...tokenize(lemma.name),
    ...lemma.tags.flatMap((t) => tokenize(t)),
    ...tokenize(lemma.statement),
  ];
  const termFreq = new Map<string, number>();
  for (const tok of tokens) {
    termFreq.set(tok, (termFreq.get(tok) ?? 0) + 1);
  }
  return { termFreq, docLength: tokens.length };
}

export class IndexStore {
  private entries: EmbeddedLemma[] = [];
  private byId: Map<string, EmbeddedLemma> = new Map();
  /** inverted index: token → set of lemma IDs (para BM25). */
  private invertedIndex: Map<string, Set<string>> = new Map();
  /** document frequency: token → número de documentos que lo contienen. */
  private docFreq: Map<string, number> = new Map();

  constructor(private readonly provider: EmbeddingProvider) {}

  /** Añade un lema al índice. Idempotente si ya existe (mismo id). */
  add(lemma: CuratedLemma): EmbeddedLemma {
    if (this.byId.has(lemma.id)) {
      return this.byId.get(lemma.id)!;
    }
    const embedding = this.provider.embed(lemma.statement);
    const { termFreq, docLength } = buildTermFreq(lemma);
    const entry: EmbeddedLemma = { lemma, embedding, termFreq, docLength };

    this.entries.push(entry);
    this.byId.set(lemma.id, entry);

    // Actualizar inverted index + docFreq
    for (const tok of termFreq.keys()) {
      let bucket = this.invertedIndex.get(tok);
      if (!bucket) {
        bucket = new Set();
        this.invertedIndex.set(tok, bucket);
      }
      bucket.add(lemma.id);
      this.docFreq.set(tok, (this.docFreq.get(tok) ?? 0) + 1);
    }

    return entry;
  }

  /** Añade múltiples lemas. */
  addAll(lemmas: CuratedLemma[]): void {
    for (const l of lemmas) this.add(l);
  }

  /** Devuelve todos los EmbeddedLemma. */
  all(): EmbeddedLemma[] {
    return this.entries;
  }

  /** Busca por ID. */
  getById(id: string): EmbeddedLemma | undefined {
    return this.byId.get(id);
  }

  /** Número de lemas indexados. */
  size(): number {
    return this.entries.length;
  }

  /** Devuelve el document frequency de un token (para BM25 IDF). */
  getDocFreq(token: string): number {
    return this.docFreq.get(token) ?? 0;
  }

  /** Total de documentos. */
  totalDocs(): number {
    return this.entries.length;
  }

  /** Average document length (para BM25). */
  avgDocLength(): number {
    if (this.entries.length === 0) return 1;
    let total = 0;
    for (const e of this.entries) total += e.docLength;
    return total / this.entries.length;
  }

  /** Filtra los entries por dominio. */
  byDomain(domain: string): EmbeddedLemma[] {
    return this.entries.filter((e) => e.lemma.domain === domain);
  }

  /** Devuelve los IDs de lemas que contienen el token (inverted index). */
  docsForToken(token: string): Set<string> {
    return this.invertedIndex.get(token) ?? new Set();
  }

  /** Devuelve el embedding de un vector de consulta generado por el provider. */
  embedQuery(text: string): Embedding {
    return this.provider.embed(text);
  }
}
