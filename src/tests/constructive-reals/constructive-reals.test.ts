// ============================================================
// ST Constructive Reals — Tests
// ============================================================
// Verificamos que cada operación cumple su contrato:
//   |x - approx(p).numerator / approx(p).denominator| < 2^{-p}
// y que los resultados coinciden numéricamente con cálculos
// en `number` (con tolerancia floating-point) donde aplica.

import { describe, it, expect } from 'vitest';
import {
  CReal,
  fromInt,
  fromRational,
  add,
  sub,
  mul,
  neg,
  div,
  sqrt,
  abs,
  exp,
  log,
  sin,
  cos,
  pow,
  toString,
  compareWithEpsilon,
  PI,
  E,
  SQRT2,
  __internals,
} from '../../constructive-reals';

/** Convierte una aproximación a `number` para comparar con float math. */
function asNumber(r: CReal, prec: number = 60): number {
  const { numerator, denominator } = r.approx(prec);
  // Para que no perdamos por desbordar Number, dividimos en bigint primero
  // si los bits son demasiados.
  const numBits = numerator.toString(2).length;
  if (numBits > 80) {
    const shift = numBits - 60;
    const small = numerator >> BigInt(shift);
    const denomShifted = denominator >> BigInt(shift);
    return Number(small) / Number(denomShifted);
  }
  return Number(numerator) / Number(denominator);
}

describe('constructive-reals — fundamentos', () => {
  it('fromInt(2).approx(20) representa exactamente 2', () => {
    const r = fromInt(2);
    const { numerator, denominator } = r.approx(20);
    expect(denominator).toBe(1n << 20n);
    // 2 · 2^20 = 2097152.
    expect(numerator).toBe(2n << 20n);
  });

  it('fromInt(-5).approx(10) representa exactamente -5', () => {
    const r = fromInt(-5);
    const { numerator, denominator } = r.approx(10);
    expect(numerator).toBe(-5n * (1n << 10n));
    expect(denominator).toBe(1n << 10n);
  });

  it('fromRational(1, 3) tiene error < 2^{-p} en cada precisión', () => {
    const oneThird = fromRational(1, 3);
    for (const p of [10, 30, 60, 100, 200]) {
      const { numerator, denominator } = oneThird.approx(p);
      // Error: |1/3 - num/2^p|. Multiplicamos por 3·2^p para enteros:
      //   |2^p - 3·num| < 3 (es decir, error < 1 en escala 2^p ⇒ < 2^{-p}).
      const diff3 = (1n << BigInt(p)) - 3n * numerator;
      const absDiff = diff3 < 0n ? -diff3 : diff3;
      // |diff3| < 3, lo cual implica |1/3 - num/denom| < 1/2^p < 2^{-p}.
      expect(absDiff).toBeLessThan(3n);
      expect(denominator).toBe(1n << BigInt(p));
    }
  });
});

describe('constructive-reals — aritmética', () => {
  it('add(1, 1) ≈ 2 a alta precisión', () => {
    const two = add(fromInt(1), fromInt(1));
    expect(asNumber(two)).toBeCloseTo(2, 14);
    // Verificamos también que la cota está cerca de 2 a precisión 100.
    const { numerator, denominator } = two.approx(100);
    // |2 - num/denom| < 2^{-100}, equivalente a |2·denom - num| < 1.
    const diff = 2n * denominator - numerator;
    const absDiff = diff < 0n ? -diff : diff;
    expect(absDiff).toBeLessThanOrEqual(1n);
  });

  it('sub(5, 3) ≈ 2', () => {
    const r = sub(fromInt(5), fromInt(3));
    expect(asNumber(r)).toBeCloseTo(2, 14);
  });

  it('mul(7, 6) ≈ 42', () => {
    const r = mul(fromInt(7), fromInt(6));
    expect(asNumber(r)).toBeCloseTo(42, 12);
  });

  it('neg(neg(x)) = x', () => {
    const seven = fromInt(7);
    const r = neg(neg(seven));
    expect(asNumber(r)).toBeCloseTo(7, 14);
  });

  it('abs(-3.5) ≈ 3.5', () => {
    const r = abs(fromRational(-7, 2));
    expect(asNumber(r)).toBeCloseTo(3.5, 14);
  });

  it('div(22, 7) ≈ 3.142857… (aprox π)', () => {
    const r = div(fromInt(22), fromInt(7));
    expect(asNumber(r)).toBeCloseTo(22 / 7, 12);
  });

  it('div(1, 3) coincide con fromRational(1, 3)', () => {
    const a = div(fromInt(1), fromInt(3));
    const b = fromRational(1, 3);
    // |a - b| debe ser ≤ 2 ulps a precisión 60.
    const av = a.approx(60).numerator;
    const bv = b.approx(60).numerator;
    const diff = av - bv;
    const absDiff = diff < 0n ? -diff : diff;
    expect(absDiff).toBeLessThanOrEqual(2n);
  });

  it('asociatividad aproximada: (a+b)+c ≈ a+(b+c)', () => {
    const a = fromRational(7, 11);
    const b = fromRational(13, 17);
    const c = fromRational(19, 23);
    const left = add(add(a, b), c);
    const right = add(a, add(b, c));
    // A precisión 50, la diferencia debe ser ≤ pocas ulps.
    expect(compareWithEpsilon(left, right, 40)).toBe(0);
  });
});

describe('constructive-reals — sqrt', () => {
  it('sqrt(fromInt(4)) ≈ 2', () => {
    const r = sqrt(fromInt(4));
    expect(asNumber(r)).toBeCloseTo(2, 14);
    // Verificación más fuerte: (sqrt(4))² ≈ 4.
    const sq = mul(r, r);
    expect(compareWithEpsilon(sq, fromInt(4), 30)).toBe(0);
  });

  it('sqrt(fromInt(2))² ≈ 2 a alta precisión', () => {
    const r = sqrt(fromInt(2));
    const sq = mul(r, r);
    // Comparamos con fromInt(2) usando epsilon 40.
    expect(compareWithEpsilon(sq, fromInt(2), 40)).toBe(0);
  });

  it('SQRT2.approx(50) elevado al cuadrado ≈ 2', () => {
    const { numerator, denominator } = SQRT2.approx(50);
    // (num/denom)² ≈ 2  ⇔  |num² - 2·denom²| pequeño.
    // Con error en num < 1, |num² - 2·denom²| < 2·num ≈ 2·√2·2^50 ≈ 2^51.5
    const lhs = numerator * numerator;
    const rhs = 2n * denominator * denominator;
    const diff = lhs - rhs;
    const absDiff = diff < 0n ? -diff : diff;
    // En escala denom² = 2^100, la diferencia debe ser ≤ ~2^52 (margen amplio).
    expect(absDiff).toBeLessThan(1n << 55n);
  });

  it('sqrt(fromInt(9)) ≈ 3', () => {
    const r = sqrt(fromInt(9));
    expect(asNumber(r)).toBeCloseTo(3, 14);
  });

  it('sqrt(2) coincide con SQRT2', () => {
    const a = sqrt(fromInt(2));
    expect(compareWithEpsilon(a, SQRT2, 40)).toBe(0);
  });
});

describe('constructive-reals — constantes', () => {
  it('PI.approx(50) coincide con Math.PI', () => {
    const piApprox = asNumber(PI, 60);
    expect(piApprox).toBeCloseTo(Math.PI, 13);
  });

  it('PI primeros 15 dígitos correctos vía toString', () => {
    // π = 3.14159265358979323846…
    const s = toString(PI, 20);
    expect(s.startsWith('3.14159265358979323846')).toBe(true);
  });

  it('E.approx(50) coincide con Math.E', () => {
    const eApprox = asNumber(E, 60);
    expect(eApprox).toBeCloseTo(Math.E, 13);
  });

  it('E primeros 15 dígitos correctos', () => {
    // e = 2.71828182845904523536…
    const s = toString(E, 20);
    expect(s.startsWith('2.71828182845904523536')).toBe(true);
  });

  it('SQRT2 coincide con Math.SQRT2', () => {
    expect(asNumber(SQRT2, 60)).toBeCloseTo(Math.SQRT2, 13);
  });
});

describe('constructive-reals — compareWithEpsilon', () => {
  it('compareWithEpsilon(PI, fromInt(3), 10) = 1', () => {
    expect(compareWithEpsilon(PI, fromInt(3), 10)).toBe(1);
  });

  it('compareWithEpsilon(fromInt(3), PI, 10) = -1', () => {
    expect(compareWithEpsilon(fromInt(3), PI, 10)).toBe(-1);
  });

  it('compareWithEpsilon(x, x, p) = 0 (reflexivo)', () => {
    const x = fromRational(355, 113);
    expect(compareWithEpsilon(x, x, 30)).toBe(0);
  });

  it('compareWithEpsilon distingue valores cercanos a precisión adecuada', () => {
    // 1/3 vs 1/3 + 2^{-20}: a precisión 30 deben diferir.
    const a = fromRational(1, 3);
    const b = add(a, fromRational(1, 1 << 20));
    expect(compareWithEpsilon(a, b, 30)).toBe(-1);
    expect(compareWithEpsilon(b, a, 30)).toBe(1);
  });

  it('compareWithEpsilon trata como iguales valores dentro de epsilon', () => {
    // 1/3 vs 1/3 + 2^{-30}: a precisión 10 deben verse iguales.
    const a = fromRational(1, 3);
    const b = add(a, fromRational(1, 1 << 30));
    expect(compareWithEpsilon(a, b, 10)).toBe(0);
  });
});

describe('constructive-reals — toString', () => {
  it('toString(fromInt(7), 5) = "7.00000"', () => {
    expect(toString(fromInt(7), 5)).toBe('7.00000');
  });

  it('toString(fromInt(-3), 0) = "-3"', () => {
    expect(toString(fromInt(-3), 0)).toBe('-3');
  });

  it('toString(fromRational(1, 4), 5) = "0.25000"', () => {
    expect(toString(fromRational(1, 4), 5)).toBe('0.25000');
  });

  it('toString(SQRT2, 10) coincide con √2 redondeado', () => {
    // √2 = 1.4142135623730950…  → 1.4142135624 redondeado a 10 dígitos
    // (el 11º dígito es 7, así que redondea hacia arriba).
    const s = toString(SQRT2, 10);
    expect(s).toBe('1.4142135624');
  });

  it('toString(SQRT2, 15) coincide con √2 a 15 dígitos', () => {
    // √2 = 1.414213562373095048…
    const s = toString(SQRT2, 15);
    expect(s.startsWith('1.41421356237309')).toBe(true);
  });
});

describe('constructive-reals — propiedades algebraicas', () => {
  it('(a + b) - b ≈ a', () => {
    const a = fromRational(7, 13);
    const b = SQRT2;
    const r = sub(add(a, b), b);
    expect(compareWithEpsilon(r, a, 30)).toBe(0);
  });

  it('a · (1/a) ≈ 1 para a = π', () => {
    const inv = div(fromInt(1), PI);
    const product = mul(PI, inv);
    expect(compareWithEpsilon(product, fromInt(1), 30)).toBe(0);
  });

  it('mul distribuye sobre add: a·(b+c) ≈ a·b + a·c', () => {
    const a = fromRational(3, 7);
    const b = fromRational(11, 13);
    const c = fromRational(17, 19);
    const lhs = mul(a, add(b, c));
    const rhs = add(mul(a, b), mul(a, c));
    expect(compareWithEpsilon(lhs, rhs, 30)).toBe(0);
  });

  it('sqrt(x)² ≈ x para varios x positivos', () => {
    for (const k of [2, 3, 5, 7, 16, 100, 1000]) {
      const x = fromInt(k);
      const sq = mul(sqrt(x), sqrt(x));
      expect(compareWithEpsilon(sq, x, 20)).toBe(0);
    }
  });

  it('error de aproximación está acotado para mul de irracionales', () => {
    // π · √2 ≈ 4.44288293…
    const r = mul(PI, SQRT2);
    expect(asNumber(r, 60)).toBeCloseTo(Math.PI * Math.SQRT2, 12);
  });

  it('div maneja divisores negativos', () => {
    // -10 / -5 = 2.
    const r = div(fromInt(-10), fromInt(-5));
    expect(asNumber(r)).toBeCloseTo(2, 14);
    // 10 / -5 = -2.
    const r2 = div(fromInt(10), fromInt(-5));
    expect(asNumber(r2)).toBeCloseTo(-2, 14);
  });
});

describe('constructive-reals — error handling', () => {
  it('fromRational(_, 0) lanza', () => {
    expect(() => fromRational(1, 0)).toThrow();
  });

  it('sqrt(-1) lanza', () => {
    expect(() => sqrt(fromInt(-1)).approx(10)).toThrow();
  });

  it('fromInt(NaN) lanza', () => {
    expect(() => fromInt(NaN)).toThrow();
  });

  it('fromInt(3.14) lanza (no es entero)', () => {
    expect(() => fromInt(3.14)).toThrow();
  });
});

describe('constructive-reals — transcendentales', () => {
  it('exp(0) = 1', () => {
    expect(asNumber(exp(fromInt(0)))).toBeCloseTo(1, 12);
  });

  it('exp(1) ≈ E', () => {
    const r = exp(fromInt(1));
    expect(compareWithEpsilon(r, E, 30)).toBe(0);
  });

  it('exp(2) ≈ e²', () => {
    expect(asNumber(exp(fromInt(2)))).toBeCloseTo(Math.E * Math.E, 10);
  });

  it('log(E) ≈ 1', () => {
    const r = log(E);
    expect(asNumber(r)).toBeCloseTo(1, 10);
  });

  it('log(exp(x)) ≈ x para x = 2', () => {
    const x = fromInt(2);
    const r = log(exp(x));
    expect(compareWithEpsilon(r, x, 20)).toBe(0);
  });

  it('exp(log(x)) ≈ x para x = 5', () => {
    const x = fromInt(5);
    const r = exp(log(x));
    expect(compareWithEpsilon(r, x, 20)).toBe(0);
  });

  it('sin(0) ≈ 0', () => {
    expect(asNumber(sin(fromInt(0)))).toBeCloseTo(0, 12);
  });

  it('cos(0) = 1', () => {
    expect(asNumber(cos(fromInt(0)))).toBeCloseTo(1, 12);
  });

  it('sin(PI) ≈ 0', () => {
    const r = sin(PI);
    // |sin(π)| < 2^{-20} debería ser cierto a precisión razonable.
    expect(compareWithEpsilon(r, fromInt(0), 20)).toBe(0);
  });

  it('cos(PI) ≈ -1', () => {
    const r = cos(PI);
    expect(compareWithEpsilon(r, fromInt(-1), 20)).toBe(0);
  });

  it('sin²(x) + cos²(x) ≈ 1', () => {
    const x = fromRational(7, 5); // arbitrario, dentro de [-π, π].
    const s = sin(x);
    const c = cos(x);
    const sum = add(mul(s, s), mul(c, c));
    expect(compareWithEpsilon(sum, fromInt(1), 20)).toBe(0);
  });

  it('pow(2, 10) = 1024 (entero rápido)', () => {
    const r = pow(fromInt(2), 10);
    expect(asNumber(r)).toBeCloseTo(1024, 10);
  });

  it('pow(2, -3) = 1/8', () => {
    const r = pow(fromInt(2), -3);
    expect(asNumber(r)).toBeCloseTo(0.125, 12);
  });

  it('pow(E, fromInt(2)) ≈ e²', () => {
    const r = pow(E, fromInt(2));
    expect(asNumber(r)).toBeCloseTo(Math.E * Math.E, 8);
  });
});

describe('constructive-reals — internals', () => {
  it('isqrt redondea correctamente', () => {
    expect(__internals.isqrt(0n)).toBe(0n);
    expect(__internals.isqrt(1n)).toBe(1n);
    expect(__internals.isqrt(2n)).toBe(1n);
    expect(__internals.isqrt(3n)).toBe(1n);
    expect(__internals.isqrt(4n)).toBe(2n);
    expect(__internals.isqrt(15n)).toBe(3n);
    expect(__internals.isqrt(16n)).toBe(4n);
    expect(__internals.isqrt(10000n)).toBe(100n);
    expect(__internals.isqrt(1n << 100n)).toBe(1n << 50n);
  });

  it('shiftRight redondea half-away-from-zero', () => {
    // 5 / 2 = 2.5 → round half away = 3.
    expect(__internals.shiftRight(5n, 1)).toBe(3n);
    expect(__internals.shiftRight(-5n, 1)).toBe(-3n);
    // 4 / 2 = 2.
    expect(__internals.shiftRight(4n, 1)).toBe(2n);
    // shift por 0 = identidad.
    expect(__internals.shiftRight(7n, 0)).toBe(7n);
    // shift negativo = shift left.
    expect(__internals.shiftRight(3n, -2)).toBe(12n);
  });

  it('bitLength funciona en bordes', () => {
    expect(__internals.bitLength(0n)).toBe(0);
    expect(__internals.bitLength(1n)).toBe(1);
    expect(__internals.bitLength(2n)).toBe(2);
    expect(__internals.bitLength(255n)).toBe(8);
    expect(__internals.bitLength(256n)).toBe(9);
    expect(__internals.bitLength(-256n)).toBe(9);
  });
});
