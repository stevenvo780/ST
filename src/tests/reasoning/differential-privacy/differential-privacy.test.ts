import { describe, it, expect } from 'vitest';
import {
  advancedComposition,
  basicComposition,
  dpCount,
  dpHistogram,
  dpMean,
  exponentialMechanism,
  gaussianNoise,
  globalSensitivityL1,
  laplaceNoise,
  makeDPRng,
  parallelComposition,
  randomizedResponse,
  randomizedResponseEpsilon,
  smoothSensitivity,
  type DPRng,
  type PrivacyBudget,
} from '../../../reasoning/differential-privacy';

// ------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------

const SEED = 42;

function rng(): DPRng {
  return makeDPRng(SEED);
}

// Muestrear N veces y devolver la media empírica.
function empiricalMean(samples: number[]): number {
  let s = 0;
  for (const x of samples) s += x;
  return s / samples.length;
}

function empiricalVar(samples: number[]): number {
  const mu = empiricalMean(samples);
  let s = 0;
  for (const x of samples) s += (x - mu) ** 2;
  return s / samples.length;
}

// ------------------------------------------------------------
// 1. Mecanismos de ruido
// ------------------------------------------------------------

describe('differential-privacy / Laplace', () => {
  it('mean empírica converge al valor original con N grande', () => {
    const r = rng();
    const N = 20000;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(laplaceNoise(10, 1, 0.5, r));
    }
    const mean = empiricalMean(samples);
    // Laplace tiene mean = original; tolerancia generosa por finite N.
    expect(Math.abs(mean - 10)).toBeLessThan(0.2);
  });

  it('varianza empírica ≈ 2b² donde b = Δ/ε', () => {
    const r = rng();
    const N = 20000;
    const sensitivity = 2;
    const epsilon = 1;
    const b = sensitivity / epsilon;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(laplaceNoise(0, sensitivity, epsilon, r));
    }
    const variance = empiricalVar(samples);
    const expected = 2 * b * b;
    expect(Math.abs(variance - expected) / expected).toBeLessThan(0.1);
  });

  it('sensibilidad 0 ⇒ no agrega ruido', () => {
    const r = rng();
    expect(laplaceNoise(42, 0, 1, r)).toBe(42);
  });

  it('rechaza epsilon ≤ 0', () => {
    expect(() => laplaceNoise(0, 1, 0)).toThrow();
    expect(() => laplaceNoise(0, 1, -0.1)).toThrow();
  });
});

describe('differential-privacy / Gaussian', () => {
  it('mean empírica ≈ valor original', () => {
    const r = rng();
    const N = 20000;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(gaussianNoise(5, 1, 1, 1e-5, r));
    }
    expect(Math.abs(empiricalMean(samples) - 5)).toBeLessThan(0.3);
  });

  it('varianza empírica ≈ σ² con σ = Δ·√(2 ln(1.25/δ))/ε', () => {
    const r = rng();
    const N = 20000;
    const sensitivity = 1;
    const epsilon = 0.5;
    const delta = 1e-5;
    const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
    const samples: number[] = [];
    for (let i = 0; i < N; i++) {
      samples.push(gaussianNoise(0, sensitivity, epsilon, delta, r));
    }
    const variance = empiricalVar(samples);
    const expected = sigma * sigma;
    expect(Math.abs(variance - expected) / expected).toBeLessThan(0.1);
  });

  it('exige delta > 0', () => {
    expect(() => gaussianNoise(0, 1, 1, 0)).toThrow();
  });
});

// ------------------------------------------------------------
// 2. Mecanismo exponencial
// ------------------------------------------------------------

describe('differential-privacy / exponentialMechanism', () => {
  it('items con score mayor aparecen más', () => {
    const r = rng();
    const items = ['low', 'mid', 'high'];
    const scoreMap = new Map([
      ['low', 0],
      ['mid', 1],
      ['high', 5],
    ]);
    const score = (it: string) => scoreMap.get(it) ?? 0;
    const counts = new Map<string, number>();
    for (const it of items) counts.set(it, 0);
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const pick = exponentialMechanism(items, score, 1, 2, r);
      counts.set(pick, (counts.get(pick) ?? 0) + 1);
    }
    // 'high' debe dominar.
    expect(counts.get('high')!).toBeGreaterThan(counts.get('mid')!);
    expect(counts.get('mid')!).toBeGreaterThan(counts.get('low')!);
  });

  it('sensibilidad 0 ⇒ argmax determinista', () => {
    const items = [
      { id: 'a', s: 1 },
      { id: 'b', s: 10 },
      { id: 'c', s: 5 },
    ];
    const pick = exponentialMechanism(items, (x) => x.s, 0, 1);
    expect(pick.id).toBe('b');
  });

  it('rechaza items vacío', () => {
    expect(() => exponentialMechanism<string>([], () => 0, 1, 1)).toThrow();
  });
});

// ------------------------------------------------------------
// 3. Randomized response
// ------------------------------------------------------------

describe('differential-privacy / randomizedResponse', () => {
  it('p = 3/4 da ε = ln(3)', () => {
    const eps = randomizedResponseEpsilon(0.75);
    expect(Math.abs(eps - Math.log(3))).toBeLessThan(1e-9);
  });

  it('p = 2/3 da ε = ln(2)', () => {
    const eps = randomizedResponseEpsilon(2 / 3);
    expect(Math.abs(eps - Math.log(2))).toBeLessThan(1e-9);
  });

  it('p alto preserva el bit con alta probabilidad', () => {
    const r = rng();
    const N = 5000;
    let truths = 0;
    for (let i = 0; i < N; i++) {
      if (randomizedResponse(true, 0.9, r) === true) truths++;
    }
    // ≈ 0.9 ± 0.02
    expect(truths / N).toBeGreaterThan(0.87);
    expect(truths / N).toBeLessThan(0.93);
  });

  it('p en (0,1) requerido', () => {
    expect(() => randomizedResponse(true, 0)).toThrow();
    expect(() => randomizedResponse(true, 1)).toThrow();
  });
});

// ------------------------------------------------------------
// 4. Queries derivadas
// ------------------------------------------------------------

describe('differential-privacy / dpCount', () => {
  it('|dp − true| acotado loose por ε⁻¹·log(1/β)', () => {
    const r = rng();
    const values = Array.from({ length: 1000 }, (_, i) => i);
    const trueCount = values.filter((v) => v % 2 === 0).length;
    const epsilon = 0.5;
    const N = 200;
    let maxDiff = 0;
    for (let i = 0; i < N; i++) {
      const got = dpCount(values, (v) => v % 2 === 0, epsilon, r);
      const diff = Math.abs(got - trueCount);
      if (diff > maxDiff) maxDiff = diff;
    }
    // Cota loose: con prob ≥ 1 − β, |Lap(1/ε)| ≤ (1/ε) ln(1/β).
    // Para β = 1/200, ln(200)/0.5 ≈ 10.6; permitimos margen 4x por finitud.
    expect(maxDiff).toBeLessThan(50);
  });

  it('siempre devuelve un entero no negativo', () => {
    const r = rng();
    const values = [1, 2, 3];
    for (let i = 0; i < 50; i++) {
      const got = dpCount(values, () => false, 0.1, r);
      expect(Number.isInteger(got)).toBe(true);
      expect(got).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('differential-privacy / dpMean', () => {
  it('dpMean ≈ true mean para datasets grandes', () => {
    const r = rng();
    const n = 1000;
    const values = Array.from({ length: n }, (_, i) => (i % 100) / 100);
    const trueMean = empiricalMean(values);
    const N = 200;
    const dpMeans: number[] = [];
    for (let i = 0; i < N; i++) {
      dpMeans.push(dpMean(values, [0, 1], 1, r));
    }
    const empirical = empiricalMean(dpMeans);
    // sensibilidad = 1/n ⇒ ruido pequeño; promedio de N corridas debería ser muy cercano.
    expect(Math.abs(empirical - trueMean)).toBeLessThan(0.01);
  });

  it('clipea valores fuera de rango', () => {
    const r = rng();
    // Todos valores muy fuera de rango altos ⇒ media DP cerca de 1.
    const values = [100, 100, 100, 100, 100];
    const got = dpMean(values, [0, 1], 100, r);
    expect(Math.abs(got - 1)).toBeLessThan(0.5);
  });

  it('rechaza rango inválido', () => {
    expect(() => dpMean([1], [1, 0], 1)).toThrow();
  });

  it('rechaza values vacío', () => {
    expect(() => dpMean([], [0, 1], 1)).toThrow();
  });
});

describe('differential-privacy / dpHistogram', () => {
  it('preserva categorías y bins suman ≈ N (loose)', () => {
    const r = rng();
    const categories = ['a', 'b', 'c'];
    const values = ['a', 'a', 'b', 'b', 'b', 'c', 'a', 'b', 'c', 'a'];
    const hist = dpHistogram(values, categories, 1, r);
    expect(hist.size).toBe(3);
    let sum = 0;
    for (const v of hist.values()) sum += v;
    // Ruido Laplace mediano puede mover ±5 por bin; sum ∈ [N − 15, N + 15].
    expect(Math.abs(sum - values.length)).toBeLessThan(15);
  });
});

// ------------------------------------------------------------
// 5. Composición
// ------------------------------------------------------------

describe('differential-privacy / basicComposition', () => {
  it('ε_total = Σ ε_i, δ_total = Σ δ_i', () => {
    const ms: PrivacyBudget[] = [
      { epsilon: 0.5, delta: 1e-6 },
      { epsilon: 0.3, delta: 1e-6 },
      { epsilon: 0.2, delta: 0 },
    ];
    const r = basicComposition(ms);
    expect(Math.abs(r.epsilon - 1.0)).toBeLessThan(1e-12);
    expect(Math.abs(r.delta - 2e-6)).toBeLessThan(1e-15);
  });

  it('vacío ⇒ (0, 0)', () => {
    const r = basicComposition([]);
    expect(r.epsilon).toBe(0);
    expect(r.delta).toBe(0);
  });
});

describe('differential-privacy / advancedComposition', () => {
  it('para k grande mejora sobre suma cuando ε pequeño', () => {
    // k = 100 mecanismos cada uno ε = 0.05, δ = 0.
    const k = 100;
    const eps = 0.05;
    const ms: PrivacyBudget[] = Array.from({ length: k }, () => ({ epsilon: eps, delta: 0 }));
    const deltaTotal = 1e-5;
    const advanced = advancedComposition(ms, deltaTotal);
    const basic = basicComposition(ms);
    // Para k grande y ε pequeño, advanced << basic.
    expect(advanced.epsilon).toBeLessThan(basic.epsilon);
    // El delta total incluye el slack.
    expect(advanced.delta).toBeCloseTo(deltaTotal, 10);
  });

  it('coincide con la fórmula Dwork-Rothblum-Vadhan', () => {
    const k = 50;
    const eps = 0.1;
    const ms: PrivacyBudget[] = Array.from({ length: k }, () => ({ epsilon: eps, delta: 0 }));
    const deltaTotal = 1e-4;
    const r = advancedComposition(ms, deltaTotal);
    const expected =
      Math.sqrt(2 * k * Math.log(1 / deltaTotal)) * eps + k * eps * (Math.exp(eps) - 1);
    expect(Math.abs(r.epsilon - expected)).toBeLessThan(1e-9);
  });

  it('vacío ⇒ (0, deltaTotal)', () => {
    const r = advancedComposition([], 1e-5);
    expect(r.epsilon).toBe(0);
    expect(r.delta).toBe(1e-5);
  });

  it('rechaza deltaTotal = 0', () => {
    expect(() => advancedComposition([{ epsilon: 1, delta: 0 }], 0)).toThrow();
  });
});

describe('differential-privacy / parallelComposition', () => {
  it('ε y δ son el máximo (no la suma)', () => {
    const ms: PrivacyBudget[] = [
      { epsilon: 0.5, delta: 1e-6 },
      { epsilon: 1.2, delta: 0 },
      { epsilon: 0.7, delta: 2e-7 },
    ];
    const r = parallelComposition(ms);
    expect(r.epsilon).toBe(1.2);
    expect(r.delta).toBe(1e-6);
  });
});

// ------------------------------------------------------------
// 6. Sensitivity calculators
// ------------------------------------------------------------

describe('differential-privacy / globalSensitivityL1', () => {
  it('para count, sensibilidad = 1', () => {
    const fn = (d: number[]) => d.length;
    const s = globalSensitivityL1(fn, [
      [
        [1, 2, 3],
        [1, 2],
      ],
      [
        [1, 2, 3],
        [1, 2, 3, 4],
      ],
    ]);
    expect(s).toBe(1);
  });

  it('para suma con rango fijo, sensibilidad = rango', () => {
    const fn = (d: number[]) => d.reduce((s, x) => s + x, 0);
    const s = globalSensitivityL1(fn, [
      [
        [1, 2, 3],
        [1, 2, 3, 10],
      ],
      [
        [5, 5],
        [5, 5, 7],
      ],
    ]);
    expect(s).toBe(10);
  });

  it('sin vecinos ⇒ 0', () => {
    expect(globalSensitivityL1((d) => d.length, [])).toBe(0);
  });
});

describe('differential-privacy / smoothSensitivity', () => {
  it('decae exponencialmente con k', () => {
    const data = [1, 2, 3, 4, 5];
    const fn = (d: number[]) => d.reduce((s, x) => s + x, 0) / d.length;
    const sLow = smoothSensitivity(fn, data, 0.1);
    const sHigh = smoothSensitivity(fn, data, 2.0);
    // β alto castiga más rápido la distancia ⇒ menor (o igual) sensibilidad suave.
    expect(sHigh).toBeLessThanOrEqual(sLow);
  });

  it('data vacío ⇒ 0', () => {
    expect(smoothSensitivity(() => 0, [], 0.1)).toBe(0);
  });

  it('rechaza beta ≤ 0', () => {
    expect(() => smoothSensitivity(() => 0, [1, 2], 0)).toThrow();
    expect(() => smoothSensitivity(() => 0, [1, 2], -1)).toThrow();
  });
});

// ------------------------------------------------------------
// 7. Determinismo del PRNG
// ------------------------------------------------------------

describe('differential-privacy / determinismo con seed', () => {
  it('mismo seed ⇒ misma secuencia Laplace', () => {
    const r1 = makeDPRng(123);
    const r2 = makeDPRng(123);
    for (let i = 0; i < 10; i++) {
      expect(r1.laplace(1)).toBe(r2.laplace(1));
    }
  });

  it('mismo seed ⇒ misma secuencia Gaussian', () => {
    const r1 = makeDPRng(7);
    const r2 = makeDPRng(7);
    for (let i = 0; i < 10; i++) {
      expect(r1.gaussian(0, 1)).toBe(r2.gaussian(0, 1));
    }
  });

  it('seeds distintos ⇒ secuencias distintas', () => {
    const r1 = makeDPRng(1);
    const r2 = makeDPRng(2);
    expect(r1.uniform()).not.toBe(r2.uniform());
  });

  it('exponentialMechanism es determinista con seed fijo', () => {
    const items = ['a', 'b', 'c'];
    const score = (x: string) => ({ a: 0, b: 1, c: 2 })[x] ?? 0;
    const r1 = makeDPRng(99);
    const r2 = makeDPRng(99);
    const a: string[] = [];
    const b: string[] = [];
    for (let i = 0; i < 20; i++) {
      a.push(exponentialMechanism(items, score, 1, 1, r1));
      b.push(exponentialMechanism(items, score, 1, 1, r2));
    }
    expect(a).toEqual(b);
  });
});
