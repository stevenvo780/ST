// ============================================================
// Probabilistic Programming — Programas de ejemplo
// ============================================================
//
// Mini-biblioteca de programas canónicos para exámenes/demos:
//   - `coinExample()`           Bernoulli(0.5) sin conditioning.
//   - `biasedCoinExample(p)`    Bernoulli(p) sin conditioning.
//   - `twoCoinsExample()`       AND de dos monedas (sanity check).
//   - `bayesianLinearRegression(xs, ys)`
//                              priors gaussianos sobre slope/intercept
//                              + likelihood gaussiana del residuo.
//   - `gaussianMeanModel(data)` posterior sobre mu | data,
//                              prior Normal(0, 10), σ conocido = 1.

import { logPdf } from './distributions';
import { bernoulli, normal, type PProgram } from './types';

/** Bernoulli simétrica: prior trivial sobre {true, false}. */
export function coinExample(): PProgram<boolean> {
  return (s) => s.sample(bernoulli(0.5));
}

/** Bernoulli con bias arbitrario p ∈ [0,1]. */
export function biasedCoinExample(p: number): PProgram<boolean> {
  return (s) => s.sample(bernoulli(p));
}

/** AND de dos monedas Bernoulli(0.5): P(true) = 0.25 esperado. */
export function twoCoinsExample(): PProgram<boolean> {
  return (s) => {
    const a = s.sample(bernoulli(0.5));
    const b = s.sample(bernoulli(0.5));
    return a && b;
  };
}

/**
 * Bayesian linear regression univariado:
 *   slope ~ Normal(0, 5)
 *   intercept ~ Normal(0, 5)
 *   yᵢ | slope, intercept ~ Normal(slope·xᵢ + intercept, 1)
 *
 * Devuelve la pareja (slope, intercept). Las observaciones se
 * codifican como factor(logPdf(...)) sobre el residuo — equivale
 * a una likelihood gaussiana, suitable para importance/MH.
 */
export function bayesianLinearRegression(
  xs: number[],
  ys: number[],
): PProgram<{ slope: number; intercept: number }> {
  if (xs.length !== ys.length) {
    throw new Error('bayesianLinearRegression: xs e ys deben tener la misma longitud');
  }
  return (s) => {
    const slope = s.sample(normal(0, 5));
    const intercept = s.sample(normal(0, 5));
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const y = ys[i];
      const predicted = slope * x + intercept;
      // Likelihood: y ~ Normal(predicted, σ=1). Usamos factor con
      // log-pdf para que el peso de la traza refleje la calidad
      // del fit sin descartar.
      s.factor(logPdf(normal(predicted, 1), y));
    }
    return { slope, intercept };
  };
}

/**
 * Posterior sobre la media de una gaussiana con σ conocido.
 *   mu ~ Normal(0, 10)
 *   xᵢ | mu ~ Normal(mu, 1)
 *
 * Útil como caso de test analítico: el posterior verdadero es
 * Normal((Σxᵢ) / (n + 1/100), 1/√(n + 1/100)).
 */
export function gaussianMeanModel(data: number[]): PProgram<number> {
  return (s) => {
    const mu = s.sample(normal(0, 10));
    for (const x of data) {
      s.factor(logPdf(normal(mu, 1), x));
    }
    return mu;
  };
}
