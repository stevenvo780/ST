import { describe, it, expect } from 'vitest';
import { Formula } from '../../types';
import { proveFOL } from '../../fol-prover/prove';

function predicate(name: string, params: string[]): Formula {
  return { kind: 'predicate', name, params, terms: params };
}

function forall(v: string, body: Formula): Formula {
  return { kind: 'forall', variable: v, args: [body] };
}

function exists(v: string, body: Formula): Formula {
  return { kind: 'exists', variable: v, args: [body] };
}

function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}

function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}

function or(a: Formula, b: Formula): Formula {
  return { kind: 'or', args: [a, b] };
}

function not(a: Formula): Formula {
  return { kind: 'not', args: [a] };
}

describe('FOL resolution prover', () => {
  it('proves tautology ∀x. P(x) → P(x)', () => {
    const goal = forall('x', implies(predicate('P', ['x']), predicate('P', ['x'])));
    const r = proveFOL([], goal);
    expect(r.proven).toBe(true);
  });

  it('modus ponens FOL: ∀x. P(x), P(a) → Q(a) ⊢ Q(a)', () => {
    const p1 = forall('x', predicate('P', ['x']));
    const p2 = implies(predicate('P', ['a']), predicate('Q', ['a']));
    const goal = predicate('Q', ['a']);
    const r = proveFOL([p1, p2], goal);
    expect(r.proven).toBe(true);
  });

  it('does NOT prove P(b) from P(a)', () => {
    const p1 = predicate('P', ['a']);
    const goal = predicate('P', ['b']);
    const r = proveFOL([p1], goal, { timeoutMs: 1000, maxSteps: 200 });
    expect(r.proven).toBe(false);
  });

  it('proves universal instantiation: ∀x. P(x) ⊢ P(a)', () => {
    const p = forall('x', predicate('P', ['x']));
    const goal = predicate('P', ['a']);
    const r = proveFOL([p], goal);
    expect(r.proven).toBe(true);
  });

  it('proves chained implication: ∀x. P(x)→Q(x), ∀x. Q(x)→R(x), P(a) ⊢ R(a)', () => {
    const p1 = forall('x', implies(predicate('P', ['x']), predicate('Q', ['x'])));
    const p2 = forall('x', implies(predicate('Q', ['x']), predicate('R', ['x'])));
    const p3 = predicate('P', ['a']);
    const goal = predicate('R', ['a']);
    const r = proveFOL([p1, p2, p3], goal, { timeoutMs: 2000, maxSteps: 500 });
    expect(r.proven).toBe(true);
  });

  it('proves contradiction (P ∧ ¬P): ⊢ Q (ex falso desde premisas)', () => {
    const p1 = predicate('P', ['a']);
    const p2 = not(predicate('P', ['a']));
    const goal = predicate('Q', ['b']);
    const r = proveFOL([p1, p2], goal);
    expect(r.proven).toBe(true);
  });

  it('proves disjunction conclusion: P(a) ⊢ P(a) ∨ Q(b)', () => {
    const p1 = predicate('P', ['a']);
    const goal = or(predicate('P', ['a']), predicate('Q', ['b']));
    const r = proveFOL([p1], goal);
    expect(r.proven).toBe(true);
  });

  it('proves Socrates-style: ∀x. Human(x) → Mortal(x), Human(socrates) ⊢ Mortal(socrates)', () => {
    const p1 = forall('x', implies(predicate('Human', ['x']), predicate('Mortal', ['x'])));
    const p2 = predicate('Human', ['socrates']);
    const goal = predicate('Mortal', ['socrates']);
    const r = proveFOL([p1, p2], goal);
    expect(r.proven).toBe(true);
  });

  it('does NOT prove unrelated conclusion from premise: Q(b) from P(a)', () => {
    const p1 = predicate('P', ['a']);
    const goal = predicate('Q', ['b']);
    const r = proveFOL([p1], goal, { timeoutMs: 800, maxSteps: 100 });
    expect(r.proven).toBe(false);
  });

  it('respects timeout on explosive search', () => {
    const premises: Formula[] = [];
    for (let i = 0; i < 6; i++) {
      premises.push(
        forall(
          'x',
          implies(
            predicate(`P${i}`, ['x']),
            and(predicate(`P${i}`, ['x']), predicate(`P${i + 1}`, ['x'])),
          ),
        ),
      );
    }
    premises.push(predicate('P0', ['a']));
    const goal = predicate('UNREACHABLE', ['a']);
    const start = Date.now();
    const r = proveFOL(premises, goal, { timeoutMs: 200, maxSteps: 10000 });
    const elapsed = Date.now() - start;
    expect(r.proven).toBe(false);
    expect(elapsed).toBeLessThan(200 + 500);
  });

  it('handles existential premise: ∃x. P(x), ∀x. P(x)→Q(x) ⊢ ∃x. Q(x)', () => {
    const p1 = exists('x', predicate('P', ['x']));
    const p2 = forall('x', implies(predicate('P', ['x']), predicate('Q', ['x'])));
    const goal = exists('x', predicate('Q', ['x']));
    const r = proveFOL([p1, p2], goal, { timeoutMs: 2000, maxSteps: 500 });
    expect(r.proven).toBe(true);
  });
});
