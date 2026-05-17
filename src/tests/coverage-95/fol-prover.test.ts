import { describe, it, expect } from 'vitest';
import { toCNF, skolemize, negate } from '../../fol-prover/cnf';
import { resolve, resolveWithRecord, runResolutionLoop } from '../../fol-prover/resolve';
import {
  mkVar,
  mkConst,
  mkFunc,
  mkLit,
  type FOLClause,
  type FOLTerm,
} from '../../fol-prover/types';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const pred = (name: string, ...params: string[]): Formula => ({
  kind: 'predicate',
  name,
  params,
  terms: params,
});
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (...args: Formula[]): Formula => ({ kind: 'and', args });
const or = (...args: Formula[]): Formula => ({ kind: 'or', args });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const biconditional = (a: Formula, b: Formula): Formula => ({
  kind: 'biconditional',
  args: [a, b],
});
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

describe('fol-prover/cnf — basic transformations', () => {
  it('negate wraps with not', () => {
    expect(negate(atom('P'))).toEqual({ kind: 'not', args: [atom('P')] });
  });

  it('toCNF on a simple predicate yields a single clause', () => {
    const f = pred('P', 'x');
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    expect(clauses[0]?.[0]?.predicate).toBe('P');
  });

  it('toCNF on disjunction yields one clause with two literals', () => {
    const f = or(pred('P', 'x'), pred('Q', 'x'));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    expect(clauses[0]?.length).toBe(2);
  });

  it('toCNF on conjunction yields two clauses', () => {
    const f = and(pred('P', 'x'), pred('Q', 'y'));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(2);
  });

  it('toCNF eliminates implication', () => {
    const f = implies(pred('P', 'x'), pred('Q', 'x'));
    const clauses = toCNF(f);
    expect(clauses.length).toBeGreaterThanOrEqual(1);
  });

  it('toCNF eliminates biconditional', () => {
    const f = biconditional(pred('P', 'x'), pred('Q', 'x'));
    const clauses = toCNF(f);
    expect(clauses.length).toBeGreaterThanOrEqual(2);
  });

  it('toCNF skolemizes exists into a constant or function', () => {
    const f = exists('x', pred('P', 'x'));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    const lit = clauses[0]?.[0];
    expect(lit?.predicate).toBe('P');
    expect(lit?.args[0]?.kind === 'const' || lit?.args[0]?.kind === 'func').toBe(true);
  });

  it('toCNF skolemizes nested exists inside forall (yields const or func)', () => {
    const f = forall('x', exists('y', pred('R', 'x', 'y')));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    const lit = clauses[0]?.[0];
    expect(lit?.predicate).toBe('R');
    expect(['func', 'const']).toContain(lit?.args[1]?.kind);
  });

  it('toCNF drops universal quantifiers', () => {
    const f = forall('x', pred('P', 'x'));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    const lit = clauses[0]?.[0];
    expect(lit?.args[0]?.kind).toBe('var');
  });

  it('skolemize() returns a Formula', () => {
    const f = forall('x', exists('y', pred('R', 'x', 'y')));
    const sk = skolemize(f);
    expect(sk).toBeDefined();
  });

  it('handles double-negation', () => {
    const f = not(not(pred('P', 'x')));
    const clauses = toCNF(f);
    expect(clauses[0]?.[0]?.negated).toBe(false);
  });

  it('pushes negation through and/or (De Morgan)', () => {
    const f = not(and(pred('P', 'x'), pred('Q', 'x')));
    const clauses = toCNF(f);
    expect(clauses[0]?.length).toBe(2);
  });

  it('handles negated exists -> forall', () => {
    const f = not(exists('x', pred('P', 'x')));
    const clauses = toCNF(f);
    expect(clauses[0]?.[0]?.negated).toBe(true);
  });

  it('handles negated forall -> exists', () => {
    const f = not(forall('x', pred('P', 'x')));
    const clauses = toCNF(f);
    expect(
      clauses[0]?.[0]?.args[0]?.kind === 'const' || clauses[0]?.[0]?.args[0]?.kind === 'func',
    ).toBe(true);
  });
});

describe('fol-prover/resolve — resolution rule', () => {
  const lit = (neg: boolean, p: string, ...args: FOLTerm[]) => mkLit(neg, p, args);

  it('resolves complementary unit clauses to empty clause', () => {
    const c1: FOLClause = [lit(false, 'P', mkConst('a'))];
    const c2: FOLClause = [lit(true, 'P', mkConst('a'))];
    const out = resolve(c1, c2);
    expect(out.length).toBe(1);
    expect(out[0]?.length).toBe(0);
  });

  it('returns no resolvents for non-complementary literals', () => {
    const c1: FOLClause = [lit(false, 'P', mkConst('a'))];
    const c2: FOLClause = [lit(false, 'P', mkConst('a'))];
    expect(resolve(c1, c2).length).toBe(0);
  });

  it('returns no resolvents for different predicates', () => {
    const c1: FOLClause = [lit(false, 'P', mkConst('a'))];
    const c2: FOLClause = [lit(true, 'Q', mkConst('a'))];
    expect(resolve(c1, c2).length).toBe(0);
  });

  it('returns no resolvents for different arities', () => {
    const c1: FOLClause = [lit(false, 'P', mkConst('a'))];
    const c2: FOLClause = [lit(true, 'P', mkConst('a'), mkConst('b'))];
    expect(resolve(c1, c2).length).toBe(0);
  });

  it('returns no resolvents when unification fails (different constants)', () => {
    const c1: FOLClause = [lit(false, 'P', mkConst('a'))];
    const c2: FOLClause = [lit(true, 'P', mkConst('b'))];
    expect(resolve(c1, c2).length).toBe(0);
  });

  it('unifies variable with constant', () => {
    const c1: FOLClause = [lit(false, 'P', mkVar('x'))];
    const c2: FOLClause = [lit(true, 'P', mkConst('a'))];
    const out = resolve(c1, c2);
    expect(out.length).toBe(1);
  });

  it('resolveWithRecord returns substitution record', () => {
    const c1: FOLClause = [lit(false, 'P', mkVar('x'))];
    const c2: FOLClause = [lit(true, 'P', mkConst('a'))];
    const out = resolveWithRecord({ c1Idx: 0, c2Idx: 1, c1, c2 });
    expect(out.length).toBe(1);
    expect(out[0]?.from).toEqual([0, 1]);
    expect(typeof out[0]?.substitution).toBe('object');
  });
});

describe('fol-prover/resolve — runResolutionLoop', () => {
  const lit = (neg: boolean, p: string, ...args: FOLTerm[]) => mkLit(neg, p, args);

  it('proves a trivial contradiction', () => {
    const premiseClauses: FOLClause[] = [[lit(false, 'P', mkConst('a'))]];
    const negatedGoalClauses: FOLClause[] = [[lit(true, 'P', mkConst('a'))]];
    const res = runResolutionLoop({
      premiseClauses,
      negatedGoalClauses,
      timeoutMs: 1000,
      maxSteps: 100,
    });
    expect(res.proven).toBe(true);
    expect(res.steps.length).toBeGreaterThan(0);
  });

  it('saturates when no proof exists', () => {
    const premiseClauses: FOLClause[] = [[lit(false, 'P', mkConst('a'))]];
    const negatedGoalClauses: FOLClause[] = [[lit(true, 'Q', mkConst('b'))]];
    const res = runResolutionLoop({
      premiseClauses,
      negatedGoalClauses,
      timeoutMs: 1000,
      maxSteps: 100,
    });
    expect(res.proven).toBe(false);
    expect(res.reason).toBe('saturated');
  });

  it('respects maxSteps cap', () => {
    const premiseClauses: FOLClause[] = [
      [lit(false, 'P', mkVar('x')), lit(true, 'Q', mkFunc('f', [mkVar('x')]))],
      [lit(true, 'P', mkConst('a'))],
      [lit(false, 'Q', mkVar('y'))],
    ];
    const negatedGoalClauses: FOLClause[] = [[lit(true, 'R', mkConst('c'))]];
    const res = runResolutionLoop({
      premiseClauses,
      negatedGoalClauses,
      timeoutMs: 5000,
      maxSteps: 2,
    });
    expect(res.proven).toBe(false);
  });

  it('detects tautologies and skips them', () => {
    const premiseClauses: FOLClause[] = [
      [lit(false, 'P', mkConst('a')), lit(true, 'P', mkConst('a'))],
    ];
    const negatedGoalClauses: FOLClause[] = [[lit(true, 'Q', mkConst('b'))]];
    const res = runResolutionLoop({
      premiseClauses,
      negatedGoalClauses,
      timeoutMs: 1000,
      maxSteps: 100,
    });
    expect(res.proven).toBe(false);
  });

  it('proves classical syllogism Socrates is mortal', () => {
    // ∀x (Human(x) → Mortal(x))  ≡  ¬Human(x) ∨ Mortal(x)
    // Human(socrates)
    // ⊨ Mortal(socrates)
    const premiseClauses: FOLClause[] = [
      [lit(true, 'Human', mkVar('x')), lit(false, 'Mortal', mkVar('x'))],
      [lit(false, 'Human', mkConst('socrates'))],
    ];
    const negatedGoalClauses: FOLClause[] = [[lit(true, 'Mortal', mkConst('socrates'))]];
    const res = runResolutionLoop({
      premiseClauses,
      negatedGoalClauses,
      timeoutMs: 1000,
      maxSteps: 100,
    });
    expect(res.proven).toBe(true);
  });
});
