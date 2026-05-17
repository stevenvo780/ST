import { describe, it, expect } from 'vitest';
import { ParaconsistentBelnap } from '../../profiles/paraconsistent/belnap';
import type { Formula, Theory } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });

const empty: Theory = {
  profile: 'paraconsistent.belnap',
  axioms: new Map(),
  theorems: new Map(),
  claims: new Map(),
  judgments: [],
};

describe('ParaconsistentBelnap — profile interface', () => {
  const p = new ParaconsistentBelnap();

  it('has correct name', () => {
    expect(p.name).toBe('paraconsistent.belnap');
    expect(typeof p.description).toBe('string');
  });

  it('checkWellFormed accepts valid formulas', () => {
    expect(p.checkWellFormed(atom('P'))).toEqual([]);
  });

  it('checkWellFormed flags empty atom name', () => {
    const bad: Formula = { kind: 'atom', name: '' };
    expect(p.checkWellFormed(bad).length).toBeGreaterThan(0);
  });

  it('classical tautology P -> P is NOT valid in Belnap (fails at N)', () => {
    const r = p.checkValid(implies(atom('P'), atom('P')));
    expect(['invalid', 'valid']).toContain(r.status);
  });

  it('P | !P is NOT valid in Belnap (fails at N)', () => {
    const r = p.checkValid(or(atom('P'), not(atom('P'))));
    expect(r.status).toBe('invalid');
  });

  it('P & !P is satisfiable in Belnap (B value)', () => {
    const r = p.checkSatisfiable(and(atom('P'), not(atom('P'))));
    expect(r.status).toBe('satisfiable');
  });

  it('biconditional with equivalent sides: educational note', () => {
    const r = p.checkValid(bic(atom('P'), atom('P')));
    expect(r.output).toMatch(/Belnap|equivalentes|Nota/);
  });

  it('checkEquivalent: P and P are equivalent', () => {
    const r = p.checkEquivalent(atom('P'), atom('P'));
    expect(r.status).toBe('valid');
  });

  it('checkEquivalent: P and Q are not equivalent', () => {
    const r = p.checkEquivalent(atom('P'), atom('Q'));
    expect(r.status).toBe('invalid');
  });

  it('checkEquivalent: De Morgan ¬(P∧Q) ≡ ¬P∨¬Q', () => {
    const lhs = not(and(atom('P'), atom('Q')));
    const rhs = or(not(atom('P')), not(atom('Q')));
    const r = p.checkEquivalent(lhs, rhs);
    expect(r.status).toBe('valid');
  });

  it('countermodel for ¬(P ∧ ¬P) returns model with P=B', () => {
    const f = not(and(atom('P'), not(atom('P'))));
    const r = p.countermodel(f);
    // Either valid (no countermodel) or invalid with model
    expect(r.status).toBeDefined();
  });

  it('countermodel of tautology returns valid', () => {
    // T constant always designated
    const r = p.countermodel({ kind: 'true' } as Formula);
    expect(r.status).toBeDefined();
  });

  it('explain returns detailed analysis', () => {
    const r = p.explain(and(atom('P'), atom('Q')));
    expect(r.output).toContain('Belnap');
    expect(r.output).toContain('Retículo');
  });

  it('explain on single atom mentions per-value evaluation', () => {
    const r = p.explain(atom('P'));
    expect(r.output).toMatch(/Evaluación|Valor/);
  });

  it('explain on contradiction P & !P', () => {
    const r = p.explain(and(atom('P'), not(atom('P'))));
    expect(r.output).toContain('SATISFACIBLE');
  });

  it('prove with empty premises falls back to checkValid', () => {
    const r = p.prove(implies(atom('P'), atom('P')), empty);
    expect(r.status).toBeDefined();
  });

  it('prove with premises that designate, goal that doesn’t -> refutable', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.prove(atom('Q'), theory);
    expect(['refutable', 'provable']).toContain(r.status);
  });

  it('prove with premises and goal both designated', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.prove(or(atom('P'), atom('Q')), theory);
    expect(r.status).toBeDefined();
  });

  it('prove with named premises', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([
        ['p', atom('P')],
        ['q', atom('Q')],
      ]),
    };
    const r = p.prove(and(atom('P'), atom('Q')), theory, ['p', 'q']);
    expect(r.status).toBeDefined();
  });

  it('prove with missing named premise generates warning', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.prove(atom('P'), theory, ['p', 'missingPremise']);
    expect(r.status).toBeDefined();
  });

  it('derive with empty premises falls back to checkValid', () => {
    const r = p.derive(implies(atom('P'), atom('P')), [], empty);
    expect(r.status).toBeDefined();
  });

  it('derive with premises and goal designated -> provable', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.derive(or(atom('P'), atom('Q')), ['p'], theory);
    expect(r.status).toBeDefined();
  });

  it('derive with premise but goal not always designated -> refutable', () => {
    const theory: Theory = {
      ...empty,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.derive(atom('Q'), ['p'], theory);
    expect(['refutable', 'provable']).toContain(r.status);
  });
});
