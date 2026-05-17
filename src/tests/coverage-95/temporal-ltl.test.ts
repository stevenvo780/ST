import { describe, it, expect } from 'vitest';
import { TemporalLTL } from '../../logic/profiles/temporal/ltl';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const biconditional = (a: Formula, b: Formula): Formula => ({
  kind: 'biconditional',
  args: [a, b],
});
const G = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const F = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });
const X = (a: Formula): Formula => ({ kind: 'temporal_next', args: [a] });
const U = (a: Formula, b: Formula): Formula => ({ kind: 'temporal_until', args: [a, b] });

describe('TemporalLTL — profile', () => {
  const p = new TemporalLTL();

  it('has name temporal.ltl', () => {
    expect(p.name).toBe('temporal.ltl');
    expect(p.description).toContain('LTL');
  });

  it('explainSystem returns a non-empty multi-line block', () => {
    const exp = p.explainSystem();
    expect(exp).toContain('G(');
    expect(exp).toContain('F(');
    expect(exp.split('\n').length).toBeGreaterThan(5);
  });

  it('formatFormula renders G(P) as G(P)', () => {
    expect(p.formatFormula(G(atom('P')))).toBe('G(P)');
  });

  it('formatFormula renders F(P)', () => {
    expect(p.formatFormula(F(atom('P')))).toBe('F(P)');
  });

  it('formatFormula renders X(P)', () => {
    expect(p.formatFormula(X(atom('P')))).toBe('X(P)');
  });

  it('formatFormula renders P U Q', () => {
    expect(p.formatFormula(U(atom('P'), atom('Q')))).toMatch(/U/);
  });

  it('formatFormula renders negation over atom inline', () => {
    expect(p.formatFormula(not(atom('P')))).toBe('¬P');
  });

  it('formatFormula renders negation over compound with parens', () => {
    expect(p.formatFormula(not(and(atom('P'), atom('Q'))))).toMatch(/¬\(/);
  });

  it('formatFormula renders and/or/implies/biconditional', () => {
    expect(p.formatFormula(and(atom('P'), atom('Q')))).toContain('∧');
    expect(p.formatFormula(or(atom('P'), atom('Q')))).toContain('∨');
    expect(p.formatFormula(implies(atom('P'), atom('Q')))).toContain('→');
    expect(p.formatFormula(biconditional(atom('P'), atom('Q')))).toContain('↔');
  });

  it('formatFormula handles incomplete G as G(?)', () => {
    expect(p.formatFormula({ kind: 'modal_necessity' })).toBe('G(?)');
    expect(p.formatFormula({ kind: 'modal_possibility' })).toBe('F(?)');
    expect(p.formatFormula({ kind: 'temporal_next' })).toBe('X(?)');
  });

  it('formatFormula falls back to formulaToString for unknown kinds', () => {
    expect(typeof p.formatFormula({ kind: 'true' })).toBe('string');
  });
});

describe('TemporalLTL — explain() classifies patterns', () => {
  const p = new TemporalLTL();

  it('classifies G(¬P) as Safety', () => {
    const r = p.explain(G(not(atom('crash'))));
    expect(r.output).toContain('Safety');
  });

  it('classifies F(P) as Liveness', () => {
    const r = p.explain(F(atom('serve')));
    expect(r.output).toContain('Liveness');
  });

  it('classifies G(P → F(Q)) as Response', () => {
    const r = p.explain(G(implies(atom('req'), F(atom('ack')))));
    expect(r.output).toContain('Response');
  });

  it('classifies F(G(P)) as Persistence', () => {
    const r = p.explain(F(G(atom('stable'))));
    expect(r.output).toContain('Persistence');
  });

  it('classifies G(F(P)) as Recurrence', () => {
    const r = p.explain(G(F(atom('serve'))));
    expect(r.output).toContain('Recurrence');
  });

  it('classifies ¬P U Q as Precedence', () => {
    const r = p.explain(U(not(atom('p')), atom('q')));
    expect(r.output).toContain('Precedence');
  });

  it('returns base result without pattern for simple atom', () => {
    const r = p.explain(atom('P'));
    expect(typeof r.output).toBe('string');
  });
});
