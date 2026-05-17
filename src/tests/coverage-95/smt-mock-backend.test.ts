import { describe, it, expect, beforeEach } from 'vitest';
import { MockSMTBackend } from '../../runtime/smt/mock-backend';
import type { Formula } from '../../types';

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (...args: Formula[]): Formula => ({ kind: 'and', args });
const or = (...args: Formula[]): Formula => ({ kind: 'or', args });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const biconditional = (a: Formula, b: Formula): Formula => ({
  kind: 'biconditional',
  args: [a, b],
});
const xor = (...args: Formula[]): Formula => ({ kind: 'xor', args });
const nand = (...args: Formula[]): Formula => ({ kind: 'nand', args });
const nor = (...args: Formula[]): Formula => ({ kind: 'nor', args });
const trueF: Formula = { kind: 'true' };
const falseF: Formula = { kind: 'false' };
const num = (value: number): Formula => ({ kind: 'number', value });
const lt = (l: Formula, r: Formula): Formula => ({ kind: 'less', args: [l, r] });
const gt = (l: Formula, r: Formula): Formula => ({ kind: 'greater', args: [l, r] });
const le = (l: Formula, r: Formula): Formula => ({ kind: 'less_eq', args: [l, r] });
const ge = (l: Formula, r: Formula): Formula => ({ kind: 'greater_eq', args: [l, r] });
const eq = (l: Formula, r: Formula): Formula => ({ kind: 'equals', args: [l, r] });

describe('MockSMTBackend — basic lifecycle', () => {
  let b: MockSMTBackend;
  beforeEach(() => {
    b = new MockSMTBackend();
  });

  it('name is "mock"', () => {
    expect(b.name).toBe('mock');
  });

  it('returns sat for no assertions', () => {
    expect(b.checkSat()).toBe('sat');
    expect(b.getModel()).toEqual({});
  });

  it('returns unknown for assertion without AST', () => {
    b.assertFormula('(assert (> x 0))');
    expect(b.checkSat()).toBe('unknown');
    expect(b.getModel()).toBeUndefined();
  });

  it('push/pop manages scopes', () => {
    b.assertAst(atom('P'));
    b.push();
    b.assertAst(not(atom('P')));
    expect(b.checkSat()).toBe('unsat');
    b.pop();
    expect(b.checkSat()).toBe('sat');
  });

  it('pop multiple levels at once', () => {
    b.push();
    b.push();
    b.push();
    b.pop(3);
    expect(b.checkSat()).toBe('sat');
  });

  it('pop never goes below 1 scope', () => {
    b.pop(99);
    expect(b.checkSat()).toBe('sat');
  });

  it('reset clears all state', () => {
    b.assertAst(atom('P'));
    b.assertAst(not(atom('P')));
    b.checkSat();
    b.reset();
    expect(b.checkSat()).toBe('sat');
  });

  it('declareConst registers and is idempotent via declareFromInference', () => {
    b.declareConst('x', 'Bool');
    b.declareFromInference([
      { name: 'x', sort: 'Bool' },
      { name: 'y', sort: 'Int' },
    ]);
    // both calls don't throw
    expect(b.checkSat()).toBe('sat');
  });
});

describe('MockSMTBackend — boolean SAT', () => {
  let b: MockSMTBackend;
  beforeEach(() => {
    b = new MockSMTBackend();
  });

  it('sat: single atom P', () => {
    b.assertAst(atom('P'));
    expect(b.checkSat()).toBe('sat');
    const m = b.getModel();
    expect(m?.P).toBe(true);
  });

  it('unsat: P ∧ ¬P', () => {
    b.assertAst(atom('P'));
    b.assertAst(not(atom('P')));
    expect(b.checkSat()).toBe('unsat');
    expect(b.getUnsatCore().length).toBeGreaterThan(0);
  });

  it('sat: P ∨ Q', () => {
    b.assertAst(or(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('unsat: P ∨ Q, ¬P, ¬Q', () => {
    b.assertAst(or(atom('P'), atom('Q')));
    b.assertAst(not(atom('P')));
    b.assertAst(not(atom('Q')));
    expect(b.checkSat()).toBe('unsat');
  });

  it('sat: P → Q', () => {
    b.assertAst(implies(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: P ↔ Q', () => {
    b.assertAst(biconditional(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: P xor Q', () => {
    b.assertAst(xor(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: P nand Q', () => {
    b.assertAst(nand(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: P nor Q', () => {
    b.assertAst(nor(atom('P'), atom('Q')));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: only true constants', () => {
    b.assertAst(trueF);
    expect(b.checkSat()).toBe('sat');
    expect(b.getModel()).toEqual({});
  });

  it('unsat: just false', () => {
    b.assertAst(falseF);
    expect(b.checkSat()).toBe('unsat');
  });

  it('returns unknown when too many atoms (>16)', () => {
    for (let i = 0; i < 17; i++) {
      b.assertAst(atom('A' + i));
    }
    expect(b.checkSat()).toBe('unknown');
  });
});

describe('MockSMTBackend — linear arithmetic', () => {
  let b: MockSMTBackend;
  beforeEach(() => {
    b = new MockSMTBackend();
  });

  it('sat: x > 0', () => {
    b.assertAst(gt(atom('x'), num(0)));
    expect(b.checkSat()).toBe('sat');
    expect((b.getModel() ?? {}).x).toBeGreaterThan(0);
  });

  it('sat: x < 10', () => {
    b.assertAst(lt(atom('x'), num(10)));
    expect(b.checkSat()).toBe('sat');
    expect((b.getModel() ?? {}).x).toBeLessThan(10);
  });

  it('sat: x >= 5 and x <= 5 -> x = 5', () => {
    b.assertAst(and(ge(atom('x'), num(5)), le(atom('x'), num(5))));
    expect(b.checkSat()).toBe('sat');
    expect((b.getModel() ?? {}).x).toBe(5);
  });

  it('sat: x = 7', () => {
    b.assertAst(eq(atom('x'), num(7)));
    expect(b.checkSat()).toBe('sat');
    expect((b.getModel() ?? {}).x).toBe(7);
  });

  it('unsat: x = 5 and x = 6', () => {
    b.assertAst(eq(atom('x'), num(5)));
    b.assertAst(eq(atom('x'), num(6)));
    expect(b.checkSat()).toBe('unsat');
  });

  it('unsat: x > 10 and x < 5', () => {
    b.assertAst(gt(atom('x'), num(10)));
    b.assertAst(lt(atom('x'), num(5)));
    expect(b.checkSat()).toBe('unsat');
  });

  it('sat: flipped operands 5 < x', () => {
    b.assertAst(lt(num(5), atom('x')));
    expect(b.checkSat()).toBe('sat');
    expect((b.getModel() ?? {}).x).toBeGreaterThan(5);
  });

  it('sat: x = 5 within range (3, 10)', () => {
    b.assertAst(gt(atom('x'), num(3)));
    b.assertAst(lt(atom('x'), num(10)));
    b.assertAst(eq(atom('x'), num(5)));
    expect(b.checkSat()).toBe('sat');
  });

  it('unsat: x = 1 violates x >= 5', () => {
    b.assertAst(ge(atom('x'), num(5)));
    b.assertAst(eq(atom('x'), num(1)));
    expect(b.checkSat()).toBe('unsat');
  });

  it('sat: x <= 10 alone', () => {
    b.assertAst(le(atom('x'), num(10)));
    expect(b.checkSat()).toBe('sat');
  });

  it('sat: x >= 5 alone', () => {
    b.assertAst(ge(atom('x'), num(5)));
    expect(b.checkSat()).toBe('sat');
  });
});
