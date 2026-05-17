import { describe, it, expect } from 'vitest';
import { mkVar, mkConst, mkFunc, FOLTerm } from '../../../proof-systems/fol-prover/types';
import { unify, applyTerm } from '../../../proof-systems/fol-prover/unify';

describe('FOL unification (Robinson)', () => {
  it('unifies P(x) with P(a) → { x → a }', () => {
    const t1 = mkVar('x');
    const t2 = mkConst('a');
    const s = unify(t1, t2);
    expect(s).not.toBeNull();
    if (!s) return;
    expect(s.get('x')?.name).toBe('a');
  });

  it('fails to unify P(x, x) with P(a, b)', () => {
    const t1 = mkFunc('P', [mkVar('x'), mkVar('x')]);
    const t2 = mkFunc('P', [mkConst('a'), mkConst('b')]);
    const s = unify(t1, t2);
    expect(s).toBeNull();
  });

  it('unifies P(x, f(y)) with P(a, f(b))', () => {
    const t1 = mkFunc('P', [mkVar('x'), mkFunc('f', [mkVar('y')])]);
    const t2 = mkFunc('P', [mkConst('a'), mkFunc('f', [mkConst('b')])]);
    const s = unify(t1, t2);
    expect(s).not.toBeNull();
    if (!s) return;
    expect(s.get('x')?.name).toBe('a');
    expect(s.get('y')?.name).toBe('b');
  });

  it('rejects occurs check: x with f(x)', () => {
    const t1 = mkVar('x');
    const t2 = mkFunc('f', [mkVar('x')]);
    const s = unify(t1, t2);
    expect(s).toBeNull();
  });

  it('unifies variable to variable transitively', () => {
    const t1 = mkVar('x');
    const t2 = mkVar('y');
    const s = unify(t1, t2);
    expect(s).not.toBeNull();
    if (!s) return;
    const after = applyTerm(mkVar('x'), s);
    expect(after.name).toBe('y');
  });

  it('unifies same constants', () => {
    const s = unify(mkConst('a'), mkConst('a'));
    expect(s).not.toBeNull();
  });

  it('fails on different constants', () => {
    const s = unify(mkConst('a'), mkConst('b'));
    expect(s).toBeNull();
  });

  it('applies substitution to nested term', () => {
    const sub = new Map<string, FOLTerm>([['x', mkConst('a')]]);
    const t = mkFunc('f', [mkVar('x'), mkFunc('g', [mkVar('x')])]);
    const out = applyTerm(t, sub);
    expect(out.kind).toBe('func');
    expect(out.name).toBe('f');
    expect(out.args?.[0]?.name).toBe('a');
    expect(out.args?.[1]?.args?.[0]?.name).toBe('a');
  });
});
