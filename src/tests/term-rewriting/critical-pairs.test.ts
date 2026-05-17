// ============================================================
// Tests — Critical pairs + confluencia
// ============================================================

import { describe, expect, it } from 'vitest';
import { allCriticalPairs, c, f, isConfluent, v } from '../../runtime/term-rewriting';

describe('critical pairs', () => {
  it('TRS sin solapes → cero CPs (módulo trivial)', () => {
    // f(a) → b  y  g(a) → c: no se pueden overlappear.
    const rules = [
      { lhs: f('f', c('a')), rhs: c('b') },
      { lhs: f('g', c('a')), rhs: c('c') },
    ];
    const cps = allCriticalPairs(rules);
    expect(cps.length).toBe(0);
  });

  it('TRS confluente trivial: rule única reflexiva', () => {
    // f(x) → x ⇒ confluente (sin overlaps de raíz no triviales).
    const rules = [{ lhs: f('f', v('x')), rhs: v('x') }];
    expect(isConfluent({ rules })).toBe(true);
  });

  it('detecta CP no joinable y reporta no-confluente', () => {
    // Sistema no confluente: f(a) → b, f(a) → c (orientado del mismo LHS
    // pero con RHS distintos). El overlap raíz produce CP (b, c) que
    // no es joinable porque ambos son irreducibles.
    const rules = [
      { lhs: f('f', c('a')), rhs: c('b') },
      { lhs: f('f', c('a')), rhs: c('c') },
    ];
    expect(isConfluent({ rules })).toBe(false);
  });
});
