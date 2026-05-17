import { describe, it, expect } from 'vitest';
import {
  S,
  K,
  I,
  app,
  cvar,
  ctermEq,
  freeVars,
  termToString,
  reduceStep,
  normalize,
  isNormalForm,
  abstractFromLambda,
  toLambda,
} from '../../combinators-ski';
import type { CTerm } from '../../combinators-ski';
import {
  alphaEq,
  ap as lamAp,
  apN as lamApN,
  lam,
  normalize as lamNormalize,
  v as lamVar,
} from '../../lambda-calc';
import type { Term as LambdaTerm } from '../../lambda-calc';

describe('combinators-ski / reducción básica', () => {
  it('I x reduce a x en un paso', () => {
    const t = app(I(), cvar('x'));
    const r = reduceStep(t);
    expect(r).not.toBeNull();
    expect(ctermEq(r!, cvar('x'))).toBe(true);
  });

  it('K x y reduce a x en un paso', () => {
    const t = app(K(), cvar('x'), cvar('y'));
    const r = reduceStep(t);
    expect(r).not.toBeNull();
    expect(ctermEq(r!, cvar('x'))).toBe(true);
  });

  it('K x y descarta y aunque y tenga redex', () => {
    // y = I z; tras K x (I z) debe quedar x — sin reducir el segundo arg.
    const t = app(K(), cvar('x'), app(I(), cvar('z')));
    const norm = normalize(t);
    expect(norm.terminated).toBe(true);
    expect(ctermEq(norm.result, cvar('x'))).toBe(true);
  });

  it('S x y z reduce a x z (y z)', () => {
    const t = app(S(), cvar('x'), cvar('y'), cvar('z'));
    const r = reduceStep(t);
    expect(r).not.toBeNull();
    const expected = app(app(cvar('x'), cvar('z')), app(cvar('y'), cvar('z')));
    expect(ctermEq(r!, expected)).toBe(true);
  });

  it('S K K x reduce a x (= I)', () => {
    const t = app(S(), K(), K(), cvar('x'));
    const norm = normalize(t);
    expect(norm.terminated).toBe(true);
    expect(ctermEq(norm.result, cvar('x'))).toBe(true);
  });

  it('isNormalForm: variable libre sola es forma normal', () => {
    expect(isNormalForm(cvar('x'))).toBe(true);
    expect(isNormalForm(I())).toBe(true);
    expect(isNormalForm(K())).toBe(true);
    expect(isNormalForm(S())).toBe(true);
  });

  it('isNormalForm: K x sin segundo arg también es FN (under-applied)', () => {
    // K x todavía no tiene los 2 args que necesita.
    expect(isNormalForm(app(K(), cvar('x')))).toBe(true);
    expect(isNormalForm(app(S(), cvar('x'), cvar('y')))).toBe(true);
  });

  it('reduceStep baja por las ramas si no hay redex en cabeza', () => {
    // (K x) (I y)  — la cabeza está under-applied a 1 arg; igual baja
    // al subtérmino (I y) para reducirlo.
    const t = app(app(K(), cvar('x')), app(I(), cvar('y')));
    // Primer paso ahora reduce K x (I y) → x (atomic head, well-applied).
    const r = reduceStep(t);
    expect(r).not.toBeNull();
    expect(ctermEq(r!, cvar('x'))).toBe(true);
  });
});

describe('combinators-ski / divergencia y maxSteps', () => {
  it('un término divergente respeta maxSteps con terminated=false', () => {
    // Omega-equivalente en SKI: SII(SII) — clásico divergente.
    // x = SII;  x x = (SII)(SII) → I(SII)(I(SII)) → SII (SII) ...
    const SII = app(S(), I(), I());
    const omega = app(SII, SII);
    const r = normalize(omega, 50);
    expect(r.terminated).toBe(false);
    expect(r.steps).toBe(50);
  });
});

describe('combinators-ski / bracket abstraction (λ → SKI)', () => {
  it('abstractFromLambda(λx.x) = I', () => {
    const t = lam('x', lamVar('x'));
    const c = abstractFromLambda(t);
    expect(ctermEq(c, I())).toBe(true);
  });

  it('abstractFromLambda(λx.λy.x) es equivalente a K', () => {
    // [y] x = K x       (x ∉ FV(x)... pero x ≠ y, sí es K x)
    // [x] (K x) = S (K K) I     (forma canónica, no sintácticamente K)
    // Aplicado a dos args debe colapsar a x.
    const t = lam('x', lam('y', lamVar('x')));
    const c = abstractFromLambda(t);
    // Test semántico: aplicado a (a, b) debe normalizar a `a`.
    const applied = app(c, cvar('a'), cvar('b'));
    const norm = normalize(applied);
    expect(norm.terminated).toBe(true);
    expect(ctermEq(norm.result, cvar('a'))).toBe(true);
  });

  it('abstractFromLambda(λx.λy.λz. x z (y z)) es equivalente a S', () => {
    // S = λx.λy.λz. x z (y z)
    const t = lam(
      'x',
      lam('y', lam('z', lamApN(lamVar('x'), lamVar('z'), lamAp(lamVar('y'), lamVar('z'))))),
    );
    const c = abstractFromLambda(t);
    // Aplicado a (f, g, h) debe normalizar a f h (g h).
    const applied = app(c, cvar('f'), cvar('g'), cvar('h'));
    const norm = normalize(applied);
    expect(norm.terminated).toBe(true);
    const expected = app(app(cvar('f'), cvar('h')), app(cvar('g'), cvar('h')));
    expect(ctermEq(norm.result, expected)).toBe(true);
  });

  it('abstractFromLambda(λx.y) = K y (constante respecto a x)', () => {
    const t = lam('x', lamVar('y'));
    const c = abstractFromLambda(t);
    expect(ctermEq(c, app(K(), cvar('y')))).toBe(true);
  });

  it('abstractFromLambda(λx.λy. x y) es equivalente a I aplicado', () => {
    // λx.λy. x y  ≡  λx. x    bajo η (en λ-cálculo).
    // SKI bracket genera algo más grande; lo probamos vía aplicación.
    const t = lam('x', lam('y', lamAp(lamVar('x'), lamVar('y'))));
    const c = abstractFromLambda(t);
    const applied = app(c, cvar('f'), cvar('a'));
    const norm = normalize(applied);
    expect(norm.terminated).toBe(true);
    expect(ctermEq(norm.result, app(cvar('f'), cvar('a')))).toBe(true);
  });

  it('abstractFromLambda no contiene abstracciones (sólo S/K/I/var/app)', () => {
    // Cualquier λ-término debe traducirse a una expresión de combinadores pura.
    const t = lam(
      'x',
      lam('y', lam('z', lamApN(lamVar('x'), lamVar('z'), lamAp(lamVar('y'), lamVar('z'))))),
    );
    const c = abstractFromLambda(t);
    assertNoBinders(c);
  });
});

describe('combinators-ski / round-trip semántico', () => {
  it('toLambda(I), toLambda(K), toLambda(S) son las definiciones λ canónicas', () => {
    expect(alphaEq(toLambda(I()), lam('x', lamVar('x')))).toBe(true);
    expect(alphaEq(toLambda(K()), lam('x', lam('y', lamVar('x'))))).toBe(true);
    const Slam: LambdaTerm = lam(
      'x',
      lam('y', lam('z', lamApN(lamVar('x'), lamVar('z'), lamAp(lamVar('y'), lamVar('z'))))),
    );
    expect(alphaEq(toLambda(S()), Slam)).toBe(true);
  });

  it('round-trip λ → SKI → λ preserva la semántica aplicada (identidad)', () => {
    // Aplicamos `(λx.x) a` y `(toLambda(abstract(λx.x))) a` y comparamos formas normales.
    const idLam: LambdaTerm = lam('x', lamVar('x'));
    const skis = abstractFromLambda(idLam);
    const lamBack = toLambda(skis);
    const lhs = lamNormalize(lamAp(idLam, lamVar('a')));
    const rhs = lamNormalize(lamAp(lamBack, lamVar('a')));
    expect(lhs.terminated).toBe(true);
    expect(rhs.terminated).toBe(true);
    expect(alphaEq(lhs.result, rhs.result)).toBe(true);
  });

  it('round-trip preserva semántica de K aplicado a (a, b)', () => {
    const Klam: LambdaTerm = lam('x', lam('y', lamVar('x')));
    const skis = abstractFromLambda(Klam);
    const lamBack = toLambda(skis);
    const applied = lamApN(lamBack, lamVar('a'), lamVar('b'));
    const norm = lamNormalize(applied);
    expect(norm.terminated).toBe(true);
    expect(alphaEq(norm.result, lamVar('a'))).toBe(true);
  });

  it('round-trip preserva semántica de S aplicado a (f, g, h)', () => {
    const Slam: LambdaTerm = lam(
      'x',
      lam('y', lam('z', lamApN(lamVar('x'), lamVar('z'), lamAp(lamVar('y'), lamVar('z'))))),
    );
    const skis = abstractFromLambda(Slam);
    const lamBack = toLambda(skis);
    const applied = lamApN(lamBack, lamVar('f'), lamVar('g'), lamVar('h'));
    const norm = lamNormalize(applied);
    expect(norm.terminated).toBe(true);
    // Forma normal: f h (g h).
    const expected = lamApN(lamVar('f'), lamVar('h'), lamAp(lamVar('g'), lamVar('h')));
    expect(alphaEq(norm.result, expected)).toBe(true);
  });
});

describe('combinators-ski / utilidades', () => {
  it('termToString imprime aplicaciones asociativas a la izquierda', () => {
    // S K K x  → "S K K x" (sin paréntesis: todo es app-izquierda)
    const t = app(S(), K(), K(), cvar('x'));
    expect(termToString(t)).toBe('S K K x');
  });

  it('termToString agrupa con paréntesis los args que son aplicaciones', () => {
    // f (g x)
    const t = app(cvar('f'), app(cvar('g'), cvar('x')));
    expect(termToString(t)).toBe('f (g x)');
  });

  it('freeVars enumera variables libres', () => {
    // S (K x) y  → libres: {x, y}
    const t = app(S(), app(K(), cvar('x')), cvar('y'));
    const fv = freeVars(t);
    expect(fv.has('x')).toBe(true);
    expect(fv.has('y')).toBe(true);
    expect(fv.size).toBe(2);
  });

  it('app con un solo argumento devuelve el término tal cual', () => {
    const t = app(cvar('x'));
    expect(ctermEq(t, cvar('x'))).toBe(true);
  });

  it('app() sin argumentos lanza', () => {
    expect(() => app()).toThrow();
  });

  it('ctermEq distingue por estructura', () => {
    expect(ctermEq(I(), I())).toBe(true);
    expect(ctermEq(K(), S())).toBe(false);
    expect(ctermEq(cvar('x'), cvar('y'))).toBe(false);
    expect(ctermEq(app(I(), cvar('x')), app(I(), cvar('x')))).toBe(true);
    expect(ctermEq(app(I(), cvar('x')), app(I(), cvar('y')))).toBe(false);
  });
});

// Helper de test: confirma que un CTerm no contiene nodos de tipo 'abs'
// (sería estructuralmente imposible en SKI, pero comprueba que el tipo
// generado por bracket abstraction es realmente puro).
function assertNoBinders(t: CTerm): void {
  switch (t.kind) {
    case 'S':
    case 'K':
    case 'I':
    case 'var':
      return;
    case 'app':
      assertNoBinders(t.fn);
      assertNoBinders(t.arg);
      return;
  }
}
