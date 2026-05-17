// ============================================================
// TPTP Tests — Emitter + Round-trip
// ============================================================

import { describe, it, expect } from 'vitest';
import { emitTptp, emitFormula } from '../../../tooling/tptp/emitter';
import { parseTptp, parseFormula } from '../../../tooling/tptp/parser';

describe('TPTP emitter', () => {
  it('emite átomo proposicional simple', () => {
    expect(emitFormula({ kind: 'atom', predicate: 'p', args: [] })).toBe('p');
  });

  it('emite atom con argumentos', () => {
    const s = emitFormula({
      kind: 'atom',
      predicate: 'p',
      args: [
        { kind: 'var', name: 'X' },
        { kind: 'const', name: 'a' },
      ],
    });
    expect(s).toBe('p(X,a)');
  });

  it('emite negación', () => {
    const s = emitFormula({
      kind: 'not',
      arg: { kind: 'atom', predicate: 'p', args: [] },
    });
    expect(s).toBe('~p');
  });

  it('emite forall con múltiples vars', () => {
    const s = emitFormula({
      kind: 'forall',
      vars: ['X', 'Y'],
      body: { kind: 'atom', predicate: 'p', args: [{ kind: 'var', name: 'X' }] },
    });
    expect(s).toBe('! [X,Y] : p(X)');
  });

  it('emite implies', () => {
    const s = emitFormula({
      kind: 'implies',
      left: { kind: 'atom', predicate: 'p', args: [] },
      right: { kind: 'atom', predicate: 'q', args: [] },
    });
    expect(s).toBe('p => q');
  });

  it('emite eq y neq', () => {
    expect(
      emitFormula({
        kind: 'eq',
        left: { kind: 'const', name: 'a' },
        right: { kind: 'const', name: 'b' },
      }),
    ).toBe('a = b');
    expect(
      emitFormula({
        kind: 'neq',
        left: { kind: 'const', name: 'a' },
        right: { kind: 'const', name: 'b' },
      }),
    ).toBe('a != b');
  });

  it('emite problema completo con include + axiomas', () => {
    const out = emitTptp({
      includes: ['axioms.ax'],
      annotated: [
        {
          language: 'fof',
          name: 'a1',
          role: 'axiom',
          formula: { kind: 'atom', predicate: 'p', args: [] },
        },
      ],
    });
    expect(out).toContain("include('axioms.ax').");
    expect(out).toContain('fof(a1, axiom, p).');
  });
});

describe('TPTP round-trip — parse → emit → parse', () => {
  const cases: string[] = [
    'fof(a, axiom, p).',
    'fof(b, axiom, p(X)).',
    'fof(c, axiom, p(X) => q(X)).',
    'fof(d, axiom, ![X] : (p(X) => q(X))).',
    'fof(e, axiom, ?[Y] : p(Y)).',
    'fof(f, axiom, a = b).',
    'fof(g, axiom, a != b).',
    'fof(h, axiom, p <=> q).',
    'fof(i, axiom, p & q & r).',
    'fof(j, axiom, p | q | r).',
    'cnf(k, axiom, p(a) | ~q(b)).',
  ];

  for (const src of cases) {
    it(`round-trip estable: ${src}`, () => {
      const p1 = parseTptp(src);
      const emitted = emitTptp(p1);
      const p2 = parseTptp(emitted);
      // El AST debe ser estructuralmente igual (deep equal)
      expect(p2.annotated).toEqual(p1.annotated);
      expect(p2.includes).toEqual(p1.includes);
    });
  }

  it('round-trip preserva problema multi-formula completo', () => {
    const src = `
      fof(ax1, axiom, ![X] : (man(X) => mortal(X))).
      fof(ax2, axiom, man(socrates)).
      fof(goal, conjecture, mortal(socrates)).
    `;
    const p1 = parseTptp(src);
    const emitted = emitTptp(p1);
    const p2 = parseTptp(emitted);
    expect(p2.annotated).toEqual(p1.annotated);
  });

  it('round-trip preserva includes', () => {
    const src = `include('a.ax').\ninclude('b.ax').\nfof(x, axiom, p).`;
    const p1 = parseTptp(src);
    const p2 = parseTptp(emitTptp(p1));
    expect(p2.includes).toEqual(['a.ax', 'b.ax']);
    expect(p2.annotated).toHaveLength(1);
  });
});

describe('parseFormula → emitFormula sin paréntesis sobrantes', () => {
  it('mantiene la forma de p & q', () => {
    const f = parseFormula('p & q', 'fof');
    expect(emitFormula(f)).toBe('p & q');
  });

  it('mantiene la forma de ![X] : p(X)', () => {
    const f = parseFormula('![X] : p(X)', 'fof');
    expect(emitFormula(f)).toBe('! [X] : p(X)');
  });
});
