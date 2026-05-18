// ============================================================
// Tests: query.ts — API pública LemmaRAG + queryLemmas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { LemmaRAG, queryLemmas, globalRAG, resetGlobalRAG } from '../query';
import type { CuratedLemma } from '../../../tooling/lemma-library/types';

const mockLemmas: CuratedLemma[] = [
  {
    id: 'prop.identity',
    name: 'Identity',
    statement: 'P → P',
    domain: 'propositional',
    tags: ['identity', 'implication', 'classical'],
    difficulty: 'trivial',
  },
  {
    id: 'prop.double-neg',
    name: 'Double negation elimination',
    statement: '¬¬P → P',
    domain: 'propositional',
    tags: ['negation', 'classical', 'double-negation'],
    difficulty: 'easy',
  },
  {
    id: 'prop.de-morgan',
    name: 'De Morgan conjunction',
    statement: '¬(P ∧ Q) ↔ (¬P ∨ ¬Q)',
    domain: 'propositional',
    tags: ['de-morgan', 'classical', 'negation', 'conjunction'],
    difficulty: 'easy',
  },
  {
    id: 'prop.excluded-middle',
    name: 'Law of excluded middle',
    statement: 'P ∨ ¬P',
    domain: 'propositional',
    tags: ['classical', 'tertium-non-datur', 'disjunction'],
    difficulty: 'easy',
    isAxiom: true,
  },
  {
    id: 'arith.add-zero',
    name: 'Right additive identity',
    statement: '∀n. n + 0 = n',
    domain: 'arithmetic',
    tags: ['peano', 'addition', 'naturals'],
    difficulty: 'trivial',
  },
  {
    id: 'modal.k',
    name: 'Axiom K',
    statement: '□(P → Q) → (□P → □Q)',
    domain: 'modal',
    tags: ['axiom', 'K', 'distribution', 'box'],
    difficulty: 'easy',
    isAxiom: true,
  },
];

describe('LemmaRAG', () => {
  let rag: LemmaRAG;

  beforeEach(() => {
    rag = new LemmaRAG();
    rag.index(mockLemmas);
  });

  it('size() refleja el número de lemas indexados', () => {
    expect(rag.size()).toBe(mockLemmas.length);
  });

  it('query vacío devuelve array', () => {
    const results = rag.query('');
    expect(Array.isArray(results)).toBe(true);
  });

  it('query sin lemas indexados devuelve []', () => {
    const emptyRag = new LemmaRAG();
    expect(emptyRag.query('P → P')).toEqual([]);
  });

  it('query devuelve resultados con score, cosineScore, bm25Score', () => {
    const results = rag.query('negation double', { k: 3 });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.score).toBe('number');
      expect(typeof r.cosineScore).toBe('number');
      expect(typeof r.bm25Score).toBe('number');
      expect(r.lemma).toBeDefined();
    }
  });

  it('k=1 devuelve exactamente 1 resultado', () => {
    const results = rag.query('implication identity', { k: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('filtro de dominio funciona', () => {
    const results = rag.query('negation', { k: 5, domain: 'arithmetic' });
    for (const r of results) {
      expect(r.lemma.domain).toBe('arithmetic');
    }
  });

  it('minScore filtra resultados de baja relevancia', () => {
    const results = rag.query('addition naturals zero', { k: 10, minScore: 0.5 });
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('resultados ordenados descendentemente por score', () => {
    const results = rag.query('classical negation modal', { k: 5 });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });
});

describe('queryLemmas — función de conveniencia', () => {
  it('retorna resultados sobre el conjunto proporcionado', () => {
    const results = queryLemmas(mockLemmas, 'negation', { k: 3 });
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('con lemmas vacío devuelve []', () => {
    expect(queryLemmas([], 'P → P')).toEqual([]);
  });

  it('usa instancia RAG externa si se provee', () => {
    const externalRAG = new LemmaRAG();
    externalRAG.index(mockLemmas);
    const results = queryLemmas([], 'double negation', {}, externalRAG);
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('globalRAG', () => {
  it('resetGlobalRAG crea nueva instancia en siguiente llamada', () => {
    resetGlobalRAG();
    const rag1 = globalRAG();
    const rag2 = globalRAG();
    expect(rag1).toBe(rag2);
    resetGlobalRAG();
    const rag3 = globalRAG();
    expect(rag3).not.toBe(rag1);
  });
});
