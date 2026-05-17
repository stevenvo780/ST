// ============================================================
// TPTP Tests — Bridge a fol-prover
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseTptp } from '../../tptp/parser';
import { toFolProverFormat, tptpFormulaToFol } from '../../tptp/bridge';
import { proveFOL } from '../../proof-systems/fol-prover';

describe('TPTP bridge — tptpFormulaToFol', () => {
  it('convierte atom proposicional', () => {
    const f = tptpFormulaToFol({ kind: 'atom', predicate: 'p', args: [] });
    expect(f).toEqual({ kind: 'atom', name: 'p' });
  });

  it('convierte predicate con args', () => {
    const f = tptpFormulaToFol({
      kind: 'atom',
      predicate: 'p',
      args: [{ kind: 'var', name: 'X' }],
    });
    expect(f.kind).toBe('predicate');
    expect(f.name).toBe('p');
    expect(f.params).toEqual(['X']);
  });

  it('convierte not / and / or / implies / iff', () => {
    const t = tptpFormulaToFol({
      kind: 'and',
      args: [
        { kind: 'atom', predicate: 'p', args: [] },
        { kind: 'atom', predicate: 'q', args: [] },
      ],
    });
    expect(t.kind).toBe('and');
    expect(t.args).toHaveLength(2);
  });

  it('convierte xor a ~(p <=> q)', () => {
    const t = tptpFormulaToFol({
      kind: 'xor',
      left: { kind: 'atom', predicate: 'p', args: [] },
      right: { kind: 'atom', predicate: 'q', args: [] },
    });
    expect(t.kind).toBe('not');
    expect(t.args![0].kind).toBe('biconditional');
  });

  it('convierte forall con múltiples vars en cuantificadores anidados', () => {
    const t = tptpFormulaToFol({
      kind: 'forall',
      vars: ['X', 'Y'],
      body: { kind: 'atom', predicate: 'p', args: [] },
    });
    expect(t.kind).toBe('forall');
    expect(t.variable).toBe('X');
    expect(t.args![0].kind).toBe('forall');
    expect(t.args![0].variable).toBe('Y');
  });

  it('convierte eq a equals', () => {
    const t = tptpFormulaToFol({
      kind: 'eq',
      left: { kind: 'const', name: 'a' },
      right: { kind: 'const', name: 'b' },
    });
    expect(t.kind).toBe('equals');
    expect(t.args).toHaveLength(2);
  });

  it('convierte neq a not(equals)', () => {
    const t = tptpFormulaToFol({
      kind: 'neq',
      left: { kind: 'const', name: 'a' },
      right: { kind: 'const', name: 'b' },
    });
    expect(t.kind).toBe('not');
    expect(t.args![0].kind).toBe('equals');
  });

  it('convierte $true / $false', () => {
    expect(tptpFormulaToFol({ kind: 'true' }).kind).toBe('true');
    expect(tptpFormulaToFol({ kind: 'false' }).kind).toBe('false');
  });
});

describe('TPTP bridge — toFolProverFormat', () => {
  it('separa axiomas y conjecture', () => {
    const p = parseTptp(`
      fof(a1, axiom, ![X] : (p(X) => q(X))).
      fof(a2, axiom, p(a)).
      fof(g, conjecture, q(a)).
    `);
    const out = toFolProverFormat(p);
    expect(out.axioms).toHaveLength(2);
    expect(out.conjecture).not.toBeNull();
    expect(out.negatedConjectures).toHaveLength(0);
  });

  it('mete negated_conjecture en su array', () => {
    const p = parseTptp('fof(g, negated_conjecture, ~p(a)).');
    const out = toFolProverFormat(p);
    expect(out.negatedConjectures).toHaveLength(1);
    expect(out.conjecture).toBeNull();
  });

  it('separa hypotheses / lemmas / theorems / definitions / plain', () => {
    const p = parseTptp(`
      fof(h1, hypothesis, p).
      fof(l1, lemma, q).
      fof(t1, theorem, r).
      fof(d1, definition, s).
      fof(p1, plain, t).
    `);
    const out = toFolProverFormat(p);
    expect(out.hypotheses).toHaveLength(5);
    expect(out.axioms).toHaveLength(0);
    expect(out.conjecture).toBeNull();
  });

  it('si hay múltiples conjectures, conserva la primera', () => {
    const p = parseTptp(`
      fof(g1, conjecture, p).
      fof(g2, conjecture, q).
    `);
    const out = toFolProverFormat(p);
    expect(out.conjecture).not.toBeNull();
    expect(out.hypotheses).toHaveLength(1);
  });
});

describe('TPTP bridge — integración con proveFOL', () => {
  it('demuestra modus ponens via TPTP → fol-prover', () => {
    const p = parseTptp(`
      fof(a1, axiom, ![X] : (p(X) => q(X))).
      fof(a2, axiom, p(a)).
      fof(g, conjecture, q(a)).
    `);
    const out = toFolProverFormat(p);
    expect(out.conjecture).not.toBeNull();
    const result = proveFOL(out.axioms, out.conjecture!, { timeoutMs: 2000, maxSteps: 200 });
    expect(result.proven).toBe(true);
  });

  it('demuestra transitividad via TPTP → fol-prover', () => {
    const p = parseTptp(`
      fof(trans, axiom, ![X,Y,Z] : ((r(X,Y) & r(Y,Z)) => r(X,Z))).
      fof(rab, axiom, r(a,b)).
      fof(rbc, axiom, r(b,c)).
      fof(goal, conjecture, r(a,c)).
    `);
    const out = toFolProverFormat(p);
    const result = proveFOL(out.axioms, out.conjecture!, { timeoutMs: 3000, maxSteps: 500 });
    expect(result.proven).toBe(true);
  });

  it('socrates es mortal — TPTP → fol-prover', () => {
    const p = parseTptp(`
      fof(all_men_mortal, axiom, ![X] : (man(X) => mortal(X))).
      fof(socrates_is_man, axiom, man(socrates)).
      fof(socrates_mortal, conjecture, mortal(socrates)).
    `);
    const out = toFolProverFormat(p);
    const result = proveFOL(out.axioms, out.conjecture!, { timeoutMs: 2000, maxSteps: 200 });
    expect(result.proven).toBe(true);
  });
});
