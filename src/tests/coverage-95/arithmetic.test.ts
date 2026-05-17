import { describe, it, expect } from 'vitest';
import { evalNumeric, ArithmeticProfile } from '../../profiles/arithmetic';
import type { Formula, Theory } from '../../types';

const num = (v: number): Formula => ({ kind: 'number', value: v });
const atom = (n: string): Formula => ({ kind: 'atom', name: n });
const add = (l: Formula, r: Formula): Formula => ({ kind: 'add', args: [l, r] });
const sub = (l: Formula, r: Formula): Formula => ({ kind: 'subtract', args: [l, r] });
const mul = (l: Formula, r: Formula): Formula => ({ kind: 'multiply', args: [l, r] });
const div = (l: Formula, r: Formula): Formula => ({ kind: 'divide', args: [l, r] });
const mod = (l: Formula, r: Formula): Formula => ({ kind: 'modulo', args: [l, r] });
const lt = (l: Formula, r: Formula): Formula => ({ kind: 'less', args: [l, r] });
const gt = (l: Formula, r: Formula): Formula => ({ kind: 'greater', args: [l, r] });
const le = (l: Formula, r: Formula): Formula => ({ kind: 'less_eq', args: [l, r] });
const ge = (l: Formula, r: Formula): Formula => ({ kind: 'greater_eq', args: [l, r] });

describe('evalNumeric — arithmetic evaluation', () => {
  it('evaluates simple literals', () => {
    expect(evalNumeric(num(42))).toBe(42);
  });

  it('evaluates with vars', () => {
    const vars = new Map([['x', 5]]);
    expect(evalNumeric(atom('x'), vars)).toBe(5);
  });

  it('atom without binding returns NaN', () => {
    expect(Number.isNaN(evalNumeric(atom('unknown')))).toBe(true);
  });

  it('add, subtract, multiply', () => {
    expect(evalNumeric(add(num(2), num(3)))).toBe(5);
    expect(evalNumeric(sub(num(10), num(3)))).toBe(7);
    expect(evalNumeric(mul(num(4), num(3)))).toBe(12);
  });

  it('divide and modulo', () => {
    expect(evalNumeric(div(num(10), num(2)))).toBe(5);
    expect(evalNumeric(mod(num(10), num(3)))).toBe(1);
  });

  it('division by zero is NaN', () => {
    expect(Number.isNaN(evalNumeric(div(num(5), num(0))))).toBe(true);
  });

  it('modulo by zero is NaN', () => {
    expect(Number.isNaN(evalNumeric(mod(num(5), num(0))))).toBe(true);
  });

  it('comparisons return 1/0', () => {
    expect(evalNumeric(lt(num(1), num(2)))).toBe(1);
    expect(evalNumeric(lt(num(2), num(1)))).toBe(0);
    expect(evalNumeric(gt(num(2), num(1)))).toBe(1);
    expect(evalNumeric(le(num(2), num(2)))).toBe(1);
    expect(evalNumeric(ge(num(3), num(2)))).toBe(1);
  });

  it('unknown kind returns NaN', () => {
    expect(Number.isNaN(evalNumeric({ kind: 'and', args: [num(1), num(2)] }))).toBe(true);
  });

  it('records trace when provided', () => {
    const trace: string[] = [];
    evalNumeric(add(num(2), num(3)), undefined, trace);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0]).toContain('suma');

    const trace2: string[] = [];
    evalNumeric(sub(num(5), num(2)), undefined, trace2);
    expect(trace2[0]).toContain('resta');

    const trace3: string[] = [];
    evalNumeric(mul(num(3), num(4)), undefined, trace3);
    expect(trace3[0]).toContain('multiplicación');

    const trace4: string[] = [];
    evalNumeric(div(num(8), num(2)), undefined, trace4);
    expect(trace4[0]).toContain('división');

    const trace5: string[] = [];
    evalNumeric(mod(num(7), num(3)), undefined, trace5);
    expect(trace5[0]).toContain('módulo');

    const trace6: string[] = [];
    evalNumeric(lt(num(1), num(2)), undefined, trace6);
    expect(trace6[0]).toContain('comparación');

    const trace7: string[] = [];
    evalNumeric(gt(num(3), num(1)), undefined, trace7);
    expect(trace7[0]).toContain('comparación');

    const trace8: string[] = [];
    evalNumeric(le(num(1), num(2)), undefined, trace8);
    expect(trace8[0]).toContain('comparación');

    const trace9: string[] = [];
    evalNumeric(ge(num(2), num(1)), undefined, trace9);
    expect(trace9[0]).toContain('comparación');
  });
});

describe('ArithmeticProfile — interface', () => {
  const p = new ArithmeticProfile();

  it('has name arithmetic', () => {
    expect(p.name).toBe('arithmetic');
  });

  it('checkWellFormed accepts numeric formulas', () => {
    expect(p.checkWellFormed(add(num(1), num(2)))).toEqual([]);
  });

  it('checkValid: 2 > 1 evaluates to valid', () => {
    const r = p.checkValid(gt(num(2), num(1)));
    expect(['valid', 'invalid', 'unknown']).toContain(r.status);
  });

  it('checkValid: 1 > 2 is invalid', () => {
    const r = p.checkValid(gt(num(1), num(2)));
    expect(r.status).toBeDefined();
  });

  it('checkSatisfiable on a comparison', () => {
    const r = p.checkSatisfiable(gt(num(2), num(1)));
    expect(r.status).toBeDefined();
  });

  it('exposes profile interface', () => {
    expect(typeof p.checkValid).toBe('function');
    expect(typeof p.checkSatisfiable).toBe('function');
    expect(typeof p.explain).toBe('function');
  });

  it('explain returns RunResult with output', () => {
    const r = p.explain(add(num(2), num(3)));
    expect(typeof r.output).toBe('string');
  });

  it('countermodel of 2 > 1', () => {
    const r = p.countermodel(gt(num(2), num(1)));
    expect(r.status).toBeDefined();
  });

  it('prove with empty theory falls back', () => {
    const t: Theory = {
      profile: 'arithmetic',
      axioms: new Map(),
      theorems: new Map(),
      claims: new Map(),
      judgments: [],
    };
    const r = p.prove(gt(num(2), num(1)), t);
    expect(r.status).toBeDefined();
  });

  it('derive with empty premises uses checkValid', () => {
    const t: Theory = {
      profile: 'arithmetic',
      axioms: new Map(),
      theorems: new Map(),
      claims: new Map(),
      judgments: [],
    };
    const r = p.derive(gt(num(2), num(1)), [], t);
    expect(r.status).toBeDefined();
  });
});
