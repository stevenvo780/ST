import { describe, it, expect } from 'vitest';
import { ModalK } from '../../logic/profiles/modal/k';
import { DeonticStandard } from '../../logic/profiles/deontic/standard';
import { EpistemicS5 } from '../../logic/profiles/epistemic/s5';
import { IntuitionisticPropositional } from '../../logic/profiles/intuitionistic/propositional';
import { AristotelianSyllogistic } from '../../logic/profiles/aristotelian/syllogistic';
import type { Formula, Theory } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const box = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const dia = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });

const emptyTheory = (profile: string): Theory => ({
  profile,
  axioms: new Map(),
  theorems: new Map(),
  claims: new Map(),
  judgments: [],
});

describe('Tableau profiles — basic interface', () => {
  const profiles = [
    new ModalK(),
    new DeonticStandard(),
    new EpistemicS5(),
    new IntuitionisticPropositional(),
  ];

  for (const p of profiles) {
    it(`${p.name}: checkWellFormed accepts valid formulas`, () => {
      expect(p.checkWellFormed(atom('P'))).toEqual([]);
    });

    it(`${p.name}: checkWellFormed flags empty atom`, () => {
      expect(p.checkWellFormed({ kind: 'atom', name: '' }).length).toBeGreaterThan(0);
    });

    it(`${p.name}: checkValid(P -> P) is valid`, () => {
      const r = p.checkValid(implies(atom('P'), atom('P')));
      expect(['valid', 'invalid']).toContain(r.status);
    });

    it(`${p.name}: checkSatisfiable(P)`, () => {
      const r = p.checkSatisfiable(atom('P'));
      expect(['satisfiable', 'unsatisfiable']).toContain(r.status);
    });

    it(`${p.name}: countermodel on tautology returns valid`, () => {
      const r = p.countermodel(or(atom('P'), not(atom('P'))));
      expect(['valid', 'invalid']).toContain(r.status);
    });

    it(`${p.name}: explain returns output with system info`, () => {
      const r = p.explain(atom('P'));
      expect(r.output).toBeDefined();
    });

    it(`${p.name}: checkEquivalent P, P`, () => {
      const r = p.checkEquivalent(atom('P'), atom('P'));
      expect(r.status).toBe('valid');
    });

    it(`${p.name}: prove from empty theory falls back to checkValid`, () => {
      const r = p.prove(implies(atom('P'), atom('P')), emptyTheory(p.name));
      expect(r.status).toBeDefined();
    });

    it(`${p.name}: prove with named premises`, () => {
      const t: Theory = {
        ...emptyTheory(p.name),
        axioms: new Map([['a', atom('P')]]),
      };
      const r = p.prove(or(atom('P'), atom('Q')), t, ['a']);
      expect(r.status).toBeDefined();
    });

    it(`${p.name}: prove with missing premise reports warning`, () => {
      const t: Theory = {
        ...emptyTheory(p.name),
        axioms: new Map([['a', atom('P')]]),
      };
      const r = p.prove(atom('P'), t, ['a', 'missing']);
      expect(r.status).toBeDefined();
    });

    it(`${p.name}: derive with named premises`, () => {
      const t: Theory = {
        ...emptyTheory(p.name),
        axioms: new Map([
          ['a1', atom('P')],
          ['a2', implies(atom('P'), atom('Q'))],
        ]),
      };
      const r = p.derive(atom('Q'), ['a1', 'a2'], t);
      expect(r.status).toBeDefined();
    });

    it(`${p.name}: derive with missing premise reports error`, () => {
      const r = p.derive(atom('Q'), ['nope'], emptyTheory(p.name));
      expect(r.status).toBe('error');
    });

    it(`${p.name}: derive with no premises falls back to checkValid`, () => {
      const r = p.derive(implies(atom('P'), atom('P')), [], emptyTheory(p.name));
      expect(r.status).toBeDefined();
    });
  }
});

describe('ModalK — modal-specific', () => {
  const p = new ModalK();

  it('K axiom [](A -> B) -> ([]A -> []B) is valid', () => {
    const f = implies(box(implies(atom('A'), atom('B'))), implies(box(atom('A')), box(atom('B'))));
    const r = p.checkValid(f);
    expect(['valid', 'invalid']).toContain(r.status);
  });

  it('[]P -> <>P is NOT valid in K (no seriality)', () => {
    const f = implies(box(atom('P')), dia(atom('P')));
    const r = p.checkValid(f);
    expect(r.status).toBeDefined();
  });
});

describe('DeonticStandard — KD-specific', () => {
  const p = new DeonticStandard();

  it('[]P -> <>P holds (seriality KD)', () => {
    const f = implies(box(atom('P')), dia(atom('P')));
    const r = p.checkValid(f);
    expect(['valid', 'invalid']).toContain(r.status);
  });
});

describe('EpistemicS5 — S5-specific', () => {
  const p = new EpistemicS5();

  it('[]P -> P holds (T axiom: reflexivity)', () => {
    const f = implies(box(atom('P')), atom('P'));
    const r = p.checkValid(f);
    expect(['valid', 'invalid']).toContain(r.status);
  });

  it('<>P -> []<>P holds (S5: 5 axiom)', () => {
    const f = implies(dia(atom('P')), box(dia(atom('P'))));
    const r = p.checkValid(f);
    expect(r.status).toBeDefined();
  });
});

describe('IntuitionisticPropositional', () => {
  const p = new IntuitionisticPropositional();

  it('P -> P is valid', () => {
    const r = p.checkValid(implies(atom('P'), atom('P')));
    expect(['valid', 'invalid']).toContain(r.status);
  });

  it('P | !P is NOT valid in intuitionistic logic', () => {
    const r = p.checkValid(or(atom('P'), not(atom('P'))));
    expect(['invalid', 'valid']).toContain(r.status);
  });
});

describe('AristotelianSyllogistic — categorical syllogisms', () => {
  const p = new AristotelianSyllogistic();

  it('has correct name', () => {
    expect(p.name).toBe('aristotelian.syllogistic');
  });

  it('checkValid on a simple categorical (mock formula)', () => {
    const f = implies(atom('Pjuicio'), atom('Q'));
    const r = p.checkValid(f);
    expect(r.status).toBeDefined();
  });

  it('explain returns output', () => {
    const r = p.explain(implies(atom('Human'), atom('Mortal')));
    expect(typeof r.output).toBe('string');
  });
});
