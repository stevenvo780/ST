// ============================================================
// Probabilistic Programming — Inference engines
// ============================================================
//
// Cuatro backends:
//
//   1. `enumerate`         — enumeración exacta para programas con
//                            soporte discreto finito. Recorre el
//                            árbol de ramificaciones, multiplica
//                            probabilidades y agrega por valor de
//                            retorno. Exacto, costo O(|soporte|).
//   2. `rejectionSample`   — muestreo simple del prior; descarta
//                            trazas con `observe(false)`. Sesgo 0,
//                            varianza alta si la aceptación es baja.
//   3. `importanceSample`  — muestreo del prior con pesos
//                            log-acumulados; usa `factor()` y el
//                            log-pdf de las observes "soft" como
//                            log-weight. Reporta ESS para diagnóstico.
//   4. `metropolisHastings` — single-site MCMC: re-muestrea uno de
//                            los sample sites por iteración y acepta
//                            según ratio de pesos. Devuelve cadena
//                            tras burn-in y thinning.
//
// Todos usan el mismo `PProgram<T>` y el mismo `Sampler` interface.

import { enumerateSupport, logPdf, sampleFrom } from './distributions';
import type { Distribution, InferenceOptions, PProgram, PosteriorSummary, Sampler } from './types';

// ── Helpers de resumen ───────────────────────────────────────

/**
 * Determina si todos los samples son numéricos (incluyendo booleanos,
 * que se interpretan como 0/1). Solo entonces tiene sentido calcular
 * media/std/quantiles continuos.
 */
function allNumericLike<T>(samples: T[]): boolean {
  if (samples.length === 0) return false;
  for (const s of samples) {
    if (typeof s !== 'number' && typeof s !== 'boolean') return false;
  }
  return true;
}

function toNumber(v: unknown): number {
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v as number;
}

/**
 * Histograma por igualdad estructural. Para tipos primitivos usa
 * `Map.set(value, count + 1)`. Para objetos/arrays usa JSON.stringify
 * como clave canónica — suficiente para los casos típicos de tests.
 */
function buildHistogram<T>(samples: T[], weights?: number[]): Map<T, number> {
  const hist = new Map<T, number>();
  // Para objetos, normalizamos via JSON; mantenemos un map de
  // clave canónica → valor original para devolver el objeto real.
  const canonicalToValue = new Map<string, T>();
  const isObjectLike = (v: unknown): boolean =>
    v !== null && (typeof v === 'object' || Array.isArray(v));
  let totalW = 0;
  for (let i = 0; i < samples.length; i++) {
    const w = weights ? (weights[i] ?? 0) : 1;
    totalW += w;
  }
  if (totalW <= 0) return hist;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const w = (weights ? (weights[i] ?? 0) : 1) / totalW;
    if (isObjectLike(s)) {
      const key = JSON.stringify(s);
      if (!canonicalToValue.has(key)) canonicalToValue.set(key, s);
      const canonical = canonicalToValue.get(key) as T;
      hist.set(canonical, (hist.get(canonical) ?? 0) + w);
    } else {
      hist.set(s, (hist.get(s) ?? 0) + w);
    }
  }
  return hist;
}

function computeQuantiles(sorted: number[], qs: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  if (sorted.length === 0) return out;
  for (const q of qs) {
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
    out[q] = sorted[idx];
  }
  return out;
}

function summarize<T>(
  samples: T[],
  opts: { weights?: number[]; ess?: number; accepted?: number; total?: number } = {},
): PosteriorSummary<T> {
  const histogram = buildHistogram(samples, opts.weights);
  const summary: PosteriorSummary<T> = { samples, histogram };
  if (opts.ess !== undefined) summary.ess = opts.ess;
  if (opts.accepted !== undefined) {
    summary.numAccepted = opts.accepted;
    if (opts.total !== undefined && opts.total > 0) {
      summary.acceptanceRate = opts.accepted / opts.total;
    }
  }
  if (opts.total !== undefined) summary.totalAttempts = opts.total;
  if (allNumericLike(samples)) {
    const nums = samples.map(toNumber);
    const weights = opts.weights;
    let sumW = 0;
    if (weights) {
      for (let i = 0; i < nums.length; i++) sumW += weights[i] ?? 0;
    }
    if (weights && sumW > 0) {
      let mean = 0;
      for (let i = 0; i < nums.length; i++) {
        mean += (nums[i] ?? 0) * ((weights[i] ?? 0) / sumW);
      }
      let varSum = 0;
      for (let i = 0; i < nums.length; i++) {
        const d = (nums[i] ?? 0) - mean;
        varSum += d * d * ((weights[i] ?? 0) / sumW);
      }
      summary.mean = mean;
      summary.std = Math.sqrt(varSum);
    } else {
      const mean = nums.reduce((s, x) => s + x, 0) / nums.length;
      const variance =
        nums.reduce((s, x) => s + (x - mean) * (x - mean), 0) / Math.max(1, nums.length - 1);
      summary.mean = mean;
      summary.std = Math.sqrt(variance);
    }
    const sorted = nums.slice().sort((a, b) => a - b);
    summary.quantiles = computeQuantiles(sorted, [0.025, 0.5, 0.975]);
  }
  return summary;
}

// ── 1. Enumeración exacta ────────────────────────────────────

/**
 * Estado del enumerador: pila de elecciones tomadas y probabilidad
 * acumulada de la rama actual.
 */
interface EnumState {
  /** Decisiones ya tomadas en esta rama (por orden de sample). */
  choices: unknown[];
  /** Probabilidad (en espacio lineal) acumulada en esta rama. */
  weight: number;
  /** Cursor: qué decisión corresponde leer en la siguiente `sample`. */
  cursor: number;
}

/**
 * Enumera todas las trayectorias del programa, multiplicando la
 * probabilidad de cada decisión discreta y descartando ramas con
 * `observe(false)`. Soporta `factor(logW)` agregando exp(logW) al
 * peso. No soporta distribuciones continuas (uniform, normal) ni
 * `poisson` — lanza error si las encuentra.
 *
 * `maxStates` protege de explosión combinatoria: corta la
 * enumeración cuando el número de ramas pendientes la supera.
 */
export function enumerate<T>(program: PProgram<T>, maxStates = 100_000): PosteriorSummary<T> {
  // Implementación: BFS sobre el árbol de elecciones discretas.
  // Cada ruta produce un valor de retorno y un peso; al final
  // agregamos por igualdad estructural en el histograma.
  interface Path {
    choices: unknown[];
    weight: number;
  }
  // Empezamos con una sola rama vacía (peso 1).
  let frontier: Path[] = [{ choices: [], weight: 1 }];
  const completed: { value: T; weight: number }[] = [];
  let safetyCounter = 0;

  while (frontier.length > 0) {
    safetyCounter += frontier.length;
    if (safetyCounter > maxStates) {
      throw new Error(
        `enumerate: superado el límite de ${maxStates} estados; ` +
          'usá rejection/importance/MH para soporte grande.',
      );
    }
    const nextFrontier: Path[] = [];
    for (const path of frontier) {
      const state: EnumState = {
        choices: path.choices,
        weight: path.weight,
        cursor: 0,
      };
      const result = runEnumPath<T>(program, state, nextFrontier);
      if (result !== undefined) {
        completed.push({ value: result.value, weight: result.weight });
      }
    }
    frontier = nextFrontier;
  }

  // Normalizar y montar samples + weights.
  let total = 0;
  for (const c of completed) total += c.weight;
  if (total <= 0) {
    // Toda la masa fue descartada por observes.
    return {
      samples: [],
      histogram: new Map(),
    };
  }
  const samples = completed.map((c) => c.value);
  const weights = completed.map((c) => c.weight / total);
  return summarize(samples, { weights });
}

/**
 * Ejecuta el programa siguiendo una ruta de decisiones pre-elegidas.
 * Cuando el programa pide un `sample` y la ruta ya no tiene más
 * decisiones, ramifica: empuja TODAS las posibles continuaciones
 * al frontier y aborta la ejecución actual con `_BRANCH`.
 *
 * Devuelve `{value, weight}` si la ruta terminó exitosamente, o
 * `undefined` si fue descartada (observe falso, factor -inf, o
 * ramificó hacia el frontier).
 */
function runEnumPath<T>(
  program: PProgram<T>,
  state: EnumState,
  frontier: { choices: unknown[]; weight: number }[],
): { value: T; weight: number } | undefined {
  // Excepciones internas para señalizar (a) que la ruta debe
  // ramificarse al frontier sin continuar la ejecución, y (b) que
  // la traza es inconsistente (observe falso o factor -inf).
  class BranchException extends Error {
    constructor() {
      super('branch');
      this.name = 'BranchException';
    }
  }
  class RejectException extends Error {
    constructor() {
      super('reject');
      this.name = 'RejectException';
    }
  }
  const sampler: Sampler = {
    sample<X>(dist: Distribution<X>): X {
      if (state.cursor < state.choices.length) {
        const v = state.choices[state.cursor];
        state.cursor += 1;
        return v as X;
      }
      // Ramificar: agregar todos los valores del soporte al frontier.
      const support = enumerateSupport(dist);
      for (const [value, p] of support) {
        if (p <= 0) continue;
        frontier.push({
          choices: [...state.choices, value],
          weight: state.weight * p,
        });
      }
      throw new BranchException();
    },
    observe(condition: boolean): void {
      if (!condition) throw new RejectException();
    },
    factor(logWeight: number): void {
      if (logWeight === -Infinity) throw new RejectException();
      state.weight *= Math.exp(logWeight);
    },
  };
  try {
    const value = program(sampler);
    return { value, weight: state.weight };
  } catch (err) {
    if (err instanceof BranchException) return undefined;
    if (err instanceof RejectException) return undefined;
    throw err;
  }
}

// ── 2. Rejection sampling ────────────────────────────────────

/**
 * Muestrea N trazas del prior; cualquier traza con `observe(false)`
 * o `factor(-Infinity)` se descarta y se reintenta.
 *
 * `factor(logW)` con `logW < 0` se trata como aceptación
 * probabilística: con prob `exp(logW)` la traza se acepta, en
 * caso contrario se descarta. `logW > 0` es legal pero raro;
 * se acepta siempre (rejection no maneja pesos > 1).
 */
export function rejectionSample<T>(
  program: PProgram<T>,
  opts: InferenceOptions = {},
): PosteriorSummary<T> {
  const numSamples = opts.numSamples ?? 1000;
  const maxAttempts = opts.maxAttempts ?? numSamples * 100;
  const rng = opts.rng ?? Math.random;
  const samples: T[] = [];
  let attempts = 0;

  while (samples.length < numSamples) {
    attempts += 1;
    if (attempts > maxAttempts) {
      throw new Error(
        `rejection: ${attempts} intentos para ${samples.length}/${numSamples} muestras; ` +
          'el observe es demasiado restrictivo. Probá importance/MH.',
      );
    }
    const result = runOneRejection(program, rng);
    if (result !== undefined) samples.push(result);
  }

  return summarize(samples, { total: attempts });
}

class RejectError extends Error {
  constructor() {
    super('reject');
    this.name = 'RejectError';
  }
}

function runOneRejection<T>(program: PProgram<T>, rng: () => number): T | undefined {
  const sampler: Sampler = {
    sample<X>(dist: Distribution<X>): X {
      return sampleFrom(dist, rng);
    },
    observe(condition: boolean): void {
      if (!condition) throw new RejectError();
    },
    factor(logWeight: number): void {
      if (logWeight >= 0) return;
      if (logWeight === -Infinity || rng() >= Math.exp(logWeight)) {
        throw new RejectError();
      }
    },
  };
  try {
    return program(sampler);
  } catch (err) {
    if (err instanceof RejectError) return undefined;
    throw err;
  }
}

// ── 3. Importance sampling ───────────────────────────────────

/**
 * Muestrea trazas del prior y acumula log-pesos de `observe`
 * (treated as -Infinity si false, 0 si true) y `factor`. Devuelve
 * los samples + sus pesos normalizados; el histograma y mean/std
 * reflejan estos pesos.
 *
 * Reporta ESS = (Σwᵢ)² / Σwᵢ² como diagnóstico de degeneración.
 */
export function importanceSample<T>(
  program: PProgram<T>,
  opts: InferenceOptions = {},
): PosteriorSummary<T> {
  const numSamples = opts.numSamples ?? 1000;
  const rng = opts.rng ?? Math.random;
  const samples: T[] = [];
  const logWeights: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const result = runOneImportance(program, rng);
    if (result !== undefined) {
      samples.push(result.value);
      logWeights.push(result.logWeight);
    }
  }

  if (samples.length === 0) {
    throw new Error('importance: 0 samples válidos; revisá las observes.');
  }

  // Normalizar log-weights (estable numéricamente: restar el máximo).
  const maxLW = Math.max(...logWeights);
  let totalW = 0;
  const expWeights = logWeights.map((lw) => {
    const w = Math.exp(lw - maxLW);
    totalW += w;
    return w;
  });
  const weights = expWeights.map((w) => w / totalW);

  // ESS = (Σwᵢ)² / Σwᵢ² con weights ya normalizados ⇒ 1 / Σwᵢ².
  let sumSq = 0;
  for (const w of weights) sumSq += w * w;
  const ess = sumSq > 0 ? 1 / sumSq : 0;

  return summarize(samples, { weights, ess, total: numSamples });
}

function runOneImportance<T>(
  program: PProgram<T>,
  rng: () => number,
): { value: T; logWeight: number } | undefined {
  let logWeight = 0;
  let rejected = false;
  const sampler: Sampler = {
    sample<X>(dist: Distribution<X>): X {
      return sampleFrom(dist, rng);
    },
    observe(condition: boolean): void {
      if (!condition) {
        rejected = true;
        logWeight = -Infinity;
      }
    },
    factor(logW: number): void {
      logWeight += logW;
    },
  };
  const value = program(sampler);
  if (rejected || !Number.isFinite(logWeight)) return undefined;
  return { value, logWeight };
}

// ── 4. Metropolis-Hastings (single-site) ─────────────────────

/**
 * Una traza grabada del programa: secuencia de samples con sus
 * distribuciones, log-peso total y valor de retorno.
 *
 * Para single-site MH, elegimos al azar un sample site, re-muestreamos
 * desde su distribución (proposal = prior) y re-ejecutamos el
 * programa. El ratio de Hastings se simplifica a la razón de pesos
 * (prior + factors + observes) — porque proposal = prior, los
 * términos de q se cancelan.
 */
interface Trace<T> {
  /** Cada sample: distribución usada y valor producido. */
  sites: { dist: Distribution<unknown>; value: unknown }[];
  logWeight: number;
  value: T;
  rejected: boolean;
}

/**
 * MCMC Metropolis-Hastings sobre el espacio de trazas del programa.
 *
 * Convenciones:
 *   - `burnIn` itera sin contar (default 1000).
 *   - `thin` toma 1 de cada N (default 1).
 *   - Single-site: en cada iteración, re-muestrea UN sample site
 *     (elegido uniforme) y re-ejecuta. Si el número de sample sites
 *     cambia entre trazas, igual funciona (re-ejecutamos forzando
 *     el valor anterior en los sites que coinciden).
 *   - Reporta `acceptanceRate` para diagnóstico.
 */
export function metropolisHastings<T>(
  program: PProgram<T>,
  opts: InferenceOptions = {},
): PosteriorSummary<T> {
  const numSamples = opts.numSamples ?? 1000;
  const burnIn = opts.burnIn ?? 1000;
  const thin = opts.thin ?? 1;
  const rng = opts.rng ?? Math.random;

  // Trace inicial: ejecutamos hasta encontrar uno con peso finito.
  let current = runFresh(program, rng);
  let attempts = 0;
  while (!Number.isFinite(current.logWeight) || current.rejected) {
    attempts += 1;
    if (attempts > 10_000) {
      throw new Error(
        'MH: no se encontró traza inicial con peso finito en 10k intentos; ' +
          'el observe podría ser inalcanzable.',
      );
    }
    current = runFresh(program, rng);
  }

  const totalIters = burnIn + numSamples * thin;
  const samples: T[] = [];
  let accepted = 0;
  let totalProposals = 0;

  for (let i = 0; i < totalIters; i++) {
    if (current.sites.length === 0) {
      // Programa sin samples: no hay nada que proponer. Solo
      // re-evaluamos (debería ser determinista módulo factor).
      const fresh = runFresh(program, rng);
      if (Number.isFinite(fresh.logWeight) && !fresh.rejected) current = fresh;
    } else {
      totalProposals += 1;
      const siteIdx = Math.floor(rng() * current.sites.length);
      const site = current.sites[siteIdx];
      if (!site) continue;
      // Proposal: re-muestrear desde la distribución del site.
      const newValue = sampleFrom(site.dist, rng);
      // Re-ejecutar el programa forzando: en `siteIdx` el valor
      // nuevo, en los demás sites el valor anterior (si coincide
      // la distribución). Si la estructura cambia (forks), seguimos
      // muestreando de prior para los sites nuevos.
      const proposal = runWithReplay(program, current, siteIdx, newValue, rng);
      if (proposal.rejected || !Number.isFinite(proposal.logWeight)) {
        // proposal con peso 0: rechazo automático.
        continue;
      }
      // Acceptance ratio: π(x') q(x | x') / (π(x) q(x' | x)).
      // Con single-site proposal del prior, q(x'|x) = p(site_new) y
      // q(x|x') = p(site_old). Esos se cancelan con los priors de
      // logWeight (que NO incluimos: usamos sólo observes+factors
      // y los priors de los SITES NO MODIFICADOS se cancelan).
      // Implementación pragmática: log-ratio = newLW - oldLW.
      const logRatio = proposal.logWeight - current.logWeight;
      const u = rng();
      if (Math.log(u) < logRatio) {
        current = proposal;
        accepted += 1;
      }
    }
    if (i >= burnIn && (i - burnIn) % thin === 0) {
      samples.push(current.value);
    }
  }

  return summarize(samples, {
    accepted,
    total: totalProposals,
  });
}

/**
 * Ejecuta el programa sampleando del prior (sin replay), grabando
 * cada sample para construir una `Trace`.
 */
function runFresh<T>(program: PProgram<T>, rng: () => number): Trace<T> {
  const sites: { dist: Distribution<unknown>; value: unknown }[] = [];
  let logWeight = 0;
  let rejected = false;
  const sampler: Sampler = {
    sample<X>(dist: Distribution<X>): X {
      const value = sampleFrom(dist, rng);
      sites.push({ dist: dist as Distribution<unknown>, value });
      // Incluimos log-prior en logWeight para que el ratio MH cierre.
      logWeight += logPdf(dist, value);
      return value;
    },
    observe(condition: boolean): void {
      if (!condition) {
        rejected = true;
        logWeight = -Infinity;
      }
    },
    factor(logW: number): void {
      logWeight += logW;
    },
  };
  const value = program(sampler);
  return { sites, logWeight, value, rejected };
}

/**
 * Re-ejecuta el programa "replayendo" la traza previa, pero
 * forzando un nuevo valor en el sample site `replaceIdx`. Los
 * sites posteriores se intentan replayear con su valor anterior;
 * si el programa cambia su estructura (toma otra rama), los sites
 * extra se muestrean del prior.
 */
function runWithReplay<T>(
  program: PProgram<T>,
  previous: Trace<T>,
  replaceIdx: number,
  newValue: unknown,
  rng: () => number,
): Trace<T> {
  const sites: { dist: Distribution<unknown>; value: unknown }[] = [];
  let logWeight = 0;
  let rejected = false;
  let cursor = 0;
  const sampler: Sampler = {
    sample<X>(dist: Distribution<X>): X {
      const idx = cursor;
      cursor += 1;
      let value: X;
      if (idx === replaceIdx) {
        value = newValue as X;
      } else {
        const prev = previous.sites[idx];
        // Reusar si misma distribución (kind igual y parámetros iguales).
        if (prev && distEquals(prev.dist, dist as Distribution<unknown>)) {
          value = prev.value as X;
        } else {
          value = sampleFrom(dist, rng);
        }
      }
      sites.push({ dist: dist as Distribution<unknown>, value });
      logWeight += logPdf(dist, value);
      return value;
    },
    observe(condition: boolean): void {
      if (!condition) {
        rejected = true;
        logWeight = -Infinity;
      }
    },
    factor(logW: number): void {
      logWeight += logW;
    },
  };
  const value = program(sampler);
  return { sites, logWeight, value, rejected };
}

/**
 * Igualdad estructural de distribuciones (para replay): mismo kind
 * y mismos parámetros. Para arrays/maps compara longitud + entradas.
 */
function distEquals(a: Distribution<unknown>, b: Distribution<unknown>): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'bernoulli':
      return a.p === (b as typeof a).p;
    case 'uniform': {
      const bb = b as typeof a;
      return a.low === bb.low && a.high === bb.high;
    }
    case 'normal': {
      const bb = b as typeof a;
      return a.mean === bb.mean && a.std === bb.std;
    }
    case 'poisson':
      return a.lambda === (b as typeof a).lambda;
    case 'categorical': {
      const bb = b as typeof a;
      if (a.values.length !== bb.values.length) return false;
      for (let i = 0; i < a.values.length; i++) {
        if (a.values[i] !== bb.values[i]) return false;
        if (a.probs[i] !== bb.probs[i]) return false;
      }
      return true;
    }
    case 'discrete': {
      const bb = b as typeof a;
      if (a.pmf.size !== bb.pmf.size) return false;
      for (const [k, p] of a.pmf) {
        if (bb.pmf.get(k) !== p) return false;
      }
      return true;
    }
  }
}
