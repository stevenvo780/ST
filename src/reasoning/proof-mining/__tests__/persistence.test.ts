import { describe, it, expect, beforeEach } from 'vitest';
import { TheoremCache } from '../../../runtime/theorem-cache';
import {
  persistLemmas,
  recoverLemmas,
  recoverLemmaFromCache,
  MINED_LEMMA_PROVER,
} from '../persistence';
import type { MinedLemma, ProofTrace } from '../types';

function mkProof(profile = 'classical', cost = 10): ProofTrace {
  return {
    conclusion: 'P -> P',
    premises: ['P'],
    profile,
    cost,
    steps: [
      { rule: 'MP', inputs: ['P->P', 'P'], output: 'P', depth: 0 },
      { rule: 'axiom', inputs: [], output: 'P->P', depth: 1 },
      { rule: 'axiom', inputs: [], output: 'P', depth: 1 },
    ],
  };
}

function mkLemma(id: string, statement: string, profile = 'classical'): MinedLemma {
  return {
    id,
    statement,
    proof: mkProof(profile),
    abstractionLevel: 1,
    usageCount: 3,
    savings: 27,
    sourceProofs: ['proof-0', 'proof-1', 'proof-2'],
  };
}

describe('persistLemmas', () => {
  let cache: TheoremCache;

  beforeEach(() => {
    cache = new TheoremCache();
  });

  it('guarda un lemma y retorna su id', () => {
    const lemma = mkLemma('l1', '?0 -> ?0');
    const ids = persistLemmas([lemma], cache, () => 1717171717171);
    expect(ids).toHaveLength(1);
    expect(typeof ids[0]).toBe('string');
  });

  it('marca el lemma con provedBy = proof-mining', () => {
    const lemma = mkLemma('l1', '?0 -> ?0');
    persistLemmas([lemma], cache);
    const th = cache.retrieve('?0 -> ?0', 'classical');
    expect(th?.metadata.provedBy).toBe(MINED_LEMMA_PROVER);
  });

  it('guarda múltiples lemmas en batch', () => {
    const lemmas = [
      mkLemma('a', '?0 -> ?0'),
      mkLemma('b', '?0 and ?1'),
      mkLemma('c', '?0 or ?1'),
    ];
    const ids = persistLemmas(lemmas, cache);
    expect(ids).toHaveLength(3);
    expect(cache.stats().entries).toBe(3);
  });
});

describe('recoverLemmaFromCache', () => {
  it('devuelve undefined si la entry no es un mined lemma', () => {
    const cache = new TheoremCache();
    const id = cache.store({
      formula: 'P -> P',
      normalizedFormula: '?0 -> ?0',
      profile: 'classical',
      proof: 'axiom',
      metadata: {
        provedAt: new Date().toISOString(),
        ms: 5,
        provedBy: 'other-prover',
      },
    });
    const th = cache.retrieve('P -> P', 'classical');
    expect(th).toBeDefined();
    expect(recoverLemmaFromCache(th!)).toBeUndefined();
    expect(id).toBeDefined();
  });

  it('reconstruye un MinedLemma desde el cache', () => {
    const cache = new TheoremCache();
    const lemma = mkLemma('l1', '?0 -> ?0');
    persistLemmas([lemma], cache);
    const th = cache.retrieve('?0 -> ?0', 'classical');
    expect(th).toBeDefined();
    const recovered = recoverLemmaFromCache(th!);
    expect(recovered).toBeDefined();
    expect(recovered?.statement).toBe('?0 -> ?0');
    expect(recovered?.usageCount).toBe(3);
    expect(recovered?.savings).toBe(27);
    expect(recovered?.abstractionLevel).toBe(1);
  });
});

describe('recoverLemmas', () => {
  it('recupera múltiples lemmas dada la lista de statements esperados', () => {
    const cache = new TheoremCache();
    const lemmas = [
      mkLemma('a', '?0 -> ?0'),
      mkLemma('b', '?0 and ?1'),
    ];
    persistLemmas(lemmas, cache);
    const recovered = recoverLemmas(cache, [
      { statement: '?0 -> ?0', profile: 'classical' },
      { statement: '?0 and ?1', profile: 'classical' },
      { statement: 'inexistente', profile: 'classical' },
    ]);
    expect(recovered).toHaveLength(2);
  });

  it('round-trip: persist + recover preserva datos clave', () => {
    const cache = new TheoremCache();
    const original = mkLemma('a', '?0 -> ?0');
    persistLemmas([original], cache);
    const [recovered] = recoverLemmas(cache, [
      { statement: '?0 -> ?0', profile: 'classical' },
    ]);
    expect(recovered).toBeDefined();
    expect(recovered?.usageCount).toBe(original.usageCount);
    expect(recovered?.savings).toBe(original.savings);
    expect(recovered?.sourceProofs).toEqual(original.sourceProofs);
  });
});
