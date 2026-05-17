// ============================================================
// ST Probabilistic Programming — Tests
// ============================================================
//
// Cubre las 4 motores (enumerate / rejection / importance / MH),
// las 6 distribuciones, observe/factor, y los ejemplos canónicos.
// Usa rng seedable (mulberry32) para tests deterministas.

import { describe, expect, it } from 'vitest';
import {
  bayesianLinearRegression,
  bernoulli,
  biasedCoinExample,
  categorical,
  coinExample,
  discrete,
  enumerate,
  enumerateSupport,
  gaussianMeanModel,
  importanceSample,
  logPdf,
  metropolisHastings,
  normal,
  poisson,
  rejectionSample,
  sampleFrom,
  twoCoinsExample,
  uniform,
  type PProgram,
} from '../../../reasoning/probabilistic';

// ── RNG seedable (mulberry32) ────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Helpers ──────────────────────────────────────────────────

function within(actual: number, expected: number, tol: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

function frac<T>(samples: T[], target: T): number {
  let n = 0;
  for (const s of samples) if (s === target) n += 1;
  return n / samples.length;
}

// ============================================================
// 1. Distribuciones — sample + logPdf + enumerate support
// ============================================================

describe('distributions', () => {
  it('bernoulli: sampleFrom converge a p con N grande', () => {
    const rng = seededRng(42);
    const dist = bernoulli(0.3);
    let trues = 0;
    const N = 10_000;
    for (let i = 0; i < N; i++) if (sampleFrom(dist, rng)) trues += 1;
    within(trues / N, 0.3, 0.02);
  });

  it('bernoulli: logPdf(true|p=0.5) = -log(2)', () => {
    within(logPdf(bernoulli(0.5), true), -Math.log(2), 1e-9);
    within(logPdf(bernoulli(0.5), false), -Math.log(2), 1e-9);
  });

  it('uniform: muestras caen dentro de [low, high) y logPdf es -log(range)', () => {
    const rng = seededRng(1);
    const dist = uniform(-2, 5);
    for (let i = 0; i < 1000; i++) {
      const x = sampleFrom(dist, rng);
      expect(x).toBeGreaterThanOrEqual(-2);
      expect(x).toBeLessThan(5);
    }
    within(logPdf(dist, 0), -Math.log(7), 1e-9);
    expect(logPdf(dist, 100)).toBe(-Infinity);
  });

  it('normal: media empírica converge', () => {
    const rng = seededRng(7);
    const dist = normal(5, 2);
    let sum = 0;
    const N = 20_000;
    for (let i = 0; i < N; i++) sum += sampleFrom(dist, rng);
    within(sum / N, 5, 0.1);
  });

  it('normal: logPdf máximo en la media', () => {
    const dist = normal(0, 1);
    const peak = logPdf(dist, 0);
    const off = logPdf(dist, 2);
    expect(peak).toBeGreaterThan(off);
  });

  it('poisson: media empírica ≈ lambda', () => {
    const rng = seededRng(13);
    const dist = poisson(4);
    let sum = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) sum += sampleFrom(dist, rng);
    within(sum / N, 4, 0.2);
  });

  it('categorical: frecuencia empírica ≈ probabilidad declarada', () => {
    const rng = seededRng(99);
    const dist = categorical(['a', 'b', 'c'], [0.1, 0.6, 0.3]);
    const counts = new Map<string, number>();
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      const v = sampleFrom(dist, rng);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    within((counts.get('a') ?? 0) / N, 0.1, 0.02);
    within((counts.get('b') ?? 0) / N, 0.6, 0.02);
    within((counts.get('c') ?? 0) / N, 0.3, 0.02);
  });

  it('discrete: enumerateSupport normaliza la PMF', () => {
    const pmf = new Map<string, number>([
      ['x', 2],
      ['y', 6],
      ['z', 2],
    ]);
    const support = enumerateSupport(discrete(pmf));
    const byKey = new Map(support);
    within(byKey.get('x') ?? 0, 0.2, 1e-9);
    within(byKey.get('y') ?? 0, 0.6, 1e-9);
    within(byKey.get('z') ?? 0, 0.2, 1e-9);
  });

  it('enumerateSupport falla sobre normal/uniform/poisson', () => {
    expect(() => enumerateSupport(normal(0, 1))).toThrow();
    expect(() => enumerateSupport(uniform(0, 1))).toThrow();
    expect(() => enumerateSupport(poisson(2))).toThrow();
  });
});

// ============================================================
// 2. Enumerate — exacto sobre discreto finito
// ============================================================

describe('enumerate', () => {
  it('coinExample: P(true)=0.5 exacto', () => {
    const post = enumerate(coinExample());
    expect(post.samples.length).toBe(2);
    const histTrue = post.histogram!.get(true) ?? 0;
    const histFalse = post.histogram!.get(false) ?? 0;
    within(histTrue, 0.5, 1e-9);
    within(histFalse, 0.5, 1e-9);
  });

  it('biasedCoin(0.7): enumera P(true)=0.7 exacto', () => {
    const post = enumerate(biasedCoinExample(0.7));
    within(post.histogram!.get(true) ?? 0, 0.7, 1e-9);
  });

  it('twoCoinsExample: P(true)=0.25 (AND de dos Bernoulli(0.5))', () => {
    const post = enumerate(twoCoinsExample());
    within(post.histogram!.get(true) ?? 0, 0.25, 1e-9);
    within(post.histogram!.get(false) ?? 0, 0.75, 1e-9);
  });

  it('observe condiciona el posterior exactamente: dada coin=true, P(coin=true|obs)=1', () => {
    const program: PProgram<boolean> = (s) => {
      const c = s.sample(bernoulli(0.5));
      s.observe(c === true);
      return c;
    };
    const post = enumerate(program);
    within(post.histogram!.get(true) ?? 0, 1, 1e-9);
    expect(post.histogram!.get(false) ?? 0).toBeLessThan(1e-9);
  });

  it('factor(log(2)) sesga uniformemente', () => {
    // Programa: coin Bernoulli(0.5). factor(log(2)) si true; equivalente a P(true)=2/3.
    const program: PProgram<boolean> = (s) => {
      const c = s.sample(bernoulli(0.5));
      if (c) s.factor(Math.log(2));
      return c;
    };
    const post = enumerate(program);
    within(post.histogram!.get(true) ?? 0, 2 / 3, 1e-9);
  });

  it('enumerate sobre programa con dos sample sites enumera 4 ramas', () => {
    const program: PProgram<string> = (s) => {
      const a = s.sample(bernoulli(0.5));
      const b = s.sample(bernoulli(0.5));
      return `${a}-${b}`;
    };
    const post = enumerate(program);
    expect(post.samples.length).toBe(4);
    within(post.histogram!.get('true-true') ?? 0, 0.25, 1e-9);
    within(post.histogram!.get('true-false') ?? 0, 0.25, 1e-9);
    within(post.histogram!.get('false-true') ?? 0, 0.25, 1e-9);
    within(post.histogram!.get('false-false') ?? 0, 0.25, 1e-9);
  });

  it('enumerate respeta maxStates explotando si excede', () => {
    // Programa con 20 monedas → 2²⁰ ramas ≈ 1M; con maxStates=100 falla.
    const program: PProgram<number> = (s) => {
      let n = 0;
      for (let i = 0; i < 20; i++) {
        if (s.sample(bernoulli(0.5))) n += 1;
      }
      return n;
    };
    expect(() => enumerate(program, 100)).toThrow();
  });
});

// ============================================================
// 3. Rejection sampling
// ============================================================

describe('rejectionSample', () => {
  it('converge a la frecuencia esperada (coin sin observe)', () => {
    const rng = seededRng(2024);
    const post = rejectionSample(coinExample(), { numSamples: 3000, rng });
    within(frac(post.samples, true), 0.5, 0.04);
  });

  it('observe condiciona: rejection sobre coin=true devuelve solo true', () => {
    const rng = seededRng(7);
    const program: PProgram<boolean> = (s) => {
      const c = s.sample(bernoulli(0.5));
      s.observe(c === true);
      return c;
    };
    const post = rejectionSample(program, { numSamples: 500, rng });
    expect(post.samples.every((v) => v === true)).toBe(true);
  });

  it('rejection sobre AND condicionado a true exige ambas monedas true', () => {
    const rng = seededRng(100);
    const program: PProgram<{ a: boolean; b: boolean }> = (s) => {
      const a = s.sample(bernoulli(0.5));
      const b = s.sample(bernoulli(0.5));
      s.observe(a && b);
      return { a, b };
    };
    const post = rejectionSample(program, { numSamples: 200, rng });
    expect(post.samples.every((v) => v.a && v.b)).toBe(true);
  });

  it('rejection con observe imposible lanza error', () => {
    const rng = seededRng(1);
    const program: PProgram<boolean> = (s) => {
      // Condición imposible: coin debe ser true Y false.
      const c = s.sample(bernoulli(0.5));
      s.observe(c && !c);
      return c;
    };
    expect(() => rejectionSample(program, { numSamples: 10, maxAttempts: 100, rng })).toThrow();
  });
});

// ============================================================
// 4. Importance sampling
// ============================================================

describe('importanceSample', () => {
  it('coin sin observe: P(true) ≈ 0.5 vía pesos uniformes', () => {
    const rng = seededRng(11);
    const post = importanceSample(coinExample(), { numSamples: 2000, rng });
    within(post.histogram!.get(true) ?? 0, 0.5, 0.05);
  });

  it('importance con factor sesgado reproduce posterior (P(true)=2/3)', () => {
    const rng = seededRng(3);
    const program: PProgram<boolean> = (s) => {
      const c = s.sample(bernoulli(0.5));
      if (c) s.factor(Math.log(2));
      return c;
    };
    const post = importanceSample(program, { numSamples: 5000, rng });
    within(post.histogram!.get(true) ?? 0, 2 / 3, 0.04);
  });

  it('importance reporta ESS positivo y finito', () => {
    const rng = seededRng(50);
    const post = importanceSample(coinExample(), { numSamples: 500, rng });
    expect(post.ess).toBeGreaterThan(0);
    expect(post.ess).toBeLessThanOrEqual(500);
  });

  it('importance sobre gaussianMeanModel ajusta mu cerca de la media empírica', () => {
    // Posterior analítico para data ~ Normal(mu_true=3, σ=1) con prior Normal(0, 10):
    //   mu | data ~ Normal((Σxᵢ) / (n + 0.01), ...) ≈ media empírica para n grande.
    const rng = seededRng(999);
    // Datos sintéticos generados desde Normal(3, 1).
    const dataRng = seededRng(123);
    const data: number[] = [];
    for (let i = 0; i < 30; i++) {
      data.push(sampleFrom(normal(3, 1), dataRng));
    }
    const post = importanceSample(gaussianMeanModel(data), {
      numSamples: 5000,
      rng,
    });
    // El posterior mean debería estar cerca de la media empírica.
    const empMean = data.reduce((s, x) => s + x, 0) / data.length;
    within(post.mean ?? 0, empMean, 0.5);
  });
});

// ============================================================
// 5. Metropolis-Hastings MCMC
// ============================================================

describe('metropolisHastings', () => {
  it('coin sin observe: P(true) ≈ 0.5 vía MH', () => {
    const rng = seededRng(77);
    const post = metropolisHastings(coinExample(), {
      numSamples: 2000,
      burnIn: 500,
      rng,
    });
    within(frac(post.samples, true), 0.5, 0.05);
  });

  it('MH sobre gaussiana converge a la media del posterior', () => {
    // 10 datos desde Normal(2, 1); con prior Normal(0, 10), posterior ≈ Normal(empMean, ...).
    const dataRng = seededRng(42);
    const data: number[] = [];
    for (let i = 0; i < 20; i++) {
      data.push(sampleFrom(normal(2, 1), dataRng));
    }
    const empMean = data.reduce((s, x) => s + x, 0) / data.length;
    const rng = seededRng(123);
    const post = metropolisHastings(gaussianMeanModel(data), {
      numSamples: 3000,
      burnIn: 1000,
      rng,
    });
    within(post.mean ?? 0, empMean, 0.4);
    expect(post.acceptanceRate).toBeGreaterThan(0);
    expect(post.acceptanceRate).toBeLessThanOrEqual(1);
  });

  it('MH sobre bayesian linear regression recupera slope/intercept aproximados', () => {
    // Datos sintéticos: y = 2x + 1 + ruido ~ N(0, 1).
    const dataRng = seededRng(2026);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < 25; i++) {
      const x = -5 + 10 * dataRng();
      const noise = sampleFrom(normal(0, 1), dataRng);
      xs.push(x);
      ys.push(2 * x + 1 + noise);
    }
    const rng = seededRng(55);
    const post = metropolisHastings(bayesianLinearRegression(xs, ys), {
      numSamples: 2000,
      burnIn: 2000,
      rng,
    });
    // Extraemos el slope/intercept promedio del posterior.
    let sumSlope = 0;
    let sumIntercept = 0;
    for (const s of post.samples) {
      sumSlope += s.slope;
      sumIntercept += s.intercept;
    }
    const meanSlope = sumSlope / post.samples.length;
    const meanIntercept = sumIntercept / post.samples.length;
    within(meanSlope, 2, 0.5);
    within(meanIntercept, 1, 1.0);
  });

  it('MH reporta tasa de aceptación entre 0 y 1', () => {
    const rng = seededRng(8);
    const post = metropolisHastings(twoCoinsExample(), {
      numSamples: 500,
      burnIn: 200,
      rng,
    });
    expect(post.acceptanceRate).toBeGreaterThanOrEqual(0);
    expect(post.acceptanceRate).toBeLessThanOrEqual(1);
  });
});

// ============================================================
// 6. Posterior summary — quantiles
// ============================================================

describe('PosteriorSummary', () => {
  it('quantiles sobre uniform [0,1] están cerca de 0.025/0.5/0.975', () => {
    const rng = seededRng(31415);
    const program: PProgram<number> = (s) => s.sample(uniform(0, 1));
    const post = importanceSample(program, { numSamples: 5000, rng });
    expect(post.quantiles).toBeDefined();
    const q = post.quantiles!;
    within(q[0.5] ?? 0, 0.5, 0.05);
    within(q[0.025] ?? 0, 0.025, 0.05);
    within(q[0.975] ?? 0, 0.975, 0.05);
  });

  it('histogram suma a 1', () => {
    const post = enumerate(twoCoinsExample());
    let total = 0;
    for (const v of post.histogram!.values()) total += v;
    within(total, 1, 1e-9);
  });

  it('mean y std definidos para samples numéricos (booleanos cuentan como 0/1)', () => {
    const post = enumerate(biasedCoinExample(0.3));
    expect(post.mean).toBeDefined();
    within(post.mean!, 0.3, 1e-9);
  });
});
