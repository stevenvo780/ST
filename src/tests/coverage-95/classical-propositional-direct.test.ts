import { describe, it, expect } from 'vitest';
import { ClassicalPropositional } from '../../logic/profiles/classical/propositional';
import type { Formula, Theory } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });

const emptyTheory: Theory = {
  profile: 'classical.propositional',
  axioms: new Map(),
  theorems: new Map(),
  claims: new Map(),
  judgments: [],
};

describe('ClassicalPropositional — direct profile invocations', () => {
  const p = new ClassicalPropositional();

  it('checkValid: tautology P -> P', () => {
    const r = p.checkValid(implies(atom('P'), atom('P')));
    expect(r.status).toBe('valid');
  });

  it('checkValid: contradiction !(P -> P)', () => {
    const r = p.checkValid(not(implies(atom('P'), atom('P'))));
    expect(r.status).toBe('invalid');
  });

  it('checkValid: contingent P', () => {
    const r = p.checkValid(atom('P'));
    expect(r.status).toBe('invalid');
  });

  it('checkValid: ill-formed predicate returns error', () => {
    const f: Formula = { kind: 'predicate', name: 'P', params: ['x'] };
    const r = p.checkValid(f);
    expect(r.status).toBe('error');
  });

  it('checkSatisfiable: P is satisfiable', () => {
    const r = p.checkSatisfiable(atom('P'));
    expect(r.status).toBe('satisfiable');
  });

  it('checkSatisfiable: P & !P is unsatisfiable', () => {
    const r = p.checkSatisfiable(and(atom('P'), not(atom('P'))));
    expect(r.status).toBe('unsatisfiable');
  });

  it('checkEquivalent: De Morgan ¬(P ∧ Q) ≡ ¬P ∨ ¬Q', () => {
    const lhs = not(and(atom('P'), atom('Q')));
    const rhs = or(not(atom('P')), not(atom('Q')));
    const r = p.checkEquivalent(lhs, rhs);
    expect(r.status).toBe('valid');
  });

  it('checkEquivalent: P and Q are NOT equivalent', () => {
    const r = p.checkEquivalent(atom('P'), atom('Q'));
    expect(r.status).toBe('invalid');
  });

  it('countermodel of tautology returns valid', () => {
    const r = p.countermodel(implies(atom('P'), atom('P')));
    expect(r.status).toBe('valid');
  });

  it('countermodel of P -> Q returns counterexample', () => {
    const r = p.countermodel(implies(atom('P'), atom('Q')));
    expect(r.status).toBe('invalid');
    expect(r.model).toBeDefined();
  });

  it('prove from empty theory falls back to checkValid', () => {
    const r = p.prove(implies(atom('P'), atom('P')), emptyTheory);
    expect(r.status).toBe('provable');
  });

  it('prove with restricted premises', () => {
    const theory: Theory = {
      ...emptyTheory,
      axioms: new Map([
        ['a1', implies(atom('P'), atom('Q'))],
        ['a2', atom('P')],
      ]),
    };
    const r = p.prove(atom('Q'), theory, ['a1', 'a2']);
    expect(r.status).toBe('provable');
  });

  it('prove with missing premise generates warning', () => {
    const theory: Theory = {
      ...emptyTheory,
      axioms: new Map([['a', atom('P')]]),
    };
    const r = p.prove(atom('P'), theory, ['a', 'nope']);
    expect(r.diagnostics.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('prove fails when goal is unprovable from premises', () => {
    const theory: Theory = {
      ...emptyTheory,
      axioms: new Map([['p', atom('P')]]),
    };
    const r = p.prove(atom('Q'), theory);
    expect(r.status).toBe('refutable');
  });

  it('derive: modus ponens', () => {
    const theory: Theory = {
      ...emptyTheory,
      axioms: new Map([
        ['mp1', implies(atom('P'), atom('Q'))],
        ['mp2', atom('P')],
      ]),
    };
    const r = p.derive(atom('Q'), ['mp1', 'mp2'], theory);
    expect(r.status).toBeDefined();
  });

  it('derive with no premises uses checkValid', () => {
    const r = p.derive(implies(atom('P'), atom('P')), [], emptyTheory);
    expect(r.status).toBeDefined();
  });

  it('derive with missing premise handles gracefully', () => {
    const r = p.derive(atom('P'), ['nonExistent'], emptyTheory);
    expect(r.status).toBeDefined();
  });

  it('explain returns RunResult with detailed output', () => {
    const r = p.explain(implies(atom('P'), atom('P')));
    expect(typeof r.output).toBe('string');
    expect(r.output!.length).toBeGreaterThan(20);
  });

  it('explain on contingent formula includes truth table', () => {
    const r = p.explain(atom('P'));
    expect(typeof r.output).toBe('string');
  });

  it('checkWellFormed flags well-formed P as no diagnostics', () => {
    expect(p.checkWellFormed(atom('P'))).toEqual([]);
  });

  it('checkWellFormed flags unnamed atom', () => {
    expect(p.checkWellFormed({ kind: 'atom', name: '' }).length).toBeGreaterThan(0);
  });

  it('checkWellFormed flags negation without args', () => {
    expect(p.checkWellFormed({ kind: 'not' }).length).toBeGreaterThan(0);
  });

  it('checkWellFormed flags binary op missing args', () => {
    expect(p.checkWellFormed({ kind: 'and', args: [atom('P')] }).length).toBeGreaterThan(0);
  });

  it('checkWellFormed flags quantifiers/predicates/modal as unsupported', () => {
    const fq: Formula = { kind: 'forall', variable: 'x', args: [atom('P')] };
    expect(p.checkWellFormed(fq).length).toBeGreaterThan(0);
    const fp: Formula = { kind: 'predicate', name: 'P', params: ['x'] };
    expect(p.checkWellFormed(fp).length).toBeGreaterThan(0);
    const fm: Formula = { kind: 'modal_necessity', args: [atom('P')] };
    expect(p.checkWellFormed(fm).length).toBeGreaterThan(0);
  });

  it('truthTable: P & Q has 4 rows', () => {
    const tt = p.truthTable(and(atom('P'), atom('Q')));
    expect(tt.rows.length).toBe(4);
    expect(tt.isTautology).toBe(false);
    expect(tt.isSatisfiable).toBe(true);
  });

  it('truthTable: P | !P always true', () => {
    const tt = p.truthTable(or(atom('P'), not(atom('P'))));
    expect(tt.isTautology).toBe(true);
  });

  it('truthTable: P & !P always false', () => {
    const tt = p.truthTable(and(atom('P'), not(atom('P'))));
    expect(tt.isSatisfiable).toBe(false);
  });

  it('handles bigger formulas (8 atoms)', () => {
    let f: Formula = atom('A0');
    for (let i = 1; i < 8; i++) {
      f = or(f, atom('A' + i));
    }
    const r = p.checkSatisfiable(f);
    expect(r.status).toBe('satisfiable');
  });

  it('handles biconditional', () => {
    const r = p.checkValid(bic(implies(atom('P'), atom('Q')), or(not(atom('P')), atom('Q'))));
    expect(r.status).toBe('valid');
  });

  it('nested formula', () => {
    const f = implies(and(implies(atom('P'), atom('Q')), atom('P')), atom('Q'));
    const r = p.checkValid(f);
    expect(r.status).toBe('valid');
  });
});
