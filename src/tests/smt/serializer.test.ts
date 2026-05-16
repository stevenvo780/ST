// ============================================================
// ST SMT Tests — toSMTLIB serializer
// ============================================================

import { describe, it, expect } from 'vitest';
import { toSMTLIB, inferDeclarations } from '../../runtime/smt/serializer';
import type { Formula } from '../../types';

function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function and(...args: Formula[]): Formula {
  return { kind: 'and', args };
}
function or(...args: Formula[]): Formula {
  return { kind: 'or', args };
}
function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}
function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}
function num(v: number): Formula {
  return { kind: 'number', value: v };
}
function greater(a: Formula, b: Formula): Formula {
  return { kind: 'greater', args: [a, b] };
}
function less(a: Formula, b: Formula): Formula {
  return { kind: 'less', args: [a, b] };
}

describe('toSMTLIB — booleanos', () => {
  it('serializa P ∧ ¬P como (and P (not P))', () => {
    const f = and(atom('P'), not(atom('P')));
    const out = toSMTLIB(f);
    expect(out).toContain('(and P (not P))');
  });

  it('declara átomos como Bool en modo full', () => {
    const f = and(atom('P'), not(atom('P')));
    const out = toSMTLIB(f, { full: true });
    expect(out).toContain('(declare-const P Bool)');
    expect(out).toContain('(assert (and P (not P)))');
    expect(out).toContain('(check-sat)');
  });

  it('serializa implicación', () => {
    const f = implies(atom('P'), atom('Q'));
    expect(toSMTLIB(f)).toBe('(=> P Q)');
  });

  it('serializa true/false', () => {
    expect(toSMTLIB({ kind: 'true' })).toBe('true');
    expect(toSMTLIB({ kind: 'false' })).toBe('false');
  });

  it('serializa or n-ario', () => {
    const f = or(atom('A'), atom('B'), atom('C'));
    expect(toSMTLIB(f)).toBe('(or A B C)');
  });
});

describe('toSMTLIB — aritmética', () => {
  it('serializa x > 5 con sort Real', () => {
    const f = greater(atom('x'), num(5));
    const out = toSMTLIB(f, { logic: 'QF_LRA', full: true });
    expect(out).toContain('(declare-const x Real)');
    expect(out).toContain('(assert (> x 5.0))');
  });

  it('serializa x > 5 ∧ x < 3 (LIA)', () => {
    const f = and(greater(atom('x'), num(5)), less(atom('x'), num(3)));
    const out = toSMTLIB(f, { logic: 'QF_LIA', full: true });
    expect(out).toContain('(declare-const x Int)');
    expect(out).toContain('(and (> x 5) (< x 3))');
  });

  it('infiere QF_LRA cuando hay aritmética y no se pasa logic explícito', () => {
    const f = greater(atom('x'), num(0));
    const out = toSMTLIB(f, { full: true });
    expect(out).toContain('(set-logic QF_LRA)');
  });
});

describe('inferDeclarations', () => {
  it('declara P, Q como Bool', () => {
    const decls = inferDeclarations(and(atom('P'), atom('Q')));
    expect(decls).toHaveLength(2);
    expect(decls.every((d) => d.sort === 'Bool')).toBe(true);
  });

  it('declara x como Real bajo QF_LRA', () => {
    const decls = inferDeclarations(greater(atom('x'), num(5)), 'QF_LRA');
    const xDecl = decls.find((d) => d.name === 'x');
    expect(xDecl?.sort).toBe('Real');
  });

  it('declara x como Int bajo QF_LIA', () => {
    const decls = inferDeclarations(greater(atom('x'), num(5)), 'QF_LIA');
    const xDecl = decls.find((d) => d.name === 'x');
    expect(xDecl?.sort).toBe('Int');
  });
});
