// ============================================================
// ST Differential Privacy — Primitivas y composición
// ============================================================
//
// Mecanismos básicos (ε,δ)-DP con composición:
//
//   • Mecanismos de ruido: Laplace, Gaussian.
//   • Mecanismo exponencial (selección bajo utility).
//   • Randomized response (privacidad local).
//   • Queries derivadas: count, mean, histogram.
//   • Composición: básica, avanzada (Dwork-Rothblum-Vadhan),
//     paralela (queries sobre dominios disjuntos).
//   • Sensitivity calculators: global L1 y smooth (Nissim-Raskhodnikova-Smith).
//   • PRNG inyectable y determinista por seed para tests.
//
// Convenciones de borde:
//   • ε > 0 y δ ∈ [0, 1). Para δ > 0 usamos (ε,δ)-DP; el mecanismo
//     Gaussian exige δ > 0 (ruido subgaussiano no da δ = 0).
//   • La sensibilidad es L1 para Laplace, L2 para Gaussian.
//   • randomized response: bit ∈ {0,1}, con probabilidad p de
//     reportar la verdad y 1−p de flipear → ε = ln(p/(1−p)).
//   • Composición básica es uniforme y conservadora; la avanzada
//     usa la cota de Dwork-Rothblum-Vadhan (Theorem III.3, 2010)
//     y sólo mejora cuando k es razonablemente grande.

// ------------------------------------------------------------
// Interfaz pública del mecanismo
// ------------------------------------------------------------

// Mecanismo (ε,δ)-DP genérico. El método `apply` puede devolver el
// mismo tipo `T` (para mecanismos categóricos) o un `number` (para
// queries numéricas). Mantenemos la unión para permitir ambos casos
// sin obligar a wrappers.
export interface DPMechanism<T> {
  epsilon: number;
  delta: number;
  sensitivity: number;
  apply(input: T): T | number;
}

// ------------------------------------------------------------
// PRNG determinista para tests
// ------------------------------------------------------------

// Interfaz de RNG con tres sampleos canónicos: uniforme(0,1),
// Laplace(0, b) y Gaussian(μ, σ). Los implementadores deben aceptar
// llamadas en cualquier orden sin estado escondido entre ellos.
export interface DPRng {
  uniform(): number;
  laplace(b: number): number;
  gaussian(mu: number, sigma: number): number;
}

// Mulberry32 — PRNG de 32 bits, sencillo y determinista, suficiente
// para tests reproducibles. NO criptográfico: nunca usar para
// despliegues reales de DP.
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Construye un DPRng a partir de un seed (default: Math.random como
// arranque, equivalente a no-determinista). Para reproducibilidad
// pasar siempre un seed entero.
export function makeDPRng(seed?: number): DPRng {
  const u = seed === undefined ? Math.random : mulberry32(seed >>> 0);
  return {
    uniform: () => u(),
    laplace: (b: number) => {
      // Inverse-CDF: si U ~ Uniform(-1/2, 1/2), entonces
      // X = -b · sign(U) · ln(1 − 2|U|) ~ Laplace(0, b).
      const r = u() - 0.5;
      const sign = r < 0 ? -1 : 1;
      // Clamp para evitar log(0). El factor 1 − 2|U| ∈ (0, 1].
      const x = 1 - 2 * Math.abs(r);
      return -b * sign * Math.log(x === 0 ? Number.MIN_VALUE : x);
    },
    gaussian: (mu: number, sigma: number) => {
      // Box-Muller con dos uniformes independientes.
      let u1 = u();
      // Evitar log(0).
      if (u1 === 0) u1 = Number.MIN_VALUE;
      const u2 = u();
      const r = Math.sqrt(-2 * Math.log(u1));
      const theta = 2 * Math.PI * u2;
      return mu + sigma * r * Math.cos(theta);
    },
  };
}

// RNG por defecto (no determinista) reutilizado por todas las funciones
// públicas que no reciben un rng explícito.
const DEFAULT_RNG: DPRng = makeDPRng();

// ------------------------------------------------------------
// Validación de parámetros
// ------------------------------------------------------------

function assertEpsilon(epsilon: number): void {
  if (!Number.isFinite(epsilon) || epsilon <= 0) {
    throw new Error(`differential-privacy: epsilon debe ser finito y > 0 (got ${epsilon})`);
  }
}

function assertDelta(delta: number): void {
  if (!Number.isFinite(delta) || delta < 0 || delta >= 1) {
    throw new Error(`differential-privacy: delta debe estar en [0, 1) (got ${delta})`);
  }
}

function assertSensitivity(sensitivity: number): void {
  if (!Number.isFinite(sensitivity) || sensitivity < 0) {
    throw new Error(`differential-privacy: sensitivity debe ser finita y ≥ 0 (got ${sensitivity})`);
  }
}

// ------------------------------------------------------------
// Mecanismos de ruido
// ------------------------------------------------------------

/**
 * Mecanismo de Laplace: agrega ruido Laplace(0, Δ/ε) a `value`.
 * Da ε-DP puro (δ = 0) cuando Δ es la sensibilidad L1 de la query.
 */
export function laplaceNoise(
  value: number,
  sensitivity: number,
  epsilon: number,
  rng: DPRng = DEFAULT_RNG,
): number {
  assertEpsilon(epsilon);
  assertSensitivity(sensitivity);
  if (sensitivity === 0) return value;
  const b = sensitivity / epsilon;
  return value + rng.laplace(b);
}

/**
 * Mecanismo Gaussian: agrega N(0, σ²) con σ = Δ·√(2 ln(1.25/δ))/ε,
 * la calibración estándar de Dwork-Roth (Algorithmic Foundations,
 * Theorem A.1). Garantiza (ε,δ)-DP para ε ∈ (0, 1] cuando Δ es la
 * sensibilidad L2. Para ε > 1 la cota sigue siendo válida pero deja
 * de ser tight; los frameworks modernos prefieren la "analytic
 * Gaussian" (Balle-Wang 2018) — la dejamos para una iteración futura.
 */
export function gaussianNoise(
  value: number,
  sensitivity: number,
  epsilon: number,
  delta: number,
  rng: DPRng = DEFAULT_RNG,
): number {
  assertEpsilon(epsilon);
  assertDelta(delta);
  assertSensitivity(sensitivity);
  if (delta === 0) {
    throw new Error('gaussianNoise: requiere delta > 0 (ε,δ)-DP');
  }
  if (sensitivity === 0) return value;
  const sigma = (sensitivity * Math.sqrt(2 * Math.log(1.25 / delta))) / epsilon;
  return value + rng.gaussian(0, sigma);
}

/**
 * Mecanismo exponencial: elige un item con probabilidad proporcional
 * a exp(ε · score(item) / (2 · sensitivity)). Implementa la
 * formulación canónica (McSherry-Talwar 2007). Da ε-DP cuando
 * `sensitivity` es la sensibilidad de la función de score.
 */
export function exponentialMechanism<T>(
  items: T[],
  score: (item: T) => number,
  sensitivity: number,
  epsilon: number,
  rng: DPRng = DEFAULT_RNG,
): T {
  assertEpsilon(epsilon);
  assertSensitivity(sensitivity);
  if (items.length === 0) {
    throw new Error('exponentialMechanism: items vacío');
  }
  if (sensitivity === 0) {
    // Determinista: máximo argmax estricto.
    let best = items[0];
    let bestScore = score(best);
    for (let i = 1; i < items.length; i++) {
      const cand = items[i];
      const s = score(cand);
      if (s > bestScore) {
        bestScore = s;
        best = cand;
      }
    }
    return best;
  }
  const scores = items.map((it) => score(it));
  // Estabilización numérica: restar el máximo antes de exponenciar.
  let maxScore = -Infinity;
  for (const s of scores) {
    if (s > maxScore) maxScore = s;
  }
  const weights = scores.map((s) => Math.exp((epsilon * (s - maxScore)) / (2 * sensitivity)));
  let total = 0;
  for (const w of weights) total += w;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('exponentialMechanism: pesos no normalizables');
  }
  const u = rng.uniform() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (u < acc) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Randomized response binario: reporta `bit` con probabilidad `p`,
 * y `¬bit` con probabilidad 1 − p. Garantiza ε-DP local con
 * ε = |ln(p / (1 − p))|. La elección clásica p = 3/4 da ε = ln 3.
 */
export function randomizedResponse(bit: boolean, p: number, rng: DPRng = DEFAULT_RNG): boolean {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new Error(`randomizedResponse: p debe estar en (0, 1) (got ${p})`);
  }
  return rng.uniform() < p ? bit : !bit;
}

/**
 * ε equivalente a un mecanismo de randomized response con
 * probabilidad de verdad `p`. Útil para test del trade-off.
 */
export function randomizedResponseEpsilon(p: number): number {
  if (!Number.isFinite(p) || p <= 0 || p >= 1) {
    throw new Error(`randomizedResponseEpsilon: p debe estar en (0, 1) (got ${p})`);
  }
  return Math.abs(Math.log(p / (1 - p)));
}

// ------------------------------------------------------------
// Queries derivadas
// ------------------------------------------------------------

/**
 * Conteo DP: cuenta cuántos valores cumplen `predicate` y aplica
 * ruido Laplace con sensibilidad 1 (cambiar un registro mueve el
 * conteo en a lo más 1). El resultado se redondea al entero más
 * cercano y se clamp-a a ≥ 0 (un conteo nunca es negativo).
 */
export function dpCount<T>(
  values: T[],
  predicate: (v: T) => boolean,
  epsilon: number,
  rng: DPRng = DEFAULT_RNG,
): number {
  assertEpsilon(epsilon);
  let count = 0;
  for (const v of values) {
    if (predicate(v)) count++;
  }
  const noisy = laplaceNoise(count, 1, epsilon, rng);
  return Math.max(0, Math.round(noisy));
}

/**
 * Media DP de valores acotados al rango [low, high]: clipea cada
 * valor al rango, calcula la media empírica y aplica Laplace con
 * sensibilidad (high − low) / n. Asumimos n público.
 */
export function dpMean(
  values: number[],
  range: [number, number],
  epsilon: number,
  rng: DPRng = DEFAULT_RNG,
): number {
  assertEpsilon(epsilon);
  const [low, high] = range;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    throw new Error(`dpMean: rango inválido [${low}, ${high}]`);
  }
  if (values.length === 0) {
    throw new Error('dpMean: values vacío');
  }
  const n = values.length;
  let sum = 0;
  for (const v of values) {
    const clipped = v < low ? low : v > high ? high : v;
    sum += clipped;
  }
  const mean = sum / n;
  const sensitivity = (high - low) / n;
  return laplaceNoise(mean, sensitivity, epsilon, rng);
}

/**
 * Histograma DP sobre `categories`: cuenta ocurrencias por categoría
 * y agrega ruido Laplace independiente a cada bin con sensibilidad 1.
 * Asumimos que cada registro pertenece a a lo más una categoría
 * (cambiar un registro mueve a lo más un bin en ±1). Si las
 * categorías son disjuntas y cubrentes, este es un caso clásico de
 * composición paralela: el ε total = ε.
 */
export function dpHistogram<T>(
  values: T[],
  categories: T[],
  epsilon: number,
  rng: DPRng = DEFAULT_RNG,
): Map<T, number> {
  assertEpsilon(epsilon);
  const counts = new Map<T, number>();
  for (const c of categories) counts.set(c, 0);
  for (const v of values) {
    const cur = counts.get(v);
    if (cur !== undefined) counts.set(v, cur + 1);
  }
  const out = new Map<T, number>();
  for (const [cat, cnt] of counts) {
    const noisy = laplaceNoise(cnt, 1, epsilon, rng);
    out.set(cat, Math.max(0, Math.round(noisy)));
  }
  return out;
}

// ------------------------------------------------------------
// Composición
// ------------------------------------------------------------

export interface PrivacyBudget {
  epsilon: number;
  delta: number;
}

/**
 * Composición básica (Dwork-McSherry-Nissim-Smith 2006, Theorem 3.16
 * en Algorithmic Foundations): la composición secuencial de k
 * mecanismos (ε_i, δ_i)-DP da (Σ ε_i, Σ δ_i)-DP. Cota uniforme y
 * conservadora.
 */
export function basicComposition(mechanisms: PrivacyBudget[]): PrivacyBudget {
  let epsilon = 0;
  let delta = 0;
  for (const m of mechanisms) {
    assertEpsilon(m.epsilon);
    assertDelta(m.delta);
    epsilon += m.epsilon;
    delta += m.delta;
  }
  return { epsilon, delta };
}

/**
 * Composición avanzada (Dwork-Rothblum-Vadhan 2010, Theorem III.3):
 * para k mecanismos cada uno (ε, δ)-DP, el compuesto es
 *
 *   (√(2 k ln(1/δ')) · ε  +  k · ε · (e^ε − 1),  k δ + δ')-DP
 *
 * para cualquier δ' > 0. Cuando los ε_i son heterogéneos usamos el
 * máximo como cota uniforme (válida pero no óptima; el tight bound
 * heterogéneo requiere RDP/zCDP, fuera del alcance de este módulo).
 *
 * `deltaTotal` es el δ' adicional que el caller acepta pagar.
 * Devuelve el (ε,δ) total cubriendo el slack δ'.
 */
export function advancedComposition(
  mechanisms: PrivacyBudget[],
  deltaTotal: number,
): PrivacyBudget {
  if (mechanisms.length === 0) {
    return { epsilon: 0, delta: deltaTotal };
  }
  assertDelta(deltaTotal);
  if (deltaTotal <= 0) {
    throw new Error('advancedComposition: deltaTotal debe ser > 0');
  }
  let maxEps = 0;
  let sumDelta = 0;
  for (const m of mechanisms) {
    assertEpsilon(m.epsilon);
    assertDelta(m.delta);
    if (m.epsilon > maxEps) maxEps = m.epsilon;
    sumDelta += m.delta;
  }
  const k = mechanisms.length;
  const eps = maxEps;
  const epsilonComposed =
    Math.sqrt(2 * k * Math.log(1 / deltaTotal)) * eps + k * eps * (Math.exp(eps) - 1);
  return { epsilon: epsilonComposed, delta: sumDelta + deltaTotal };
}

/**
 * Composición paralela: cuando k mecanismos actúan sobre particiones
 * disjuntas del dataset, el ε total es el máximo (no la suma), y el
 * δ total es el máximo (no la suma). Caso clásico: histograma con
 * categorías mutuamente excluyentes.
 */
export function parallelComposition(mechanisms: PrivacyBudget[]): PrivacyBudget {
  let maxEps = 0;
  let maxDelta = 0;
  for (const m of mechanisms) {
    assertEpsilon(m.epsilon);
    assertDelta(m.delta);
    if (m.epsilon > maxEps) maxEps = m.epsilon;
    if (m.delta > maxDelta) maxDelta = m.delta;
  }
  return { epsilon: maxEps, delta: maxDelta };
}

// ------------------------------------------------------------
// Sensitivity calculators
// ------------------------------------------------------------

/**
 * Sensibilidad global L1: el máximo de |f(D) − f(D')| sobre la
 * lista de pares neighbours suministrada. Implementación empírica
 * pensada para tests/diagnóstico — la sensibilidad real exige
 * razonar sobre todas las parejas válidas, no sólo las muestreadas.
 */
export function globalSensitivityL1(
  fn: (data: number[]) => number,
  neighbors: Array<[number[], number[]]>,
): number {
  let max = 0;
  for (const [a, b] of neighbors) {
    const diff = Math.abs(fn(a) - fn(b));
    if (diff > max) max = diff;
  }
  return max;
}

/**
 * Sensibilidad suave (Nissim-Raskhodnikova-Smith 2007):
 *
 *   S*_β(f, D) = max_k e^{−β·k} · LS^{(k)}(f, D)
 *
 * donde LS^{(k)} es la sensibilidad local a distancia k. Aproximamos
 * variando vecinos hasta `data.length` (cota superior de k). Para
 * datasets grandes, restringir el k máximo via la longitud del
 * propio dataset.
 *
 * Esta es una versión basada en mutaciones simples (cambiar un valor
 * por el mín o máx empírico) — suficiente para median/mean acotados
 * en tests, no un cálculo general.
 */
export function smoothSensitivity(
  fn: (data: number[]) => number,
  data: number[],
  beta: number,
): number {
  if (!Number.isFinite(beta) || beta <= 0) {
    throw new Error(`smoothSensitivity: beta debe ser > 0 (got ${beta})`);
  }
  if (data.length === 0) return 0;
  // Determinar rango empírico para sintetizar vecinos extremos.
  let lo = data[0];
  let hi = data[0];
  for (const v of data) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const base = fn(data);
  let max = 0;
  // Para cada k = 0..n, calculamos LS^{(k)} aproximada cambiando los
  // primeros k valores a `lo` o `hi` (el extremo que más mueve la query).
  for (let k = 0; k <= data.length; k++) {
    // Vecinos a distancia k: probar mutar k posiciones a lo o hi.
    // Esto es heurístico — para mediana/media acotadas es exacto.
    const mutLo = data.slice();
    const mutHi = data.slice();
    for (let i = 0; i < k; i++) {
      mutLo[i] = lo;
      mutHi[i] = hi;
    }
    const dLo = Math.abs(fn(mutLo) - base);
    const dHi = Math.abs(fn(mutHi) - base);
    const lsK = Math.max(dLo, dHi);
    const smoothed = Math.exp(-beta * k) * lsK;
    if (smoothed > max) max = smoothed;
  }
  return max;
}
