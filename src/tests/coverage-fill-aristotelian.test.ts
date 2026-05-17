/**
 * Coverage fill — src/profiles/aristotelian/syllogistic.ts
 * Current coverage: ~30% stmts, ~38% branch
 * Uses: AristotelianSyllogistic directly + evaluate() API
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- test stubs use partial any casts for brevity */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../api';
import { AristotelianSyllogistic } from '../profiles/aristotelian/syllogistic';
import type { Formula } from '../types';

const profile = new AristotelianSyllogistic();

// ── Formula constructors ──────────────────────────────────────────────────────

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
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
const pred = (name: string): Formula => ({ kind: 'predicate', name, params: ['x'] });

// ── Categorical propositions as quantified formulas ───────────────────────────

// A: Todo S es P — ∀x(S(x) → P(x))
const universal_aff = (S: string, P: string): Formula => forall('x', implies(pred(S), pred(P)));

// E: Ningún S es P — ∀x(S(x) → ¬P(x))
const universal_neg = (S: string, P: string): Formula =>
  forall('x', implies(pred(S), not(pred(P))));

// I: Algún S es P — ∃x(S(x) ∧ P(x))
const particular_aff = (S: string, P: string): Formula => exists('x', and(pred(S), pred(P)));

// O: Algún S no es P — ∃x(S(x) ∧ ¬P(x))
const particular_neg = (S: string, P: string): Formula => exists('x', and(pred(S), not(pred(P))));

// Syllogism formula: (P1 ∧ P2) → C
const syllogism = (p1: Formula, p2: Formula, c: Formula): Formula => implies(and(p1, p2), c);

const emptyTheory = () => ({
  axioms: new Map<string, Formula>(),
  theorems: new Map<string, Formula>(),
  claims: new Map<string, Formula>(),
  judgments: [] as any[],
  profile: 'aristotelian.syllogistic',
});

// ── checkWellFormed ───────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.checkWellFormed', () => {
  it('universal affirmative is well-formed (no warning)', () => {
    const diags = profile.checkWellFormed(universal_aff('S', 'P'));
    expect(diags).toHaveLength(0);
  });

  it('plain atom gives warning (not categorical)', () => {
    const diags = profile.checkWellFormed(atom('P'));
    expect(diags.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('particular affirmative is well-formed', () => {
    const diags = profile.checkWellFormed(particular_aff('S', 'P'));
    expect(diags).toHaveLength(0);
  });

  it('simplified propositional A-form: S→P', () => {
    const f = implies(atom('S'), atom('P'));
    const diags = profile.checkWellFormed(f);
    expect(diags).toHaveLength(0);
  });

  it('simplified propositional I-form: S∧P', () => {
    const f = and(atom('S'), atom('P'));
    const diags = profile.checkWellFormed(f);
    expect(diags).toHaveLength(0);
  });
});

// ── checkValid — syllogism validation ─────────────────────────────────────────

describe('AristotelianSyllogistic.checkValid', () => {
  it('Barbara (Fig.1: All M is P, All S is M ⊢ All S is P) is valid', () => {
    // Barbara: AAA-1: M→P, S→M ⊢ S→P
    const p1 = universal_aff('M', 'P');
    const p2 = universal_aff('S', 'M');
    const conclusion = universal_aff('S', 'P');
    const f = syllogism(p1, p2, conclusion);
    const result = profile.checkValid(f);
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Barbara');
  });

  it('Celarent (Fig.1: No M is P, All S is M ⊢ No S is P) is valid', () => {
    const p1 = universal_neg('M', 'P');
    const p2 = universal_aff('S', 'M');
    const conclusion = universal_neg('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Celarent');
  });

  it('Darii (Fig.1: All M is P, Some S is M ⊢ Some S is P) is valid', () => {
    const p1 = universal_aff('M', 'P');
    const p2 = particular_aff('S', 'M');
    const conclusion = particular_aff('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Darii');
  });

  it('Ferio (Fig.1: No M is P, Some S is M ⊢ Some S is not P) is valid', () => {
    const p1 = universal_neg('M', 'P');
    const p2 = particular_aff('S', 'M');
    const conclusion = particular_neg('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Ferio');
  });

  it('invalid syllogism returns invalid', () => {
    // AAA-2 is invalid (undistributed middle)
    const p1 = universal_aff('P', 'M');
    const p2 = universal_aff('S', 'M');
    const conclusion = universal_aff('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('invalid');
  });

  it('non-syllogism formula returns unknown', () => {
    const result = profile.checkValid(atom('P'));
    expect(result.status).toBe('unknown');
  });

  it('syllogism with incomplete premises returns unknown', () => {
    const result = profile.checkValid(implies(atom('P'), atom('Q')));
    expect(result.status).toBe('unknown');
  });

  it('Cesare (Fig.2: No P is M, All S is M ⊢ No S is P) is valid', () => {
    const p1 = universal_neg('P', 'M');
    const p2 = universal_aff('S', 'M');
    const conclusion = universal_neg('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Cesare');
  });

  it('Darapti (Fig.3: All M is P, All M is S ⊢ Some S is P) is valid', () => {
    const p1 = universal_aff('M', 'P');
    const p2 = universal_aff('M', 'S');
    const conclusion = particular_aff('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Darapti');
  });

  it('Bramantip (Fig.4: All P is M, All M is S ⊢ Some S is P) is valid', () => {
    const p1 = universal_aff('P', 'M');
    const p2 = universal_aff('M', 'S');
    const conclusion = particular_aff('S', 'P');
    const result = profile.checkValid(syllogism(p1, p2, conclusion));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('Bramantip');
  });
});

// ── checkSatisfiable ──────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.checkSatisfiable', () => {
  it('universal affirmative is satisfiable', () => {
    const result = profile.checkSatisfiable(universal_aff('S', 'P'));
    expect(result.status).toBe('satisfiable');
    expect(result.output).toContain('satisfacible');
  });

  it('particular affirmative is satisfiable', () => {
    const result = profile.checkSatisfiable(particular_aff('S', 'P'));
    expect(result.status).toBe('satisfiable');
  });

  it('universal negative is satisfiable', () => {
    const result = profile.checkSatisfiable(universal_neg('S', 'P'));
    expect(result.status).toBe('satisfiable');
  });

  it('particular negative is satisfiable', () => {
    const result = profile.checkSatisfiable(particular_neg('S', 'P'));
    expect(result.status).toBe('satisfiable');
  });

  it('non-categorical formula returns unknown', () => {
    const result = profile.checkSatisfiable(atom('P'));
    expect(result.status).toBe('unknown');
  });

  it('simplified A-form S→P is satisfiable', () => {
    const result = profile.checkSatisfiable(implies(atom('S'), atom('P')));
    expect(result.status).toBe('satisfiable');
  });
});

// ── prove ─────────────────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.prove', () => {
  it('proves via Barbara with 2 axioms', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    theory.axioms.set('a2', universal_aff('S', 'M'));
    const goal = universal_aff('S', 'P');
    const result = profile.prove(goal, theory as any);
    expect(result.status).toBe('provable');
    expect(result.output).toContain('Barbara');
  });

  it('returns unknown with insufficient axioms', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    const goal = universal_aff('S', 'P');
    const result = profile.prove(goal, theory as any);
    expect(result.status).toBe('unknown');
  });

  it('restricted prove with specified premises', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    theory.axioms.set('a2', universal_aff('S', 'M'));
    theory.axioms.set('a3', universal_aff('X', 'Y')); // irrelevant
    const goal = universal_aff('S', 'P');
    const result = profile.prove(goal, theory as any, ['a1', 'a2']);
    expect(result.status).toBe('provable');
  });

  it('warning for missing premise in restricted prove', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    const goal = universal_aff('S', 'P');
    const result = profile.prove(goal, theory as any, ['a1', 'nonexistent']);
    expect(result.diagnostics?.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('non-categorical goal returns unknown', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    theory.axioms.set('a2', universal_aff('S', 'M'));
    const goal = atom('Q');
    const result = profile.prove(goal, theory as any);
    expect(result.status).toBe('unknown');
  });
});

// ── derive ────────────────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.derive', () => {
  it('derives via Barbara syllogism', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    theory.axioms.set('a2', universal_aff('S', 'M'));
    const goal = universal_aff('S', 'P');
    const result = profile.derive(goal, ['a1', 'a2'], theory as any);
    expect(result.status).toBe('provable');
    expect(result.output).toContain('Barbara');
  });

  it('returns error for missing premise when another premise exists', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    const goal = universal_aff('S', 'P');
    // 'missing' is not found, returns error
    const result = profile.derive(goal, ['a1', 'missing'], theory as any);
    expect(result.status).toBe('error');
    expect(result.output).toContain('no encontrada');
  });

  it('returns unknown with only missing premises', () => {
    const theory = emptyTheory();
    const goal = universal_aff('S', 'P');
    // Only 1 missing premise: triggers entimema or unknown path
    const result = profile.derive(goal, ['missing'], theory as any);
    expect(result.status).toBe('unknown');
  });

  it('returns unknown with fewer than 2 premises', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    const goal = universal_aff('S', 'P');
    const result = profile.derive(goal, ['a1'], theory as any);
    // With 1 premise, triggers entimema detection
    expect(['unknown', 'error']).toContain(result.status);
  });

  it('entimema: single premise gives suggestions', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', universal_aff('M', 'P'));
    const goal = universal_aff('S', 'P');
    const result = profile.derive(goal, ['a1'], theory as any);
    expect(result.output).toContain('entimema');
  });

  it('non-categorical goal with 2 premises returns unknown', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', atom('P'));
    theory.axioms.set('a2', atom('Q'));
    const goal = atom('R');
    const result = profile.derive(goal, ['a1', 'a2'], theory as any);
    expect(result.status).toBe('unknown');
  });
});

// ── countermodel ─────────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.countermodel', () => {
  it('valid syllogism has no countermodel', () => {
    const p1 = universal_aff('M', 'P');
    const p2 = universal_aff('S', 'M');
    const conclusion = universal_aff('S', 'P');
    const f = syllogism(p1, p2, conclusion);
    const result = profile.countermodel(f);
    expect(result.status).toBe('valid');
    expect(result.output).toContain('No hay contramodelo');
  });

  it('invalid syllogism has countermodel', () => {
    const result = profile.countermodel(atom('P'));
    expect(result.status).toBe('invalid');
    expect(result.output).toContain('Contramodelo posible');
  });
});

// ── explain ───────────────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.explain', () => {
  it('explains universal affirmative (type A)', () => {
    const result = profile.explain(universal_aff('S', 'P'));
    expect(result.output).toContain('Cuadro de Oposición');
    expect(result.output).toContain('Todo S es P');
    expect(result.output).toContain('Distribución');
  });

  it('explains universal negative (type E)', () => {
    const result = profile.explain(universal_neg('S', 'P'));
    expect(result.output).toContain('Ningún S es P');
  });

  it('explains particular affirmative (type I)', () => {
    const result = profile.explain(particular_aff('S', 'P'));
    expect(result.output).toContain('Algún S es P');
  });

  it('explains particular negative (type O)', () => {
    const result = profile.explain(particular_neg('S', 'P'));
    expect(result.output).toContain('Algún S no es P');
  });

  it('explains non-categorical formula', () => {
    const result = profile.explain(atom('X'));
    expect(result.output).toContain('Silogística Aristotélica');
  });

  it('explain A shows contraposition', () => {
    const result = profile.explain(universal_aff('S', 'P'));
    expect(result.output).toContain('Contraposición');
  });

  it('explain E shows subalternation', () => {
    const result = profile.explain(universal_neg('S', 'P'));
    expect(result.output).toContain('Subalterna');
  });

  it('explain I shows subcontrariety', () => {
    const result = profile.explain(particular_aff('S', 'P'));
    expect(result.output).toContain('Subcontraria');
  });

  it('explain O shows contradictory', () => {
    const result = profile.explain(particular_neg('S', 'P'));
    expect(result.output).toContain('Contradictoria');
  });
});

// ── checkEquivalent ───────────────────────────────────────────────────────────

describe('AristotelianSyllogistic.checkEquivalent', () => {
  it('same categorical propositions are equivalent', () => {
    const a = universal_aff('S', 'P');
    const b = universal_aff('S', 'P');
    const result = profile.checkEquivalent(a, b);
    expect(result.status).toBe('valid');
  });

  it('different types are not equivalent', () => {
    const a = universal_aff('S', 'P');
    const b = universal_neg('S', 'P');
    const result = profile.checkEquivalent(a, b);
    expect(result.status).toBe('invalid');
  });

  it('non-categorical returns unknown', () => {
    const result = profile.checkEquivalent(atom('P'), atom('P'));
    expect(result.status).toBe('unknown');
  });
});

// ── Via evaluate() API ────────────────────────────────────────────────────────

describe('aristotelian.syllogistic via evaluate()', () => {
  it('Barbara via check valid', () => {
    const r = evaluate(`
logic aristotelian.syllogistic
check valid (forall x (M(x) -> P(x)) & forall x (S(x) -> M(x))) -> forall x (S(x) -> P(x))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('valid');
  });

  it('derive via axioms', () => {
    const r = evaluate(`
logic aristotelian.syllogistic
axiom mayor : forall x (M(x) -> P(x))
axiom menor : forall x (S(x) -> M(x))
derive forall x (S(x) -> P(x)) from mayor, menor
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('provable');
  });

  it('checkSatisfiable', () => {
    const r = evaluate(`
logic aristotelian.syllogistic
check satisfiable forall x (S(x) -> P(x))
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('satisfiable');
  });
});
