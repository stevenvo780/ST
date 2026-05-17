import { describe, it, expect } from 'vitest';
import {
  toSMTLIB,
  inferDeclarations,
  emitDeclareConst,
  defaultSortFor,
} from '../../solver/smt/serializer';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const xor = (a: Formula, b: Formula): Formula => ({ kind: 'xor', args: [a, b] });
const num = (v: number): Formula => ({ kind: 'number', value: v });
const lt = (l: Formula, r: Formula): Formula => ({ kind: 'less', args: [l, r] });
const gt = (l: Formula, r: Formula): Formula => ({ kind: 'greater', args: [l, r] });
const le = (l: Formula, r: Formula): Formula => ({ kind: 'less_eq', args: [l, r] });
const ge = (l: Formula, r: Formula): Formula => ({ kind: 'greater_eq', args: [l, r] });
const eq = (l: Formula, r: Formula): Formula => ({ kind: 'equals', args: [l, r] });
const add = (l: Formula, r: Formula): Formula => ({ kind: 'add', args: [l, r] });

describe('SMT serializer — defaultSortFor', () => {
  it('QF_LIA → Int', () => expect(defaultSortFor('QF_LIA')).toBe('Int'));
  it('AUFLIA → Int', () => expect(defaultSortFor('AUFLIA')).toBe('Int'));
  it('QF_LRA → Real', () => expect(defaultSortFor('QF_LRA')).toBe('Real'));
  it('QF_BV → BitVec', () => expect(defaultSortFor('QF_BV')).toBe('BitVec'));
});

describe('SMT serializer — emitDeclareConst', () => {
  it('Bool sort', () => {
    expect(emitDeclareConst('P', 'Bool')).toBe('(declare-const P Bool)');
  });
  it('Int sort', () => {
    expect(emitDeclareConst('x', 'Int')).toBe('(declare-const x Int)');
  });
  it('BitVec default width 32', () => {
    expect(emitDeclareConst('x', 'BitVec')).toBe('(declare-const x (_ BitVec 32))');
  });
  it('BitVec custom width', () => {
    expect(emitDeclareConst('x', 'BitVec', 16)).toBe('(declare-const x (_ BitVec 16))');
  });
  it('quotes invalid names with pipes', () => {
    expect(emitDeclareConst('x y', 'Int')).toContain('|');
  });
});

describe('SMT serializer — toSMTLIB body-only', () => {
  it('boolean atom', () => {
    expect(toSMTLIB(atom('P'))).toBe('P');
  });

  it('not P', () => {
    expect(toSMTLIB(not(atom('P')))).toBe('(not P)');
  });

  it('P and Q', () => {
    expect(toSMTLIB(and(atom('P'), atom('Q')))).toBe('(and P Q)');
  });

  it('P or Q', () => {
    expect(toSMTLIB(or(atom('P'), atom('Q')))).toBe('(or P Q)');
  });

  it('P implies Q uses =>', () => {
    expect(toSMTLIB(implies(atom('P'), atom('Q')))).toBe('(=> P Q)');
  });

  it('biconditional uses =', () => {
    expect(toSMTLIB(bic(atom('P'), atom('Q')))).toBe('(= P Q)');
  });

  it('xor', () => {
    expect(toSMTLIB(xor(atom('P'), atom('Q')))).toBe('(xor P Q)');
  });

  it('number literal', () => {
    expect(toSMTLIB(num(42))).toMatch(/^42(\.0)?$/);
  });

  it('arithmetic add', () => {
    expect(toSMTLIB(add(num(1), num(2)))).toMatch(/^\(\+ 1(\.0)? 2(\.0)?\)$/);
  });

  it('comparison less', () => {
    expect(toSMTLIB(lt(atom('x'), num(5)))).toMatch(/\(< x 5(\.0)?\)/);
  });

  it('comparison greater', () => {
    expect(toSMTLIB(gt(atom('x'), num(5)))).toMatch(/\(> x 5(\.0)?\)/);
  });

  it('comparison less_eq', () => {
    expect(toSMTLIB(le(atom('x'), num(5)))).toMatch(/\(<= x 5(\.0)?\)/);
  });

  it('comparison greater_eq', () => {
    expect(toSMTLIB(ge(atom('x'), num(5)))).toMatch(/\(>= x 5(\.0)?\)/);
  });

  it('equals', () => {
    expect(toSMTLIB(eq(atom('x'), num(5)))).toMatch(/\(= x 5(\.0)?\)/);
  });

  it('true/false constants', () => {
    expect(toSMTLIB({ kind: 'true' })).toBe('true');
    expect(toSMTLIB({ kind: 'false' })).toBe('false');
  });

  it('nested formulas with arithmetic', () => {
    const f = and(gt(atom('x'), num(0)), lt(atom('x'), num(10)));
    const s = toSMTLIB(f);
    expect(s).toMatch(/and/);
    expect(s).toMatch(/> x 0/);
  });
});

describe('SMT serializer — full script', () => {
  it('full=true emits set-logic + declare-const + assert + check-sat', () => {
    const out = toSMTLIB(and(atom('P'), atom('Q')), { full: true });
    expect(out).toContain('(set-logic');
    expect(out).toContain('(declare-const');
    expect(out).toContain('(assert');
    expect(out).toContain('(check-sat)');
  });

  it('full=true with arithmetic chooses QF_LRA', () => {
    const out = toSMTLIB(gt(atom('x'), num(0)), { full: true });
    expect(out).toMatch(/QF_LRA|AUFLIA/);
  });

  it('full=true with bv width', () => {
    const out = toSMTLIB(eq(atom('x'), num(1)), {
      full: true,
      logic: 'QF_BV',
      bvWidth: 8,
    });
    expect(out).toContain('BitVec 8');
  });

  it('honors explicit logic option', () => {
    const out = toSMTLIB(and(atom('P'), atom('Q')), { full: true, logic: 'QF_LIA' });
    expect(out).toContain('QF_LIA');
  });
});

describe('SMT serializer — inferDeclarations', () => {
  it('infers Bool atoms for boolean formula', () => {
    const decls = inferDeclarations(and(atom('P'), atom('Q')));
    expect(decls.length).toBe(2);
    expect(decls.every((d) => d.sort === 'Bool')).toBe(true);
  });

  it('infers numeric atoms for arithmetic comparisons', () => {
    const decls = inferDeclarations(gt(atom('x'), num(5)));
    expect(decls.some((d) => d.name === 'x' && d.sort !== 'Bool')).toBe(true);
  });

  it('mixed formula: numeric in comparison + boolean wrapper', () => {
    const f = and(gt(atom('x'), num(0)), atom('flag'));
    const decls = inferDeclarations(f);
    expect(decls.some((d) => d.name === 'flag')).toBe(true);
    expect(decls.some((d) => d.name === 'x')).toBe(true);
  });

  it('honors explicit logic for inference', () => {
    const decls = inferDeclarations(gt(atom('x'), num(0)), 'QF_LIA');
    const x = decls.find((d) => d.name === 'x');
    expect(x?.sort).toBe('Int');
  });
});
