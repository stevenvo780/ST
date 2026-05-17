import { describe, it, expect } from 'vitest';
import {
  I,
  K,
  S,
  Y,
  alphaEq,
  alphaRename,
  ap,
  apN,
  betaStep,
  churchAdd,
  churchMul,
  churchNumeral,
  churchSucc,
  decodeChurch,
  etaStep,
  evalChurch,
  freeVars,
  isNormalForm,
  isWeakHeadNormalForm,
  lam,
  makeFreshSupply,
  normalize,
  omega,
  substitute,
  termToString,
  v,
} from '../../../type-theory/lambda-calc';

describe('lambda-calc / sustitución y α', () => {
  it('freeVars enumera variables libres respetando binders', () => {
    // λx. x y   → libres = {y}
    const t = lam('x', ap(v('x'), v('y')));
    expect(Array.from(freeVars(t))).toEqual(['y']);
  });

  it('substitute capture-avoiding: (λy. x)[x := y] → λy#0. y', () => {
    // El binder `y` choca con la `y` libre del valor sustituido; se debe renombrar.
    const t = lam('y', v('x'));
    const r = substitute(t, 'x', v('y'));
    expect(r.kind).toBe('abs');
    if (r.kind === 'abs') {
      expect(r.param).not.toBe('y');
      // El cuerpo es exactamente la `y` libre original.
      expect(r.body).toEqual(v('y'));
    }
  });

  it('betaStep: (λx.x) y → y', () => {
    const t = ap(I, v('y'));
    const r = betaStep(t);
    expect(r).toEqual(v('y'));
  });

  it('betaStep capture avoidance: (λx.λy.x) y → λz.y (z fresh)', () => {
    // (λx.λy.x) y debe renombrar el binder interno para no capturar.
    const t = ap(lam('x', lam('y', v('x'))), v('y'));
    const r = betaStep(t);
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.kind).toBe('abs');
    if (r.kind === 'abs') {
      // El binder fue renombrado → ya no se llama 'y'.
      expect(r.param).not.toBe('y');
      // Y el cuerpo es la `y` libre, no la antigua ligada.
      expect(r.body).toEqual(v('y'));
    }
    // α-equivalente a λz.y.
    expect(alphaEq(r, lam('z', v('y')))).toBe(true);
  });
});

describe('lambda-calc / β-reducción y estrategias', () => {
  it('normalize(SKK) →* I (módulo α)', () => {
    const term = apN(S, K, K);
    const { result, terminated } = normalize(term);
    expect(terminated).toBe(true);
    // SKK es la implementación clásica de I.
    expect(alphaEq(result, I)).toBe(true);
  });

  it('normalize(omega) no termina: maxSteps agotado y terminated=false', () => {
    const { steps, terminated } = normalize(omega, { maxSteps: 100 });
    expect(terminated).toBe(false);
    expect(steps).toBe(100);
  });

  it('cbn termina en weak-head normal form, no entra bajo λ', () => {
    // λz. (λx.x) z  — bajo cbn es ya WHNF (no reduce bajo lambda).
    const t = lam('z', ap(I, v('z')));
    const { result, terminated } = normalize(t, { strategy: 'cbn', maxSteps: 50 });
    expect(terminated).toBe(true);
    expect(isWeakHeadNormalForm(result)).toBe(true);
    // No se reduce: el redex interno queda intacto.
    expect(result.kind).toBe('abs');
    if (result.kind === 'abs') {
      expect(result.body.kind).toBe('app');
    }
  });

  it('cbv reduce argumentos antes de aplicar — (λx.y) ((λw.w) z) →* y', () => {
    // El argumento se reduce primero pero al final el lambda lo descarta.
    const t = ap(lam('x', v('y')), ap(I, v('z')));
    const { result, terminated } = normalize(t, { strategy: 'cbv', maxSteps: 50 });
    expect(terminated).toBe(true);
    expect(result).toEqual(v('y'));
  });

  it('leftmost-innermost vs outermost: ambos preservan ((λx.x) y) → y en este caso', () => {
    const t = ap(I, v('y'));
    expect(betaStep(t, 'leftmost-outermost')).toEqual(v('y'));
    expect(betaStep(t, 'leftmost-innermost')).toEqual(v('y'));
  });

  it('isNormalForm distingue normal de redex', () => {
    expect(isNormalForm(v('x'))).toBe(true);
    expect(isNormalForm(I)).toBe(true);
    expect(isNormalForm(ap(I, v('y')))).toBe(false);
  });

  it('isWeakHeadNormalForm: λ y aplicación var-headed son WHNF; redex no', () => {
    expect(isWeakHeadNormalForm(I)).toBe(true);
    expect(isWeakHeadNormalForm(ap(v('f'), v('y')))).toBe(true);
    expect(isWeakHeadNormalForm(ap(I, v('y')))).toBe(false);
  });
});

describe('lambda-calc / η-reducción', () => {
  it('etaStep: (λx. f x) → f cuando x ∉ FV(f)', () => {
    const t = lam('x', ap(v('f'), v('x')));
    expect(etaStep(t)).toEqual(v('f'));
  });

  it('etaStep NO aplica cuando x ∈ FV(f): (λx. x x) se queda igual', () => {
    const t = lam('x', ap(v('x'), v('x')));
    expect(etaStep(t)).toBeNull();
  });
});

describe('lambda-calc / Church numerals', () => {
  it('churchNumeral(0..3) son normalmente decodificables', () => {
    for (let n = 0; n <= 3; n += 1) {
      expect(decodeChurch(churchNumeral(n))).toBe(n);
    }
  });

  it('SUCC: succ(2̄) →* 3̄', () => {
    const term = ap(churchSucc, churchNumeral(2));
    expect(evalChurch(term)).toBe(3);
  });

  it('ADD: 2 + 3 →* 5', () => {
    const term = apN(churchAdd, churchNumeral(2), churchNumeral(3));
    expect(evalChurch(term)).toBe(5);
  });

  it('MUL: 3 * 4 →* 12', () => {
    const term = apN(churchMul, churchNumeral(3), churchNumeral(4));
    expect(evalChurch(term)).toBe(12);
  });

  it('decodeChurch devuelve null para términos que no son numerales', () => {
    // y libre, no es Church numeral.
    expect(decodeChurch(v('y'))).toBeNull();
    // Función pero no tiene la forma λf.λx. f^n x.
    expect(decodeChurch(lam('f', v('x')))).toBeNull();
  });
});

describe('lambda-calc / utilidades', () => {
  it('alphaEq detecta equivalencia y rechaza diferencias estructurales', () => {
    expect(alphaEq(lam('x', v('x')), lam('y', v('y')))).toBe(true);
    expect(alphaEq(lam('x', v('x')), lam('x', v('y')))).toBe(false);
    // Variables libres con nombres distintos NO son α-equivalentes.
    expect(alphaEq(v('x'), v('y'))).toBe(false);
  });

  it('alphaRename produce términos α-equivalentes al original', () => {
    const t = lam('x', lam('y', ap(v('x'), v('y'))));
    const supply = makeFreshSupply();
    const renamed = alphaRename(t, supply);
    expect(alphaEq(t, renamed)).toBe(true);
    // Y los binders quedaron con los nombres frescos.
    if (renamed.kind === 'abs') {
      expect(renamed.param).toMatch(/^_x\d+$/);
    }
  });

  it('termToString produce algo legible para combinadores', () => {
    expect(termToString(I)).toBe('(λx.x)');
    expect(termToString(ap(I, v('y')))).toBe('((λx.x) y)');
  });

  it('Y-combinator es un punto fijo: Y f →* f (Y f)  (1 paso de unfolding bajo cbn)', () => {
    // Bajo cbn, Y f hace UN paso β y revela la forma f ((λx.f(xx))(λx.f(xx))).
    const term = ap(Y, v('f'));
    const next = betaStep(term);
    expect(next).not.toBeNull();
    if (next === null) return;
    // El primer paso debe producir (λx. f (x x)) (λx. f (x x)).
    expect(next.kind).toBe('app');
    if (next.kind === 'app') {
      // La cabeza es λx. f (x x).
      expect(next.fn.kind).toBe('abs');
    }
  });
});
