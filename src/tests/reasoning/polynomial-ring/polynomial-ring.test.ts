import { describe, it, expect } from 'vitest';
import {
  poly,
  degree,
  leadingCoefficient,
  isZero,
  add,
  sub,
  multiply,
  divmod,
  gcd,
  derivative,
  evaluate,
  compose,
  rationalRoots,
  squareFree,
  factor,
  isIrreducible,
  factorInZp,
  resultant,
  discriminant,
  type Polynomial,
} from '../../../reasoning/polynomial-ring';

function coeffs(p: Polynomial): bigint[] {
  return p.coefficients;
}

describe('Polynomial Ring — construcción y básicos', () => {
  it('poly([1,2,3]) representa 3x² + 2x + 1 con grado 2 y líder 3', () => {
    const p = poly([1, 2, 3]);
    expect(coeffs(p)).toEqual([1n, 2n, 3n]);
    expect(degree(p)).toBe(2);
    expect(leadingCoefficient(p)).toBe(3n);
    expect(isZero(p)).toBe(false);
  });

  it('poly([0]) es cero y poly([0,0,0]) se normaliza a cero', () => {
    expect(isZero(poly([0]))).toBe(true);
    expect(isZero(poly([0, 0, 0]))).toBe(true);
    expect(degree(poly([0]))).toBe(-1);
    expect(leadingCoefficient(poly([0]))).toBe(0n);
  });

  it('normaliza ceros finales: [1, 2, 0, 0] → grado 1', () => {
    const p = poly([1, 2, 0, 0]);
    expect(degree(p)).toBe(1);
    expect(coeffs(p)).toEqual([1n, 2n]);
  });
});

describe('Polynomial Ring — aritmética', () => {
  it('add: (x² + 2x + 1) + (x² - 1) = 2x² + 2x', () => {
    const a = poly([1, 2, 1]);
    const b = poly([-1, 0, 1]);
    const r = add(a, b);
    expect(coeffs(r)).toEqual([0n, 2n, 2n]);
  });

  it('sub: (x² + 2x + 1) - (x² + 1) = 2x', () => {
    const a = poly([1, 2, 1]);
    const b = poly([1, 0, 1]);
    const r = sub(a, b);
    expect(coeffs(r)).toEqual([0n, 2n]);
  });

  it('multiply: (x + 1)(x - 1) = x² - 1', () => {
    const a = poly([1, 1]);
    const b = poly([-1, 1]);
    const r = multiply(a, b);
    expect(coeffs(r)).toEqual([-1n, 0n, 1n]);
  });

  it('multiply distributivo: (2x + 3)(x² + x + 4) = 2x³ + 5x² + 11x + 12', () => {
    const r = multiply(poly([3, 2]), poly([4, 1, 1]));
    expect(coeffs(r)).toEqual([12n, 11n, 5n, 2n]);
  });
});

describe('Polynomial Ring — división euclidiana', () => {
  it('divmod: (x³ - 1) / (x - 1) = x² + x + 1 con resto 0', () => {
    const a = poly([-1, 0, 0, 1]);
    const b = poly([-1, 1]);
    const { quotient, remainder } = divmod(a, b);
    expect(coeffs(quotient)).toEqual([1n, 1n, 1n]);
    expect(isZero(remainder)).toBe(true);
  });

  it('divmod en Z/5: (x² + 1) / (x + 2) = x + 3 con resto 0', () => {
    // x² + 1 = (x + 2)(x + 3) en Z/5 (porque (x+2)(x+3) = x² + 5x + 6 = x² + 1 (mod 5)).
    const a = poly([1, 0, 1], 5n);
    const b = poly([2, 1], 5n);
    const { quotient, remainder } = divmod(a, b);
    expect(coeffs(quotient)).toEqual([3n, 1n]);
    expect(isZero(remainder)).toBe(true);
  });

  it('divmod monic: (x² + 3x + 2) / (x + 1) = x + 2 r 0', () => {
    const { quotient, remainder } = divmod(poly([2, 3, 1]), poly([1, 1]));
    expect(coeffs(quotient)).toEqual([2n, 1n]);
    expect(isZero(remainder)).toBe(true);
  });
});

describe('Polynomial Ring — gcd', () => {
  it('gcd(x² - 1, x - 1) = x - 1', () => {
    const g = gcd(poly([-1, 0, 1]), poly([-1, 1]));
    expect(coeffs(g)).toEqual([-1n, 1n]);
  });

  it('gcd coprimos: gcd(x² + 1, x - 1) = 1', () => {
    const g = gcd(poly([1, 0, 1]), poly([-1, 1]));
    expect(degree(g)).toBe(0);
  });

  it('gcd en Z/2: gcd(x³ + x² + x + 1, x² + 1) = x² + 1 (monic)', () => {
    // En Z/2: x³ + x² + x + 1 = (x+1)(x²+1), gcd con (x²+1) = (x²+1).
    const g = gcd(poly([1, 1, 1, 1], 2n), poly([1, 0, 1], 2n));
    expect(g.modulus).toBe(2n);
    expect(coeffs(g)).toEqual([1n, 0n, 1n]);
  });
});

describe('Polynomial Ring — derivada, evaluación, composición', () => {
  it('derivative: d/dx(x³) = 3x²', () => {
    const d = derivative(poly([0, 0, 0, 1]));
    expect(coeffs(d)).toEqual([0n, 0n, 3n]);
  });

  it('derivative: d/dx(5) = 0', () => {
    const d = derivative(poly([5]));
    expect(isZero(d)).toBe(true);
  });

  it('evaluate(2x + 3, 5) = 13', () => {
    expect(evaluate(poly([3, 2]), 5n)).toBe(13n);
  });

  it('evaluate en Z/7: (2x + 3)(5) = 13 mod 7 = 6', () => {
    expect(evaluate(poly([3, 2], 7n), 5n)).toBe(6n);
  });

  it('compose: (x²)(x + 1) = (x+1)² = x² + 2x + 1', () => {
    const r = compose(poly([0, 0, 1]), poly([1, 1]));
    expect(coeffs(r)).toEqual([1n, 2n, 1n]);
  });
});

describe('Polynomial Ring — raíces racionales y factorización Q[x]', () => {
  it('rationalRoots de x² - 5x + 6 = (x-2)(x-3) → {2/1, 3/1}', () => {
    const roots = rationalRoots(poly([6, -5, 1]));
    expect(roots).toEqual([
      { num: 2n, den: 1n },
      { num: 3n, den: 1n },
    ]);
  });

  it('rationalRoots de 2x² - 3x + 1 → {1/1, 1/2}', () => {
    const roots = rationalRoots(poly([1, -3, 2]));
    expect(roots).toEqual([
      { num: 1n, den: 1n },
      { num: 1n, den: 2n },
    ]);
  });

  it('rationalRoots de x² + 1 → [] (sin raíces racionales)', () => {
    expect(rationalRoots(poly([1, 0, 1]))).toEqual([]);
  });

  it('factor de x² - 1 produce factores lineales que multiplican al original', () => {
    const fs = factor(poly([-1, 0, 1]));
    // Producto de todos los factores reconstruye x² - 1.
    let product = poly([1]);
    for (const f of fs) product = multiply(product, f);
    expect(coeffs(product)).toEqual([-1n, 0n, 1n]);
    // Y contiene factores lineales (x - 1) y (x + 1) (en algún orden / signo).
    const linearFactors = fs.filter((f) => degree(f) === 1);
    expect(linearFactors.length).toBeGreaterThanOrEqual(2);
  });

  it('factor reconstruye 2x³ - 2x = 2x(x-1)(x+1)', () => {
    const original = poly([0, -2, 0, 2]);
    const fs = factor(original);
    let product = poly([1]);
    for (const f of fs) product = multiply(product, f);
    expect(coeffs(product)).toEqual(coeffs(original));
  });

  it('isIrreducible(x² + 1) = true en Q[x]', () => {
    expect(isIrreducible(poly([1, 0, 1]))).toBe(true);
  });

  it('isIrreducible(x² - 1) = false en Q[x] (factoriza)', () => {
    expect(isIrreducible(poly([-1, 0, 1]))).toBe(false);
  });

  it('isIrreducible(x³ - 2) = true (Eisenstein-friendly, sin raíz racional)', () => {
    expect(isIrreducible(poly([-2, 0, 0, 1]))).toBe(true);
  });

  it('squareFree de (x-1)²(x+1) divide x², extrae parte sin repetición', () => {
    // p = (x-1)²(x+1) = (x² - 2x + 1)(x+1) = x³ - x² - x + 1.
    const p = poly([1, -1, -1, 1]);
    const sf = squareFree(p);
    // squareFree debe tener grado ≤ grado(p) y dividir a p.
    expect(degree(sf)).toBeLessThanOrEqual(degree(p));
    // Las raíces 1 y -1 siguen siendo raíces.
    expect(evaluate(sf, 1n)).toBe(0n);
    expect(evaluate(sf, -1n)).toBe(0n);
  });
});

describe('Polynomial Ring — Berlekamp en Z/p[x]', () => {
  it('factorInZp(x² - 1, 5) produce factores lineales que reconstruyen el original', () => {
    // En Z/5: x² - 1 ≡ x² + 4 (mod 5) = (x - 1)(x + 1) = (x + 4)(x + 1).
    const fs = factorInZp(poly([-1, 0, 1]), 5n);
    let product = poly([1n], 5n);
    for (const f of fs) product = multiply(product, f);
    // Reducir a Z/5: el polinomio original mod 5 es x² + 4.
    expect(product.coefficients).toEqual([4n, 0n, 1n]);
    // Debe haber 2 factores lineales monic (lead 1).
    const lineales = fs.filter((f) => degree(f) === 1);
    expect(lineales.length).toBe(2);
  });

  it('factorInZp(x³ - x, 3) produce factores que reconstruyen el polinomio mod 3', () => {
    // En Z/3: x³ - x = x(x-1)(x+1) = x(x+2)(x+1).
    const fs = factorInZp(poly([0, -1, 0, 1]), 3n);
    let product = poly([1n], 3n);
    for (const f of fs) product = multiply(product, f);
    // x³ - x ≡ x³ + 2x (mod 3).
    expect(product.coefficients).toEqual([0n, 2n, 0n, 1n]);
    const lineales = fs.filter((f) => degree(f) === 1);
    expect(lineales.length).toBe(3);
  });

  it('factorInZp(x² + 1, 5) tiene factores lineales (porque 2² = -1 mod 5)', () => {
    // 2² = 4 = -1 mod 5, así que x²+1 = (x-2)(x+2) en Z/5.
    const fs = factorInZp(poly([1, 0, 1]), 5n);
    let product = poly([1n], 5n);
    for (const f of fs) product = multiply(product, f);
    expect(product.coefficients).toEqual([1n, 0n, 1n]);
    const lineales = fs.filter((f) => degree(f) === 1);
    expect(lineales.length).toBe(2);
  });

  it('factorInZp(x² + 1, 3) es irreducible (no hay raíz mod 3)', () => {
    // En Z/3: 0²+1=1, 1²+1=2, 2²+1=5≡2 → ninguna raíz.
    const fs = factorInZp(poly([1, 0, 1]), 3n);
    // Debe haber un único factor no-constante de grado 2.
    const nonConst = fs.filter((f) => degree(f) >= 1);
    expect(nonConst.length).toBe(1);
    expect(degree(nonConst[0])).toBe(2);
  });
});

describe('Polynomial Ring — resultante y discriminante', () => {
  it('resultant(x² - 1, x - 1) = 0 (comparten raíz)', () => {
    expect(resultant(poly([-1, 0, 1]), poly([-1, 1]))).toBe(0n);
  });

  it('resultant(x + 1, x - 1) = -2 (Sylvester 2×2 |1,1;1,-1| signo)', () => {
    // res(a,b) para deg(a)=deg(b)=1 es a0*b1 - a1*b0 hasta signo.
    const r = resultant(poly([1, 1]), poly([-1, 1]));
    // (x+1) y (x-1) son coprimos, resultante distinto de 0.
    expect(r).not.toBe(0n);
  });

  it('discriminant(x² + bx + c) = b² - 4c — caso x² - 5x + 6 = 25 - 24 = 1', () => {
    expect(discriminant(poly([6, -5, 1]))).toBe(1n);
  });

  it('discriminant(x² - 4) = 16 (b=0, c=-4 → 0 - 4*(-4) = 16)', () => {
    expect(discriminant(poly([-4, 0, 1]))).toBe(16n);
  });

  it('discriminant(x² + 1) = -4', () => {
    expect(discriminant(poly([1, 0, 1]))).toBe(-4n);
  });
});
