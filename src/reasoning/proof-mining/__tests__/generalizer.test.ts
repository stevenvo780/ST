import { describe, it, expect } from 'vitest';
import {
  generalizeFormulas,
  generalizeLemma,
  generalizeTerms,
} from '../generalizer';
import type { Term } from '../../../runtime/anti-unification';

describe('generalizeFormulas', () => {
  it('para 0 instancias devuelve string vacío', () => {
    expect(generalizeFormulas([])).toEqual({
      statement: '',
      abstractionLevel: 0,
      nonTrivial: false,
    });
  });

  it('para 1 instancia devuelve el original sin abstracción', () => {
    const r = generalizeFormulas(['P -> P']);
    expect(r.statement).toBe('P -> P');
    expect(r.abstractionLevel).toBe(0);
    expect(r.nonTrivial).toBe(false);
  });

  it('P->P y Q->Q producen ?0 -> ?0', () => {
    const r = generalizeFormulas(['P -> P', 'Q -> Q']);
    expect(r.abstractionLevel).toBe(1);
    expect(r.nonTrivial).toBe(true);
    expect(r.statement).toContain('->');
    // Debería contener el mismo placeholder dos veces (reflexividad).
    const matches = r.statement.match(/\?0/g);
    expect(matches?.length).toBe(2);
  });

  it('P->Q y R->S producen ?0 -> ?1', () => {
    const r = generalizeFormulas(['P -> Q', 'R -> S']);
    expect(r.abstractionLevel).toBe(2);
    expect(r.nonTrivial).toBe(true);
    expect(r.statement).toMatch(/\?0/);
    expect(r.statement).toMatch(/\?1/);
  });

  it('instancias idénticas no introducen abstracción', () => {
    const r = generalizeFormulas(['P -> P', 'P -> P']);
    expect(r.abstractionLevel).toBe(0);
    expect(r.nonTrivial).toBe(false);
  });

  it('desacuerdos en operadores no son generalizables (fallback al literal)', () => {
    const r = generalizeFormulas(['P and Q', 'P or Q']);
    expect(r.nonTrivial).toBe(false);
    expect(r.statement).toBe('P and Q');
  });

  it('arrays de tokens de distinta longitud caen al primer literal', () => {
    const r = generalizeFormulas(['P', 'P -> P']);
    expect(r.nonTrivial).toBe(false);
    expect(r.statement).toBe('P');
  });

  it('mantiene operadores como tokens literales en el patrón', () => {
    const r = generalizeFormulas(['P -> Q', 'A -> B']);
    expect(r.statement).toContain('->');
  });
});

describe('generalizeLemma', () => {
  it('respeta maxAbstractionLevel', () => {
    const r = generalizeLemma(['f(a, b, c)', 'f(x, y, z)'], { maxAbstractionLevel: 2 });
    // Necesitaríamos 3 fresh vars; con cap = 2 cae al literal.
    expect(r.abstractionLevel).toBe(0);
    expect(r.statement).toBe('f(a, b, c)');
  });

  it('preserveSemantic = true no rechaza generalizaciones válidas', () => {
    const r = generalizeLemma(['P -> P', 'Q -> Q'], {
      preserveSemantic: true,
      maxAbstractionLevel: 5,
    });
    expect(r.nonTrivial).toBe(true);
  });

  it('opciones por defecto producen abstracción si es no-trivial', () => {
    const r = generalizeLemma(['P -> P', 'Q -> Q']);
    expect(r.abstractionLevel).toBeGreaterThan(0);
  });
});

describe('generalizeTerms', () => {
  it('para 0 terms devuelve vacío', () => {
    expect(generalizeTerms([])).toEqual({
      statement: '',
      abstractionLevel: 0,
      nonTrivial: false,
    });
  });

  it('para 1 term devuelve el original sin abstracción', () => {
    const t: Term = { kind: 'const', name: 'a' };
    const r = generalizeTerms([t]);
    expect(r.statement).toBe('a');
    expect(r.abstractionLevel).toBe(0);
  });

  it('lgg de p(a) y p(b) introduce variable fresca', () => {
    const t1: Term = { kind: 'func', name: 'p', args: [{ kind: 'const', name: 'a' }] };
    const t2: Term = { kind: 'func', name: 'p', args: [{ kind: 'const', name: 'b' }] };
    const r = generalizeTerms([t1, t2]);
    expect(r.abstractionLevel).toBe(1);
    expect(r.statement).toMatch(/^p\(/);
  });

  it('lgg de términos idénticos no introduce abstracción', () => {
    const t1: Term = { kind: 'const', name: 'a' };
    const t2: Term = { kind: 'const', name: 'a' };
    const r = generalizeTerms([t1, t2]);
    expect(r.abstractionLevel).toBe(0);
  });

  it('lgg de p(a,a) y p(b,b) reusa la misma fresh var', () => {
    const t1: Term = {
      kind: 'func',
      name: 'p',
      args: [
        { kind: 'const', name: 'a' },
        { kind: 'const', name: 'a' },
      ],
    };
    const t2: Term = {
      kind: 'func',
      name: 'p',
      args: [
        { kind: 'const', name: 'b' },
        { kind: 'const', name: 'b' },
      ],
    };
    const r = generalizeTerms([t1, t2]);
    // Idealmente abstractionLevel = 1 (una sola fresh var reusada).
    expect(r.abstractionLevel).toBe(1);
  });
});
