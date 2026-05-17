import { describe, it, expect } from 'vitest';
import {
  evaluateClassical,
  generateValuationsLazy,
  formulaToString,
  toNNF,
  toCNF,
  toDNF,
  extractClauses,
  collectAtoms,
} from '../../logic/profiles/classical/propositional';
import type { Formula, Valuation } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const biconditional = (a: Formula, b: Formula): Formula => ({
  kind: 'biconditional',
  args: [a, b],
});
const xor = (a: Formula, b: Formula): Formula => ({ kind: 'xor', args: [a, b] });
const nand = (a: Formula, b: Formula): Formula => ({ kind: 'nand', args: [a, b] });
const nor = (a: Formula, b: Formula): Formula => ({ kind: 'nor', args: [a, b] });
const trueF: Formula = { kind: 'true' };
const falseF: Formula = { kind: 'false' };
const num = (value: number): Formula => ({ kind: 'number', value });

describe('evaluateClassical — all operators', () => {
  const v0: Valuation = { P: false, Q: false };
  const v1: Valuation = { P: true, Q: false };
  const v2: Valuation = { P: false, Q: true };
  const v3: Valuation = { P: true, Q: true };
  const P = atom('P');
  const Q = atom('Q');

  it('true/false constants', () => {
    expect(evaluateClassical(trueF, v0)).toBe(true);
    expect(evaluateClassical(falseF, v0)).toBe(false);
  });

  it('atom missing in valuation defaults to false', () => {
    expect(evaluateClassical(atom('Z'), v0)).toBe(false);
  });

  it('not', () => {
    expect(evaluateClassical(not(P), v0)).toBe(true);
    expect(evaluateClassical(not(P), v1)).toBe(false);
  });

  it('and', () => {
    expect(evaluateClassical(and(P, Q), v3)).toBe(true);
    expect(evaluateClassical(and(P, Q), v1)).toBe(false);
  });

  it('or', () => {
    expect(evaluateClassical(or(P, Q), v0)).toBe(false);
    expect(evaluateClassical(or(P, Q), v1)).toBe(true);
  });

  it('implies', () => {
    expect(evaluateClassical(implies(P, Q), v1)).toBe(false);
    expect(evaluateClassical(implies(P, Q), v0)).toBe(true);
    expect(evaluateClassical(implies(P, Q), v3)).toBe(true);
  });

  it('biconditional', () => {
    expect(evaluateClassical(biconditional(P, Q), v3)).toBe(true);
    expect(evaluateClassical(biconditional(P, Q), v1)).toBe(false);
  });

  it('nand', () => {
    expect(evaluateClassical(nand(P, Q), v3)).toBe(false);
    expect(evaluateClassical(nand(P, Q), v1)).toBe(true);
  });

  it('nor', () => {
    expect(evaluateClassical(nor(P, Q), v0)).toBe(true);
    expect(evaluateClassical(nor(P, Q), v1)).toBe(false);
  });

  it('xor', () => {
    expect(evaluateClassical(xor(P, Q), v1)).toBe(true);
    expect(evaluateClassical(xor(P, Q), v3)).toBe(false);
    expect(evaluateClassical(xor(P, Q), v2)).toBe(true);
  });

  it('throws on unsupported kind', () => {
    expect(() => evaluateClassical({ kind: 'modal_necessity', args: [P] }, v0)).toThrow(
      /Operador lógico no soportado/,
    );
  });
});

describe('generateValuationsLazy', () => {
  it('yields exactly 2^n valuations for n atoms', () => {
    const vals = Array.from(generateValuationsLazy(['P', 'Q', 'R']));
    expect(vals.length).toBe(8);
  });

  it('yields single empty valuation for 0 atoms', () => {
    const vals = Array.from(generateValuationsLazy([]));
    expect(vals.length).toBe(1);
    expect(vals[0]).toEqual({});
  });

  it('throws on too many atoms (>23)', () => {
    const atoms = Array.from({ length: 24 }, (_, i) => 'a' + i);
    expect(() => Array.from(generateValuationsLazy(atoms))).toThrow(/Demasiadas variables/);
  });
});

describe('formulaToString — all kinds and edge cases', () => {
  it('renders constants', () => {
    expect(formulaToString(trueF)).toBe('⊤');
    expect(formulaToString(falseF)).toBe('⊥');
  });

  it('atom fallback to ?', () => {
    expect(formulaToString({ kind: 'atom' })).toBe('?');
  });

  it('not over atom drops parens', () => {
    expect(formulaToString(not(atom('P')))).toBe('!P');
  });

  it('not over compound uses parens', () => {
    expect(formulaToString(not(and(atom('P'), atom('Q'))))).toMatch(/!\(/);
  });

  it('not without args yields !?', () => {
    expect(formulaToString({ kind: 'not' })).toBe('!?');
  });

  it('and/or/implies/biconditional render normally', () => {
    expect(formulaToString(and(atom('P'), atom('Q')))).toBe('(P & Q)');
    expect(formulaToString(or(atom('P'), atom('Q')))).toBe('(P | Q)');
    expect(formulaToString(implies(atom('P'), atom('Q')))).toBe('(P -> Q)');
    expect(formulaToString(biconditional(atom('P'), atom('Q')))).toBe('(P <-> Q)');
  });

  it('renders nand/nor/xor with unicode', () => {
    expect(formulaToString(nand(atom('P'), atom('Q')))).toContain('↑');
    expect(formulaToString(nor(atom('P'), atom('Q')))).toContain('↓');
    expect(formulaToString(xor(atom('P'), atom('Q')))).toContain('⊕');
  });

  it('renders predicates and quantifiers', () => {
    const pred: Formula = { kind: 'predicate', name: 'P', params: ['x', 'y'] };
    expect(formulaToString(pred)).toBe('P(x, y)');
    expect(formulaToString({ kind: 'forall', variable: 'x', args: [pred] })).toMatch(/forall x/);
    expect(formulaToString({ kind: 'exists', variable: 'x', args: [pred] })).toMatch(/exists x/);
  });

  it('renders modal and temporal', () => {
    const P = atom('P');
    expect(formulaToString({ kind: 'modal_necessity', args: [P] })).toMatch(/\[\]/);
    expect(formulaToString({ kind: 'modal_possibility', args: [P] })).toMatch(/<>/);
    expect(formulaToString({ kind: 'temporal_next', args: [P] })).toMatch(/^X\(/);
    expect(formulaToString({ kind: 'temporal_until', args: [P, atom('Q')] })).toMatch(/U/);
  });

  it('renders all arithmetic kinds', () => {
    const a = atom('x');
    const b = atom('y');
    expect(formulaToString({ kind: 'add', args: [a, b] })).toBe('(x + y)');
    expect(formulaToString({ kind: 'subtract', args: [a, b] })).toBe('(x - y)');
    expect(formulaToString({ kind: 'multiply', args: [a, b] })).toBe('(x * y)');
    expect(formulaToString({ kind: 'divide', args: [a, b] })).toBe('(x / y)');
    expect(formulaToString({ kind: 'modulo', args: [a, b] })).toBe('(x % y)');
    expect(formulaToString({ kind: 'less', args: [a, b] })).toBe('(x < y)');
    expect(formulaToString({ kind: 'greater', args: [a, b] })).toBe('(x > y)');
    expect(formulaToString({ kind: 'less_eq', args: [a, b] })).toBe('(x <= y)');
    expect(formulaToString({ kind: 'greater_eq', args: [a, b] })).toBe('(x >= y)');
    expect(formulaToString({ kind: 'equals', args: [a, b] })).toBe('(x = y)');
    expect(formulaToString(num(42))).toBe('42');
  });

  it('renders incomplete binary as ? marker', () => {
    expect(formulaToString({ kind: 'and' })).toBe('? & ?');
    expect(formulaToString({ kind: 'or' })).toBe('? | ?');
    expect(formulaToString({ kind: 'implies' })).toBe('? -> ?');
    expect(formulaToString({ kind: 'biconditional' })).toBe('? <-> ?');
    expect(formulaToString({ kind: 'nand' })).toBe('? ↑ ?');
    expect(formulaToString({ kind: 'nor' })).toBe('? ↓ ?');
    expect(formulaToString({ kind: 'xor' })).toBe('? ⊕ ?');
    expect(formulaToString({ kind: 'equals' })).toBe('? = ?');
    expect(formulaToString({ kind: 'add' })).toBe('? + ?');
    expect(formulaToString({ kind: 'less' })).toBe('? < ?');
    expect(formulaToString({ kind: 'temporal_until' })).toBe('? U ?');
    expect(formulaToString({ kind: 'temporal_next' })).toBe('X(?)');
    expect(formulaToString({ kind: 'modal_necessity' })).toBe('[](?)');
    expect(formulaToString({ kind: 'modal_possibility' })).toBe('<>(?)');
    expect(formulaToString({ kind: 'forall' })).toBe('forall ?(?)');
    expect(formulaToString({ kind: 'exists' })).toBe('exists ?(?)');
    expect(formulaToString({ kind: 'predicate' })).toBe('?(...)');
    expect(formulaToString({ kind: 'number' })).toBe('?');
  });
});

describe('toNNF — negation normal form', () => {
  it('idempotent on atoms', () => {
    const a = atom('P');
    expect(toNNF(a)).toEqual(a);
  });

  it('pushes negation through and/or via De Morgan', () => {
    const f = not(and(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('or');
  });

  it('!(P or Q) becomes !P & !Q', () => {
    const f = not(or(atom('P'), atom('Q')));
    expect(toNNF(f).kind).toBe('and');
  });

  it('!!P collapses to P', () => {
    const f = not(not(atom('P')));
    expect(toNNF(f)).toEqual(atom('P'));
  });

  it('!(P -> Q) becomes P & !Q', () => {
    const f = not(implies(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('and');
  });

  it('!(P <-> Q) expands biconditional', () => {
    const f = not(biconditional(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('or');
  });

  it('!(P nand Q) becomes P & Q', () => {
    const f = not(nand(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('and');
  });

  it('!(P nor Q) becomes P | Q', () => {
    const f = not(nor(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('or');
  });

  it('!(P xor Q) becomes biconditional-shaped', () => {
    const f = not(xor(atom('P'), atom('Q')));
    const nnf = toNNF(f);
    expect(['or', 'and', 'biconditional']).toContain(nnf.kind);
  });

  it('!true becomes false; !false becomes true', () => {
    expect(toNNF(not(trueF)).kind).toBe('false');
    expect(toNNF(not(falseF)).kind).toBe('true');
  });

  it('nnf with modal operators', () => {
    const P = atom('P');
    expect(toNNF({ kind: 'modal_necessity', args: [P] }).kind).toBe('modal_necessity');
    expect(toNNF(not({ kind: 'modal_necessity', args: [P] })).kind).toBe('modal_possibility');
    expect(toNNF(not({ kind: 'modal_possibility', args: [P] })).kind).toBe('modal_necessity');
  });

  it('nnf with quantifiers (Skolem-like)', () => {
    const px: Formula = { kind: 'predicate', name: 'P', params: ['x'] };
    const f = not({ kind: 'forall', variable: 'x', args: [px] });
    expect(toNNF(f).kind).toBe('exists');
    const g = not({ kind: 'exists', variable: 'x', args: [px] });
    expect(toNNF(g).kind).toBe('forall');
  });

  it('nnf normalizes xor positive', () => {
    const f = xor(atom('P'), atom('Q'));
    const nnf = toNNF(f);
    expect(nnf.kind).toBe('or');
  });

  it('nnf normalizes nand/nor positive', () => {
    const f1 = nand(atom('P'), atom('Q'));
    const f2 = nor(atom('P'), atom('Q'));
    expect(toNNF(f1).kind).toBe('or');
    expect(toNNF(f2).kind).toBe('and');
  });

  it('nnf temporal_next preserves shape when negated', () => {
    const P = atom('P');
    const f = not({ kind: 'temporal_next', args: [P] });
    expect(toNNF(f).kind).toBe('temporal_next');
  });
});

describe('toCNF and toDNF — distributive normal forms', () => {
  it('toCNF of P is P (atom unchanged)', () => {
    expect(toCNF(atom('P'))).toEqual(atom('P'));
  });

  it('toCNF distributes or over and', () => {
    const f = or(atom('P'), and(atom('Q'), atom('R')));
    const cnf = toCNF(f);
    expect(cnf.kind).toBe('and');
  });

  it('toDNF distributes and over or', () => {
    const f = and(atom('P'), or(atom('Q'), atom('R')));
    const dnf = toDNF(f);
    expect(dnf.kind).toBe('or');
  });
});

describe('extractClauses', () => {
  it('returns list of clauses (each is list of literals)', () => {
    const f = and(or(atom('P'), atom('Q')), or(not(atom('P')), atom('R')));
    const cs = extractClauses(f);
    expect(cs.length).toBeGreaterThanOrEqual(2);
    expect(cs.some((c) => c.includes('P'))).toBe(true);
  });

  it('handles single atom as a single clause', () => {
    const cs = extractClauses(atom('P'));
    expect(cs.length).toBe(1);
  });
});

describe('collectAtoms', () => {
  it('collects nested atoms', () => {
    const f = and(atom('P'), or(atom('Q'), not(atom('R'))));
    const atoms = collectAtoms(f);
    expect(atoms.has('P')).toBe(true);
    expect(atoms.has('Q')).toBe(true);
    expect(atoms.has('R')).toBe(true);
  });

  it('empty for constants', () => {
    expect(collectAtoms(trueF).size).toBe(0);
    expect(collectAtoms(falseF).size).toBe(0);
  });
});
