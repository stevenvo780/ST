// ============================================================
// Probabilistic Programming — Distributions
// ============================================================
//
// Muestreo y log-density para las seis familias soportadas.
// Todo función pura y RNG inyectable.

import type {
  BernoulliDist,
  CategoricalDist,
  DiscreteDist,
  Distribution,
  NormalDist,
  PoissonDist,
  UniformDist,
} from './types';

const TWO_PI = 2 * Math.PI;
const LOG_2PI = Math.log(TWO_PI);

/**
 * Saca un valor de `dist` usando `rng` (uniforme [0,1)).
 *
 * Para `categorical` y `discrete`, normaliza las probs internamente
 * para tolerar entradas no exactamente sumadas a 1.
 *
 * Las firmas overloaded dan inferencia precisa por familia.
 */
export function sampleFrom(dist: BernoulliDist, rng: () => number): boolean;
export function sampleFrom(dist: UniformDist, rng: () => number): number;
export function sampleFrom(dist: NormalDist, rng: () => number): number;
export function sampleFrom(dist: PoissonDist, rng: () => number): number;
export function sampleFrom<T>(dist: CategoricalDist<T>, rng: () => number): T;
export function sampleFrom<T>(dist: DiscreteDist<T>, rng: () => number): T;
export function sampleFrom<T>(dist: Distribution<T>, rng: () => number): T;
export function sampleFrom<T>(dist: Distribution<T>, rng: () => number): T {
  switch (dist.kind) {
    case 'bernoulli':
      return (rng() < dist.p) as unknown as T;
    case 'uniform':
      return (dist.low + rng() * (dist.high - dist.low)) as unknown as T;
    case 'normal':
      return sampleNormal(dist.mean, dist.std, rng) as unknown as T;
    case 'poisson':
      return samplePoisson(dist.lambda, rng) as unknown as T;
    case 'categorical': {
      const u = rng();
      const total = dist.probs.reduce((s, x) => s + x, 0);
      if (total <= 0) {
        throw new Error('categorical: suma de probs <= 0');
      }
      let acc = 0;
      for (let i = 0; i < dist.values.length; i++) {
        acc += (dist.probs[i] ?? 0) / total;
        if (u < acc) return dist.values[i];
      }
      // Borde por float: devolver el último.
      return dist.values[dist.values.length - 1];
    }
    case 'discrete': {
      const u = rng();
      let total = 0;
      for (const p of dist.pmf.values()) total += p;
      if (total <= 0) {
        throw new Error('discrete: suma de pmf <= 0');
      }
      let acc = 0;
      let last: T | undefined;
      for (const [v, p] of dist.pmf) {
        last = v;
        acc += p / total;
        if (u < acc) return v;
      }
      if (last === undefined) throw new Error('discrete: pmf vacío');
      return last;
    }
  }
}

/**
 * Log-densidad / log-masa de `value` bajo `dist`.
 *
 * Para distribuciones continuas (`uniform`, `normal`) es log-pdf;
 * para discretas (`bernoulli`, `poisson`, `categorical`, `discrete`)
 * es log-pmf. Valores fuera del soporte devuelven `-Infinity`.
 */
export function logPdf(dist: BernoulliDist, value: boolean): number;
export function logPdf(dist: UniformDist, value: number): number;
export function logPdf(dist: NormalDist, value: number): number;
export function logPdf(dist: PoissonDist, value: number): number;
export function logPdf<T>(dist: CategoricalDist<T>, value: T): number;
export function logPdf<T>(dist: DiscreteDist<T>, value: T): number;
export function logPdf<T>(dist: Distribution<T>, value: T): number;
export function logPdf<T>(dist: Distribution<T>, value: T): number {
  switch (dist.kind) {
    case 'bernoulli': {
      const v = value as unknown as boolean;
      if (typeof v !== 'boolean') return -Infinity;
      const p = clampProb(dist.p);
      return v ? Math.log(p) : Math.log(1 - p);
    }
    case 'uniform': {
      const x = value as unknown as number;
      if (typeof x !== 'number' || !Number.isFinite(x)) return -Infinity;
      if (x < dist.low || x >= dist.high) return -Infinity;
      if (dist.high <= dist.low) return -Infinity;
      return -Math.log(dist.high - dist.low);
    }
    case 'normal': {
      const x = value as unknown as number;
      if (typeof x !== 'number' || !Number.isFinite(x)) return -Infinity;
      if (dist.std <= 0) return -Infinity;
      const z = (x - dist.mean) / dist.std;
      return -0.5 * (z * z + LOG_2PI) - Math.log(dist.std);
    }
    case 'poisson': {
      const k = value as unknown as number;
      if (!Number.isInteger(k) || k < 0) return -Infinity;
      if (dist.lambda <= 0) return k === 0 ? 0 : -Infinity;
      return k * Math.log(dist.lambda) - dist.lambda - logFactorial(k);
    }
    case 'categorical': {
      const idx = dist.values.indexOf(value);
      if (idx < 0) return -Infinity;
      const total = dist.probs.reduce((s, x) => s + x, 0);
      const p = (dist.probs[idx] ?? 0) / total;
      return p > 0 ? Math.log(p) : -Infinity;
    }
    case 'discrete': {
      const p = dist.pmf.get(value);
      if (p === undefined || p <= 0) return -Infinity;
      let total = 0;
      for (const x of dist.pmf.values()) total += x;
      return Math.log(p / total);
    }
  }
}

/**
 * Enumera el soporte de una distribución discreta como pares
 * `[valor, probabilidad]`. Para distribuciones continuas o de
 * soporte infinito (poisson), lanza error: no se puede enumerar.
 *
 * Para `poisson` se podría truncar pero la enumeración exacta no
 * lo soporta — el usuario debe usar `categorical` con un soporte
 * acotado si quiere enumeración.
 */
export function enumerateSupport(dist: BernoulliDist): Array<[boolean, number]>;
export function enumerateSupport<T>(dist: CategoricalDist<T>): Array<[T, number]>;
export function enumerateSupport<T>(dist: DiscreteDist<T>): Array<[T, number]>;
export function enumerateSupport<T>(dist: Distribution<T>): Array<[T, number]>;
export function enumerateSupport<T>(dist: Distribution<T>): Array<[T, number]> {
  switch (dist.kind) {
    case 'bernoulli': {
      const p = clampProb(dist.p);
      return [
        [true as unknown as T, p],
        [false as unknown as T, 1 - p],
      ];
    }
    case 'categorical': {
      const total = dist.probs.reduce((s, x) => s + x, 0);
      const out: Array<[T, number]> = [];
      for (let i = 0; i < dist.values.length; i++) {
        const p = (dist.probs[i] ?? 0) / total;
        if (p > 0) out.push([dist.values[i], p]);
      }
      return out;
    }
    case 'discrete': {
      let total = 0;
      for (const x of dist.pmf.values()) total += x;
      const out: Array<[T, number]> = [];
      for (const [v, p] of dist.pmf) {
        if (p > 0) out.push([v, p / total]);
      }
      return out;
    }
    case 'uniform':
    case 'normal':
    case 'poisson':
      throw new Error(
        `enumerate: la distribución "${dist.kind}" tiene soporte continuo o infinito; ` +
          'usá categorical/discrete o cambiá a rejection/importance/MH.',
      );
  }
}

// ── Helpers privados ─────────────────────────────────────────

/**
 * Box-Muller transform. Cachea el segundo gaussiano por llamada
 * para no desperdiciar entropía — aunque la API permite dos
 * llamadas separadas, en la práctica solo necesitamos una muestra
 * por invocación, así que descartamos la segunda.
 */
function sampleNormal(mean: number, std: number, rng: () => number): number {
  if (std <= 0) {
    throw new Error('normal: std debe ser > 0');
  }
  let u1 = rng();
  // Evitar log(0) en el caso degenerado u1 == 0.
  while (u1 <= 0) u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
  return mean + std * z;
}

/**
 * Algoritmo de Knuth para Poisson — eficiente para lambda chicos
 * (que es el caso típico en programas de tests). Para lambda > 30
 * podría usarse aproximación normal, pero no lo necesitamos aquí.
 */
function samplePoisson(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  for (;;) {
    k += 1;
    p *= rng();
    if (p <= L) return k - 1;
    // Salvaguarda anti-loop (lambda muy grande): truncar a 10 sigmas.
    if (k > lambda + 50 * Math.sqrt(lambda) + 100) return k - 1;
  }
}

function logFactorial(n: number): number {
  // Tabulamos los primeros valores para precisión exacta.
  let r = 0;
  for (let i = 2; i <= n; i++) r += Math.log(i);
  return r;
}

function clampProb(p: number): number {
  if (p < 0) return 0;
  if (p > 1) return 1;
  return p;
}
