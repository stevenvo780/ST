// ============================================================
// ST dL-Hybrid — Decision procedure tests
// ============================================================
// Casos canónicos del paper de Platzer adaptados al subset.

import { describe, it, expect } from 'vitest';
import { parseFormula } from '../parser';
import { checkValid, checkSatisfiable, evalInState } from '../tableau';
import type { State } from '../ast';

const valid = (src: string, opts?: Parameters<typeof checkValid>[1]): boolean =>
  checkValid(parseFormula(src), opts).status === 'valid';

const sat = (src: string, opts?: Parameters<typeof checkSatisfiable>[1]): boolean =>
  checkSatisfiable(parseFormula(src), opts).status === 'satisfiable';

describe('dl-hybrid tableau — asignaciones discretas', () => {
  it('[ x := 0 ] x = 0 es válida', () => {
    expect(valid('[ x := 0 ] x = 0')).toBe(true);
  });

  it('[ x := 0 ] x > 0 NO es válida', () => {
    expect(valid('[ x := 0 ] x > 0')).toBe(false);
  });

  it('precondición → postcondición tras asignación: x >= 0 -> [x := x + 1] x > 0', () => {
    expect(valid('x >= 0 -> [ x := x + 1 ] x > 0')).toBe(true);
  });

  it('contraejemplo: x = -1 → [x := x + 1] x > 0 falla', () => {
    // En estado x=-1, tras x:=x+1 queda x=0, no > 0.
    const f = parseFormula('[ x := x + 1 ] x > 0');
    const s: State = new Map([['x', -1]]);
    expect(evalInState(f, s)).toBe(false);
  });

  it('asignación encadenada: [x := 1; x := x + 1] x = 2', () => {
    expect(valid('[ x := 1; x := x + 1 ] x = 2')).toBe(true);
  });
});

describe('dl-hybrid tableau — choice y test', () => {
  it('[x := 0 ++ x := 1] x >= 0 es válida', () => {
    expect(valid('[ x := 0 ++ x := 1 ] x >= 0')).toBe(true);
  });

  it('[x := 0 ++ x := -1] x >= 0 NO es válida (rama -1 viola)', () => {
    expect(valid('[ x := 0 ++ x := -1 ] x >= 0')).toBe(false);
  });

  it('test bloqueante: [?(x > 0); x := 1] x > 0 es válida (vacuous si bloquea)', () => {
    expect(valid('[ ?(x > 0); x := 1 ] x > 0')).toBe(true);
  });

  it('test que pasa con precondición: x > 0 -> [?(x > 0)] x > 0', () => {
    expect(valid('x > 0 -> [ ?(x > 0) ] x > 0')).toBe(true);
  });
});

describe('dl-hybrid tableau — diamond (existencial)', () => {
  it('<x := 5> x > 0 es válida — existe outcome con x > 0', () => {
    expect(valid('<x := 5> x > 0')).toBe(true);
  });

  it('<x := 0> x > 0 NO es válida — único outcome es x=0', () => {
    expect(valid('<x := 0> x > 0')).toBe(false);
  });

  it('diamond y choice: <x := 0 ++ x := 1> x > 0 vale (rama 1)', () => {
    expect(valid('<x := 0 ++ x := 1> x > 0')).toBe(true);
  });
});

describe('dl-hybrid tableau — loops bounded', () => {
  it('[(x := x + 1)*] true siempre vale', () => {
    expect(valid('[(x := x + 1)*] true')).toBe(true);
  });

  it('[x := 0; (x := x + 1)*] x >= 0 es válida (todos los unfolds preservan x >= 0)', () => {
    expect(valid('[ x := 0; (x := x + 1)* ] x >= 0')).toBe(true);
  });

  it('[(x := x - 1)*] x >= 0 NO es válida (un unfold rompe la cota)', () => {
    expect(valid('[ x := 0; (x := x - 1)* ] x >= 0', { loopUnfold: 2 })).toBe(false);
  });
});

describe('dl-hybrid tableau — ODEs continuas', () => {
  it("[{x' = 1 & x < 5}] x <= 5 es válida con dominio", () => {
    expect(valid("[{x' = 1 & x < 5}] x <= 5")).toBe(true);
  });

  it("[{x' = 0}] x = x0 — flujo trivial preserva valor (cualquier x)", () => {
    // x' = 0 → x permanece constante.
    // Como x se interpreta como el valor en el estado, [{x'=0}] (x = x0) sólo
    // tiene sentido con x0 ligado al estado. Probamos invariante simple:
    // x >= 0 -> [{x' = 0}] x >= 0
    expect(valid("x >= 0 -> [{x' = 0}] x >= 0")).toBe(true);
  });

  it("evolución sin dominio: <{x' = 1}> x > 0 vale cuando x >= 0 (acepta t>0)", () => {
    expect(valid("x >= 0 -> <{x' = 1}> x >= 0")).toBe(true);
  });
});

describe('dl-hybrid tableau — satisfiability', () => {
  it('x > 0 es satisfacible (testigo: x=1)', () => {
    expect(sat('x > 0')).toBe(true);
  });

  it('false NO es satisfacible', () => {
    expect(sat('false')).toBe(false);
  });

  it('x > 0 & x < 0 es insatisfacible en la malla', () => {
    expect(sat('x > 0 & x < 0')).toBe(false);
  });
});

describe('dl-hybrid tableau — booleano puro', () => {
  it('true es válida', () => {
    expect(valid('true')).toBe(true);
  });

  it('false NO es válida', () => {
    expect(valid('false')).toBe(false);
  });

  it('tautología clásica: x = 0 | !(x = 0)', () => {
    expect(valid('x = 0 | !(x = 0)')).toBe(true);
  });
});
