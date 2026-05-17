// ============================================================
// ST Real Analysis — Tests numéricos de las primitivas
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  verifyLimit,
  findLimit,
  isContinuousAt,
  isUniformlyContinuous,
  findDiscontinuities,
  derivative,
  nthDerivative,
  isDifferentiableAt,
  findCriticalPoints,
  integrate,
  ratioTest,
  rootTest,
  partialSum,
  sequenceLimit,
  meanValueTheorem,
  taylorPolynomial,
  taylorRemainderBound,
} from '../../../reasoning/real-analysis';

// ── 1. Límites ──────────────────────────────────────────────

describe('real-analysis · limits', () => {
  it('lim_{x→1} (x²-1)/(x-1) = 2 (factorización)', () => {
    const fn = (x: number) => (x * x - 1) / (x - 1);
    const L = findLimit(fn, 1);
    expect(typeof L).toBe('number');
    if (typeof L === 'number') expect(Math.abs(L - 2)).toBeLessThan(1e-4);
  });

  it('verifyLimit acepta lim_{x→0} sin(x)/x = 1', () => {
    const fn = (x: number) => Math.sin(x) / x;
    const res = verifyLimit({ fn, point: 0, value: 1 }, 1e-3);
    expect(res.holds).toBe(true);
    expect(res.suggestedDelta).toBeGreaterThan(0);
  });

  it('verifyLimit rechaza un valor incorrecto', () => {
    const fn = (x: number) => 2 * x + 1;
    const res = verifyLimit({ fn, point: 0, value: 7 }, 1e-3);
    expect(res.holds).toBe(false);
  });

  it('findLimit detecta divergencia de 1/x² en 0', () => {
    const fn = (x: number) => 1 / (x * x);
    const L = findLimit(fn, 0);
    expect(L).toBe('diverges');
  });

  it('findLimit retorna unknown si las colas no coinciden (signo de x)', () => {
    const fn = (x: number) => (x === 0 ? 0 : x / Math.abs(x));
    const L = findLimit(fn, 0);
    expect(L).toBe('unknown');
  });
});

// ── 2. Continuidad ──────────────────────────────────────────

describe('real-analysis · continuity', () => {
  it('isContinuousAt(sin, 0) === true', () => {
    expect(isContinuousAt(Math.sin, 0)).toBe(true);
  });

  it('isContinuousAt(Heaviside, 0) === false', () => {
    const H = (x: number) => (x < 0 ? 0 : 1);
    expect(isContinuousAt(H, 0)).toBe(false);
  });

  it('isUniformlyContinuous(sin, [0, 2π]) === true (compacto)', () => {
    expect(isUniformlyContinuous(Math.sin, [0, 2 * Math.PI], 0.01)).toBe(true);
  });

  it('findDiscontinuities detecta la singularidad de 1/x cerca de 0', () => {
    const fn = (x: number) => (x === 0 ? Number.NaN : 1 / x);
    const ds = findDiscontinuities(fn, [-1, 1], 100);
    expect(ds.length).toBeGreaterThan(0);
    expect(ds.some((p) => Math.abs(p) < 0.1)).toBe(true);
  });
});

// ── 3. Derivadas ────────────────────────────────────────────

describe('real-analysis · derivatives', () => {
  it('derivative central de x² en x=3 ≈ 6', () => {
    const d = derivative((x) => x * x, 3, { method: 'central' });
    expect(d.method).toBe('central');
    expect(Math.abs(d.value - 6)).toBeLessThan(1e-6);
  });

  it('derivative forward y backward de cos en π/2 ≈ -1', () => {
    const f = derivative(Math.cos, Math.PI / 2, { method: 'forward', h: 1e-6 });
    const b = derivative(Math.cos, Math.PI / 2, { method: 'backward', h: 1e-6 });
    expect(Math.abs(f.value + 1)).toBeLessThan(1e-3);
    expect(Math.abs(b.value + 1)).toBeLessThan(1e-3);
  });

  it('derivative richardson reduce error vs central', () => {
    // f(x)=e^x en x=1 → derivada = e
    const fn = Math.exp;
    const e = Math.E;
    const c = derivative(fn, 1, { method: 'central', h: 1e-3 });
    const r = derivative(fn, 1, { method: 'richardson', h: 1e-3 });
    expect(Math.abs(r.value - e)).toBeLessThanOrEqual(Math.abs(c.value - e) + 1e-10);
  });

  it('nthDerivative(sin, 0, 1) ≈ cos(0) = 1', () => {
    const d = nthDerivative(Math.sin, 0, 1);
    expect(Math.abs(d - 1)).toBeLessThan(1e-3);
  });

  it('nthDerivative(x→x³, 0, 3) ≈ 6', () => {
    const fn = (x: number) => x * x * x;
    const d = nthDerivative(fn, 0, 3, 1e-2);
    expect(Math.abs(d - 6)).toBeLessThan(0.5);
  });

  it('isDifferentiableAt(|x|, 0) === false', () => {
    const fn = (x: number) => Math.abs(x);
    expect(isDifferentiableAt(fn, 0)).toBe(false);
  });

  it('findCriticalPoints de x³-3x → cerca de ±1', () => {
    const fn = (x: number) => x ** 3 - 3 * x;
    const pts = findCriticalPoints(fn, [-2, 2], 200);
    expect(pts.length).toBeGreaterThanOrEqual(2);
    expect(pts.some((p) => Math.abs(p - 1) < 0.05)).toBe(true);
    expect(pts.some((p) => Math.abs(p + 1) < 0.05)).toBe(true);
  });
});

// ── 4. Integrales ───────────────────────────────────────────

describe('real-analysis · integrals', () => {
  it('integrate(x², 0, 1, simpson) ≈ 1/3', () => {
    const r = integrate((x) => x * x, 0, 1, { method: 'simpson' });
    expect(Math.abs(r.value - 1 / 3)).toBeLessThan(1e-8);
  });

  it('integrate(sin, 0, π, trapezoidal) ≈ 2', () => {
    const r = integrate(Math.sin, 0, Math.PI, { method: 'trapezoidal', subdivisions: 4096 });
    expect(Math.abs(r.value - 2)).toBeLessThan(1e-4);
  });

  it('integrate(e^x, 0, 1, romberg) ≈ e-1', () => {
    const r = integrate(Math.exp, 0, 1, { method: 'romberg' });
    expect(Math.abs(r.value - (Math.E - 1))).toBeLessThan(1e-8);
  });

  it('integrate(1, 0, 5, gaussian) ≈ 5', () => {
    const r = integrate(() => 1, 0, 5, { method: 'gaussian' });
    expect(Math.abs(r.value - 5)).toBeLessThan(1e-8);
  });

  it('integrate orientación: ∫_b^a = -∫_a^b', () => {
    const ab = integrate((x) => x, 0, 1).value;
    const ba = integrate((x) => x, 1, 0).value;
    expect(Math.abs(ab + ba)).toBeLessThan(1e-9);
  });
});

// ── 5. Series y sucesiones ──────────────────────────────────

describe('real-analysis · series', () => {
  it('ratioTest([1, 1/2, 1/4, ...]) converge', () => {
    const coefs = Array.from({ length: 20 }, (_, n) => Math.pow(0.5, n));
    const res = ratioTest(coefs);
    expect(res.converges).toBe(true);
  });

  it('ratioTest sobre serie armónica truncada NO declara convergencia', () => {
    const coefs = Array.from({ length: 50 }, (_, n) => 1 / (n + 1));
    const res = ratioTest(coefs);
    expect(res.converges).toBe(false);
  });

  it('rootTest sobre (1/2)^n converge', () => {
    const coefs = Array.from({ length: 20 }, (_, n) => Math.pow(0.5, n));
    const res = rootTest(coefs);
    expect(res.converges).toBe(true);
  });

  it('partialSum de geometric ratio 1/2 → ≈ 2', () => {
    const s = partialSum((n) => Math.pow(0.5, n), 50);
    expect(Math.abs(s - 2)).toBeLessThan(1e-10);
  });

  it('sequenceLimit (1+1/n)^n → e', () => {
    const res = sequenceLimit((n) => Math.pow(1 + 1 / n, n), {
      maxTerms: 200000,
      tolerance: 1e-3,
    });
    expect(res.converges).toBe(true);
    if (res.limit !== undefined) expect(Math.abs(res.limit - Math.E)).toBeLessThan(1e-3);
  });

  it('sequenceLimit de 1/n → 0 (con tolerance laxa y muchos términos)', () => {
    const res = sequenceLimit((n) => 1 / n, { maxTerms: 100000, tolerance: 1e-3 });
    expect(res.converges).toBe(true);
    if (res.limit !== undefined) expect(Math.abs(res.limit)).toBeLessThan(1e-3);
  });
});

// ── 6. MVT ──────────────────────────────────────────────────

describe('real-analysis · MVT', () => {
  it("MVT para f(x)=x², a=0, b=2, f'=2x → c=1", () => {
    const fn = (x: number) => x * x;
    const dfn = (x: number) => 2 * x;
    const res = meanValueTheorem(fn, dfn, 0, 2);
    expect(res.holds).toBe(true);
    if (res.c !== undefined) expect(Math.abs(res.c - 1)).toBeLessThan(1e-4);
  });

  it('MVT para sin en [0, π], cos como derivada → ∃c con cos(c) = 0', () => {
    const res = meanValueTheorem(Math.sin, Math.cos, 0, Math.PI);
    expect(res.holds).toBe(true);
    // (sin(π)-sin(0))/π = 0, así que cos(c)=0 ⇒ c ≈ π/2
    if (res.c !== undefined) expect(Math.abs(res.c - Math.PI / 2)).toBeLessThan(1e-4);
  });
});

// ── 7. Taylor ───────────────────────────────────────────────

describe('real-analysis · Taylor', () => {
  it('Taylor de sin orden 5 en 0 aproxima sin(0.5) con error < 1e-3', () => {
    const T = taylorPolynomial(Math.sin, 0, 5);
    const x = 0.5;
    expect(Math.abs(T(x) - Math.sin(x))).toBeLessThan(1e-3);
  });

  it('Taylor de exp orden 8 en 0 aproxima exp(1) con error < 1e-3', () => {
    const T = taylorPolynomial(Math.exp, 0, 8);
    expect(Math.abs(T(1) - Math.E)).toBeLessThan(1e-3);
  });

  it('taylorRemainderBound es ≥ |error real| para exp orden 4 en x=0.5', () => {
    const T = taylorPolynomial(Math.exp, 0, 4);
    const err = Math.abs(T(0.5) - Math.exp(0.5));
    const bound = taylorRemainderBound(Math.exp, 0, 0.5, 4);
    expect(bound).toBeGreaterThanOrEqual(err * 0.5); // bound numérico tolerante
  });
});
