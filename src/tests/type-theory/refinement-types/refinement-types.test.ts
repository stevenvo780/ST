import { describe, expect, it } from 'vitest';
import {
  checkVC,
  generateVC,
  implies,
  isSubtype,
  rApp,
  rBinop,
  rLam,
  rLet,
  rLit,
  rVar,
  refine,
  refTypeToString,
  tBool,
  tInt,
  typeCheck,
  parsePredicate,
  predicateRenameVar,
} from '../../../type-theory/refinement-types';

describe('refinement-types / predicates & solver', () => {
  it('checkVC: predicado vacío es trivialmente satisfacible', () => {
    const res = checkVC([]);
    expect(res.satisfiable).toBe(true);
  });

  it('checkVC: encuentra testigo para x > 0 && x < 5', () => {
    const res = checkVC(['x > 0 && x < 5']);
    expect(res.satisfiable).toBe(true);
    expect(res.counter).toBeDefined();
    const x = res.counter!['x'];
    expect(typeof x).toBe('number');
    expect(x as number).toBeGreaterThan(0);
    expect(x as number).toBeLessThan(5);
  });

  it('checkVC: contradicción x > 5 && x < 0 no es satisfacible', () => {
    const res = checkVC(['x > 5', 'x < 0']);
    expect(res.satisfiable).toBe(false);
  });

  it('implies: x > 5 ⇒ x > 0 (válido)', () => {
    expect(implies(['x > 5'], 'x > 0')).toBe(true);
  });

  it('implies: x > 0 ⇒ x > 5 (NO válido, hay contraejemplo x=1)', () => {
    expect(implies(['x > 0'], 'x > 5')).toBe(false);
  });

  it('predicateRenameVar: reemplaza el binding correctamente', () => {
    const renamed = predicateRenameVar('x > 0 && x < 10', 'x', 'y');
    // El predicado renombrado debe ser equivalente al original al sustituir y por valores.
    const ast = parsePredicate(renamed);
    expect(JSON.stringify(ast).includes('"x"')).toBe(false);
    expect(JSON.stringify(ast).includes('"y"')).toBe(true);
  });
});

describe('refinement-types / subtipado', () => {
  it('{ x | x > 5 } <: { x | x > 0 } (más restrictivo es subtipo)', () => {
    const t1 = refine('Int', 'x', 'x > 5');
    const t2 = refine('Int', 'x', 'x > 0');
    expect(isSubtype(t1, t2)).toBe(true);
  });

  it('{ x | x > 0 } NO es subtipo de { x | x > 5 }', () => {
    const t1 = refine('Int', 'x', 'x > 0');
    const t2 = refine('Int', 'x', 'x > 5');
    expect(isSubtype(t1, t2)).toBe(false);
  });

  it('subtipado con bindings distintos (rename)', () => {
    const t1 = refine('Int', 'a', 'a >= 10');
    const t2 = refine('Int', 'b', 'b > 0');
    expect(isSubtype(t1, t2)).toBe(true);
  });

  it('intersección de rangos: { x | x>0 && x<10 } <: { x | x<100 }', () => {
    const t1 = refine('Int', 'x', 'x > 0 && x < 10');
    const t2 = refine('Int', 'x', 'x < 100');
    expect(isSubtype(t1, t2)).toBe(true);
  });

  it('tipos base distintos no son subtipo', () => {
    expect(isSubtype(tInt(), tBool())).toBe(false);
  });

  it('subtipado de arrow: contravariante en parámetro', () => {
    // (Int|x>0) -> Int <: (Int|x>5) -> Int  (porque {x>5} <: {x>0})
    const broader = refine('Int', 'x', 'x > 0');
    const narrower = refine('Int', 'x', 'x > 5');
    const arrA = {
      base: { kind: 'arrow' as const, from: broader, to: tInt() },
      binding: '_f',
      predicate: 'true',
    };
    const arrB = {
      base: { kind: 'arrow' as const, from: narrower, to: tInt() },
      binding: '_f',
      predicate: 'true',
    };
    expect(isSubtype(arrA, arrB)).toBe(true);
    expect(isSubtype(arrB, arrA)).toBe(false);
  });
});

describe('refinement-types / typeCheck (aplicación)', () => {
  it('(λ x : {x:Int | x>0}. x+1) 5 type-checks', () => {
    const positives = refine('Int', 'x', 'x > 0');
    const term = rApp(rLam('x', positives, rBinop('+', rVar('x'), rLit(1))), rLit(5));
    const res = typeCheck(term);
    if (!res.ok) {
      console.warn('errors:', res.errors);
    }
    expect(res.ok).toBe(true);
  });

  it('(λ x : {x:Int | x>0}. x+1) 0 es RECHAZADO (precondición violada)', () => {
    const positives = refine('Int', 'x', 'x > 0');
    const term = rApp(rLam('x', positives, rBinop('+', rVar('x'), rLit(1))), rLit(0));
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('(λ x : {x:Int | x>0}. x+1) -3 es RECHAZADO', () => {
    const positives = refine('Int', 'x', 'x > 0');
    const term = rApp(rLam('x', positives, rBinop('+', rVar('x'), rLit(1))), rLit(-3));
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });

  it('rango doble: argumento dentro de [1..99] es aceptado', () => {
    const inRange = refine('Int', 'x', 'x > 0 && x < 100');
    const term = rApp(rLam('x', inRange, rVar('x')), rLit(42));
    const res = typeCheck(term);
    expect(res.ok).toBe(true);
  });

  it('rango doble: argumento fuera del rango es rechazado', () => {
    const inRange = refine('Int', 'x', 'x > 0 && x < 100');
    const term = rApp(rLam('x', inRange, rVar('x')), rLit(150));
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });

  it('let con anotación: valor que satisface el predicado pasa', () => {
    const term = rLet('y', rLit(10), rVar('y'), refine('Int', 'y', 'y > 0'));
    const res = typeCheck(term);
    expect(res.ok).toBe(true);
  });

  it('let con anotación: valor que NO satisface el predicado falla', () => {
    const term = rLet('y', rLit(-1), rVar('y'), refine('Int', 'y', 'y > 0'));
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });

  it('binop suma sintetiza Int', () => {
    const term = rBinop('+', rLit(2), rLit(3));
    const res = typeCheck(term);
    expect(res.ok).toBe(true);
    expect(res.type?.base).toBe('Int');
  });

  it('binop comparación sintetiza Bool', () => {
    const term = rBinop('<', rLit(2), rLit(3));
    const res = typeCheck(term);
    expect(res.ok).toBe(true);
    expect(res.type?.base).toBe('Bool');
  });

  it('if con condición no booleana es rechazado', () => {
    const term = { kind: 'if' as const, cond: rLit(1), then: rLit(1), else: rLit(2) };
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });

  it('aplicar algo que no es función falla', () => {
    const term = rApp(rLit(1), rLit(2));
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });

  it('variable libre da error', () => {
    const term = rVar('z');
    const res = typeCheck(term);
    expect(res.ok).toBe(false);
  });
});

describe('refinement-types / generateVC + utilidades', () => {
  it('generateVC devuelve array (puede estar vacío en términos triviales)', () => {
    const term = rLit(42);
    expect(Array.isArray(generateVC(term))).toBe(true);
  });

  it('generateVC: aplicación con precondición violada acumula al menos una VC', () => {
    const positives = refine('Int', 'x', 'x > 0');
    const term = rApp(rLam('x', positives, rVar('x')), rLit(-1));
    const vcs = generateVC(term);
    expect(vcs.length).toBeGreaterThan(0);
  });

  it('refTypeToString incluye predicado cuando no es trivial', () => {
    const t = refine('Int', 'x', 'x > 0');
    const s = refTypeToString(t);
    expect(s).toContain('Int');
    expect(s).toContain('x > 0');
  });

  it('refTypeToString omite predicado trivial', () => {
    const t = tInt('x', 'true');
    expect(refTypeToString(t)).not.toContain('|');
  });
});
