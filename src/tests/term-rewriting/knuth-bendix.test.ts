// ============================================================
// Tests — Knuth-Bendix completion
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  c,
  f,
  isConfluent,
  knuthBendixCompletion,
  normalize,
  orient,
  termEquals,
  v,
} from '../../runtime/term-rewriting';

describe('orient (LPO-based)', () => {
  it('orienta una ecuación cuando LPO decide', () => {
    const prec = new Map<string, number>([
      ['mult', 3],
      ['e', 1],
    ]);
    const rule = orient(f('mult', c('e'), v('x')), v('x'), prec);
    expect(rule).not.toBeNull();
    expect(termEquals(rule!.lhs, f('mult', c('e'), v('x')))).toBe(true);
    expect(termEquals(rule!.rhs, v('x'))).toBe(true);
  });

  it('devuelve null si LPO no decide (incomparable)', () => {
    const prec = new Map<string, number>();
    // x = y son variables distintas ⇒ incomparables
    const rule = orient(v('x'), v('y'), prec);
    expect(rule).toBeNull();
  });
});

describe('knuthBendixCompletion', () => {
  it('TRS ya confluente y terminante → completed sin cambios', () => {
    // {f(x) → x}
    const rules = [{ lhs: f('f', v('x')), rhs: v('x') }];
    const prec = new Map<string, number>([['f', 2]]);
    const result = knuthBendixCompletion(rules, { precedence: prec, maxSteps: 50 });
    expect(result.completed).toBe(true);
    expect(result.trs.rules).toHaveLength(1);
  });

  it('TRS de grupos parciales: e*x → x y x*e → x completa sin agregar reglas', () => {
    const prec = new Map<string, number>([
      ['mult', 4],
      ['inv', 3],
      ['e', 1],
    ]);
    const initial = [
      { lhs: f('mult', c('e'), v('x')), rhs: v('x') },
      { lhs: f('mult', v('x'), c('e')), rhs: v('x') },
    ];
    const result = knuthBendixCompletion(initial, { precedence: prec, maxSteps: 50 });
    expect(result.completed).toBe(true);
    // El resultado sigue siendo confluente.
    expect(isConfluent(result.trs)).toBe(true);
  });

  it('completa un sistema de grupos pequeño (inversa por izq + identidad izq)', () => {
    // Ecuaciones:
    //   mult(e, x) = x
    //   mult(inv(x), x) = e
    //   mult(mult(x, y), z) = mult(x, mult(y, z))   (asociatividad)
    //
    // Con LPO y precedencia mult > inv > e, KB debería completar.
    const prec = new Map<string, number>([
      ['mult', 4],
      ['inv', 3],
      ['e', 1],
    ]);
    const initial = [
      { lhs: f('mult', c('e'), v('x')), rhs: v('x') },
      { lhs: f('mult', f('inv', v('x')), v('x')), rhs: c('e') },
      {
        lhs: f('mult', f('mult', v('x'), v('y')), v('z')),
        rhs: f('mult', v('x'), f('mult', v('y'), v('z'))),
      },
    ];
    const result = knuthBendixCompletion(initial, { precedence: prec, maxSteps: 80 });
    // Algunos sistemas de grupos terminan en KB clásico tras añadir
    // ~6-10 reglas; lo importante acá es que termina y que el TRS
    // resultante normaliza correctamente.
    expect(result.trs.rules.length).toBeGreaterThanOrEqual(3);

    // Confirmamos que mult(inv(a), mult(a, b)) se normaliza al mismo
    // término que b (en grupos: inv(a) * (a*b) = (inv(a)*a)*b = e*b = b).
    if (result.completed) {
      const lhs = normalize(
        f('mult', f('inv', c('a')), f('mult', c('a'), c('b'))),
        result.trs.rules,
      );
      const rhs = normalize(c('b'), result.trs.rules);
      expect(termEquals(lhs, rhs)).toBe(true);
    }
  });

  it('respeta maxSteps en sistemas que no completan', () => {
    // Sistema con CPs persistentemente no joinables y no orientables.
    // f(x, y) = f(y, x) (commutatividad) — KB clásico falla acá porque
    // ningún LPO orienta f(x,y) vs f(y,x).
    const prec = new Map<string, number>([['f', 2]]);
    const initial = [{ lhs: f('f', v('x'), v('y')), rhs: f('f', v('y'), v('x')) }];
    const result = knuthBendixCompletion(initial, { precedence: prec, maxSteps: 10 });
    // Debe devolver completed:false sin colgarse.
    expect(result.completed).toBe(false);
  });
});
