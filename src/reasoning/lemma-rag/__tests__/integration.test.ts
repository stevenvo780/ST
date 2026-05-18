// ============================================================
// Tests: integration — RAG sobre la biblioteca real (standardLibrary)
// ============================================================

import { describe, it, expect } from 'vitest';
import { LemmaRAG } from '../query';
import { standardLibrary } from '../../../tooling/lemma-library/standard';

describe('LemmaRAG sobre standardLibrary real', () => {
  const lib = standardLibrary();
  const lemmas = lib.all();

  it('indexa todos los lemas sin errores', () => {
    const rag = new LemmaRAG();
    expect(() => rag.index(lemmas)).not.toThrow();
    expect(rag.size()).toBe(lemmas.length);
  });

  it('query de "double negation" recupera prop.double-negation-elim en top-3', () => {
    const rag = new LemmaRAG();
    rag.index(lemmas);
    const results = rag.query('double negation elimination', { k: 3 });
    const ids = results.map((r) => r.lemma.id);
    expect(ids).toContain('prop.double-negation-elim');
  });

  it('query de "modus ponens" recupera prop.modus-ponens en top-5', () => {
    const rag = new LemmaRAG();
    rag.index(lemmas);
    const results = rag.query('modus ponens inference rule implication', { k: 5 });
    const ids = results.map((r) => r.lemma.id);
    expect(ids).toContain('prop.modus-ponens');
  });

  it('filtro de dominio no devuelve lemas de otros dominios', () => {
    const rag = new LemmaRAG();
    rag.index(lemmas);
    const results = rag.query('commutativity identity', { k: 10, domain: 'arithmetic' });
    for (const r of results) {
      expect(r.lemma.domain).toBe('arithmetic');
    }
  });
});
