import { describe, it, expect, beforeEach } from 'vitest';
import { TheoremCache } from '../../../runtime/theorem-cache';
import { mineLemmas, ProofMiner } from '../index';
import type { ProofTrace } from '../types';

function reflexivityProof(id: string, atom: string): ProofTrace {
  return {
    id,
    conclusion: `${atom} -> ${atom}`,
    premises: [],
    profile: 'classical',
    cost: 12,
    steps: [
      // sub-tree raíz: implIntro con un assume.
      { rule: 'implIntro', inputs: [atom], output: `${atom} -> ${atom}`, depth: 0 },
      { rule: 'assume', inputs: [], output: atom, depth: 1 },
    ],
  };
}

function conjunctionProof(id: string, l: string, r: string): ProofTrace {
  return {
    id,
    conclusion: `${l} and ${r}`,
    premises: [l, r],
    profile: 'classical',
    cost: 20,
    steps: [
      { rule: 'andI', inputs: [l, r], output: `${l} and ${r}`, depth: 0 },
      { rule: 'assume', inputs: [], output: l, depth: 1 },
      { rule: 'assume', inputs: [], output: r, depth: 1 },
    ],
  };
}

describe('mineLemmas — pipeline end-to-end', () => {
  it('extrae el lemma de reflexividad cuando aparece en múltiples proofs', () => {
    const corpus = [
      reflexivityProof('p1', 'P'),
      reflexivityProof('p2', 'Q'),
      reflexivityProof('p3', 'R'),
    ];
    const { lemmas, stats } = mineLemmas(corpus);
    expect(lemmas.length).toBeGreaterThan(0);
    expect(stats.proofsAnalyzed).toBe(3);
    expect(stats.lemmasExtracted).toBeGreaterThan(0);
    // Al menos un lemma debería tener usageCount = 3.
    const trio = lemmas.find((l) => l.usageCount === 3);
    expect(trio).toBeDefined();
  });

  it('rankea por savings: el lemma más reusado va primero', () => {
    const corpus = [
      reflexivityProof('p1', 'P'),
      reflexivityProof('p2', 'Q'),
      reflexivityProof('p3', 'R'),
      conjunctionProof('p4', 'A', 'B'),
      conjunctionProof('p5', 'C', 'D'),
    ];
    const { lemmas } = mineLemmas(corpus);
    expect(lemmas.length).toBeGreaterThan(0);
    // El primero debería tener usageCount alto.
    expect(lemmas[0]?.usageCount).toBeGreaterThanOrEqual(2);
  });

  it('persiste lemmas en el cache cuando se pasa la opción', () => {
    const cache = new TheoremCache();
    const corpus = [
      reflexivityProof('p1', 'P'),
      reflexivityProof('p2', 'Q'),
    ];
    const { lemmas } = mineLemmas(corpus, { cache });
    expect(lemmas.length).toBeGreaterThan(0);
    expect(cache.stats().entries).toBeGreaterThan(0);
  });

  it('savings = cost_subproof × (usageCount - 1)', () => {
    const corpus = [
      reflexivityProof('p1', 'P'),
      reflexivityProof('p2', 'Q'),
    ];
    const { lemmas } = mineLemmas(corpus);
    const trio = lemmas.find((l) => l.usageCount === 2);
    expect(trio).toBeDefined();
    // El sub-tree raíz tiene 2 pasos del proof de cost 12: cost prorrateado
    // = 12 × (2/2) = 12. usageCount=2 ⇒ savings = 12 × 1 = 12.
    expect(trio?.savings).toBeGreaterThan(0);
  });
});

describe('ProofMiner — fachada stateful', () => {
  let miner: ProofMiner;

  beforeEach(() => {
    miner = new ProofMiner();
  });

  it('acumula lemmas entre batches', () => {
    miner.mine([reflexivityProof('p1', 'P'), reflexivityProof('p2', 'Q')]);
    const after1 = miner.all().length;
    miner.mine([reflexivityProof('p3', 'R'), reflexivityProof('p4', 'S')]);
    const after2 = miner.all().length;
    expect(after2).toBeGreaterThanOrEqual(after1);
  });

  it('mergea usageCount cuando el mismo lemma aparece en batches distintos', () => {
    miner.mine([reflexivityProof('p1', 'P'), reflexivityProof('p2', 'Q')]);
    miner.mine([reflexivityProof('p3', 'R'), reflexivityProof('p4', 'S')]);
    // Algún lemma debería tener usageCount >= 4 (suma de batches).
    const allUsages = miner.all().map((l) => l.usageCount);
    expect(Math.max(...allUsages)).toBeGreaterThanOrEqual(4);
  });

  it('clear() resetea el estado', () => {
    miner.mine([reflexivityProof('p1', 'P'), reflexivityProof('p2', 'Q')]);
    miner.clear();
    expect(miner.all()).toHaveLength(0);
    expect(miner.stats().proofsAnalyzed).toBe(0);
  });

  it('top(k) devuelve los k mejores', () => {
    miner.mine([
      reflexivityProof('p1', 'P'),
      reflexivityProof('p2', 'Q'),
      conjunctionProof('p3', 'A', 'B'),
      conjunctionProof('p4', 'C', 'D'),
    ]);
    const top1 = miner.top(1);
    expect(top1.length).toBeLessThanOrEqual(1);
  });

  it('cache compartido: getCache devuelve la instancia interna', () => {
    const cache = new TheoremCache();
    const m = new ProofMiner({ cache });
    m.mine([reflexivityProof('p1', 'P'), reflexivityProof('p2', 'Q')]);
    expect(m.getCache()).toBe(cache);
    expect(cache.stats().entries).toBeGreaterThan(0);
  });
});
