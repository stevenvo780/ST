/**
 * Coverage fill — src/profiles/intuitionistic/propositional.ts
 * Current coverage: ~48% stmts, ~34% branch
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- test stubs use partial any casts for brevity */

import { describe, it, expect } from 'vitest';
import { evaluate } from '../api';
import { IntuitionisticPropositional } from '../logic/profiles/intuitionistic/propositional';
import type { Formula } from '../types';

const profile = new IntuitionisticPropositional();

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const nand = (a: Formula, b: Formula): Formula => ({ kind: 'nand', args: [a, b] });
const nor = (a: Formula, b: Formula): Formula => ({ kind: 'nor', args: [a, b] });
const xor = (a: Formula, b: Formula): Formula => ({ kind: 'xor', args: [a, b] });
const box = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const dia = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });

const emptyTheory = () => ({
  axioms: new Map<string, Formula>(),
  theorems: new Map<string, Formula>(),
  claims: new Map<string, Formula>(),
  judgments: [] as any[],
  profile: 'intuitionistic.propositional',
});

// ── checkWellFormed ───────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.checkWellFormed', () => {
  it('atom is well-formed', () => {
    const diags = profile.checkWellFormed(atom('P'));
    expect(diags).toHaveLength(0);
  });

  it('unnamed atom gives error', () => {
    const diags = profile.checkWellFormed({ kind: 'atom' });
    expect(diags.some((d) => d.severity === 'error')).toBe(true);
  });

  it('modal_necessity gives warning', () => {
    const diags = profile.checkWellFormed(box(atom('P')));
    expect(diags.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('modal_possibility gives warning', () => {
    const diags = profile.checkWellFormed(dia(atom('P')));
    expect(diags.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('nested formula checks recursively', () => {
    const f = and(atom('P'), { kind: 'atom' });
    const diags = profile.checkWellFormed(f);
    expect(diags.some((d) => d.severity === 'error')).toBe(true);
  });
});

// ── checkValid — IPC laws ─────────────────────────────────────────────────────

describe('IntuitionisticPropositional.checkValid — IPC laws', () => {
  it('P→P is valid in IPC', () => {
    const result = profile.checkValid(implies(atom('P'), atom('P')));
    expect(result.status).toBe('valid');
  });

  it('P→(Q→P) is valid in IPC', () => {
    const result = profile.checkValid(implies(atom('P'), implies(atom('Q'), atom('P'))));
    expect(result.status).toBe('valid');
  });

  it('P→¬¬P is valid in IPC', () => {
    const result = profile.checkValid(implies(atom('P'), not(not(atom('P')))));
    expect(result.status).toBe('valid');
  });

  it('(P∧Q)→P is valid in IPC', () => {
    const result = profile.checkValid(implies(and(atom('P'), atom('Q')), atom('P')));
    expect(result.status).toBe('valid');
  });

  it('(P∧Q)→Q is valid in IPC', () => {
    const result = profile.checkValid(implies(and(atom('P'), atom('Q')), atom('Q')));
    expect(result.status).toBe('valid');
  });

  it('P→(Q→(P∧Q)) is valid in IPC', () => {
    const result = profile.checkValid(
      implies(atom('P'), implies(atom('Q'), and(atom('P'), atom('Q')))),
    );
    expect(result.status).toBe('valid');
  });

  it('P→(P∨Q) is valid in IPC', () => {
    const result = profile.checkValid(implies(atom('P'), or(atom('P'), atom('Q'))));
    expect(result.status).toBe('valid');
  });

  it('(P∧¬P)→Q is valid in IPC (ex falso)', () => {
    const result = profile.checkValid(implies(and(atom('P'), not(atom('P'))), atom('Q')));
    expect(result.status).toBe('valid');
  });

  // Laws NOT valid in IPC
  it('P∨¬P (LEM) is NOT valid in IPC', () => {
    const result = profile.checkValid(or(atom('P'), not(atom('P'))));
    expect(result.status).toBe('invalid');
  });

  it('¬¬P→P (DNE) is NOT valid in IPC', () => {
    const result = profile.checkValid(implies(not(not(atom('P'))), atom('P')));
    expect(result.status).toBe('invalid');
  });

  it('Peirce law ((P→Q)→P)→P is NOT valid in IPC', () => {
    const result = profile.checkValid(
      implies(implies(implies(atom('P'), atom('Q')), atom('P')), atom('P')),
    );
    expect(result.status).toBe('invalid');
  });
});

// ── Additional connectives in forces() ───────────────────────────────────────

describe('IntuitionisticPropositional — extended connectives', () => {
  it('biconditional P↔P is valid', () => {
    const result = profile.checkValid(bic(atom('P'), atom('P')));
    expect(result.status).toBe('valid');
  });

  it('biconditional P↔Q is not valid in general', () => {
    const result = profile.checkValid(bic(atom('P'), atom('Q')));
    expect(result.status).toBe('invalid');
  });

  it('nand P↑P formula evaluated', () => {
    // nand P P = ¬(P∧P) = ¬P, not a tautology
    const result = profile.checkValid(nand(atom('P'), atom('P')));
    expect(result.status).toBe('invalid');
  });

  it('nor P↓P formula evaluated', () => {
    // nor P P = ¬(P∨P) = ¬P, not a tautology
    const result = profile.checkValid(nor(atom('P'), atom('P')));
    expect(result.status).toBe('invalid');
  });

  it('xor P⊕P = ⊥, not satisfiable intuitionistically', () => {
    // xor with same var = false
    const result = profile.checkSatisfiable(xor(atom('P'), atom('P')));
    expect(result.status).toBe('unsatisfiable');
  });

  it('modal_necessity atom is handled', () => {
    // □P not valid in basic IPC Kripke
    const result = profile.checkValid(box(atom('P')));
    expect(['valid', 'invalid']).toContain(result.status);
  });

  it('modal_possibility atom is handled', () => {
    const result = profile.checkSatisfiable(dia(atom('P')));
    expect(['satisfiable', 'unsatisfiable']).toContain(result.status);
  });
});

// ── checkSatisfiable ──────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.checkSatisfiable', () => {
  it('P is satisfiable', () => {
    const result = profile.checkSatisfiable(atom('P'));
    expect(result.status).toBe('satisfiable');
  });

  it('P∧¬P is not satisfiable intuitionistically', () => {
    const result = profile.checkSatisfiable(and(atom('P'), not(atom('P'))));
    expect(result.status).toBe('unsatisfiable');
  });

  it('P∨Q is satisfiable', () => {
    const result = profile.checkSatisfiable(or(atom('P'), atom('Q')));
    expect(result.status).toBe('satisfiable');
  });

  it('¬P is satisfiable', () => {
    const result = profile.checkSatisfiable(not(atom('P')));
    expect(result.status).toBe('satisfiable');
  });
});

// ── prove ─────────────────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.prove', () => {
  it('proves P→P without axioms', () => {
    const theory = emptyTheory();
    const result = profile.prove(implies(atom('P'), atom('P')), theory as any);
    expect(result.status).toBe('valid');
  });

  it('proves with axioms', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', atom('P'));
    const result = profile.prove(atom('P'), theory as any);
    expect(result.status).toBe('valid');
  });

  it('restricted prove uses only specified premises', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', atom('P'));
    theory.axioms.set('a2', atom('Q'));
    const goal = implies(atom('P'), atom('P'));
    const result = profile.prove(goal, theory as any, ['a1']);
    expect(result.status).toBe('valid');
  });

  it('warning for missing premise in restricted prove', () => {
    const theory = emptyTheory();
    const result = profile.prove(atom('P'), theory as any, ['nonexistent']);
    expect(result.diagnostics?.some((d) => d.severity === 'warning')).toBe(true);
  });

  it('uses theorems as well', () => {
    const theory = emptyTheory();
    theory.theorems.set('t1', atom('P'));
    const result = profile.prove(atom('P'), theory as any);
    expect(result.status).toBe('valid');
  });
});

// ── derive ────────────────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.derive', () => {
  it('returns error for missing premise', () => {
    const theory = emptyTheory();
    const result = profile.derive(atom('Q'), ['missing'], theory as any);
    expect(result.status).toBe('error');
  });

  it('empty premises falls back to checkValid', () => {
    const theory = emptyTheory();
    const result = profile.derive(implies(atom('P'), atom('P')), [], theory as any);
    expect(result.status).toBe('valid');
  });

  it('derives Q from P and P→Q', () => {
    const theory = emptyTheory();
    theory.axioms.set('a1', atom('P'));
    theory.axioms.set('a2', implies(atom('P'), atom('Q')));
    const result = profile.derive(atom('Q'), ['a1', 'a2'], theory as any);
    expect(result.status).toBe('valid');
  });
});

// ── countermodel ─────────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.countermodel', () => {
  it('finds countermodel for LEM', () => {
    const result = profile.countermodel(or(atom('P'), not(atom('P'))));
    expect(result.status).toBe('invalid');
    expect(result.output).toContain('Contramodelo');
  });

  it('no countermodel for valid IPC theorem', () => {
    const result = profile.countermodel(implies(atom('P'), atom('P')));
    expect(result.status).toBe('valid');
    expect(result.output).toContain('No existe contramodelo');
  });

  it('countermodel for DNE ¬¬P→P', () => {
    const result = profile.countermodel(implies(not(not(atom('P'))), atom('P')));
    expect(result.status).toBe('invalid');
    expect(result.output).toContain('Traza');
  });
});

// ── explain ───────────────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.explain', () => {
  it('explains IPC system', () => {
    const result = profile.explain(atom('P'));
    expect(result.output).toContain('Intuicionista');
    expect(result.output).toContain('BHK');
  });

  it('valid formula marked as valid in explain', () => {
    const result = profile.explain(implies(atom('P'), atom('P')));
    expect(result.output).toContain('VÁLIDA');
  });

  it('non-valid formula marked as not valid in explain', () => {
    const result = profile.explain(or(atom('P'), not(atom('P'))));
    expect(result.output).toContain('NO válida');
  });
});

// ── checkEquivalent ───────────────────────────────────────────────────────────

describe('IntuitionisticPropositional.checkEquivalent', () => {
  it('P ≡ P', () => {
    const result = profile.checkEquivalent(atom('P'), atom('P'));
    expect(result.status).toBe('valid');
  });

  it('P ≢ Q', () => {
    const result = profile.checkEquivalent(atom('P'), atom('Q'));
    expect(result.status).toBe('invalid');
  });

  it('P∧Q ≡ Q∧P', () => {
    const result = profile.checkEquivalent(and(atom('P'), atom('Q')), and(atom('Q'), atom('P')));
    expect(result.status).toBe('valid');
  });
});

// ── Via evaluate() API ────────────────────────────────────────────────────────

describe('intuitionistic.propositional via evaluate()', () => {
  it('P→P valid', () => {
    const r = evaluate(`
logic intuitionistic.propositional
check valid P -> P
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('valid');
  });

  it('LEM not valid', () => {
    const r = evaluate(`
logic intuitionistic.propositional
check valid P | !P
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('invalid');
  });

  it('P satisfiable', () => {
    const r = evaluate(`
logic intuitionistic.propositional
check satisfiable P
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('satisfiable');
  });

  it('countermodel for DNE', () => {
    const r = evaluate(`
logic intuitionistic.propositional
countermodel !!P -> P
`);
    expect(r.ok).toBe(true);
    expect(r.results[0]?.status).toBe('invalid');
  });
});
