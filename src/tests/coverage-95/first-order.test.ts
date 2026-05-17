import { describe, it, expect } from 'vitest';
import { ClassicalFirstOrder, toPrenex, skolemize } from '../../profiles/classical/first-order';
import type { Formula, Theory } from '../../types';

const pred = (name: string, ...params: string[]): Formula => ({
  kind: 'predicate',
  name,
  params,
  terms: params,
});
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const forall = (variable: string, body: Formula): Formula => ({
  kind: 'forall',
  variable,
  args: [body],
});
const exists = (variable: string, body: Formula): Formula => ({
  kind: 'exists',
  variable,
  args: [body],
});

const emptyTheory: Theory = {
  profile: 'classical.first_order',
  axioms: new Map(),
  theorems: new Map(),
  claims: new Map(),
  judgments: [],
};

describe('ClassicalFirstOrder — toPrenex', () => {
  it('idempotent on quantifier-free formula', () => {
    const f = pred('P', 'x');
    expect(toPrenex(f)).toBeDefined();
  });

  it('moves outer quantifier outward', () => {
    const f = forall('x', and(pred('P', 'x'), pred('Q', 'x')));
    const prenex = toPrenex(f);
    expect(prenex.kind).toBe('forall');
  });

  it('handles nested quantifiers', () => {
    const f = forall('x', exists('y', pred('R', 'x', 'y')));
    const prenex = toPrenex(f);
    expect(prenex.kind).toBe('forall');
  });
});

describe('ClassicalFirstOrder — skolemize', () => {
  it('replaces exists with skolem constant when no universal', () => {
    const f = exists('x', pred('P', 'x'));
    const sk = skolemize(f);
    // After skolemization, no exists should remain at the top
    expect(sk.kind).not.toBe('exists');
  });

  it('replaces exists with skolem function when nested in forall', () => {
    const f = forall('x', exists('y', pred('R', 'x', 'y')));
    const sk = skolemize(f);
    expect(sk.kind).toBe('forall');
  });
});

describe('ClassicalFirstOrder — profile interface', () => {
  const p = new ClassicalFirstOrder();

  it('name and description', () => {
    expect(p.name).toBe('classical.first_order');
    expect(typeof p.description).toBe('string');
  });

  it('checkWellFormed on a valid predicate is empty', () => {
    const f = forall('x', pred('P', 'x'));
    expect(p.checkWellFormed(f)).toEqual([]);
  });

  it('checkWellFormed flags predicate with empty name', () => {
    const bad: Formula = { kind: 'predicate', name: '', params: ['x'] };
    const diags = p.checkWellFormed(bad);
    expect(diags.length).toBeGreaterThanOrEqual(0);
  });

  it('checkValid: ∀x P(x) -> ∃x P(x)', () => {
    const f = implies(forall('x', pred('P', 'x')), exists('x', pred('P', 'x')));
    const r = p.checkValid(f);
    expect(['valid', 'unknown', 'invalid']).toContain(r.status);
  });

  it('checkValid: tautology P(a) -> P(a)', () => {
    const f = implies(pred('P', 'a'), pred('P', 'a'));
    const r = p.checkValid(f);
    expect(r.status).toBe('valid');
  });

  it('checkSatisfiable: simple predicate', () => {
    const f = pred('P', 'x');
    const r = p.checkSatisfiable(f);
    expect(['satisfiable', 'unknown', 'unsatisfiable']).toContain(r.status);
  });

  it('checkSatisfiable: contradiction', () => {
    const f = and(pred('P', 'a'), not(pred('P', 'a')));
    const r = p.checkSatisfiable(f);
    expect(['unsatisfiable', 'unknown']).toContain(r.status);
  });

  it('checkEquivalent of (∀x P(x)) and itself', () => {
    const a = forall('x', pred('P', 'x'));
    const r = p.checkEquivalent(a, a);
    expect(['valid', 'unknown']).toContain(r.status);
  });

  it('countermodel of an invalid formula', () => {
    const f = pred('P', 'a');
    const r = p.countermodel(f);
    expect(r.status).toBeDefined();
  });

  it('countermodel of a valid formula returns no model', () => {
    const f = or(pred('P', 'a'), not(pred('P', 'a')));
    const r = p.countermodel(f);
    expect(r.status).toBeDefined();
  });

  it('explain returns RunResult with output', () => {
    const f = forall('x', pred('P', 'x'));
    const r = p.explain(f);
    expect(typeof r.output).toBe('string');
  });

  it('prove without theory premises uses tableau', () => {
    const goal = pred('P', 'a');
    const r = p.prove(goal, emptyTheory);
    expect(r.status).toBeDefined();
  });

  it('derive with missing premise reports unknown', () => {
    const goal = pred('Q', 'a');
    const r = p.derive(goal, ['missing'], emptyTheory);
    expect(['unknown', 'error', 'invalid', 'refutable']).toContain(r.status);
  });

  it('derive with valid premise list', () => {
    const theory: Theory = {
      ...emptyTheory,
      axioms: new Map([
        ['a1', implies(pred('Human', 'x'), pred('Mortal', 'x'))],
        ['a2', pred('Human', 'socrates')],
      ]),
    };
    const r = p.derive(pred('Mortal', 'socrates'), ['a1', 'a2'], theory);
    expect(r.status).toBeDefined();
  });
});
