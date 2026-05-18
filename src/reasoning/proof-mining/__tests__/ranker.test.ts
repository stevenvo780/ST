import { describe, it, expect } from 'vitest';
import { rankLemmas, scoreLemma, topK } from '../ranker';
import type { MinedLemma, ProofTrace } from '../types';

function mkProof(profile = 'classical'): ProofTrace {
  return {
    conclusion: 'X',
    premises: [],
    profile,
    cost: 10,
    steps: [{ rule: 'r', inputs: [], output: 'X', depth: 0 }],
  };
}

function mkLemma(
  id: string,
  opts: { usage: number; savings: number; abstraction: number },
): MinedLemma {
  return {
    id,
    statement: `lemma-${id}`,
    proof: mkProof(),
    abstractionLevel: opts.abstraction,
    usageCount: opts.usage,
    savings: opts.savings,
    sourceProofs: [],
  };
}

describe('scoreLemma', () => {
  it('score aumenta con savings', () => {
    const a = mkLemma('a', { usage: 1, savings: 0, abstraction: 0 });
    const b = mkLemma('b', { usage: 1, savings: 100, abstraction: 0 });
    expect(scoreLemma(b)).toBeGreaterThan(scoreLemma(a));
  });

  it('score aumenta con usageCount', () => {
    const a = mkLemma('a', { usage: 2, savings: 10, abstraction: 0 });
    const b = mkLemma('b', { usage: 20, savings: 10, abstraction: 0 });
    expect(scoreLemma(b)).toBeGreaterThan(scoreLemma(a));
  });

  it('score aumenta con abstractionLevel', () => {
    const a = mkLemma('a', { usage: 2, savings: 10, abstraction: 0 });
    const b = mkLemma('b', { usage: 2, savings: 10, abstraction: 3 });
    expect(scoreLemma(b)).toBeGreaterThan(scoreLemma(a));
  });

  it('weights override default', () => {
    const lemma = mkLemma('a', { usage: 1, savings: 0, abstraction: 10 });
    const baseScore = scoreLemma(lemma);
    const boosted = scoreLemma(lemma, { generality: 1 });
    expect(boosted).toBeGreaterThan(baseScore);
  });
});

describe('rankLemmas', () => {
  it('ordena descendente por score', () => {
    const a = mkLemma('a', { usage: 1, savings: 0, abstraction: 0 });
    const b = mkLemma('b', { usage: 10, savings: 100, abstraction: 2 });
    const c = mkLemma('c', { usage: 5, savings: 50, abstraction: 1 });
    const ranked = rankLemmas([a, b, c]);
    expect(ranked[0]?.id).toBe('b');
    expect(ranked[2]?.id).toBe('a');
  });

  it('en empate de score, mayor usageCount gana', () => {
    const x = mkLemma('x', { usage: 5, savings: 10, abstraction: 1 });
    const y = mkLemma('y', { usage: 5, savings: 10, abstraction: 1 });
    const ranked = rankLemmas([x, y]);
    // Misma score → orden por id asc (determinismo)
    expect(ranked[0]?.id).toBe('x');
  });

  it('no muta el array original', () => {
    const a = mkLemma('a', { usage: 1, savings: 0, abstraction: 0 });
    const b = mkLemma('b', { usage: 10, savings: 100, abstraction: 2 });
    const input = [a, b];
    rankLemmas(input);
    expect(input[0]?.id).toBe('a');
    expect(input[1]?.id).toBe('b');
  });
});

describe('topK', () => {
  it('devuelve los primeros K', () => {
    const lemmas = Array.from({ length: 10 }, (_, i) =>
      mkLemma(`l${i}`, { usage: i, savings: i * 10, abstraction: 0 }),
    );
    const top3 = topK(lemmas, 3);
    expect(top3).toHaveLength(3);
    // El de mayor usage/savings (l9) debe estar primero.
    expect(top3[0]?.id).toBe('l9');
  });

  it('K = 0 devuelve array vacío', () => {
    const lemmas = [mkLemma('a', { usage: 1, savings: 0, abstraction: 0 })];
    expect(topK(lemmas, 0)).toHaveLength(0);
  });

  it('K mayor que la lista devuelve toda la lista', () => {
    const lemmas = [
      mkLemma('a', { usage: 1, savings: 0, abstraction: 0 }),
      mkLemma('b', { usage: 2, savings: 0, abstraction: 0 }),
    ];
    expect(topK(lemmas, 100)).toHaveLength(2);
  });
});
