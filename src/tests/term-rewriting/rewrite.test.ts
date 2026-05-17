// ============================================================
// Tests — Reescritura básica + normalización
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  allPositions,
  c,
  f,
  normalize,
  replaceAt,
  rewriteStep,
  subtermAt,
  termEquals,
  v,
} from '../../runtime/term-rewriting';

describe('rewriteStep', () => {
  it('rewriteStep(f(a), [f(x) -> g(x)]) = g(a)', () => {
    const out = rewriteStep(f('f', c('a')), [{ lhs: f('f', v('x')), rhs: f('g', v('x')) }]);
    expect(out).not.toBeNull();
    expect(termEquals(out!, f('g', c('a')))).toBe(true);
  });

  it('rewriteStep devuelve null si no hay redex', () => {
    const out = rewriteStep(c('a'), [{ lhs: f('f', v('x')), rhs: v('x') }]);
    expect(out).toBeNull();
  });

  it('rewriteStep aplica reglas a subtérminos (leftmost-outermost)', () => {
    // 0 + 0  →  0  con regla 0 + x → x
    const t = f('plus', c('0'), c('0'));
    const rules = [{ lhs: f('plus', c('0'), v('x')), rhs: v('x') }];
    const out = rewriteStep(t, rules);
    expect(out).not.toBeNull();
    expect(termEquals(out!, c('0'))).toBe(true);
  });

  it('normalize(f(f(a)), [f(x) -> x]) = a', () => {
    const out = normalize(f('f', f('f', c('a'))), [{ lhs: f('f', v('x')), rhs: v('x') }]);
    expect(termEquals(out, c('a'))).toBe(true);
  });

  it('normalize respeta maxSteps en sistemas no terminantes', () => {
    // f(x) → f(x) loop trivial: la cota debe disparar.
    const out = normalize(c('a'), [{ lhs: c('a'), rhs: f('f', c('a')) }], 5);
    // Después de 5 aplicaciones tenemos f(f(f(f(f(a)))))
    expect(termEquals(out, f('f', f('f', f('f', f('f', f('f', c('a')))))))).toBe(true);
  });
});

describe('positions y replaceAt', () => {
  it('allPositions enumera posiciones', () => {
    const t = f('g', c('a'), f('h', c('b')));
    const positions = allPositions(t);
    // raíz [], [0]=a, [1]=h(b), [1,0]=b
    expect(positions).toHaveLength(4);
  });

  it('subtermAt y replaceAt son inversas para posiciones válidas', () => {
    const t = f('g', c('a'), f('h', c('b')));
    const sub = subtermAt(t, [1, 0]);
    expect(termEquals(sub!, c('b'))).toBe(true);
    const replaced = replaceAt(t, [1, 0], c('z'));
    expect(termEquals(replaced, f('g', c('a'), f('h', c('z'))))).toBe(true);
  });

  it('replaceAt con posición vacía devuelve replacement', () => {
    const out = replaceAt(c('a'), [], c('b'));
    expect(termEquals(out, c('b'))).toBe(true);
  });
});
