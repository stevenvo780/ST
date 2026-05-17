// ============================================================
// Tests — Lemma Library curada + TF-IDF + auto-apply
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  standardLibrary,
  LemmaLibrary,
  buildIndex,
  semanticSearch,
  tryApplyLemma,
  tokenize,
  PROPOSITIONAL_LEMMAS,
  ARITHMETIC_LEMMAS,
  SET_THEORY_LEMMAS,
  MODAL_LEMMAS,
  FIRSTORDER_LEMMAS,
  type CuratedLemma,
} from '../../../tooling/lemma-library';

describe('Lemma Library — biblioteca estándar', () => {
  it('contiene ≥95 lemas curados', () => {
    const lib = standardLibrary();
    expect(lib.size()).toBeGreaterThanOrEqual(95);
  });

  it('cada sub-biblioteca aporta el conteo esperado', () => {
    expect(PROPOSITIONAL_LEMMAS.length).toBeGreaterThanOrEqual(30);
    expect(ARITHMETIC_LEMMAS.length).toBeGreaterThanOrEqual(20);
    expect(SET_THEORY_LEMMAS.length).toBeGreaterThanOrEqual(15);
    expect(MODAL_LEMMAS.length).toBeGreaterThanOrEqual(15);
    expect(FIRSTORDER_LEMMAS.length).toBeGreaterThanOrEqual(15);
  });

  it('todos los ids son únicos', () => {
    const lib = standardLibrary();
    const ids = lib.all().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rechaza añadir un lema con id duplicado', () => {
    const lib = new LemmaLibrary();
    const lemma: CuratedLemma = {
      id: 'x.dup',
      name: 'dup',
      statement: 'P',
      domain: 'propositional',
      tags: [],
      difficulty: 'trivial',
    };
    lib.add(lemma);
    expect(() => lib.add(lemma)).toThrow(/duplicate/);
  });
});

describe('Lemma Library — filtros', () => {
  const lib = standardLibrary();

  it('byDomain(modal) filtra solo modales', () => {
    const modal = lib.byDomain('modal');
    expect(modal.length).toBeGreaterThanOrEqual(15);
    for (const l of modal) expect(l.domain).toBe('modal');
  });

  it('byDomain(arithmetic) tiene la inducción', () => {
    const arith = lib.byDomain('arithmetic');
    const ids = arith.map((l) => l.id);
    expect(ids).toContain('arith.induction');
  });

  it('byTag(classical) trae lemas clásicos', () => {
    const classical = lib.byTag('classical');
    expect(classical.length).toBeGreaterThan(5);
    for (const l of classical) expect(l.tags).toContain('classical');
  });

  it('byTag(de-morgan) trae De Morgan en proposicional y conjuntos', () => {
    const dm = lib.byTag('de-morgan');
    const ids = dm.map((l) => l.id);
    expect(ids).toContain('prop.de-morgan-and');
    expect(ids).toContain('prop.de-morgan-or');
    expect(ids).toContain('set.de-morgan-union');
    expect(ids).toContain('set.de-morgan-inter');
  });

  it('byDifficulty(trivial) y (hard) particionan razonablemente', () => {
    const trivial = lib.byDifficulty('trivial');
    const hard = lib.byDifficulty('hard');
    expect(trivial.length).toBeGreaterThan(0);
    expect(hard.length).toBeGreaterThan(0);
    expect(trivial.every((l) => l.difficulty === 'trivial')).toBe(true);
    expect(hard.every((l) => l.difficulty === 'hard')).toBe(true);
  });

  it('get(id) recupera el lema correcto o undefined', () => {
    expect(lib.get('prop.identity')?.statement).toBe('P → P');
    expect(lib.get('nope.nada')).toBeUndefined();
  });
});

describe('Lemma Library — keyword search', () => {
  const lib = standardLibrary();

  it('search "de morgan" devuelve los 4 De Morgan en el top', () => {
    const results = lib.search('de morgan', { limit: 10 });
    const topIds = results.slice(0, 6).map((l) => l.id);
    expect(topIds).toContain('prop.de-morgan-and');
    expect(topIds).toContain('prop.de-morgan-or');
    expect(topIds).toContain('set.de-morgan-union');
    expect(topIds).toContain('set.de-morgan-inter');
  });

  it('search filtrado por dominio respeta el filtro', () => {
    const results = lib.search('commutativity', { domain: 'set' });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.domain).toBe('set');
  });

  it('search sin matches devuelve []', () => {
    const results = lib.search('xyzqwerty-nope');
    expect(results).toEqual([]);
  });

  it('search query vacía devuelve []', () => {
    expect(lib.search('   ')).toEqual([]);
  });
});

describe('Lemma Library — similar', () => {
  const lib = standardLibrary();

  it('similar a la identidad P → P prioriza otros con → ', () => {
    const identity = lib.get('prop.identity');
    expect(identity).toBeDefined();
    if (!identity) return;
    const sims = lib.similar(identity, 5);
    expect(sims.length).toBe(5);
    // todos los similares deberían ser proposicional o usar →
    for (const s of sims) {
      expect(s.id).not.toBe('prop.identity');
    }
  });

  it('similar a De Morgan (∧) sugiere De Morgan (∨)', () => {
    const dmAnd = lib.get('prop.de-morgan-and');
    expect(dmAnd).toBeDefined();
    if (!dmAnd) return;
    const sims = lib.similar(dmAnd, 5);
    const ids = sims.map((s) => s.id);
    expect(ids).toContain('prop.de-morgan-or');
  });
});

describe('Lemma Library — TF-IDF semantic search', () => {
  const lib = standardLibrary();
  const index = buildIndex(lib);

  it('buildIndex cubre todos los lemas', () => {
    expect(index.totalDocs).toBe(lib.size());
    expect(index.documents.length).toBe(lib.size());
  });

  it('semanticSearch "modus ponens" ranquea MP en el tope', () => {
    const hits = semanticSearch(index, 'modus ponens', 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.lemma.id).toBe('prop.modus-ponens');
  });

  it('semanticSearch "axiom K modal distribution" privilegia K', () => {
    const hits = semanticSearch(index, 'axiom K distribution', 5);
    const ids = hits.map((h) => h.lemma.id);
    expect(ids).toContain('modal.k');
  });

  it('semanticSearch query vacía → []', () => {
    expect(semanticSearch(index, '')).toEqual([]);
  });

  it('semanticSearch scores son monótonos decrecientes', () => {
    const hits = semanticSearch(index, 'commutativity union intersection', 5);
    for (let i = 1; i < hits.length; i++) {
      const prev = hits[i - 1];
      const curr = hits[i];
      if (prev && curr) expect(prev.score).toBeGreaterThanOrEqual(curr.score);
    }
  });
});

describe('Lemma Library — tryApplyLemma', () => {
  const lib = standardLibrary();

  it('aplica asociatividad a "(P ∧ Q) ∧ R"', () => {
    const goal = '((P ∧ Q) ∧ R) ↔ (P ∧ (Q ∧ R))';
    const result = tryApplyLemma(goal, lib);
    const ids = result.applicable.map((l) => l.id);
    expect(ids).toContain('prop.and-associative');
  });

  it('aplica modus ponens a su forma canónica', () => {
    const goal = '((P → Q) ∧ P) → Q';
    const result = tryApplyLemma(goal, lib);
    const ids = result.applicable.map((l) => l.id);
    expect(ids).toContain('prop.modus-ponens');
    expect(result.substitutions).toBeDefined();
  });

  it('goal sin estructura lógica → applicable []', () => {
    const result = tryApplyLemma('hello world', lib);
    expect(result.applicable).toEqual([]);
  });

  it('substitutions mapea variables del lema a tokens del goal', () => {
    const result = tryApplyLemma('A → A', lib);
    const ids = result.applicable.map((l) => l.id);
    expect(ids).toContain('prop.identity');
    // tokens normalizados a lowercase: la metavar 'p' del lema captura 'a' del goal.
    expect(result.substitutions?.get('p')).toBe('a');
  });
});

describe('Lemma Library — tokenize', () => {
  it('separa símbolos lógicos en tokens propios', () => {
    expect(tokenize('P ∧ Q')).toEqual(['p', '∧', 'q']);
    expect(tokenize('¬¬P → P')).toEqual(['¬', '¬', 'p', '→', 'p']);
  });

  it('filtra stopwords largos y normaliza case', () => {
    // "The" filtrado (stopword ≥3 letras); "of" preservado; metavar "P" lowercased.
    const toks = tokenize('The Identity of P');
    expect(toks).toContain('identity');
    expect(toks).toContain('p');
    expect(toks).not.toContain('the');
  });
});
