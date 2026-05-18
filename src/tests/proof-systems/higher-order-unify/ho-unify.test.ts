// ============================================================
// Tests — Higher-order unification (Miller pattern)
// ============================================================
//
// Cubre:
//   - Unificación de primer orden con meta-variables libres
//   - Patrón λx. M x ≈ λx. f x  →  {M: f}
//   - No-patrón: λx. M x x  (var repetida) → null
//   - isPattern / isHigherOrderPattern
//   - applyHOSubst con β-reducción
//   - normalize β
//   - occurs check
//   - rigidez (heads distintas no unifican)
//   - identidad (M ≈ M sin binding → subst vacía)
//   - unifyMetaApp helper
//   - multi-binding compuesto
//   - encadenado: applyHOSubst transitivo

import { describe, it, expect, beforeEach } from 'vitest';
import {
  unifyPattern,
  applyHOSubst,
  normalize,
  isPattern,
  isHigherOrderPattern,
  unifyMetaApp,
  resetFreshCounter,
  type HOTerm,
} from '../../../proof-systems/higher-order-unify';

// ---- Helpers de construcción ----

const v = (name: string): HOTerm => ({ kind: 'var', name });
const m = (name: string): HOTerm => ({ kind: 'meta', name });
const abs = (param: string, body: HOTerm): HOTerm => ({ kind: 'abs', param, body });
const app = (fn: HOTerm, ...args: HOTerm[]): HOTerm => ({ kind: 'app', fn, args });

beforeEach(() => {
  resetFreshCounter();
});

// ===========================================================
// 1. Unificación de primer orden: f(a,b) ≈ f(x,y) → {x:a, y:b}
//    Modelado como: app(f, [M, N]) ≈ app(f, [a, b])
//    donde M y N son meta-variables libres (no aplicadas a nada).
// ===========================================================
describe('unifyPattern — primer orden', () => {
  it('meta libre unifica con término concreto: M ≈ a → {M: a}', () => {
    const result = unifyPattern(m('M'), v('a'));
    expect(result).not.toBeNull();
    expect(result!['M']).toEqual(v('a'));
  });

  it('f(M, N) ≈ f(a, b) → {M: a, N: b}', () => {
    const t1 = app(v('f'), m('M'), m('N'));
    const t2 = app(v('f'), v('a'), v('b'));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    expect(result!['M']).toEqual(v('a'));
    expect(result!['N']).toEqual(v('b'));
  });

  it('meta libre ≈ meta libre del mismo nombre → subst vacía', () => {
    const result = unifyPattern(m('M'), m('M'));
    expect(result).not.toBeNull();
    expect(Object.keys(result!).length).toBe(0);
  });
});

// ===========================================================
// 2. Pattern unification λx. M x ≈ λx. f x
//    El MGU de Miller es M ↦ λx. f x (no simplemente M ↦ f).
//    Ambos son η-equivalentes, pero el algoritmo produce la forma λ.
// ===========================================================
describe('unifyPattern — patrón Miller λx. M x ≈ λx. f x', () => {
  it('unifica correctamente: M ↦ λx. f x (aplicar devuelve f x)', () => {
    // λx. (M x) ≈ λx. (f x)
    const t1 = abs('x', app(m('M'), v('x')));
    const t2 = abs('x', app(v('f'), v('x')));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    // El MGU es M ↦ λx. f x; verificamos aplicando M a un argumento
    const mBinding = result!['M'];
    const applied = applyHOSubst(app(mBinding, v('a')), {});
    // (λx. f x) a → f a
    expect(normalize(applied)).toEqual(app(v('f'), v('a')));
  });

  it('λx. M x ≈ λx. (g x) — aplicar M a a da g a', () => {
    const t1 = abs('x', app(m('M'), v('x')));
    const t2 = abs('x', app(v('g'), v('x')));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    const mBinding = result!['M'];
    expect(normalize(app(mBinding, v('a')))).toEqual(app(v('g'), v('a')));
  });

  it('λx. λy. M x y ≈ λx. λy. h x y — aplicar M a b da h a b', () => {
    // M aplicada a dos vars ligadas distintas; MGU: M ↦ λx.λy. h x y
    const t1 = abs('x', abs('y', app(m('M'), v('x'), v('y'))));
    const t2 = abs('x', abs('y', app(v('h'), v('x'), v('y'))));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    const mBinding = result!['M'];
    // (λx.λy. h x y) a b → h a b
    expect(normalize(app(mBinding, v('a'), v('b')))).toEqual(app(v('h'), v('a'), v('b')));
  });
});

// ===========================================================
// 3. Non-pattern: λx. M x x — variable repetida → null
// ===========================================================
describe('unifyPattern — no-patrón (var repetida)', () => {
  it('λx. M x x no es patrón → unifyPattern devuelve null', () => {
    const t1 = abs('x', app(m('M'), v('x'), v('x')));
    const t2 = abs('x', app(v('f'), v('x'), v('x')));
    // No puede unificar porque M x x es non-pattern
    const result = unifyPattern(t1, t2);
    expect(result).toBeNull();
  });

  it('isPattern detecta λx. M x x como false', () => {
    // En el scope interno {x}, M aplicada a [x, x] → repetida
    const term = abs('x', app(m('M'), v('x'), v('x')));
    expect(isPattern(term)).toBe(false);
  });
});

// ===========================================================
// 4. isPattern — detección correcta
// ===========================================================
describe('isPattern', () => {
  it('variable libre es patrón', () => {
    expect(isPattern(v('a'))).toBe(true);
  });

  it('meta libre es patrón', () => {
    expect(isPattern(m('M'))).toBe(true);
  });

  it('abs con meta sola en body es patrón', () => {
    expect(isPattern(abs('x', m('M')))).toBe(true);
  });

  it('λx. M x es patrón (M aplicada a var ligada única)', () => {
    expect(isPattern(abs('x', app(m('M'), v('x'))))).toBe(true);
  });

  it('λx. M x x NO es patrón (var repetida)', () => {
    expect(isPattern(abs('x', app(m('M'), v('x'), v('x'))))).toBe(false);
  });

  it('M aplicada a variable libre NO es patrón', () => {
    // x es libre (no está en ningún binder)
    expect(isPattern(app(m('M'), v('x')))).toBe(false);
  });

  it('isHigherOrderPattern es alias de isPattern con scope vacío', () => {
    const term = abs('x', app(m('M'), v('x')));
    expect(isHigherOrderPattern(term)).toBe(isPattern(term));
  });
});

// ===========================================================
// 5. applyHOSubst con β-reducción
// ===========================================================
describe('applyHOSubst', () => {
  it('sustituye meta simple', () => {
    const subst = { M: v('a') };
    const result = applyHOSubst(m('M'), subst);
    expect(result).toEqual(v('a'));
  });

  it('sustituye y β-reduce: M aplicada a x con M ↦ λx.x', () => {
    // M ↦ λx.x, aplicar M a 'y' → (λx.x) y → y
    const subst = { M: abs('x', v('x')) };
    const term = app(m('M'), v('y'));
    const result = applyHOSubst(term, subst);
    expect(result).toEqual(v('y'));
  });

  it('sustituye y β-reduce: M ↦ λx.f x, M y → f y', () => {
    const subst = { M: abs('x', app(v('f'), v('x'))) };
    const term = app(m('M'), v('y'));
    const result = applyHOSubst(term, subst);
    // (λx. f x) y → f y
    expect(result).toEqual(app(v('f'), v('y')));
  });

  it('no toca variables ordinarias', () => {
    const subst = { M: v('a') };
    const result = applyHOSubst(v('x'), subst);
    expect(result).toEqual(v('x'));
  });
});

// ===========================================================
// 6. normalize — β-normalización
// ===========================================================
describe('normalize', () => {
  it('variable queda igual', () => {
    expect(normalize(v('x'))).toEqual(v('x'));
  });

  it('(λx.x) a → a', () => {
    const term = app(abs('x', v('x')), v('a'));
    expect(normalize(term)).toEqual(v('a'));
  });

  it('(λx.λy.x) a b → a', () => {
    const term = app(abs('x', abs('y', v('x'))), v('a'), v('b'));
    expect(normalize(term)).toEqual(v('a'));
  });

  it('(λx. f x) a → f a', () => {
    const term = app(abs('x', app(v('f'), v('x'))), v('a'));
    expect(normalize(term)).toEqual(app(v('f'), v('a')));
  });

  it('término sin redex queda igual', () => {
    const term = abs('x', app(v('f'), v('x')));
    expect(normalize(term)).toEqual(term);
  });
});

// ===========================================================
// 7. Occurs check: M ≈ f(M) debe fallar
// ===========================================================
describe('unifyPattern — occurs check', () => {
  it('M ≈ f M falla por occurs check', () => {
    const t1 = m('M');
    const t2 = app(v('f'), m('M'));
    const result = unifyPattern(t1, t2);
    expect(result).toBeNull();
  });
});

// ===========================================================
// 8. Rigid heads distintas no unifican
// ===========================================================
describe('unifyPattern — rigid heads', () => {
  it('f a ≈ g a falla (f ≠ g)', () => {
    const t1 = app(v('f'), v('a'));
    const t2 = app(v('g'), v('a'));
    const result = unifyPattern(t1, t2);
    expect(result).toBeNull();
  });

  it('f a b ≈ f a falla (aridades distintas)', () => {
    const t1 = app(v('f'), v('a'), v('b'));
    const t2 = app(v('f'), v('a'));
    const result = unifyPattern(t1, t2);
    expect(result).toBeNull();
  });
});

// ===========================================================
// 9. unifyMetaApp helper
// ===========================================================
describe('unifyMetaApp', () => {
  it('M [x, y] ↦ λx.λy.body construye el lambda correcto', () => {
    const result = unifyMetaApp('M', ['x', 'y'], app(v('f'), v('x'), v('y')));
    expect(result).not.toBeNull();
    expect(result!['M']).toEqual(abs('x', abs('y', app(v('f'), v('x'), v('y')))));
  });

  it('rechaza si hay vars repetidas', () => {
    const result = unifyMetaApp('M', ['x', 'x'], v('x'));
    expect(result).toBeNull();
  });
});

// ===========================================================
// 10. Sustitución transitiva / encadenada
// ===========================================================
describe('applyHOSubst — sustitución encadenada', () => {
  it('M ↦ N, N ↦ a  → aplicar sobre M da a', () => {
    const subst = { M: m('N'), N: v('a') };
    const result = applyHOSubst(m('M'), subst);
    expect(result).toEqual(v('a'));
  });
});

// ===========================================================
// 11. Unificación con múltiples metas en simultáneo
// ===========================================================
describe('unifyPattern — múltiples metas', () => {
  it('pair(M, N) ≈ pair(a, b) → {M:a, N:b}', () => {
    const t1 = app(v('pair'), m('M'), m('N'));
    const t2 = app(v('pair'), v('a'), v('b'));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    expect(result!['M']).toEqual(v('a'));
    expect(result!['N']).toEqual(v('b'));
  });

  it('λx. pair(M x, N x) ≈ λx. pair(f x, g x) — M a = f a, N a = g a', () => {
    const t1 = abs('x', app(v('pair'), app(m('M'), v('x')), app(m('N'), v('x'))));
    const t2 = abs('x', app(v('pair'), app(v('f'), v('x')), app(v('g'), v('x'))));
    const result = unifyPattern(t1, t2);
    expect(result).not.toBeNull();
    // MGU: M ↦ λx. f x, N ↦ λx. g x
    expect(normalize(app(result!['M'], v('a')))).toEqual(app(v('f'), v('a')));
    expect(normalize(app(result!['N'], v('a')))).toEqual(app(v('g'), v('a')));
  });
});
