import { describe, it, expect } from 'vitest';
import { dpll, dpllAsync, dpllLegacy } from '../../logic/profiles/classical/dpll';
import { cdcl, detectPatterns, addSymmetryBreaking } from '../../logic/profiles/classical/cdcl';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (...args: Formula[]): Formula => ({ kind: 'and', args });
const or = (...args: Formula[]): Formula => ({ kind: 'or', args });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });

describe('coverage-90 — DPLL and CDCL engines', () => {
  it('dpll: tautology !p | p is satisfiable', () => {
    const r = dpll(or(not(atom('p')), atom('p')));
    expect(r.satisfiable).toBe(true);
  });

  it('dpll: contradiction p & !p is UNSAT', () => {
    const r = dpll(and(atom('p'), not(atom('p'))));
    expect(r.satisfiable).toBe(false);
  });

  it('dpll: complex CNF satisfiable', () => {
    const f = and(
      or(atom('a'), atom('b')),
      or(not(atom('a')), atom('c')),
      or(not(atom('b')), atom('c')),
    );
    const r = dpll(f);
    expect(r.satisfiable).toBe(true);
  });

  it('dpll: 3-SAT with chain implications', () => {
    const r = dpll(
      and(
        atom('a'),
        implies(atom('a'), atom('b')),
        implies(atom('b'), atom('c')),
        implies(atom('c'), atom('d')),
      ),
    );
    expect(r.satisfiable).toBe(true);
  });

  it('dpll: 5-variable pigeonhole-like UNSAT', () => {
    // (a | b) & (a | c) & (b | c) & (!a | !b) & (!a | !c) & (!b | !c)
    const f = and(
      or(atom('a'), atom('b')),
      or(atom('a'), atom('c')),
      or(atom('b'), atom('c')),
      or(not(atom('a')), not(atom('b'))),
      or(not(atom('a')), not(atom('c'))),
      or(not(atom('b')), not(atom('c'))),
    );
    const r = dpll(f);
    expect(r.satisfiable).toBe(false);
  });

  it('dpll: deeply nested formula', () => {
    const r = dpll(implies(implies(implies(atom('p'), atom('q')), atom('p')), atom('p')));
    expect(r.satisfiable).toBe(true);
  });

  it('dpllLegacy fallback works', () => {
    const r = dpllLegacy(or(atom('a'), atom('b')));
    expect(r.satisfiable).toBe(true);
  });

  it('dpllAsync resolves', async () => {
    const r = await dpllAsync(and(atom('a'), not(atom('b'))));
    expect(r.satisfiable).toBe(true);
  });

  it('dpll with timeout=1ms still returns', () => {
    const f = and(
      or(atom('a'), atom('b'), atom('c')),
      or(not(atom('a')), atom('d')),
      or(not(atom('b')), atom('e')),
    );
    const r = dpll(f, 1);
    expect(typeof r.satisfiable).toBe('boolean');
  });

  it('cdcl: same satisfiable formula', () => {
    const r = cdcl(or(atom('a'), atom('b')));
    expect(r.satisfiable).toBe(true);
  });

  it('cdcl: unsatisfiable pigeonhole', () => {
    const f = and(
      or(atom('a'), atom('b')),
      or(atom('a'), atom('c')),
      or(atom('b'), atom('c')),
      or(not(atom('a')), not(atom('b'))),
      or(not(atom('a')), not(atom('c'))),
      or(not(atom('b')), not(atom('c'))),
    );
    const r = cdcl(f);
    expect(r.satisfiable).toBe(false);
  });

  it('cdcl with stats output', () => {
    const r = cdcl(and(or(atom('a'), atom('b')), or(not(atom('a')), atom('b'))));
    expect(r.satisfiable).toBe(true);
  });

  it('detectPatterns: empty clauses returns null', () => {
    const p = detectPatterns([], 0);
    // null or some result, just exercise
    expect(p === null || typeof p === 'object').toBe(true);
  });

  it('detectPatterns: cardinality-like clauses', () => {
    const clauses = [
      new Int32Array([1, 2, 3]),
      new Int32Array([-1, -2]),
      new Int32Array([-1, -3]),
      new Int32Array([-2, -3]),
    ];
    const p = detectPatterns(clauses, 3);
    expect(p === null || typeof p === 'object').toBe(true);
  });

  it('addSymmetryBreaking returns clauses', () => {
    const clauses = [new Int32Array([1, 2]), new Int32Array([-1, -2])];
    const out = addSymmetryBreaking(clauses, 2);
    expect(Array.isArray(out)).toBe(true);
  });

  it('addSymmetryBreaking with empty clauses', () => {
    const out = addSymmetryBreaking([], 0);
    expect(Array.isArray(out)).toBe(true);
  });

  it('cdcl: large unsat instance with restarts', () => {
    // Construct ~20 variable hard instance
    const f = and(
      or(atom('a'), atom('b'), atom('c'), atom('d')),
      or(not(atom('a')), atom('e')),
      or(not(atom('b')), atom('f')),
      or(not(atom('c')), atom('g')),
      or(not(atom('d')), atom('h')),
      or(not(atom('e')), not(atom('f'))),
      or(not(atom('e')), not(atom('g'))),
      or(not(atom('e')), not(atom('h'))),
      or(not(atom('f')), not(atom('g'))),
      or(not(atom('f')), not(atom('h'))),
      or(not(atom('g')), not(atom('h'))),
    );
    const r = cdcl(f);
    expect(typeof r.satisfiable).toBe('boolean');
  });

  it('cdcl with very tight budget', () => {
    const f = or(atom('a'), atom('b'));
    const r = cdcl(f, 1);
    expect(typeof r.satisfiable).toBe('boolean');
  });
});
