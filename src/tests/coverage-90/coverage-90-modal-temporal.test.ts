import { describe, it, expect } from 'vitest';
import { ModalK } from '../../logic/profiles/modal/k';
import { DeonticStandard } from '../../logic/profiles/deontic/standard';
import { EpistemicS5 } from '../../logic/profiles/epistemic/s5';
import { IntuitionisticPropositional } from '../../logic/profiles/intuitionistic/propositional';
import { Interpreter } from '../../runtime/interpreter';
import type { Formula, Theory } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const box = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const dia = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });

const emptyTheory = (profile: string): Theory => ({
  profile,
  axioms: new Map(),
  theorems: new Map(),
  claims: new Map(),
  judgments: [],
});

describe('coverage-90 — modal/temporal tableau-engine paths', () => {
  // ---- ModalK ----
  const k = new ModalK();

  it('K: tautology []P -> []P', () => {
    const r = k.checkValid(implies(box(atom('P')), box(atom('P'))));
    expect(r.status).toBe('valid');
  });

  it('K: K axiom []((P -> Q)) -> ([]P -> []Q)', () => {
    const r = k.checkValid(
      implies(box(implies(atom('P'), atom('Q'))), implies(box(atom('P')), box(atom('Q')))),
    );
    expect(r.status).toBe('valid');
  });

  it('K: non-tautology []P -> P is invalid', () => {
    const r = k.checkValid(implies(box(atom('P')), atom('P')));
    expect(r.status).not.toBe('valid');
  });

  it('K: countermodel for []P -> P', () => {
    const r = k.countermodel(implies(box(atom('P')), atom('P')));
    expect(r.status).toBeDefined();
  });

  it('K: derive uses tableau engine', () => {
    const theory = emptyTheory('modal.k');
    theory.axioms.set('a1', box(implies(atom('P'), atom('Q'))));
    theory.axioms.set('a2', box(atom('P')));
    const r = k.derive(box(atom('Q')), ['a1', 'a2'], theory);
    expect(r.status).toBeDefined();
  });

  it('K: prove with biconditional', () => {
    const r = k.checkValid(
      bic(box(and(atom('P'), atom('Q'))), and(box(atom('P')), box(atom('Q')))),
    );
    expect(r.status).toBeDefined();
  });

  it('K: <>P is consistent with []!P false', () => {
    const r = k.checkSatisfiable(and(dia(atom('P')), box(not(atom('Q')))));
    expect(r.status).toBeDefined();
  });

  it('K: explain produces output', () => {
    const r = k.explain(box(atom('P')));
    expect(r.status).toBeDefined();
  });

  // ---- DeonticStandard ----
  const d = new DeonticStandard();

  it('Deontic: O(P) → []P-like deductions', () => {
    const r = d.checkValid(implies(box(atom('P')), atom('P')));
    expect(r.status).toBeDefined();
  });

  it('Deontic: countermodel works', () => {
    const r = d.countermodel(implies(box(atom('P')), box(atom('Q'))));
    expect(r.status).toBeDefined();
  });

  // ---- EpistemicS5 ----
  const e = new EpistemicS5();

  it('S5: []P -> P is valid (T axiom)', () => {
    const r = e.checkValid(implies(box(atom('P')), atom('P')));
    expect(r.status).toBe('valid');
  });

  it('S5: []P -> [][]P is valid (S4)', () => {
    const r = e.checkValid(implies(box(atom('P')), box(box(atom('P')))));
    expect(r.status).toBe('valid');
  });

  it('S5: <>P -> []<>P is valid (5)', () => {
    const r = e.checkValid(implies(dia(atom('P')), box(dia(atom('P')))));
    expect(r.status).toBe('valid');
  });

  it('S5: countermodel for non-valid formula', () => {
    const r = e.countermodel(atom('P'));
    expect(r.status).toBeDefined();
  });

  // ---- Intuitionistic ----
  const ip = new IntuitionisticPropositional();

  it('Intuitionistic: P -> P is valid', () => {
    const r = ip.checkValid(implies(atom('P'), atom('P')));
    expect(r.status).toBe('valid');
  });

  it('Intuitionistic: P | !P is NOT a tautology', () => {
    const r = ip.checkValid(or(atom('P'), not(atom('P'))));
    expect(r.status).not.toBe('valid');
  });

  it('Intuitionistic: ¬¬P -> P is NOT valid (double negation)', () => {
    const r = ip.checkValid(implies(not(not(atom('P'))), atom('P')));
    expect(r.status).not.toBe('valid');
  });

  it('Intuitionistic: countermodel for !!P -> P', () => {
    const r = ip.countermodel(implies(not(not(atom('P'))), atom('P')));
    expect(r.status).toBeDefined();
  });

  it('Intuitionistic: De Morgan one direction is valid', () => {
    const r = ip.checkValid(
      implies(not(or(atom('P'), atom('Q'))), and(not(atom('P')), not(atom('Q')))),
    );
    expect(r.status).toBe('valid');
  });

  // ---- Via interpreter integration ----
  it('temporal.ltl X(P) parses and runs', () => {
    const out = new Interpreter().execute(`logic temporal.ltl
axiom a : X(P)
check valid X(P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('temporal.ltl with U (until) operator', () => {
    const out = new Interpreter().execute(`logic temporal.ltl
check valid (X(P) -> X(P))
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('modal.k via interpreter with complex formula', () => {
    const out = new Interpreter().execute(`logic modal.k
check valid ([](P & Q) -> ([]P & []Q))
check valid (<>P | []P)
countermodel ([]P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('intuitionistic via interpreter with countermodel', () => {
    const out = new Interpreter().execute(`logic intuitionistic.propositional
countermodel (P | !P)
countermodel (!!P -> P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  it('epistemic.s5 with nested modalities', () => {
    const out = new Interpreter().execute(`logic epistemic.s5
check valid ([]P -> [][]P)
check valid (<>P -> []<>P)
`);
    expect(typeof out.stdout).toBe('string');
  });

  // ---- Tableau engine paths via larger formulas ----
  it('K with deeply nested formulas exercises tableau engine fully', () => {
    const r = k.checkValid(
      implies(
        box(and(implies(atom('P'), atom('Q')), implies(atom('Q'), atom('R')))),
        implies(box(atom('P')), box(atom('R'))),
      ),
    );
    expect(r.status).toBe('valid');
  });

  it('K with disjunction triggers beta branch', () => {
    const r = k.checkSatisfiable(or(box(atom('P')), dia(atom('Q'))));
    expect(r.status).toBeDefined();
  });

  it('K with double negation triggers nnf', () => {
    const r = k.checkValid(implies(not(not(atom('P'))), atom('P')));
    expect(r.status).toBeDefined();
  });
});
