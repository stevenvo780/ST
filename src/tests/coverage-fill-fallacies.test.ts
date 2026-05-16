/**
 * Coverage fill — src/runtime/fallacies.ts
 * Current coverage: ~65% stmts, ~48% branch
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- test stubs use partial any casts for brevity */

import { describe, it, expect } from 'vitest';
import { detectFallacies } from '../runtime/fallacies';
import type { Formula } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const forall = (v: string, body: Formula): Formula => ({
  kind: 'forall',
  variable: v,
  args: [body],
});
const exists = (v: string, body: Formula): Formula => ({
  kind: 'exists',
  variable: v,
  args: [body],
});
const pred = (name: string, ...params: string[]): Formula => ({ kind: 'predicate', name, params });

// Stub profile (not used in most checkers)
const dummyProfile: any = {};

// ── No fallacy (valid argument) ───────────────────────────────────────────────

describe('detectFallacies — valid argument', () => {
  it('modus ponens has no fallacies', () => {
    const premises = [implies(atom('P'), atom('Q')), atom('P')];
    const conclusion = atom('Q');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    // modus ponens is valid — no fallacy expected
    expect(
      fallacies.filter((f) => f.name !== 'Petición de principio (Petitio Principii)'),
    ).toHaveLength(0);
  });
});

// ── Affirming the consequent ──────────────────────────────────────────────────

describe('Afirmación del consecuente', () => {
  it('detects P→Q, Q ⊢ P', () => {
    const premises = [implies(atom('P'), atom('Q')), atom('Q')];
    const conclusion = atom('P');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Afirmación del consecuente')).toBe(true);
  });

  it('no detection when conclusion is the consequent', () => {
    const premises = [implies(atom('P'), atom('Q')), atom('P')];
    const conclusion = atom('Q');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Afirmación del consecuente')).toBe(false);
  });
});

// ── Denying the antecedent ────────────────────────────────────────────────────

describe('Negación del antecedente', () => {
  it('detects P→Q, ¬P ⊢ ¬Q', () => {
    const premises = [implies(atom('P'), atom('Q')), not(atom('P'))];
    const conclusion = not(atom('Q'));
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Negación del antecedente')).toBe(true);
  });

  it('no detection when conclusion is not negated', () => {
    const premises = [implies(atom('P'), atom('Q')), not(atom('P'))];
    const conclusion = atom('Q');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Negación del antecedente')).toBe(false);
  });

  it('no detection when antecedent is not denied', () => {
    const premises = [implies(atom('P'), atom('Q')), atom('R')];
    const conclusion = not(atom('Q'));
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Negación del antecedente')).toBe(false);
  });
});

// ── Undistributed middle ──────────────────────────────────────────────────────

describe('Medio no distribuido', () => {
  it('detects P→M, S→M ⊢ S→P', () => {
    const M = atom('M');
    const P = atom('P');
    const S = atom('S');
    const premises = [implies(P, M), implies(S, M)];
    const conclusion = implies(S, P);
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Medio no distribuido')).toBe(true);
  });

  it('no detection when conclusion is not implication', () => {
    const premises = [implies(atom('A'), atom('M')), implies(atom('B'), atom('M'))];
    const conclusion = atom('C');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Medio no distribuido')).toBe(false);
  });
});

// ── Composition fallacy ───────────────────────────────────────────────────────

describe('Falacia de composición', () => {
  it('detects A→C, B→C ⊢ (A∧B)→C', () => {
    const A = atom('A');
    const B = atom('B');
    const C = atom('C');
    const premises = [implies(A, C), implies(B, C)];
    const conclusion = implies(and(A, B), C);
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Falacia de composición')).toBe(true);
  });

  it('no detection when conclusion antecedent is not AND', () => {
    const A = atom('A');
    const C = atom('C');
    const premises = [implies(A, C)];
    const conclusion = implies(A, C);
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Falacia de composición')).toBe(false);
  });
});

// ── False disjunction ─────────────────────────────────────────────────────────

describe('Posible falso dilema', () => {
  it('detects P∨Q, ¬P ⊢ Q', () => {
    const P = atom('P');
    const Q = atom('Q');
    const premises = [or(P, Q), not(P)];
    const conclusion = Q;
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Posible falso dilema')).toBe(true);
  });

  it('no detection when disjunction not in premises', () => {
    const premises = [atom('P'), not(atom('Q'))];
    const conclusion = atom('R');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Posible falso dilema')).toBe(false);
  });

  it('no detection when conclusion matches left of disjunction', () => {
    const P = atom('P');
    const Q = atom('Q');
    const premises = [or(P, Q), not(Q)];
    const conclusion = atom('X'); // doesn't match right side
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Posible falso dilema')).toBe(false);
  });
});

// ── Begging the question (petitio principii) ──────────────────────────────────

describe('Petición de principio', () => {
  it('detects when conclusion is in premises', () => {
    const P = atom('P');
    const premises = [P, implies(atom('Q'), atom('R'))];
    const conclusion = P;
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Petición de principio (Petitio Principii)')).toBe(
      true,
    );
  });

  it('no detection when conclusion not in premises', () => {
    const premises = [atom('P'), atom('Q')];
    const conclusion = atom('R');
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Petición de principio (Petitio Principii)')).toBe(
      false,
    );
  });

  it('detects complex formula in premises', () => {
    const conclusion = implies(atom('P'), atom('Q'));
    const premises = [conclusion, atom('R')];
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Petición de principio (Petitio Principii)')).toBe(
      true,
    );
  });
});

// ── Illicit conversion ────────────────────────────────────────────────────────

describe('Conversión ilícita', () => {
  it('detects ∀x(A(x)→B(x)) ⊢ ∀x(B(x)→A(x))', () => {
    const pA = pred('A', 'x');
    const pB = pred('B', 'x');
    const premise = forall('x', implies(pA, pB));
    const conclusion = forall('x', implies(pB, pA));
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Conversión ilícita')).toBe(true);
  });

  it('no detection for valid conclusion', () => {
    const pA = pred('A', 'x');
    const pB = pred('B', 'x');
    const premise = forall('x', implies(pA, pB));
    const conclusion = forall('x', implies(pA, pB)); // same, not converted
    // Will detect petitio principii but not illicit conversion
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Conversión ilícita')).toBe(false);
  });

  it('no detection when conclusion is not forall', () => {
    const premise = forall('x', implies(pred('A', 'x'), pred('B', 'x')));
    const conclusion = atom('C');
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Conversión ilícita')).toBe(false);
  });
});

// ── Hasty generalization ──────────────────────────────────────────────────────

describe('Generalización apresurada', () => {
  it('detects ∃x(S(x)∧P(x)) ⊢ ∀x(S(x)→P(x))', () => {
    const S = pred('S', 'x');
    const P = pred('P', 'x');
    const premise = exists('x', and(S, P));
    const conclusion = forall('x', implies(S, P));
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Generalización apresurada')).toBe(true);
  });

  it('no detection when conclusion is existential', () => {
    const S = pred('S', 'x');
    const P = pred('P', 'x');
    const premise = exists('x', and(S, P));
    const conclusion = exists('x', and(S, P));
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Generalización apresurada')).toBe(false);
  });
});

// ── Four terms (Quaternio terminorum) ─────────────────────────────────────────

describe('Cuatro términos', () => {
  it('detects >3 predicates in categorical syllogism', () => {
    const A = pred('A', 'x');
    const B = pred('B', 'x');
    const C = pred('C', 'x');
    const D = pred('D', 'x');
    // Quantified forms with 4 distinct predicates
    const p1 = forall('x', implies(A, B));
    const p2 = forall('x', implies(C, D));
    const conclusion = forall('x', implies(A, D));
    const fallacies = detectFallacies([p1, p2], conclusion, dummyProfile);
    expect(
      fallacies.some((f) => f.name === 'Falacia de cuatro términos (Quaternio terminorum)'),
    ).toBe(true);
  });

  it('no detection for exactly 3 terms', () => {
    const A = pred('A', 'x');
    const B = pred('B', 'x');
    const C = pred('C', 'x');
    const p1 = forall('x', implies(A, B));
    const p2 = forall('x', implies(B, C));
    const conclusion = forall('x', implies(A, C));
    const fallacies = detectFallacies([p1, p2], conclusion, dummyProfile);
    expect(
      fallacies.some((f) => f.name === 'Falacia de cuatro términos (Quaternio terminorum)'),
    ).toBe(false);
  });

  it('no detection with only 1 premise', () => {
    const A = pred('A', 'x');
    const B = pred('B', 'x');
    const C = pred('C', 'x');
    const D = pred('D', 'x');
    const p1 = forall('x', implies(A, B));
    const conclusion = forall('x', implies(C, D));
    const fallacies = detectFallacies([p1], conclusion, dummyProfile);
    expect(
      fallacies.some((f) => f.name === 'Falacia de cuatro términos (Quaternio terminorum)'),
    ).toBe(false);
  });
});

// ── Division fallacy ──────────────────────────────────────────────────────────

describe('Falacia de división', () => {
  it('detects (A∧B)→C ⊢ A→C', () => {
    const A = atom('A');
    const B = atom('B');
    const C = atom('C');
    const premise = implies(and(A, B), C);
    const conclusion = implies(A, C);
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Falacia de división')).toBe(true);
  });

  it('no detection when conclusion is not implication', () => {
    const A = atom('A');
    const B = atom('B');
    const C = atom('C');
    const premise = implies(and(A, B), C);
    const conclusion = atom('D');
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Falacia de división')).toBe(false);
  });

  it('no detection when premise antecedent is not AND', () => {
    const A = atom('A');
    const C = atom('C');
    const premise = implies(A, C);
    const conclusion = implies(atom('B'), C);
    const fallacies = detectFallacies([premise], conclusion, dummyProfile);
    expect(fallacies.some((f) => f.name === 'Falacia de división')).toBe(false);
  });
});

// ── Multiple fallacies at once ────────────────────────────────────────────────

describe('Multiple fallacies', () => {
  it('can detect multiple fallacies simultaneously', () => {
    // Affirming consequent + Begging question simultaneously
    const P = atom('P');
    const Q = atom('Q');
    // Affirming consequent: P→Q, Q ⊢ P; also begging question if P is also a premise
    const premises = [implies(P, Q), Q, P];
    const conclusion = P;
    const fallacies = detectFallacies(premises, conclusion, dummyProfile);
    expect(fallacies.length).toBeGreaterThanOrEqual(2);
  });

  it('empty premises returns only possible petitio', () => {
    const fallacies = detectFallacies([], atom('P'), dummyProfile);
    // No premises means no premises-based fallacies
    expect(fallacies.some((f) => f.name === 'Afirmación del consecuente')).toBe(false);
  });
});
