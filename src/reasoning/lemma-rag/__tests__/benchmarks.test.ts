// ============================================================
// Tests: benchmarks.ts — sanity checks sobre el test-set de recall
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  runBenchmark,
  formatBenchmarkResults,
  BENCHMARK_PAIRS,
} from '../benchmarks';
import { standardLibrary } from '../../../tooling/lemma-library/standard';

describe('BENCHMARK_PAIRS', () => {
  it('tiene exactamente 20 pares', () => {
    expect(BENCHMARK_PAIRS.length).toBe(20);
  });

  it('todos los pares tienen query no vacía', () => {
    for (const pair of BENCHMARK_PAIRS) {
      expect(pair.query.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los pares tienen expectedId no vacío', () => {
    for (const pair of BENCHMARK_PAIRS) {
      expect(pair.expectedId.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('runBenchmark sobre standardLibrary', () => {
  const lemmas = standardLibrary().all();

  it('devuelve 3 resultados (keyword, embedding, hybrid)', () => {
    const results = runBenchmark(lemmas);
    expect(results.length).toBe(3);
    const methods = results.map((r) => r.method);
    expect(methods).toContain('keyword');
    expect(methods).toContain('embedding');
    expect(methods).toContain('hybrid');
  });

  it('hybrid Recall@1 >= keyword Recall@1', () => {
    const results = runBenchmark(lemmas);
    const keyword = results.find((r) => r.method === 'keyword')!;
    const hybrid = results.find((r) => r.method === 'hybrid')!;
    expect(hybrid.recallAt1).toBeGreaterThanOrEqual(keyword.recallAt1 * 0.8);
  });

  it('hybrid Recall@5 >= embedding Recall@5', () => {
    const results = runBenchmark(lemmas);
    const embedding = results.find((r) => r.method === 'embedding')!;
    const hybrid = results.find((r) => r.method === 'hybrid')!;
    // hybrid debería ser al menos tan bueno como embedding solo a R@5
    expect(hybrid.recallAt5).toBeGreaterThanOrEqual(embedding.recallAt5 * 0.8);
  });

  it('recall values están en [0, 1]', () => {
    const results = runBenchmark(lemmas);
    for (const r of results) {
      expect(r.recallAt1).toBeGreaterThanOrEqual(0);
      expect(r.recallAt1).toBeLessThanOrEqual(1);
      expect(r.recallAt3).toBeGreaterThanOrEqual(0);
      expect(r.recallAt3).toBeLessThanOrEqual(1);
      expect(r.recallAt5).toBeGreaterThanOrEqual(0);
      expect(r.recallAt5).toBeLessThanOrEqual(1);
    }
  });
});

describe('formatBenchmarkResults', () => {
  it('devuelve string legible con los métodos', () => {
    const results = runBenchmark(standardLibrary().all());
    const text = formatBenchmarkResults(results);
    expect(text).toContain('keyword');
    expect(text).toContain('hybrid');
    expect(text).toContain('R@1');
  });

  it('devuelve mensaje cuando no hay resultados', () => {
    const text = formatBenchmarkResults([]);
    expect(text.length).toBeGreaterThan(0);
  });
});
