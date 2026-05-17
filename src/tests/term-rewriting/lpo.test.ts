// ============================================================
// Tests — Lexicographic Path Order
// ============================================================

import { describe, expect, it } from 'vitest';
import { c, f, lpo, lpoCompare, v } from '../../runtime/term-rewriting';

describe('LPO', () => {
  it('f > g implica f(x) >LPO g(x)', () => {
    const prec = new Map([
      ['f', 2],
      ['g', 1],
    ]);
    expect(lpo(f('f', v('x')), f('g', v('x')), prec)).toBe(1);
    expect(lpo(f('g', v('x')), f('f', v('x')), prec)).toBe(-1);
  });

  it('LPO reconoce igualdad estructural', () => {
    const prec = new Map<string, number>();
    const cmp = lpoCompare(f('f', v('x')), f('f', v('x')), prec);
    expect(cmp).toBe('eq');
  });

  it('subterm rule: f(g(a)) >LPO g(a)', () => {
    // El argumento de un símbolo domina al término entero, por LPO1.
    const prec = new Map([
      ['f', 1],
      ['g', 2],
    ]);
    // f(g(a)) >LPO g(a): por LPO1, sᵢ = g(a) ≥LPO g(a) ⇒ sí.
    expect(lpo(f('f', f('g', c('a'))), f('g', c('a')), prec)).toBe(1);
  });

  it('LPO compara lexicográficamente argumentos con mismo símbolo', () => {
    const prec = new Map([
      ['f', 1],
      ['a', 2],
      ['b', 1],
    ]);
    // f(a, b) vs f(b, b): primer arg a > b por precedencia, además f(a,b) >LPO b
    expect(lpo(f('f', c('a'), c('b')), f('f', c('b'), c('b')), prec)).toBe(1);
  });

  it('variables distintas son incomparables', () => {
    const prec = new Map<string, number>();
    expect(lpoCompare(v('x'), v('y'), prec)).toBe('inc');
  });

  it('orientación clásica de grupos: e*x → x (lhs > rhs por LPO)', () => {
    // Precedencia: mult > inv > e (constantes simples más bajas).
    const prec = new Map<string, number>([
      ['mult', 3],
      ['inv', 2],
      ['e', 1],
    ]);
    const lhs = f('mult', c('e'), v('x'));
    const rhs = v('x');
    // mult(e, x) >LPO x: LPO1 con sᵢ = x ⇒ x ≥LPO x ⇒ sí.
    expect(lpo(lhs, rhs, prec)).toBe(1);
  });
});
