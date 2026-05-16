// ============================================================
// ST Hyperreal — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  hr,
  HR_ZERO,
  HR_ONE,
  HR_EPSILON,
  Hyperreal,
  add,
  sub,
  mul,
  compare,
  eq,
  lt,
  gt,
  hrAnd,
  hrOr,
  hrNot,
  hrImplies,
  propagate,
  bound,
  hrToString,
  UncertaintyBound,
} from '../../hyperreal';

const FLOAT_EPS = 1e-9;

function approxHr(actual: Hyperreal, expected: Hyperreal, tol = FLOAT_EPS): void {
  expect(Math.abs(actual.standard - expected.standard)).toBeLessThan(tol);
  expect(Math.abs(actual.infinitesimal - expected.infinitesimal)).toBeLessThan(tol);
}

describe('hyperreal — constructores y constantes', () => {
  it('hr(s) define infinitesimal = 0 por defecto', () => {
    const x = hr(0.5);
    expect(x.standard).toBe(0.5);
    expect(x.infinitesimal).toBe(0);
  });

  it('hr(s, i) acepta infinitesimal explícito', () => {
    const x = hr(0.5, 3);
    expect(x.standard).toBe(0.5);
    expect(x.infinitesimal).toBe(3);
  });

  it('constantes canónicas', () => {
    expect(HR_ZERO).toEqual({ standard: 0, infinitesimal: 0 });
    expect(HR_ONE).toEqual({ standard: 1, infinitesimal: 0 });
    expect(HR_EPSILON).toEqual({ standard: 0, infinitesimal: 1 });
  });
});

describe('hyperreal — orden y comparación', () => {
  it('HR_EPSILON > HR_ZERO pero ≠ HR_ZERO', () => {
    expect(gt(HR_EPSILON, HR_ZERO)).toBe(true);
    expect(eq(HR_EPSILON, HR_ZERO)).toBe(false);
    expect(compare(HR_EPSILON, HR_ZERO)).toBe(1);
  });

  it('1 + ε ≠ 1 y 1 + ε > 1', () => {
    const onePlusEps = add(HR_ONE, HR_EPSILON);
    expect(eq(onePlusEps, HR_ONE)).toBe(false);
    expect(gt(onePlusEps, HR_ONE)).toBe(true);
    expect(compare(onePlusEps, HR_ONE)).toBe(1);
  });

  it('orden total: tricotomía sobre muestras', () => {
    const samples: Hyperreal[] = [
      HR_ZERO,
      HR_EPSILON,
      hr(0, 2),
      hr(0.5),
      hr(0.5, -1),
      hr(0.5, 1),
      HR_ONE,
      add(HR_ONE, HR_EPSILON),
      hr(2, 0),
    ];

    for (const a of samples) {
      for (const b of samples) {
        const c = compare(a, b);
        expect([-1, 0, 1]).toContain(c);
        // anti-simetría (normalizamos a 0 para evitar -0)
        const expected = c === 0 ? 0 : (-c as -1 | 1);
        expect(compare(b, a)).toBe(expected);
      }
    }

    // transitividad puntual
    for (let i = 0; i < samples.length; i++) {
      for (let j = 0; j < samples.length; j++) {
        for (let k = 0; k < samples.length; k++) {
          const ij = compare(samples[i], samples[j]);
          const jk = compare(samples[j], samples[k]);
          if (ij < 0 && jk < 0) expect(compare(samples[i], samples[k])).toBeLessThan(0);
          if (ij > 0 && jk > 0) expect(compare(samples[i], samples[k])).toBeGreaterThan(0);
          if (ij === 0 && jk === 0) expect(compare(samples[i], samples[k])).toBe(0);
        }
      }
    }
  });

  it('standard domina sobre infinitesimal: ε << 0.001', () => {
    expect(lt(HR_EPSILON, hr(0.001))).toBe(true);
    expect(lt(hr(0, 1e9), hr(1e-9))).toBe(true);
  });

  it('comparación absorbe ruido float ínfimo', () => {
    const a = hr(0.1 + 0.2); // 0.30000000000000004
    const b = hr(0.3);
    expect(eq(a, b)).toBe(true);
  });
});

describe('hyperreal — aritmética de primer orden', () => {
  it('add suma componente a componente', () => {
    approxHr(add(hr(1, 2), hr(3, 4)), hr(4, 6));
  });

  it('sub resta componente a componente', () => {
    approxHr(sub(hr(5, 3), hr(2, 1)), hr(3, 2));
  });

  it('mul: (1 + 2ε)(3 + 4ε) = 3 + 10ε (descartando ε²)', () => {
    approxHr(mul(hr(1, 2), hr(3, 4)), hr(3, 10));
  });

  it('mul con ε puro: ε · ε = 0 (orden 2 descartado)', () => {
    approxHr(mul(HR_EPSILON, HR_EPSILON), HR_ZERO);
  });

  it('mul es conmutativa y asociativa sobre standards', () => {
    const a = hr(0.3, 1);
    const b = hr(0.5, -2);
    const c = hr(0.7, 0);
    approxHr(mul(a, b), mul(b, a));
    approxHr(mul(mul(a, b), c), mul(a, mul(b, c)));
  });

  it('1 es identidad de mul', () => {
    const x = hr(0.42, 3);
    approxHr(mul(HR_ONE, x), x);
    approxHr(mul(x, HR_ONE), x);
  });
});

describe('hyperreal — lógica probabilística', () => {
  it('hrAnd(0.5, 0.5) = 0.25', () => {
    approxHr(hrAnd(hr(0.5), hr(0.5)), hr(0.25));
  });

  it('hrOr(0.5, 0.5) = 0.75', () => {
    approxHr(hrOr(hr(0.5), hr(0.5)), hr(0.75));
  });

  it('hrNot(0.3) = 0.7 y es involutivo', () => {
    approxHr(hrNot(hr(0.3)), hr(0.7));
    approxHr(hrNot(hrNot(hr(0.3))), hr(0.3));
  });

  it('hrImplies(1, q) = q  (modus ponens degenera)', () => {
    approxHr(hrImplies(HR_ONE, hr(0.4)), hr(0.4));
  });

  it('hrImplies(0, q) = 1  (vacuamente verdadera)', () => {
    approxHr(hrImplies(HR_ZERO, hr(0.4)), HR_ONE);
  });

  it('De Morgan: ¬(p ∧ q) = ¬p ∨ ¬q sobre standards', () => {
    const p = hr(0.3);
    const q = hr(0.6);
    approxHr(hrNot(hrAnd(p, q)), hrOr(hrNot(p), hrNot(q)));
  });

  it('infinitesimales sobreviven a And: (1+ε) ∧ (1+ε) = 1+2ε', () => {
    const onePlusEps = add(HR_ONE, HR_EPSILON);
    approxHr(hrAnd(onePlusEps, onePlusEps), hr(1, 2));
  });

  it('ε de "casi cierto" no colapsa: hrNot(1 - ε) = ε', () => {
    const almost = sub(HR_ONE, HR_EPSILON);
    approxHr(hrNot(almost), HR_EPSILON);
  });
});

describe('hyperreal — propagación de incertidumbre', () => {
  function approxBound(actual: UncertaintyBound, expected: UncertaintyBound, tol = 1e-9): void {
    approxHr(actual.lower, expected.lower, tol);
    approxHr(actual.upper, expected.upper, tol);
  }

  it('bound() rechaza intervalo invertido', () => {
    expect(() => bound(hr(0.7), hr(0.3))).toThrow();
  });

  it('AND: [0.4, 0.6] ∧ [0.5, 0.7] = [0.2, 0.42]', () => {
    const a = bound(hr(0.4), hr(0.6));
    const b = bound(hr(0.5), hr(0.7));
    approxBound(propagate(a, 'and', b), {
      lower: hr(0.2),
      upper: hr(0.42),
    });
  });

  it('OR: [0.2, 0.4] ∨ [0.3, 0.5] = [0.44, 0.7]', () => {
    const a = bound(hr(0.2), hr(0.4));
    const b = bound(hr(0.3), hr(0.5));
    // lower = 0.2 + 0.3 - 0.2*0.3 = 0.44
    // upper = 0.4 + 0.5 - 0.4*0.5 = 0.7
    approxBound(propagate(a, 'or', b), {
      lower: hr(0.44),
      upper: hr(0.7),
    });
  });

  it('NOT: ¬[0.2, 0.7] = [0.3, 0.8]', () => {
    const a = bound(hr(0.2), hr(0.7));
    approxBound(propagate(a, 'not'), {
      lower: hr(0.3),
      upper: hr(0.8),
    });
  });

  it('IMPLIES: [0.2, 0.6] → [0.3, 0.5] respeta monotonicidad', () => {
    const p = bound(hr(0.2), hr(0.6));
    const q = bound(hr(0.3), hr(0.5));
    // lower = hrImplies(upper_p, lower_q) = 1 - 0.6 + 0.6*0.3 = 0.58
    // upper = hrImplies(lower_p, upper_q) = 1 - 0.2 + 0.2*0.5 = 0.9
    approxBound(propagate(p, 'implies', q), {
      lower: hr(0.58),
      upper: hr(0.9),
    });
  });

  it('AND requiere segundo operando', () => {
    const a = bound(HR_ZERO, HR_ONE);
    expect(() => propagate(a, 'and')).toThrow();
    expect(() => propagate(a, 'or')).toThrow();
    expect(() => propagate(a, 'implies')).toThrow();
  });

  it('propagación con infinitesimales: ¬[1−ε, 1] = [0, ε]', () => {
    const almost = bound(sub(HR_ONE, HR_EPSILON), HR_ONE);
    const result = propagate(almost, 'not');
    approxHr(result.lower, HR_ZERO);
    approxHr(result.upper, HR_EPSILON);
  });

  it('propagación AND con ε: [ε, 2ε] ∧ [0.5, 0.5] = [0.5ε, ε]', () => {
    const a = bound(HR_EPSILON, hr(0, 2));
    const b = bound(hr(0.5), hr(0.5));
    const r = propagate(a, 'and', b);
    approxHr(r.lower, hr(0, 0.5));
    approxHr(r.upper, hr(0, 1));
  });
});

describe('hyperreal — utilidades', () => {
  it('hrToString omite infinitesimal cuando es 0', () => {
    expect(hrToString(hr(0.5))).toBe('0.5');
  });

  it('hrToString muestra parte infinitesimal con signo', () => {
    expect(hrToString(hr(1, 2))).toBe('1 + 2ε');
    expect(hrToString(hr(1, -2))).toBe('1 - 2ε');
    expect(hrToString(HR_EPSILON)).toBe('0 + 1ε');
  });
});
