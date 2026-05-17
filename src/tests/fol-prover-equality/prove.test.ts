import { describe, expect, it } from 'vitest';
import type { Formula } from '../../types';
import type { FOLClause, FOLTerm } from '../../fol-prover/types';
import {
  EQ_PREDICATE,
  demodulate,
  equalityFactor,
  isEqualityLiteral,
  paramodulate,
  proveWithEquality,
  reflexivityResolve,
} from '../../fol-prover-equality';

// ---------- Formula helpers ----------

function predicate(name: string, params: string[]): Formula {
  return { kind: 'predicate', name, params, terms: params };
}

function equals(a: string, b: string): Formula {
  return { kind: 'equals', params: [a, b], terms: [a, b] };
}

function forall(v: string, body: Formula): Formula {
  return { kind: 'forall', variable: v, args: [body] };
}

// ---------- Term helpers ----------

function v(name: string): FOLTerm {
  return { kind: 'var', name };
}
function c(name: string): FOLTerm {
  return { kind: 'const', name };
}
function f(name: string, args: FOLTerm[]): FOLTerm {
  return { kind: 'func', name, args };
}

function eqLit(a: FOLTerm, b: FOLTerm, negated = false): FOLClause[number] {
  return { negated, predicate: EQ_PREDICATE, args: [a, b] };
}
function predLit(name: string, args: FOLTerm[], negated = false): FOLClause[number] {
  return { negated, predicate: name, args };
}

describe('FOL equality — paramodulation core', () => {
  it('1. f(a) = a, P(f(a)) ⊢ P(a)  (paramodulation)', () => {
    const p1 = forall('x', equals('x', 'x')); // dummy reflex
    // Build manually because `equals` formula parses string params; we use predicate trick.
    const eq_fa_a: Formula = {
      kind: 'predicate',
      name: '=',
      params: ['f(a)', 'a'],
      terms: ['f(a)', 'a'],
    };
    // Above won't decompose f(a) correctly via CNF (it would treat "f(a)" as a const).
    // Instead, we drive the prover with raw clauses through paramodulate() directly
    // for this specific test, and also assert that the high-level prover handles a
    // simpler form: c = a, P(c) ⊢ P(a) (the c-case is what naturally appears in CNF).
    void p1;
    void eq_fa_a;

    const eqClause: FOLClause = [eqLit(f('f', [c('a')]), c('a'))];
    const targetClause: FOLClause = [predLit('P', [f('f', [c('a')])])];
    const result = paramodulate(eqClause, 0, targetClause, 0, [0]);
    expect(result).not.toBeNull();
    expect(result?.length).toBe(1);
    expect(result?.[0]?.predicate).toBe('P');
    expect(result?.[0]?.args[0]?.kind).toBe('const');
    expect((result?.[0]?.args[0] as { name: string }).name).toBe('a');
  });

  it('2. a = b, b = c ⊢ a = c (transitividad via paramodulation chain)', () => {
    const p1 = equals('a', 'b');
    const p2 = equals('b', 'c');
    const goal = equals('a', 'c');
    const r = proveWithEquality([p1, p2], goal, { timeoutMs: 3000, maxSteps: 500 });
    expect(r.proven).toBe(true);
  });

  it('3. a = b, P(a) ⊢ P(b) (paramodulation substitutiva)', () => {
    const p1 = equals('a', 'b');
    const p2 = predicate('P', ['a']);
    const goal = predicate('P', ['b']);
    const r = proveWithEquality([p1, p2], goal, { timeoutMs: 3000, maxSteps: 500 });
    expect(r.proven).toBe(true);
  });

  it('4. ⊢ ∀x. x = x  (reflexividad trivial)', () => {
    const goal = forall('x', equals('x', 'x'));
    const r = proveWithEquality([], goal, { timeoutMs: 2000, maxSteps: 200 });
    expect(r.proven).toBe(true);
  });

  it('5. f(a) = a ⊢ f(f(a)) = a (rewriting iterado via paramodulation)', () => {
    // Drive at clause level: from {f(a)=a} we should derive {f(f(a))=a}.
    const eqClause: FOLClause = [eqLit(f('f', [c('a')]), c('a'))];
    // target clause: f(f(a)) = a as negated goal would become ¬(f(f(a))=a)
    const negGoal: FOLClause = [eqLit(f('f', [f('f', [c('a')])]), c('a'), true)];

    // Paramodulate eqClause into negGoal at the inner f(a) (position [0, 0]):
    //   negGoal's literal arg[0] = f(f(a)); descend into arg[0] of that = f(a).
    const r1 = paramodulate(eqClause, 0, negGoal, 0, [0, 0]);
    expect(r1).not.toBeNull();
    // Result should be ¬(f(a) = a). Apply paramodulation once more.
    expect(r1?.length).toBe(1);
    const lit1 = r1?.[0];
    expect(lit1?.predicate).toBe(EQ_PREDICATE);
    expect(lit1?.negated).toBe(true);

    const r2 = paramodulate(eqClause, 0, r1 ?? [], 0, [0]);
    expect(r2).not.toBeNull();
    // Result: ¬(a = a) — apply reflexivity to close it.
    const closed = reflexivityResolve(r2 ?? []);
    expect(closed).not.toBeNull();
    expect(closed?.length).toBe(0);
  });

  it('6. Reflexivity resolution closes ¬(a = a)', () => {
    const cl: FOLClause = [eqLit(c('a'), c('a'), true)];
    const r = reflexivityResolve(cl);
    expect(r).not.toBeNull();
    expect(r?.length).toBe(0);
  });

  it('7. demodulate replaces f(a) with a in P(f(a))', () => {
    const cl: FOLClause = [predLit('P', [f('f', [c('a')])])];
    const out = demodulate(cl, [{ from: f('f', [c('a')]), to: c('a') }]);
    expect(out.length).toBe(1);
    expect(out[0]?.args[0]?.kind).toBe('const');
    expect((out[0]?.args[0] as { name: string }).name).toBe('a');
  });

  it('8. demodulate is idempotent at fixed point', () => {
    const cl: FOLClause = [predLit('P', [c('a')])];
    const out = demodulate(cl, [{ from: f('f', [c('a')]), to: c('a') }]);
    expect(out.length).toBe(1);
    expect((out[0]?.args[0] as { name: string }).name).toBe('a');
  });

  it('9. demodulate orients rules so the larger side is rewritten away', () => {
    // Rule given backwards: from a, to f(a). Should be flipped to f(a) → a.
    const cl: FOLClause = [predLit('P', [f('f', [c('a')])])];
    const out = demodulate(cl, [{ from: c('a'), to: f('f', [c('a')]) }]);
    expect((out[0]?.args[0] as { name: string }).name).toBe('a');
  });

  it('10. equalityFactor on x = b ∨ x = c (with x variable) produces a factor', () => {
    const cl: FOLClause = [eqLit(v('x'), c('b')), eqLit(v('x'), c('c'))];
    const factors = equalityFactor(cl);
    expect(factors.length).toBeGreaterThan(0);
    // Each factor must contain a negative __eq__(b, c) or __eq__(c, b)
    for (const fac of factors) {
      const hasNeg = fac.some((l) => l.negated && isEqualityLiteral(l));
      expect(hasNeg).toBe(true);
    }
  });

  it('11. proves chained substitution: a=b, b=c, P(a) ⊢ P(c)', () => {
    const r = proveWithEquality(
      [equals('a', 'b'), equals('b', 'c'), predicate('P', ['a'])],
      predicate('P', ['c']),
      { timeoutMs: 4000, maxSteps: 800 },
    );
    expect(r.proven).toBe(true);
  });

  it('12. does NOT prove P(c) from a=b and P(a) (c is unrelated)', () => {
    const r = proveWithEquality([equals('a', 'b'), predicate('P', ['a'])], predicate('P', ['c']), {
      timeoutMs: 800,
      maxSteps: 200,
    });
    expect(r.proven).toBe(false);
  });

  it('13. paramodulate returns null when unification fails', () => {
    const eqClause: FOLClause = [eqLit(c('a'), c('b'))];
    const target: FOLClause = [predLit('P', [c('z')])];
    const r = paramodulate(eqClause, 0, target, 0, [0]);
    expect(r).toBeNull();
  });

  it('14. paramodulate skips bare variable subterms (no useless rewrites)', () => {
    const eqClause: FOLClause = [eqLit(c('a'), c('b'))];
    const target: FOLClause = [predLit('P', [v('y')])];
    const r = paramodulate(eqClause, 0, target, 0, [0]);
    // arg is a variable, must be null per design.
    expect(r).toBeNull();
  });

  it('15. timeout: explosive equality search hits timeout cleanly', () => {
    // a=b, b=c, c=d, d=e ... goal is an unrelated predicate that can't be reached.
    const premises: Formula[] = [
      equals('a', 'b'),
      equals('b', 'c'),
      equals('c', 'd'),
      equals('d', 'e'),
      predicate('P', ['a']),
    ];
    const goal = predicate('Q', ['z']);
    const start = Date.now();
    const r = proveWithEquality(premises, goal, { timeoutMs: 150, maxSteps: 5000 });
    const elapsed = Date.now() - start;
    expect(r.proven).toBe(false);
    expect(elapsed).toBeLessThan(150 + 500);
  });

  it('16. proves symmetric goal: a = b ⊢ b = a', () => {
    const r = proveWithEquality([equals('a', 'b')], equals('b', 'a'), {
      timeoutMs: 2000,
      maxSteps: 300,
    });
    expect(r.proven).toBe(true);
  });
});
