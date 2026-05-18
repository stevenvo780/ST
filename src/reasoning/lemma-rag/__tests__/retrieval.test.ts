// ============================================================
// Tests: retrieval — cosineSimilarity + BM25 + hybridScore
// ============================================================

import { describe, it, expect } from 'vitest';
import { cosineSimilarity, bm25Score, hybridScore, retrieveTopK } from '../retrieval';
import { hashEmbed } from '../embedding';
import { EMBEDDING_DIM } from '../types';
import { IndexStore } from '../index-store';
import { HashEmbeddingProvider } from '../embedding';
import type { CuratedLemma } from '../../../tooling/lemma-library/types';

// ---- helpers ----

function makeVec(values: number[]): Float32Array {
  const v = new Float32Array(EMBEDDING_DIM);
  for (let i = 0; i < values.length && i < EMBEDDING_DIM; i++) v[i] = values[i] ?? 0;
  // normalize
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += (v[i] ?? 0) ** 2;
  if (norm > 0) {
    const invNorm = 1 / Math.sqrt(norm);
    for (let i = 0; i < v.length; i++) v[i] = (v[i] ?? 0) * invNorm;
  }
  return v;
}

const sampleLemmas: CuratedLemma[] = [
  {
    id: 'prop.identity',
    name: 'Identity',
    statement: 'P → P',
    domain: 'propositional',
    tags: ['identity', 'implication'],
    difficulty: 'trivial',
  },
  {
    id: 'prop.and-comm',
    name: 'Commutativity of conjunction',
    statement: '(P ∧ Q) ↔ (Q ∧ P)',
    domain: 'propositional',
    tags: ['commutativity', 'conjunction'],
    difficulty: 'trivial',
  },
  {
    id: 'arith.add-comm',
    name: 'Commutativity of addition',
    statement: '∀m n. m + n = n + m',
    domain: 'arithmetic',
    tags: ['commutativity', 'addition'],
    difficulty: 'medium',
  },
];

function makeStore(lemmas: CuratedLemma[] = sampleLemmas): IndexStore {
  const store = new IndexStore(new HashEmbeddingProvider());
  store.addAll(lemmas);
  return store;
}

describe('cosineSimilarity', () => {
  it('vector consigo mismo tiene similarity 1.0', () => {
    const v = hashEmbed('P → P');
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it('dos vectores iguales tienen similarity 1.0', () => {
    const v1 = hashEmbed('P ∧ Q');
    const v2 = hashEmbed('P ∧ Q');
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
  });

  it('similarity está acotada en [0, 1]', () => {
    const v1 = hashEmbed('P → Q');
    const v2 = hashEmbed('∀x. P(x)');
    const s = cosineSimilarity(v1, v2);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('vectores de distinto length devuelven 0', () => {
    const v1 = new Float32Array(10);
    const v2 = new Float32Array(20);
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });

  it('P∧Q vs Q∧P tienen alta similarity', () => {
    const v1 = hashEmbed('P ∧ Q');
    const v2 = hashEmbed('Q ∧ P');
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.5);
  });
});

describe('bm25Score', () => {
  it('score > 0 cuando query coincide con tokens del documento', () => {
    const store = makeStore();
    const doc = store.getById('prop.and-comm')!;
    const score = bm25Score('commutativity conjunction', doc, store);
    expect(score).toBeGreaterThan(0);
  });

  it('score = 0 cuando query sin tokens comunes', () => {
    const store = makeStore();
    const doc = store.getById('prop.identity')!;
    const score = bm25Score('xyz abc def', doc, store);
    expect(score).toBe(0);
  });

  it('score ≥ 0 siempre', () => {
    const store = makeStore();
    const doc = store.getById('arith.add-comm')!;
    const score = bm25Score('naturals addition induction', doc, store);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('hybridScore', () => {
  it('hybrid con cosineWeight=1 es igual al cosine', () => {
    expect(hybridScore(0.8, 5, 10, 1.0)).toBeCloseTo(0.8, 5);
  });

  it('hybrid con cosineWeight=0 es bm25 normalizado', () => {
    expect(hybridScore(0.8, 5, 10, 0.0)).toBeCloseTo(0.5, 5);
  });

  it('hybrid con maxBm25=0 no produce NaN', () => {
    const s = hybridScore(0.6, 0, 0, 0.7);
    expect(Number.isFinite(s)).toBe(true);
  });
});

describe('retrieveTopK', () => {
  it('devuelve top-k resultados ordenados por score desc', () => {
    const store = makeStore();
    const query = 'commutativity conjunction';
    const queryVec = hashEmbed(query);
    const results = retrieveTopK(query, queryVec, store, 3, 0.7);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it('k limita el número de resultados', () => {
    const store = makeStore();
    const query = 'implication';
    const queryVec = hashEmbed(query);
    const results = retrieveTopK(query, queryVec, store, 1, 0.7);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('filtro de dominio restringe resultados', () => {
    const store = makeStore();
    const query = 'commutativity';
    const queryVec = hashEmbed(query);
    const results = retrieveTopK(query, queryVec, store, 5, 0.7, 'arithmetic');
    for (const r of results) {
      expect(r.lemma.domain).toBe('arithmetic');
    }
  });
});
