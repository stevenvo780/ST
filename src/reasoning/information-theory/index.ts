// ============================================================
// ST Information Theory — Toolkit de entropías y divergencias
// ============================================================
//
// Sobre distribuciones simbólicas discretas (`Map<T, number>` con masa
// total ≈ 1) provee:
//
//   • Entropías: Shannon, Rényi(α), min, max, colisión.
//   • Divergencias: KL, JS, total-variation, Hellinger.
//   • Información mutua a partir de distribución conjunta.
//   • Cross-entropy y la relación H(p,q) = H(p) + KL(p ‖ q).
//
// Convenciones de borde:
//   • La probabilidad 0 contribuye 0 a la entropía (lim x·log x = 0).
//   • KL(p ‖ q) es +∞ si existe x con p(x) > 0 y q(x) = 0.
//   • La base por defecto del logaritmo es 2 (bits). También se aceptan
//     'e' (nats), 10 (hartleys/dits) y el alias 'log' = 2.
//   • Validamos con tolerancia EPS_DEFAULT antes de cualquier cómputo
//     que asuma normalización. `normalize` no se llama implícitamente
//     porque queremos que el usuario decida cuándo reescalar.

/** Distribución de probabilidad discreta sobre símbolos de tipo `T` (`Map<T, number>`, masa ≈ 1). */
export type Distribution<T> = Map<T, number>;

/**
 * Distribución conjunta sobre pares (X, Y).
 * Nota: `Map<[X, Y], number>` no des-duplica por igualdad estructural;
 * el llamante debe garantizar un par por combinación (x, y).
 */
export type Joint<X, Y> = Map<[X, Y], number>;

// Tolerancia por defecto para "suma ≈ 1" y comparaciones simétricas.
const EPS_DEFAULT = 1e-9;

// ------------------------------------------------------------
// Soporte y validación
// ------------------------------------------------------------

/** Devuelve los símbolos con probabilidad estrictamente positiva (soporte de `p`). */
export function support<T>(p: Distribution<T>): T[] {
  const out: T[] = [];
  for (const [k, v] of p) {
    if (v > 0) out.push(k);
  }
  return out;
}

/** `true` si todas las probabilidades son ≥ 0, finitas y su suma difiere de 1 en menos de `eps`. */
export function isValidDistribution<T>(p: Distribution<T>, eps: number = EPS_DEFAULT): boolean {
  let sum = 0;
  for (const v of p.values()) {
    if (!Number.isFinite(v) || v < 0) return false;
    sum += v;
  }
  return Math.abs(sum - 1) <= eps;
}

/**
 * Reescala la distribución `p` para que su masa sea 1.
 * @throws si alguna probabilidad es inválida o la masa total es 0.
 */
export function normalize<T>(p: Distribution<T>): Distribution<T> {
  let sum = 0;
  for (const v of p.values()) {
    if (!Number.isFinite(v) || v < 0) {
      throw new Error('normalize: probabilidad inválida (negativa, NaN o infinita)');
    }
    sum += v;
  }
  if (sum === 0) {
    throw new Error('normalize: distribución con masa total 0');
  }
  const out = new Map<T, number>();
  for (const [k, v] of p) {
    out.set(k, v / sum);
  }
  return out;
}

// ------------------------------------------------------------
// Logaritmos parametrizados por base
// ------------------------------------------------------------

/** Base del logaritmo para entropías: `2` (bits, default), `'e'` (nats), `10` (hartleys), `'log'` (alias de 2). */
export type LogBase = 'log' | 'e' | 2 | 10;

function logIn(base: LogBase): (x: number) => number {
  switch (base) {
    case 'e':
      return Math.log;
    case 10:
      return Math.log10;
    case 2:
    case 'log':
    default:
      return Math.log2;
  }
}

// ------------------------------------------------------------
// Entropías
// ------------------------------------------------------------

/** Entropía de Shannon: H(p) = −Σ p(x)·log p(x). Convención: 0·log 0 = 0. */
export function shannonEntropy<T>(p: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  let h = 0;
  for (const v of p.values()) {
    if (v > 0) {
      h -= v * log(v);
    }
  }
  return h;
}

/**
 * Entropía de Rényi de orden `alpha` (α ≥ 0): H_α(p) = 1/(1−α)·log Σ p(x)^α.
 * Límites: α=0 → max-entropy, α=1 → Shannon, α=2 → colisión, α→∞ → min-entropy.
 * @throws si `alpha` es negativo o no finito.
 */
export function renyiEntropy<T>(p: Distribution<T>, alpha: number, base: LogBase = 2): number {
  if (!Number.isFinite(alpha) || alpha < 0) {
    throw new Error('renyiEntropy: α debe ser finito y ≥ 0');
  }
  if (alpha === 1) return shannonEntropy(p, base);
  if (alpha === 0) return maxEntropy(p, base);

  const log = logIn(base);
  let s = 0;
  for (const v of p.values()) {
    if (v > 0) s += Math.pow(v, alpha);
  }
  if (s === 0) return 0;
  return log(s) / (1 - alpha);
}

/** Min-entropy: −log max_x p(x). Mide la peor predictibilidad en un solo intento. */
export function minEntropy<T>(p: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  let max = 0;
  for (const v of p.values()) {
    if (v > max) max = v;
  }
  if (max === 0) return 0;
  return -log(max);
}

/** Max-entropy (Hartley): log|soporte(p)|, el logaritmo del tamaño del soporte estricto. */
export function maxEntropy<T>(p: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  const n = support(p).length;
  if (n === 0) return 0;
  return log(n);
}

/** Entropía de colisión: Rényi α=2 = −log Σ p(x)². Mide la probabilidad de dos muestras iguales. */
export function collisionEntropy<T>(p: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  let s = 0;
  for (const v of p.values()) {
    if (v > 0) s += v * v;
  }
  if (s === 0) return 0;
  return -log(s);
}

// ------------------------------------------------------------
// Divergencias y distancias
// ------------------------------------------------------------

/** Divergencia KL: KL(p ‖ q) = Σ p(x)·log(p(x)/q(x)). Devuelve +∞ si p(x)>0 y q(x)=0. */
export function klDivergence<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  let d = 0;
  for (const [k, px] of p) {
    if (px === 0) continue;
    const qx = q.get(k) ?? 0;
    if (qx === 0) return Number.POSITIVE_INFINITY;
    d += px * log(px / qx);
  }
  return d;
}

/** Divergencia Jensen-Shannon: JS(p,q) = ½ KL(p ‖ m) + ½ KL(q ‖ m), m = ½(p+q). Simétrica, ∈ [0, log 2]. */
export function jsDivergence<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number {
  const m = new Map<T, number>();
  for (const [k, v] of p) m.set(k, (m.get(k) ?? 0) + v);
  for (const [k, v] of q) m.set(k, (m.get(k) ?? 0) + v);
  // m = p + q; dividimos por 2 para obtener la mezcla.
  for (const [k, v] of m) m.set(k, v / 2);

  return 0.5 * klDivergence(p, m, base) + 0.5 * klDivergence(q, m, base);
}

/** Distancia de variación total: TV(p,q) = ½ Σ |p(x) − q(x)|. ∈ [0, 1]. */
export function tvDistance<T>(p: Distribution<T>, q: Distribution<T>): number {
  const keys = new Set<T>();
  for (const k of p.keys()) keys.add(k);
  for (const k of q.keys()) keys.add(k);
  let s = 0;
  for (const k of keys) {
    s += Math.abs((p.get(k) ?? 0) - (q.get(k) ?? 0));
  }
  return s / 2;
}

/** Distancia de Hellinger: H(p,q) = (1/√2)·√(Σ (√p(x) − √q(x))²). ∈ [0, 1]; 0 ⟺ p = q; 1 ⟺ soportes disjuntos. */
export function hellingerDistance<T>(p: Distribution<T>, q: Distribution<T>): number {
  const keys = new Set<T>();
  for (const k of p.keys()) keys.add(k);
  for (const k of q.keys()) keys.add(k);
  let s = 0;
  for (const k of keys) {
    const a = Math.sqrt(p.get(k) ?? 0);
    const b = Math.sqrt(q.get(k) ?? 0);
    const d = a - b;
    s += d * d;
  }
  return Math.sqrt(s) / Math.SQRT2;
}

// ------------------------------------------------------------
// Cross-entropy
// ------------------------------------------------------------

/** Cross-entropía: H(p,q) = −Σ p(x)·log q(x) = H(p) + KL(p ‖ q). Devuelve +∞ si p(x)>0 y q(x)=0. */
export function crossEntropy<T>(p: Distribution<T>, q: Distribution<T>, base: LogBase = 2): number {
  const log = logIn(base);
  let h = 0;
  for (const [k, px] of p) {
    if (px === 0) continue;
    const qx = q.get(k) ?? 0;
    if (qx === 0) return Number.POSITIVE_INFINITY;
    h -= px * log(qx);
  }
  return h;
}

// ------------------------------------------------------------
// Distribuciones conjuntas e información mutua
// ------------------------------------------------------------

/** Proyecta la distribución conjunta `j` sobre cada eje, devolviendo las marginales `X` e `Y`. */
export function jointToMarginals<X, Y>(j: Joint<X, Y>): { X: Distribution<X>; Y: Distribution<Y> } {
  const mX = new Map<X, number>();
  const mY = new Map<Y, number>();
  for (const [pair, v] of j) {
    const x = pair[0];
    const y = pair[1];
    mX.set(x, (mX.get(x) ?? 0) + v);
    mY.set(y, (mY.get(y) ?? 0) + v);
  }
  return { X: mX, Y: mY };
}

// H(X, Y): entropía conjunta directa sobre la distribución del par.
function jointEntropy<X, Y>(j: Joint<X, Y>, base: LogBase): number {
  const log = logIn(base);
  let h = 0;
  for (const v of j.values()) {
    if (v > 0) h -= v * log(v);
  }
  return h;
}

/** Información mutua I(X;Y) = Σ p(x,y)·log(p(x,y)/(p(x)·p(y))) = H(X) + H(Y) − H(X,Y). */
export function mutualInformation<X, Y>(j: Joint<X, Y>, base: LogBase = 2): number {
  const log = logIn(base);
  const { X: mX, Y: mY } = jointToMarginals(j);
  let mi = 0;
  for (const [pair, pxy] of j) {
    if (pxy <= 0) continue;
    const px = mX.get(pair[0]) ?? 0;
    const py = mY.get(pair[1]) ?? 0;
    if (px === 0 || py === 0) continue;
    mi += pxy * log(pxy / (px * py));
  }
  // Por estabilidad numérica forzamos no-negatividad estricta (puede
  // dar -1e-16 por redondeo en distribuciones independientes).
  return mi < 0 && mi > -1e-12 ? 0 : mi;
}

/** Entropía condicional H(X|Y) o H(Y|X) según `condOn`. H(X|Y) = H(X,Y) − H(Y) ≥ 0. */
export function conditionalEntropy<X, Y>(
  j: Joint<X, Y>,
  condOn: 'X' | 'Y',
  base: LogBase = 2,
): number {
  const hXY = jointEntropy(j, base);
  const { X: mX, Y: mY } = jointToMarginals(j);
  const hX = shannonEntropy(mX, base);
  const hY = shannonEntropy(mY, base);
  const out = condOn === 'X' ? hXY - hY : hXY - hX;
  return out < 0 && out > -1e-12 ? 0 : out;
}

/**
 * Devuelve los cuatro escalares {hX, hY, hXY, iXY} de la regla de la cadena.
 * Verifica: H(X,Y) = H(X) + H(Y) − I(X;Y).
 */
export function chainRule<X, Y>(
  j: Joint<X, Y>,
  base: LogBase = 2,
): { hX: number; hY: number; hXY: number; iXY: number } {
  const { X: mX, Y: mY } = jointToMarginals(j);
  return {
    hX: shannonEntropy(mX, base),
    hY: shannonEntropy(mY, base),
    hXY: jointEntropy(j, base),
    iXY: mutualInformation(j, base),
  };
}
