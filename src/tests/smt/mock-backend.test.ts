// ============================================================
// ST SMT Tests — MockSMTBackend resuelve casos triviales
// ============================================================

import { describe, it, expect } from 'vitest';
import { MockSMTBackend } from '../../runtime/smt/mock-backend';
import { toSMTLIB, inferDeclarations } from '../../runtime/smt/serializer';
import type { Formula } from '../../types';

function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function and(...args: Formula[]): Formula {
  return { kind: 'and', args };
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
function equals(a: Formula, b: Formula): Formula {
  return { kind: 'equals', args: [a, b] };
}

/** Helper que sincroniza assertAst con inferDeclarations. */
function assertAst(b: MockSMTBackend, f: Formula): void {
  b.declareFromInference(inferDeclarations(f));
  b.assertAst(f, toSMTLIB(f));
}

describe('MockSMTBackend — booleanos triviales', () => {
  it('P → P es sat (tautología asertada es trivialmente satisfacible)', () => {
    const b = new MockSMTBackend();
    assertAst(b, implies(atom('P'), atom('P')));
    expect(b.checkSat()).toBe('sat');
    expect(b.getModel()).toBeDefined();
  });

  it('P ∧ ¬P es unsat', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(atom('P'), not(atom('P'))));
    expect(b.checkSat()).toBe('unsat');
    expect(b.getModel()).toBeUndefined();
    expect(b.getUnsatCore().length).toBeGreaterThan(0);
  });

  it('sin asserts es sat con modelo vacío', () => {
    const b = new MockSMTBackend();
    expect(b.checkSat()).toBe('sat');
    expect(b.getModel()).toEqual({});
  });

  it('P es sat con P:=true', () => {
    const b = new MockSMTBackend();
    assertAst(b, atom('P'));
    expect(b.checkSat()).toBe('sat');
    const m = b.getModel();
    expect(m).toBeDefined();
    expect(m && m['P']).toBe(true);
  });
});

describe('MockSMTBackend — LRA/LIA triviales', () => {
  it('x > 5 ∧ x < 3 es unsat', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(greater(atom('x'), num(5)), less(atom('x'), num(3))));
    expect(b.checkSat()).toBe('unsat');
  });

  it('x > 5 ∧ x < 10 es sat (modelo intermedio)', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(greater(atom('x'), num(5)), less(atom('x'), num(10))));
    expect(b.checkSat()).toBe('sat');
    const m = b.getModel();
    expect(m).toBeDefined();
    const x = m?.['x'];
    expect(typeof x === 'number').toBe(true);
    expect(typeof x === 'number' && x > 5 && x < 10).toBe(true);
  });

  it('x = 5 ∧ x = 7 es unsat', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(equals(atom('x'), num(5)), equals(atom('x'), num(7))));
    expect(b.checkSat()).toBe('unsat');
  });

  it('x = 5 ∧ x > 0 es sat con x=5', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(equals(atom('x'), num(5)), greater(atom('x'), num(0))));
    expect(b.checkSat()).toBe('sat');
    expect(b.getModel()?.['x']).toBe(5);
  });
});

describe('MockSMTBackend — API contract', () => {
  it('push/pop aísla aserciones', () => {
    const b = new MockSMTBackend();
    assertAst(b, atom('P'));
    b.push();
    assertAst(b, not(atom('P')));
    expect(b.checkSat()).toBe('unsat');
    b.pop();
    expect(b.checkSat()).toBe('sat');
  });

  it('reset limpia todo', () => {
    const b = new MockSMTBackend();
    assertAst(b, and(atom('P'), not(atom('P'))));
    expect(b.checkSat()).toBe('unsat');
    b.reset();
    expect(b.checkSat()).toBe('sat');
  });

  it('declareConst manual no rompe checkSat', () => {
    const b = new MockSMTBackend();
    b.declareConst('flag', 'Bool');
    expect(b.checkSat()).toBe('sat');
  });

  it('pop con levels > stack no se sale del scope raíz', () => {
    const b = new MockSMTBackend();
    b.push();
    b.push();
    b.pop(10);
    assertAst(b, atom('Q'));
    expect(b.checkSat()).toBe('sat');
  });

  it('reporta nombre del backend', () => {
    const b = new MockSMTBackend();
    expect(b.name).toBe('mock');
  });
});
