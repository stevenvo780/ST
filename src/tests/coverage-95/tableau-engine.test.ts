import { describe, it, expect } from 'vitest';
import {
  formulaEqual,
  formulaHash,
  eliminateConnectives,
  fullNNF,
  makeBranch,
  checkTableau,
  isValid,
  isSatisfiable,
  FRAME_K,
  FRAME_KD,
  FRAME_S5,
  FRAME_T,
  FRAME_S4,
} from '../../profiles/shared/tableau-engine';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const box = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const dia = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });
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

describe('tableau-engine — formulaEqual', () => {
  it('atoms with same name are equal', () => {
    expect(formulaEqual(atom('P'), atom('P'))).toBe(true);
    expect(formulaEqual(atom('P'), atom('Q'))).toBe(false);
  });

  it('compound: same structure equal', () => {
    expect(formulaEqual(and(atom('P'), atom('Q')), and(atom('P'), atom('Q')))).toBe(true);
    expect(formulaEqual(and(atom('P'), atom('Q')), or(atom('P'), atom('Q')))).toBe(false);
  });

  it('alpha-equivalence ∀x.P(x) ≡ ∀y.P(y) (with rename)', () => {
    const f1 = forall('x', { kind: 'predicate', name: 'P', params: ['x'] });
    const f2 = forall('y', { kind: 'predicate', name: 'P', params: ['y'] });
    expect(formulaEqual(f1, f2)).toBe(true);
  });

  it('alpha-inequivalence ∀x.P(x) ≠ ∀x.Q(x)', () => {
    const f1 = forall('x', { kind: 'predicate', name: 'P', params: ['x'] });
    const f2 = forall('x', { kind: 'predicate', name: 'Q', params: ['x'] });
    expect(formulaEqual(f1, f2)).toBe(false);
  });
});

describe('tableau-engine — formulaHash', () => {
  it('atom hash is name', () => {
    expect(formulaHash(atom('P'))).toBe('P');
  });

  it('hash respects structure', () => {
    expect(formulaHash(and(atom('P'), atom('Q')))).toMatch(/&/);
    expect(formulaHash(or(atom('P'), atom('Q')))).toMatch(/\|/);
    expect(formulaHash(implies(atom('P'), atom('Q')))).toMatch(/->/);
    expect(formulaHash(bic(atom('P'), atom('Q')))).toMatch(/<->/);
    expect(formulaHash(not(atom('P')))).toMatch(/!/);
    expect(formulaHash(box(atom('P')))).toMatch(/\[\]/);
    expect(formulaHash(dia(atom('P')))).toMatch(/<>/);
    expect(formulaHash(forall('x', atom('P')))).toMatch(/^Ax/);
    expect(formulaHash(exists('x', atom('P')))).toMatch(/^Ex/);
  });

  it('hash for predicate includes params', () => {
    const pred: Formula = { kind: 'predicate', name: 'R', args: [atom('a'), atom('b')] };
    expect(formulaHash(pred)).toContain('R(');
  });

  it('hash for temporal operators', () => {
    expect(formulaHash({ kind: 'temporal_next', args: [atom('P')] })).toMatch(/X/);
    expect(formulaHash({ kind: 'temporal_until', args: [atom('P'), atom('Q')] })).toMatch(/U/);
  });

  it('hash for equals', () => {
    expect(formulaHash({ kind: 'equals', args: [atom('a'), atom('b')] })).toMatch(/=/);
  });
});

describe('tableau-engine — eliminateConnectives and fullNNF', () => {
  it('eliminateConnectives unwraps implies/bicond into and/or/not', () => {
    const f = implies(atom('P'), atom('Q'));
    const r = eliminateConnectives(f);
    expect(r.kind).not.toBe('implies');
  });

  it('fullNNF pushes negation inward', () => {
    const f = not(and(atom('P'), atom('Q')));
    const r = fullNNF(f);
    expect(r.kind).toBe('or');
  });

  it('fullNNF preserves atoms', () => {
    expect(fullNNF(atom('P'))).toEqual(atom('P'));
  });
});

describe('tableau-engine — isValid / isSatisfiable', () => {
  it('K: tautology P -> P is valid', () => {
    expect(isValid(implies(atom('P'), atom('P')), FRAME_K)).toBe(true);
  });

  it('K: P alone is satisfiable but not valid', () => {
    expect(isSatisfiable(atom('P'), FRAME_K)).toBe(true);
    expect(isValid(atom('P'), FRAME_K)).toBe(false);
  });

  it('K: contradiction P & !P is unsatisfiable', () => {
    expect(isSatisfiable(and(atom('P'), not(atom('P'))), FRAME_K)).toBe(false);
  });

  it('KD seriality: []P -> <>P', () => {
    const f = implies(box(atom('P')), dia(atom('P')));
    expect(isValid(f, FRAME_KD)).toBe(true);
  });

  it('T reflexivity: []P -> P', () => {
    expect(isValid(implies(box(atom('P')), atom('P')), FRAME_T)).toBe(true);
  });

  it('S4 transitivity: []P -> [][]P', () => {
    expect(isValid(implies(box(atom('P')), box(box(atom('P')))), FRAME_S4)).toBe(true);
  });

  it('S5: <>P -> []<>P', () => {
    expect(isValid(implies(dia(atom('P')), box(dia(atom('P')))), FRAME_S5)).toBe(true);
  });
});

describe('tableau-engine — checkTableau', () => {
  it('returns ExpandResult with closed flag', () => {
    const r = checkTableau(implies(atom('P'), atom('P')), FRAME_K, true);
    expect(r.closed).toBe(true);
  });

  it('returns openBranch when satisfiable', () => {
    const r = checkTableau(atom('P'), FRAME_K, false);
    expect(r.closed).toBe(false);
    expect(r.openBranch).toBeDefined();
  });

  it('makeBranch produces a Branch with w0', () => {
    const b = makeBranch([{ formula: atom('P'), world: 'w0' }]);
    expect(b.worlds.has('w0')).toBe(true);
  });
});
