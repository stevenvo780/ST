// ============================================================
// Índice TF-IDF sobre LemmaLibrary
//
// Construye un vector espaciable por documento (lema) mezclando
// name + tags + statement. Ranking de consultas via cosine
// similarity. Determinístico, sin dependencias externas.
// ============================================================

import type { CuratedLemma, SemanticSearchHit, TfIdfDocument, TfIdfIndex } from './types';
import type { LemmaLibrary } from './library';
import { tokenize } from './tokenize';

function lemmaTokens(lemma: CuratedLemma): string[] {
  return [
    ...tokenize(lemma.name),
    ...lemma.tags.flatMap((t) => tokenize(t)),
    ...tokenize(lemma.statement),
  ];
}

export function buildIndex(library: LemmaLibrary): TfIdfIndex {
  const lemmas = library.all();
  const lemmasMap = new Map<string, CuratedLemma>();
  const documents: TfIdfDocument[] = [];
  const docFreq = new Map<string, number>();

  for (const lemma of lemmas) {
    lemmasMap.set(lemma.id, lemma);
    const tokens = lemmaTokens(lemma);
    const termFreq = new Map<string, number>();
    for (const tok of tokens) {
      termFreq.set(tok, (termFreq.get(tok) ?? 0) + 1);
    }
    for (const term of termFreq.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
    documents.push({ lemmaId: lemma.id, termFreq, length: tokens.length });
  }

  return { documents, docFreq, totalDocs: lemmas.length, lemmas: lemmasMap };
}

function idf(term: string, index: TfIdfIndex): number {
  const df = index.docFreq.get(term) ?? 0;
  if (df === 0) return 0;
  // suavizado clásico: log((N + 1) / (df + 1)) + 1
  return Math.log((index.totalDocs + 1) / (df + 1)) + 1;
}

function vectorize(tokens: string[], index: TfIdfIndex): Map<string, number> {
  const tf = new Map<string, number>();
  for (const tok of tokens) {
    tf.set(tok, (tf.get(tok) ?? 0) + 1);
  }
  const vec = new Map<string, number>();
  for (const [term, freq] of tf) {
    vec.set(term, freq * idf(term, index));
  }
  return vec;
}

function docVector(doc: TfIdfDocument, index: TfIdfIndex): Map<string, number> {
  const vec = new Map<string, number>();
  for (const [term, freq] of doc.termFreq) {
    vec.set(term, freq * idf(term, index));
  }
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [, w] of a) normA += w * w;
  for (const [, w] of b) normB += w * w;
  if (normA === 0 || normB === 0) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, w] of small) {
    const other = big.get(term);
    if (other !== undefined) dot += w * other;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function semanticSearch(index: TfIdfIndex, query: string, k = 5): SemanticSearchHit[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const qVec = vectorize(queryTokens, index);
  const hits: SemanticSearchHit[] = [];
  for (const doc of index.documents) {
    const lemma = index.lemmas.get(doc.lemmaId);
    if (!lemma) continue;
    const dVec = docVector(doc, index);
    const score = cosine(qVec, dVec);
    if (score > 0) hits.push({ lemma, score });
  }
  hits.sort((a, b) => b.score - a.score || a.lemma.id.localeCompare(b.lemma.id));
  return hits.slice(0, k);
}
