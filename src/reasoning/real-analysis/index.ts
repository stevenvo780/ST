// ============================================================
// ST Real Analysis — Primitivas formales (límites ε-δ, continuidad,
// derivadas, integrales, series, Taylor, MVT)
// ============================================================
// Estas primitivas son *numéricas*: no decidimos análisis real
// exactamente (eso es indecidible en general), sino que verificamos
// claims con tolerancia explícita ε > 0 sobre muestreos finitos.
//
// Convención: una función real es `RealFn = (x: number) => number`.
// Toda función que dependa de muestreos expone `eps`/`samples`/`tol`
// para que quien llama pueda ajustar el rigor numérico.
// ============================================================

export type RealFn = (x: number) => number;

// ── Constantes y helpers internos ────────────────────────────

const DEFAULT_EPS = 1e-6;
const DEFAULT_SAMPLES = 200;

function isFiniteNumber(x: number): boolean {
  return Number.isFinite(x);
}

function safeEval(fn: RealFn, x: number): number | null {
  try {
    const v = fn(x);
    return isFiniteNumber(v) ? v : null;
  } catch {
    return null;
  }
}

// ── 1. Límite ε-δ ────────────────────────────────────────────

export interface LimitClaim {
  fn: RealFn;
  point: number;
  value: number;
}

export interface LimitVerification {
  holds: boolean;
  counterexample?: number;
  suggestedDelta?: number;
}

/**
 * Verifica numéricamente la afirmación
 *   ∀ε>0 ∃δ>0 ∀x (0 < |x-point| < δ → |fn(x)-value| < ε)
 * para el ε dado. Devuelve δ sugerido (o counterexample si falla
 * incluso con δ extremadamente pequeño).
 *
 * Estrategia: bisecta δ desde 1 hacia abajo, muestreando puntos en
 * (point-δ, point) ∪ (point, point+δ); si todos cumplen |f(x)-L|<ε,
 * δ es válido. Si no encontramos δ válido tras `maxIter` iteraciones,
 * el último x que falló se reporta como counterexample.
 */
export function verifyLimit(
  claim: LimitClaim,
  epsilon: number,
  deltaFinder?: (eps: number) => number,
): LimitVerification {
  if (epsilon <= 0) return { holds: false };

  const { fn, point, value } = claim;
  const maxIter = 60;
  const samplesPerDelta = 40;

  let delta = deltaFinder ? deltaFinder(epsilon) : 1.0;
  if (!isFiniteNumber(delta) || delta <= 0) delta = 1.0;

  let lastCounter: number | undefined;

  for (let iter = 0; iter < maxIter; iter++) {
    let allOk = true;
    let worstX = point;
    let worstDiff = -Infinity;

    for (let i = 1; i <= samplesPerDelta; i++) {
      const frac = i / (samplesPerDelta + 1);
      const dx = delta * frac;
      const candidates = [point + dx, point - dx];
      for (const x of candidates) {
        if (x === point) continue;
        const v = safeEval(fn, x);
        if (v === null) {
          allOk = false;
          worstX = x;
          worstDiff = Infinity;
          break;
        }
        const diff = Math.abs(v - value);
        if (diff > worstDiff) {
          worstDiff = diff;
          worstX = x;
        }
        if (diff >= epsilon) {
          allOk = false;
          // seguimos para encontrar el peor punto, pero podríamos break
        }
      }
      if (!allOk && worstDiff === Infinity) break;
    }

    if (allOk && worstDiff < epsilon) {
      return { holds: true, suggestedDelta: delta };
    }
    lastCounter = worstX;
    delta = delta / 2;
    if (delta < 1e-15) break;
  }
  return { holds: false, counterexample: lastCounter };
}

/**
 * Encuentra (o detecta divergencia/indeterminación de) lim_{x→point} fn(x)
 * por muestreo bilateral con refinamiento sucesivo.
 *
 * Devuelve:
 *   • número L si las dos colas convergen al mismo valor con tolerancia
 *   • 'diverges' si crece sin cota
 *   • 'unknown' si las colas no coinciden (límite no existe / discontinuidad de salto)
 */
export function findLimit(
  fn: RealFn,
  point: number,
  opts?: { tolerance?: number; samples?: number },
): number | 'diverges' | 'unknown' {
  const tol = opts?.tolerance ?? 1e-7;
  const samples = opts?.samples ?? 30;

  const leftVals: number[] = [];
  const rightVals: number[] = [];
  for (let k = 1; k <= samples; k++) {
    const h = Math.pow(0.5, k);
    const vl = safeEval(fn, point - h);
    const vr = safeEval(fn, point + h);
    if (vl !== null) leftVals.push(vl);
    if (vr !== null) rightVals.push(vr);
  }

  if (leftVals.length < 5 || rightVals.length < 5) return 'unknown';

  const tail = (arr: number[]): number[] => arr.slice(-Math.min(5, arr.length));
  const lt = tail(leftVals);
  const rt = tail(rightVals);

  // detecto divergencia: valores absolutos crecen sin cota
  const lastL = lt[lt.length - 1];
  const lastR = rt[rt.length - 1];
  if (
    Math.abs(lastL) > 1e12 &&
    Math.abs(lastL) > Math.abs(lt[0]) * 1e3 &&
    Math.abs(lastR) > 1e12 &&
    Math.abs(lastR) > Math.abs(rt[0]) * 1e3
  ) {
    return 'diverges';
  }

  // estabilidad de las colas
  const stable = (arr: number[]): boolean => {
    const last = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    return Math.abs(last - prev) < tol * (1 + Math.abs(last));
  };
  if (!stable(lt) || !stable(rt)) {
    // ¿ambos divergen al mismo infinito?
    const li = lt[lt.length - 1];
    const ri = rt[rt.length - 1];
    if (Math.abs(li) > 1e10 && Math.abs(ri) > 1e10 && Math.sign(li) === Math.sign(ri)) {
      return 'diverges';
    }
    return 'unknown';
  }

  if (Math.abs(lastL - lastR) > tol * 100 * (1 + Math.abs(lastL))) {
    return 'unknown';
  }
  return (lastL + lastR) / 2;
}

// ── 2. Continuidad ───────────────────────────────────────────

/**
 * fn es continua en `point` si lim_{x→point} fn(x) = fn(point) con tol `eps`.
 */
export function isContinuousAt(fn: RealFn, point: number, eps: number = DEFAULT_EPS): boolean {
  const v0 = safeEval(fn, point);
  if (v0 === null) return false;
  const lim = findLimit(fn, point, { tolerance: eps / 10 });
  if (lim === 'diverges' || lim === 'unknown') return false;
  return Math.abs(lim - v0) < eps;
}

/**
 * Verificación numérica de continuidad uniforme en [a,b]:
 *   ∀ε ∃δ ∀x,y∈[a,b] (|x-y|<δ → |f(x)-f(y)|<ε)
 * Estrategia: para cada δ candidato muestreamos pares (x_i, x_i+δ)
 * cubriendo el intervalo y verificamos que |f(x)-f(x+δ)| < eps en todos.
 */
export function isUniformlyContinuous(
  fn: RealFn,
  domain: [number, number],
  eps: number = DEFAULT_EPS,
): boolean {
  const [a, b] = domain;
  if (!(b > a)) return false;
  // probamos un δ "razonable" basado en eps y la longitud del dominio
  const candidateDeltas = [(b - a) / 1000, (b - a) / 10000, (b - a) / 100000];
  for (const delta of candidateDeltas) {
    const steps = Math.min(10000, Math.max(50, Math.floor((b - a) / delta) + 1));
    let ok = true;
    for (let i = 0; i < steps; i++) {
      const x = a + (i / steps) * (b - a);
      const v1 = safeEval(fn, x);
      const v2 = safeEval(fn, x + delta);
      if (v1 === null || v2 === null) {
        ok = false;
        break;
      }
      if (Math.abs(v1 - v2) >= eps) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Detecta puntos de discontinuidad por muestreo + chequeo local.
 */
export function findDiscontinuities(
  fn: RealFn,
  domain: [number, number],
  samples: number = DEFAULT_SAMPLES,
): number[] {
  const [a, b] = domain;
  const out: number[] = [];
  const step = (b - a) / samples;
  // valores y NaN/Inf candidates
  const ys: (number | null)[] = [];
  for (let i = 0; i <= samples; i++) {
    ys.push(safeEval(fn, a + i * step));
  }
  for (let i = 0; i < samples; i++) {
    const x = a + i * step;
    const y1 = ys[i];
    const y2 = ys[i + 1];
    if (y1 === null || y2 === null) {
      if (!out.some((p) => Math.abs(p - x) < step * 2)) out.push(x);
      continue;
    }
    // salto local: |Δy| es mucho mayor que la media local
    const expected = 100 * step * Math.max(1, Math.abs(y1));
    if (Math.abs(y2 - y1) > expected + 1) {
      // confirma localmente
      const mid = x + step / 2;
      if (!isContinuousAt(fn, mid, 1e-3)) {
        if (!out.some((p) => Math.abs(p - mid) < step * 2)) out.push(mid);
      }
    }
  }
  return out;
}

// ── 3. Derivadas numéricas ───────────────────────────────────

export interface Derivative {
  value: number;
  method: 'forward' | 'backward' | 'central' | 'richardson';
}

export function derivative(
  fn: RealFn,
  x: number,
  opts?: { h?: number; method?: Derivative['method'] },
): Derivative {
  const h = opts?.h ?? 1e-5;
  const method = opts?.method ?? 'central';
  switch (method) {
    case 'forward': {
      const v = (fn(x + h) - fn(x)) / h;
      return { value: v, method };
    }
    case 'backward': {
      const v = (fn(x) - fn(x - h)) / h;
      return { value: v, method };
    }
    case 'central': {
      const v = (fn(x + h) - fn(x - h)) / (2 * h);
      return { value: v, method };
    }
    case 'richardson': {
      // Richardson extrapolation: D = (4·D(h/2) - D(h)) / 3 con central diff
      const D = (step: number): number => (fn(x + step) - fn(x - step)) / (2 * step);
      const d1 = D(h);
      const d2 = D(h / 2);
      const v = (4 * d2 - d1) / 3;
      return { value: v, method };
    }
  }
}

/**
 * n-ésima derivada por diferencias finitas centrales iteradas (fórmula
 * con coeficientes binomiales con signo alternado).
 *
 *   f^(n)(x) ≈ (1/h^n) · Σ_{k=0..n} (-1)^k C(n,k) f(x + (n/2 - k)·h)
 */
export function nthDerivative(fn: RealFn, x: number, n: number, h?: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`nthDerivative: n debe ser entero ≥ 0, recibido ${n}`);
  }
  if (n === 0) return fn(x);
  // Heurística: derivadas altas necesitan h más grande para no perder precisión por roundoff
  const step = h ?? Math.pow(1e-3, 1 / Math.max(1, n));
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    const coef = binomial(n, k) * (k % 2 === 0 ? 1 : -1);
    const xi = x + (n / 2 - k) * step;
    sum += coef * fn(xi);
  }
  return sum / Math.pow(step, n);
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - i + 1)) / i;
  }
  return result;
}

/**
 * Diferenciable en `point` si las derivadas laterales coinciden con tolerancia.
 */
export function isDifferentiableAt(fn: RealFn, point: number, eps: number = DEFAULT_EPS): boolean {
  if (!isContinuousAt(fn, point, eps)) return false;
  const h = 1e-5;
  const fwd = (fn(point + h) - fn(point)) / h;
  const bwd = (fn(point) - fn(point - h)) / h;
  if (!isFiniteNumber(fwd) || !isFiniteNumber(bwd)) return false;
  return Math.abs(fwd - bwd) < eps * 1000;
}

/**
 * Encuentra puntos críticos (f'(x) ≈ 0) por bisección en cambios de signo
 * de la derivada numérica.
 */
export function findCriticalPoints(
  fn: RealFn,
  domain: [number, number],
  samples: number = DEFAULT_SAMPLES,
): number[] {
  const [a, b] = domain;
  const out: number[] = [];
  const dx = (b - a) / samples;
  let prev = derivative(fn, a, { method: 'central' }).value;
  for (let i = 1; i <= samples; i++) {
    const xi = a + i * dx;
    const cur = derivative(fn, xi, { method: 'central' }).value;
    if (!isFiniteNumber(prev) || !isFiniteNumber(cur)) {
      prev = cur;
      continue;
    }
    if (prev * cur < 0 || cur === 0) {
      // bisección
      let lo = a + (i - 1) * dx;
      let hi = xi;
      for (let it = 0; it < 60; it++) {
        const mid = (lo + hi) / 2;
        const dmid = derivative(fn, mid, { method: 'central' }).value;
        const dlo = derivative(fn, lo, { method: 'central' }).value;
        if (Math.abs(dmid) < 1e-9) {
          lo = mid;
          hi = mid;
          break;
        }
        if (dlo * dmid < 0) hi = mid;
        else lo = mid;
      }
      const root = (lo + hi) / 2;
      if (!out.some((p) => Math.abs(p - root) < dx / 4)) out.push(root);
    }
    prev = cur;
  }
  return out;
}

// ── 4. Integrales numéricas ──────────────────────────────────

export interface Integral {
  value: number;
  method: 'simpson' | 'trapezoidal' | 'romberg' | 'gaussian';
}

export function integrate(
  fn: RealFn,
  from: number,
  to: number,
  opts?: { method?: Integral['method']; subdivisions?: number },
): Integral {
  const method = opts?.method ?? 'simpson';
  const n = opts?.subdivisions ?? 1024;
  if (from === to) return { value: 0, method };
  const sign = from < to ? 1 : -1;
  const a = Math.min(from, to);
  const b = Math.max(from, to);

  let value = 0;
  switch (method) {
    case 'trapezoidal':
      value = trapezoidal(fn, a, b, n);
      break;
    case 'simpson':
      value = simpson(fn, a, b, n % 2 === 0 ? n : n + 1);
      break;
    case 'romberg':
      value = romberg(fn, a, b, Math.min(12, Math.max(4, Math.log2(n) | 0)));
      break;
    case 'gaussian':
      value = gaussianAdaptive(fn, a, b, n);
      break;
  }
  return { value: sign * value, method };
}

function trapezoidal(fn: RealFn, a: number, b: number, n: number): number {
  const h = (b - a) / n;
  let sum = (fn(a) + fn(b)) / 2;
  for (let i = 1; i < n; i++) sum += fn(a + i * h);
  return sum * h;
}

function simpson(fn: RealFn, a: number, b: number, n: number): number {
  // n debe ser par
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    const c = i % 2 === 0 ? 2 : 4;
    sum += c * fn(a + i * h);
  }
  return (sum * h) / 3;
}

function romberg(fn: RealFn, a: number, b: number, levels: number): number {
  const R: number[][] = [];
  for (let i = 0; i < levels; i++) R.push(new Array<number>(levels).fill(0));
  R[0][0] = ((b - a) / 2) * (fn(a) + fn(b));
  for (let i = 1; i < levels; i++) {
    const n = 1 << i;
    const h = (b - a) / n;
    let s = 0;
    for (let k = 1; k <= n; k += 2) s += fn(a + k * h);
    R[i][0] = R[i - 1][0] / 2 + s * h;
    for (let j = 1; j <= i; j++) {
      const p = 1 << (2 * j);
      R[i][j] = (p * R[i][j - 1] - R[i - 1][j - 1]) / (p - 1);
    }
  }
  return R[levels - 1][levels - 1];
}

// Gauss-Legendre de 5 puntos sobre cada subintervalo (adaptativo simple).
function gaussianAdaptive(fn: RealFn, a: number, b: number, n: number): number {
  const segs = Math.max(1, Math.floor(n / 8));
  const w = [0.2369268851, 0.4786286705, 0.5688888889, 0.4786286705, 0.2369268851];
  const t = [-0.9061798459, -0.5384693101, 0.0, 0.5384693101, 0.9061798459];
  const h = (b - a) / segs;
  let total = 0;
  for (let s = 0; s < segs; s++) {
    const x0 = a + s * h;
    const x1 = x0 + h;
    const mid = (x0 + x1) / 2;
    const half = (x1 - x0) / 2;
    let sub = 0;
    for (let i = 0; i < 5; i++) sub += w[i] * fn(mid + half * t[i]);
    total += sub * half;
  }
  return total;
}

// ── 5. Series ────────────────────────────────────────────────

export interface SeriesConvergence {
  converges: boolean;
  sumApprox?: number;
  reason?: string;
}

/**
 * Test de la razón sobre coeficientes de una serie Σ a_n (no Σ a_n x^n):
 *   L = lim |a_{n+1}/a_n|
 *   L < 1 ⇒ converge ; L > 1 ⇒ diverge ; L = 1 ⇒ indeciso.
 */
export function ratioTest(coefficients: number[]): SeriesConvergence {
  if (coefficients.length < 3) {
    return { converges: false, reason: 'insuficientes coeficientes' };
  }
  const ratios: number[] = [];
  for (let i = 1; i < coefficients.length; i++) {
    const a = coefficients[i - 1];
    const b = coefficients[i];
    if (a === 0) continue;
    ratios.push(Math.abs(b / a));
  }
  if (ratios.length === 0) return { converges: false, reason: 'todos los coeficientes ceros' };
  // limit aproximado por las últimas razones + chequeo de tendencia
  const tail = ratios.slice(-Math.min(5, ratios.length));
  const L = tail.reduce((s, x) => s + x, 0) / tail.length;
  // tendencia: si las razones siguen creciendo hacia 1 desde abajo, es inconcluyente
  // (ej: serie armónica n/(n+1) → 1⁻)
  const trendingToOne =
    tail.length >= 3 &&
    tail[tail.length - 1] > tail[0] &&
    tail[tail.length - 1] > 0.9 &&
    tail[tail.length - 1] < 1;
  if (L < 0.95 && !trendingToOne) {
    const sum = coefficients.reduce((s, x) => s + x, 0);
    return { converges: true, sumApprox: sum, reason: `L≈${L.toFixed(4)} < 1` };
  }
  if (L > 1.05) {
    return { converges: false, reason: `L≈${L.toFixed(4)} > 1` };
  }
  return { converges: false, reason: `L≈${L.toFixed(4)} ≈ 1 (test inconcluyente)` };
}

/**
 * Test de la raíz: L = lim sup |a_n|^{1/n}.
 */
export function rootTest(coefficients: number[]): SeriesConvergence {
  if (coefficients.length < 3) {
    return { converges: false, reason: 'insuficientes coeficientes' };
  }
  const roots: number[] = [];
  for (let n = 1; n < coefficients.length; n++) {
    const an = Math.abs(coefficients[n]);
    if (an === 0) continue;
    roots.push(Math.pow(an, 1 / n));
  }
  if (roots.length === 0)
    return { converges: true, sumApprox: 0, reason: 'todos los coeficientes ceros' };
  const tail = roots.slice(-Math.min(5, roots.length));
  const L = Math.max(...tail);
  if (L < 0.95) {
    const sum = coefficients.reduce((s, x) => s + x, 0);
    return { converges: true, sumApprox: sum, reason: `L≈${L.toFixed(4)} < 1` };
  }
  if (L > 1.05) {
    return { converges: false, reason: `L≈${L.toFixed(4)} > 1` };
  }
  return { converges: false, reason: `L≈${L.toFixed(4)} ≈ 1 (test inconcluyente)` };
}

export function partialSum(fn: (n: number) => number, terms: number): number {
  let s = 0;
  for (let n = 0; n < terms; n++) s += fn(n);
  return s;
}

// ── 6. Sucesiones ────────────────────────────────────────────

export function sequenceLimit(
  seq: (n: number) => number,
  opts?: { maxTerms?: number; tolerance?: number },
): { converges: boolean; limit?: number; rate?: 'linear' | 'quadratic' | 'unknown' } {
  const N = opts?.maxTerms ?? 2000;
  const tol = opts?.tolerance ?? 1e-7;
  const vals: number[] = [];
  for (let n = 1; n <= N; n++) {
    const v = seq(n);
    if (!isFiniteNumber(v)) return { converges: false };
    vals.push(v);
  }
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  const prev2 = vals[vals.length - 3];
  const d1 = Math.abs(last - prev);
  const d2 = Math.abs(prev - prev2);
  // Aceptamos convergencia si:
  //   (a) adyacentes están dentro de tol relativo a la magnitud, O
  //   (b) ambas diferencias son menores que tol absoluto y decrecientes
  //       (Cauchy con cola pequeña, típico de seq → 0)
  const denom = 1 + Math.abs(last);
  const cauchyRel = d1 < tol * denom;
  const cauchyAbs = d1 < tol && d2 < tol && d1 <= d2 * 1.5;
  if (cauchyRel || cauchyAbs) {
    let rate: 'linear' | 'quadratic' | 'unknown' = 'unknown';
    if (d2 > 0) {
      const ratio = d1 / d2;
      if (ratio < 0.5 && ratio > 0) rate = 'linear';
      if (ratio < 0.05) rate = 'quadratic';
    }
    return { converges: true, limit: last, rate };
  }
  return { converges: false };
}

// ── 7. Mean Value Theorem ────────────────────────────────────

/**
 * Busca c ∈ (a,b) tal que f'(c) = (f(b)-f(a))/(b-a).
 * Si fn es continua en [a,b] y derivable en (a,b), por MVT existe.
 * Aquí asumimos eso y buscamos c por bisección sobre f'(x) - slope.
 */
export function meanValueTheorem(
  fn: RealFn,
  derivativeFn: RealFn,
  a: number,
  b: number,
  tolerance: number = 1e-7,
): { holds: boolean; c?: number } {
  if (!(b > a)) return { holds: false };
  const slope = (fn(b) - fn(a)) / (b - a);
  if (!isFiniteNumber(slope)) return { holds: false };

  const g = (x: number): number => derivativeFn(x) - slope;
  // muestreo para encontrar cambio de signo
  const samples = 200;
  let prevX = a + (b - a) / (samples + 1);
  let prevG = g(prevX);
  for (let i = 2; i <= samples; i++) {
    const xi = a + (i * (b - a)) / (samples + 1);
    const gi = g(xi);
    if (!isFiniteNumber(gi)) continue;
    if (prevG * gi <= 0) {
      // bisección
      let lo = prevX,
        hi = xi;
      for (let it = 0; it < 80; it++) {
        const mid = (lo + hi) / 2;
        const gm = g(mid);
        if (Math.abs(gm) < tolerance) return { holds: true, c: mid };
        if (g(lo) * gm < 0) hi = mid;
        else lo = mid;
      }
      return { holds: true, c: (lo + hi) / 2 };
    }
    prevX = xi;
    prevG = gi;
  }
  return { holds: false };
}

// ── 8. Taylor ────────────────────────────────────────────────

/**
 * Polinomio de Taylor de orden N de `fn` centrado en `center`, devuelto
 * como función. Las derivadas se calculan numéricamente con `nthDerivative`.
 */
export function taylorPolynomial(fn: RealFn, center: number, order: number): (x: number) => number {
  if (!Number.isInteger(order) || order < 0) {
    throw new Error(`taylorPolynomial: order debe ser entero ≥ 0`);
  }
  const coefs: number[] = [];
  let fact = 1;
  for (let k = 0; k <= order; k++) {
    if (k > 0) fact *= k;
    const dk = k === 0 ? fn(center) : nthDerivative(fn, center, k);
    coefs.push(dk / fact);
  }
  return (x: number) => {
    let s = 0;
    let pow = 1;
    const dx = x - center;
    for (let k = 0; k <= order; k++) {
      s += coefs[k] * pow;
      pow *= dx;
    }
    return s;
  };
}

/**
 * Cota grosera del resto de Lagrange: |R_n(x)| ≤ M·|x-c|^(n+1)/(n+1)!
 * con M estimado como sup |f^(n+1)| sobre un muestreo entre c y x.
 */
export function taylorRemainderBound(fn: RealFn, center: number, x: number, order: number): number {
  if (!Number.isInteger(order) || order < 0) return Infinity;
  const samples = 30;
  const a = Math.min(center, x);
  const b = Math.max(center, x);
  let M = 0;
  for (let i = 0; i <= samples; i++) {
    const xi = a + ((b - a) * i) / samples;
    const v = Math.abs(nthDerivative(fn, xi, order + 1));
    if (isFiniteNumber(v) && v > M) M = v;
  }
  let fact = 1;
  for (let k = 1; k <= order + 1; k++) fact *= k;
  return (M * Math.pow(Math.abs(x - center), order + 1)) / fact;
}
