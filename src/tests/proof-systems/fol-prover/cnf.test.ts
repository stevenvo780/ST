import { describe, it, expect } from 'vitest';
import { Formula } from '../../../types';
import { toCNF, skolemize } from '../../../proof-systems/fol-prover/cnf';

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

describe('CNF / Skolemization', () => {
  it('skolemizes ∃x. P(x) into P(sk_c0)', () => {
    const f = exists('x', predicate('P', ['x']));
    const sk = skolemize(f);
    expect(sk.kind).toBe('predicate');
    expect(sk.name).toBe('P');
    expect(sk.params?.[0]).toBe('sk_c0');
  });

  it('skolemizes ∀x. ∃y. R(x, y) introducing skolem function', () => {
    const f = forall('x', exists('y', predicate('R', ['x', 'y'])));
    const sk = skolemize(f);
    const flat = JSON.stringify(sk);
    expect(flat).toContain('sk_f');
  });

  it('converts ∀x. P(x) → Q(x) to clauses [¬P(x), Q(x)]', () => {
    const f = forall('x', implies(predicate('P', ['x']), predicate('Q', ['x'])));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    const c = clauses[0];
    expect(c).toBeDefined();
    if (!c) return;
    expect(c.length).toBe(2);
    const preds = c.map((l) => `${l.negated ? '!' : ''}${l.predicate}`).sort();
    expect(preds).toEqual(['!P', 'Q']);
  });

  it('handles conjunction: P ∧ Q → two clauses', () => {
    const f = and(predicate('P', []), predicate('Q', []));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(2);
  });

  it('handles disjunction: P ∨ Q → one clause with two literals', () => {
    const f = or(predicate('P', []), predicate('Q', []));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    expect(clauses[0]?.length).toBe(2);
  });

  it('pushes negation inward: ¬(P ∧ Q) → ¬P ∨ ¬Q', () => {
    const f = not(and(predicate('P', []), predicate('Q', [])));
    const clauses = toCNF(f);
    expect(clauses.length).toBe(1);
    const c = clauses[0];
    expect(c).toBeDefined();
    if (!c) return;
    expect(c.every((l) => l.negated)).toBe(true);
  });
});
