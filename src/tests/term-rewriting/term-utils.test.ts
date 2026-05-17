// ============================================================
// Tests — Utilidades de términos (match, unify, subst)
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  applySubst,
  c,
  f,
  match,
  occursIn,
  termEquals,
  termSize,
  unify,
  v,
  varsOf,
} from '../../runtime/term-rewriting';

describe('term-utils', () => {
  it('termEquals reconoce términos estructuralmente iguales', () => {
    expect(termEquals(f('g', v('x'), c('a')), f('g', v('x'), c('a')))).toBe(true);
    expect(termEquals(f('g', v('x')), f('g', v('y')))).toBe(false);
    expect(termEquals(c('a'), c('b'))).toBe(false);
  });

  it('match: pattern f(x) contra f(a) liga x ↦ a', () => {
    const subst = match(f('f', v('x')), f('f', c('a')));
    expect(subst).not.toBeNull();
    expect(termEquals(subst!.get('x')!, c('a'))).toBe(true);
  });

  it('match: variable repetida exige consistencia', () => {
    // f(x, x) NO matchea f(a, b)
    const fail = match(f('f', v('x'), v('x')), f('f', c('a'), c('b')));
    expect(fail).toBeNull();
    // f(x, x) sí matchea f(a, a)
    const ok = match(f('f', v('x'), v('x')), f('f', c('a'), c('a')));
    expect(ok).not.toBeNull();
    expect(termEquals(ok!.get('x')!, c('a'))).toBe(true);
  });

  it('unify: variables disjuntas se unifican', () => {
    const u = unify(f('f', v('x'), c('a')), f('f', c('b'), v('y')));
    expect(u).not.toBeNull();
    expect(termEquals(applySubst(v('x'), u!), c('b'))).toBe(true);
    expect(termEquals(applySubst(v('y'), u!), c('a'))).toBe(true);
  });

  it('unify: occurs check rechaza x con f(x)', () => {
    const u = unify(v('x'), f('f', v('x')));
    expect(u).toBeNull();
  });

  it('applySubst sustituye recursivamente', () => {
    const subst = new Map([['x', c('a')]]);
    const out = applySubst(f('g', v('x'), f('h', v('x'))), subst);
    expect(termEquals(out, f('g', c('a'), f('h', c('a'))))).toBe(true);
  });

  it('occursIn detecta variables', () => {
    expect(occursIn('x', f('f', v('x')))).toBe(true);
    expect(occursIn('y', f('f', v('x')))).toBe(false);
  });

  it('varsOf colecta nombres de variables', () => {
    const vs = varsOf(f('g', v('x'), f('h', v('y'), v('x'))));
    expect(vs).toEqual(new Set(['x', 'y']));
  });

  it('termSize cuenta nodos', () => {
    expect(termSize(c('a'))).toBe(1);
    expect(termSize(v('x'))).toBe(1);
    expect(termSize(f('f', v('x'), v('y')))).toBe(3);
    expect(termSize(f('g', f('h', c('a'))))).toBe(3);
  });
});
