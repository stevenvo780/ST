// ============================================================
// ST Galois Fields — cuerpos finitos GF(p^n) sobre Z/p.
// ============================================================
// Elementos: polinomios de grado < n con coeficientes en Z/p, representados
//            como vector de números (little-endian: coefficients[i] = coef de x^i).
// Operaciones: suma, resta, multiplicación, división, inverso, potencia.
// Utilidades: búsqueda de polinomio irreducible, elemento primitivo,
//             logaritmo discreto, encoding estilo Reed-Solomon.
//
// Convenciones:
//  - p siempre primo. n >= 1.
//  - El polinomio irreducible se da como vector de longitud n+1 (grado n),
//    con coefficients[n] = 1 (mónico).
//  - Todas las operaciones devuelven un nuevo GFElement (inmutable).
// ============================================================

/**
 * An element of GF(p^n) represented as a polynomial of degree < n
 * with coefficients in Z/p (little-endian: `coefficients[i]` = coef of x^i).
 */
export interface GFElement {
  coefficients: number[]; // little-endian, length = n
  prime: number;
  degree: number; // n
}

/**
 * A finite field GF(p^n) defined by a monic irreducible polynomial of degree n over Z/p.
 * Elements are polynomials mod `irreducible`; arithmetic is done in Z/p[x] / (irreducible).
 */
export interface GaloisField {
  prime: number; // p
  degree: number; // n
  order: number; // p^n
  irreducible: number[]; // polinomio mónico de grado n sobre Z/p (length n+1)
  primitiveElement?: GFElement; // generador del grupo multiplicativo
}

// ---- utilidades sobre Z/p para polinomios densos -----------

function zeros(n: number): number[] {
  return Array.from({ length: n }, () => 0);
}

function modp(x: number, p: number): number {
  const r = x % p;
  return r < 0 ? r + p : r;
}

// Extended GCD en Z/p para enteros (p primo) — devuelve inverso modular.
function invModP(a: number, p: number): number {
  let [old_r, r] = [modp(a, p), p];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  if (old_r !== 1) {
    throw new RangeError(`invModP: ${a} no invertible mod ${p}`);
  }
  return modp(old_s, p);
}

function polyTrim(poly: number[]): number[] {
  // Elimina ceros líderes (al final, por ser little-endian).
  let end = poly.length;
  while (end > 0 && poly[end - 1] === 0) end--;
  return poly.slice(0, end);
}

function polyDeg(poly: number[]): number {
  // Grado del polinomio (−∞ representado como -1).
  const trimmed = polyTrim(poly);
  return trimmed.length - 1;
}

function polyAddP(a: number[], b: number[], p: number): number[] {
  const len = Math.max(a.length, b.length);
  const out: number[] = zeros(len);
  for (let i = 0; i < len; i++) {
    const ai = i < a.length ? (a[i] ?? 0) : 0;
    const bi = i < b.length ? (b[i] ?? 0) : 0;
    out[i] = modp(ai + bi, p);
  }
  return out;
}

function polySubP(a: number[], b: number[], p: number): number[] {
  const len = Math.max(a.length, b.length);
  const out: number[] = zeros(len);
  for (let i = 0; i < len; i++) {
    const ai = i < a.length ? (a[i] ?? 0) : 0;
    const bi = i < b.length ? (b[i] ?? 0) : 0;
    out[i] = modp(ai - bi, p);
  }
  return out;
}

function polyMulP(a: number[], b: number[], p: number): number[] {
  if (a.length === 0 || b.length === 0) return [];
  const out: number[] = zeros(a.length + b.length - 1);
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    if (ai === 0) continue;
    for (let j = 0; j < b.length; j++) {
      const bj = b[j] ?? 0;
      out[i + j] = modp((out[i + j] ?? 0) + ai * bj, p);
    }
  }
  return out;
}

function polyScale(a: number[], c: number, p: number): number[] {
  return a.map((x) => modp(x * c, p));
}

// División polinomial en Z/p[x]: devuelve { q, r } con a = q·b + r y deg(r) < deg(b).
function polyDivP(a: number[], b: number[], p: number): { q: number[]; r: number[] } {
  const bTrim = polyTrim(b);
  if (bTrim.length === 0) {
    throw new RangeError('polyDivP: división por polinomio cero');
  }
  let r = polyTrim(a).slice();
  const q: number[] = [];
  const degB = bTrim.length - 1;
  const lcB = bTrim[degB] ?? 0;
  const invLcB = invModP(lcB, p);
  while (polyDeg(r) >= degB) {
    const degR = polyDeg(r);
    const coef = modp((r[degR] ?? 0) * invLcB, p);
    const shift = degR - degB;
    // término actual del cociente
    while (q.length <= shift) q.push(0);
    q[shift] = coef;
    // r := r − coef·x^shift · b
    for (let i = 0; i <= degB; i++) {
      const idx = i + shift;
      r[idx] = modp((r[idx] ?? 0) - coef * (bTrim[i] ?? 0), p);
    }
    r = polyTrim(r);
  }
  return { q: polyTrim(q), r };
}

function polyModP(a: number[], b: number[], p: number): number[] {
  return polyDivP(a, b, p).r;
}

// MCD de polinomios en Z/p[x] (Euclides). Devuelve un polinomio mónico.
function polyGcdP(a: number[], b: number[], p: number): number[] {
  let x = polyTrim(a);
  let y = polyTrim(b);
  while (y.length > 0) {
    const { r } = polyDivP(x, y, p);
    x = y;
    y = r;
  }
  if (x.length === 0) return [];
  // Normalizar a mónico.
  const lead = x[x.length - 1] ?? 0;
  if (lead === 0) return [];
  const invLead = invModP(lead, p);
  return polyScale(x, invLead, p);
}

// ---- primalidad ligera para validar p -----------------------

function isPrimeSmall(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  const lim = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= lim; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// ---- enumeración de polinomios mónicos de grado n -----------

function* monicPolysOfDegree(p: number, n: number): Generator<number[]> {
  // Coeficientes [c0, c1, ..., c_{n-1}, 1].
  const coeffs: number[] = zeros(n + 1);
  coeffs[n] = 1;
  const total = Math.pow(p, n); // p^n combinaciones para las posiciones [0..n-1]
  for (let k = 0; k < total; k++) {
    let x = k;
    for (let i = 0; i < n; i++) {
      coeffs[i] = x % p;
      x = Math.floor(x / p);
    }
    yield coeffs.slice();
  }
}

// Test de irreducibilidad estilo Rabin: f mónico de grado n es irreducible sobre Z/p
// sii (a) f | x^(p^n) − x, y (b) para cada primo q | n, gcd(f, x^(p^(n/q)) − x) = 1.
function primeDivisors(n: number): number[] {
  const out: number[] = [];
  let x = n;
  for (let i = 2; i * i <= x; i++) {
    if (x % i === 0) {
      out.push(i);
      while (x % i === 0) x = Math.floor(x / i);
    }
  }
  if (x > 1) out.push(x);
  return out;
}

// Calcula x^e mod f en Z/p[x] por squaring.
function polyPowModX(e: number, f: number[], p: number): number[] {
  // x^e mod f, donde e puede ser muy grande (usa squaring).
  // Trabajamos con representación entera de e (puede exceder 2^53 para p^n grandes,
  // pero solo verificamos n pequeños — n hasta ~8 con p<=11).
  if (e === 0) return [1];
  // base = x = [0, 1]
  let result: number[] = [1];
  let base: number[] = [0, 1];
  let exp = e;
  while (exp > 0) {
    if (exp & 1) {
      result = polyModP(polyMulP(result, base, p), f, p);
    }
    exp = Math.floor(exp / 2);
    if (exp > 0) {
      base = polyModP(polyMulP(base, base, p), f, p);
    }
  }
  return result;
}

function isIrreducibleOverZp(f: number[], p: number): boolean {
  const n = polyDeg(f);
  if (n < 1) return false;
  if (n === 1) return true; // todo polinomio lineal mónico es irreducible
  // (b) para cada primo q | n: gcd(f, x^(p^(n/q)) − x) debe ser 1.
  for (const q of primeDivisors(n)) {
    const e = Math.pow(p, n / q);
    if (!Number.isFinite(e) || e > Number.MAX_SAFE_INTEGER) return false;
    const xPe = polyPowModX(e, f, p); // x^(p^(n/q)) mod f
    const candidate = polySubP(xPe, [0, 1], p); // − x
    const g = polyGcdP(f, candidate, p);
    // Debe ser 1 (polinomio constante 1).
    if (!(g.length === 1 && g[0] === 1)) return false;
  }
  // (a) f | x^(p^n) − x.
  const E = Math.pow(p, n);
  if (!Number.isFinite(E) || E > Number.MAX_SAFE_INTEGER) return false;
  const xPn = polyPowModX(E, f, p);
  const target = polySubP(xPn, [0, 1], p);
  return polyTrim(target).length === 0;
}

/**
 * Finds the first monic irreducible polynomial of degree `n` over Z/p
 * by enumerating all monic polys and applying Rabin's irreducibility test.
 * @param p - A prime number.
 * @param n - Degree >= 1.
 * @returns Coefficient array (little-endian), or `null` if none found (should not happen for valid inputs).
 * @throws When `p` is not prime or `n` < 1.
 */
export function findIrreducibleOverZp(p: number, n: number): number[] | null {
  if (!isPrimeSmall(p)) {
    throw new RangeError(`findIrreducibleOverZp: p=${p} no es primo`);
  }
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`findIrreducibleOverZp: n=${n} debe ser entero >= 1`);
  }
  if (n === 1) return [0, 1]; // x  es irreducible mónico de grado 1
  for (const poly of monicPolysOfDegree(p, n)) {
    if (isIrreducibleOverZp(poly, p)) {
      return poly;
    }
  }
  return null;
}

// ---- API GF(p^n) -------------------------------------------

function normalizeElement(coefficients: number[], p: number, n: number): number[] {
  const out: number[] = zeros(n);
  for (let i = 0; i < n; i++) {
    if (i < coefficients.length) {
      out[i] = modp(coefficients[i] ?? 0, p);
    }
  }
  return out;
}

/**
 * Constructs the finite field GF(p^n).
 * If `irreducible` is not provided, one is found automatically via {@link findIrreducibleOverZp}.
 * @param p - A prime number.
 * @param n - Extension degree >= 1. `n = 1` gives the prime field GF(p).
 * @param irreducible - Optional monic irreducible polynomial of degree `n` over Z/p.
 * @throws When `p` is not prime, `n` < 1, or the provided polynomial is reducible.
 */
export function makeGaloisField(p: number, n: number, irreducible?: number[]): GaloisField {
  if (!isPrimeSmall(p)) {
    throw new RangeError(`makeGaloisField: p=${p} no es primo`);
  }
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`makeGaloisField: n=${n} debe ser entero >= 1`);
  }
  let irr: number[];
  if (irreducible) {
    if (polyDeg(irreducible) !== n) {
      throw new RangeError(
        `makeGaloisField: irreducible debe tener grado ${n}, recibió ${polyDeg(irreducible)}`,
      );
    }
    if ((irreducible[n] ?? 0) !== 1) {
      throw new RangeError('makeGaloisField: irreducible debe ser mónico (coef líder = 1)');
    }
    if (!isIrreducibleOverZp(irreducible, p)) {
      throw new RangeError('makeGaloisField: polinomio no es irreducible sobre Z/p');
    }
    irr = irreducible.slice();
  } else {
    const found = findIrreducibleOverZp(p, n);
    if (!found) {
      throw new Error(`makeGaloisField: no se encontró irreducible para GF(${p}^${n})`);
    }
    irr = found;
  }
  return {
    prime: p,
    degree: n,
    order: Math.pow(p, n),
    irreducible: irr,
  };
}

/** Returns the additive identity 0 of the field `F`. */
export function gfZero(F: GaloisField): GFElement {
  return {
    coefficients: zeros(F.degree),
    prime: F.prime,
    degree: F.degree,
  };
}

/** Returns the multiplicative identity 1 of the field `F`. */
export function gfOne(F: GaloisField): GFElement {
  const c = zeros(F.degree);
  c[0] = 1;
  return { coefficients: c, prime: F.prime, degree: F.degree };
}

/**
 * Constructs an element of `F` from a coefficient array, reducing each coefficient mod p
 * and padding/truncating to length `F.degree`.
 */
export function gfElement(F: GaloisField, coefficients: number[]): GFElement {
  return {
    coefficients: normalizeElement(coefficients, F.prime, F.degree),
    prime: F.prime,
    degree: F.degree,
  };
}

function assertCompatible(F: GaloisField, a: GFElement, b?: GFElement): void {
  if (a.prime !== F.prime || a.degree !== F.degree) {
    throw new TypeError('gf: elemento no pertenece a este cuerpo');
  }
  if (b && (b.prime !== F.prime || b.degree !== F.degree)) {
    throw new TypeError('gf: elemento no pertenece a este cuerpo');
  }
}

/** Returns `a + b` in `F`. */
export function gfAdd(F: GaloisField, a: GFElement, b: GFElement): GFElement {
  assertCompatible(F, a, b);
  const out = polyAddP(a.coefficients, b.coefficients, F.prime);
  return gfElement(F, out);
}

/** Returns `a - b` in `F`. */
export function gfSub(F: GaloisField, a: GFElement, b: GFElement): GFElement {
  assertCompatible(F, a, b);
  const out = polySubP(a.coefficients, b.coefficients, F.prime);
  return gfElement(F, out);
}

/** Returns `a * b` in `F` (polynomial product reduced mod the irreducible). */
export function gfMul(F: GaloisField, a: GFElement, b: GFElement): GFElement {
  assertCompatible(F, a, b);
  const product = polyMulP(a.coefficients, b.coefficients, F.prime);
  const reduced = polyModP(product, F.irreducible, F.prime);
  return gfElement(F, reduced);
}

/** Returns `true` when `a` and `b` represent the same field element (coefficient-wise). */
export function gfEq(a: GFElement, b: GFElement): boolean {
  if (a.prime !== b.prime || a.degree !== b.degree) return false;
  for (let i = 0; i < a.degree; i++) {
    if ((a.coefficients[i] ?? 0) !== (b.coefficients[i] ?? 0)) return false;
  }
  return true;
}

function isZero(a: GFElement): boolean {
  for (let i = 0; i < a.degree; i++) {
    if ((a.coefficients[i] ?? 0) !== 0) return false;
  }
  return true;
}

/**
 * Returns the multiplicative inverse of `a` in `F` via the extended Euclidean algorithm,
 * or `null` when `a` is the zero element.
 */
export function gfInverse(F: GaloisField, a: GFElement): GFElement | null {
  assertCompatible(F, a);
  if (isZero(a)) return null;
  const p = F.prime;
  // Algoritmo de Euclides extendido sobre Z/p[x].
  let old_r = polyTrim(a.coefficients);
  let r = polyTrim(F.irreducible);
  let old_s: number[] = [1];
  let s: number[] = [];
  while (r.length > 0) {
    const { q, r: rem } = polyDivP(old_r, r, p);
    [old_r, r] = [r, rem];
    const newS = polySubP(old_s, polyMulP(q, s, p), p);
    [old_s, s] = [s, newS];
  }
  // old_r es gcd (debería ser una constante distinta de 0). Normalizar.
  const gcdTrim = polyTrim(old_r);
  if (gcdTrim.length !== 1) return null;
  const g = gcdTrim[0] ?? 0;
  if (g === 0) return null;
  const invG = invModP(g, p);
  const invPoly = polyScale(old_s, invG, p);
  // Reducir mod irreducible por si quedó con grado >= n (no debería, pero por seguridad).
  const reduced = polyModP(invPoly, F.irreducible, p);
  return gfElement(F, reduced);
}

/** Returns `a / b` in `F`, or `null` when `b` is zero (not invertible). */
export function gfDiv(F: GaloisField, a: GFElement, b: GFElement): GFElement | null {
  assertCompatible(F, a, b);
  const inv = gfInverse(F, b);
  if (inv === null) return null;
  return gfMul(F, a, inv);
}

/**
 * Returns `a^exp` in `F` via square-and-multiply.
 * Negative exponents compute the inverse first.
 * @throws When `exp` < 0 and `a` is the zero element.
 */
export function gfPow(F: GaloisField, a: GFElement, exp: bigint): GFElement {
  assertCompatible(F, a);
  if (exp < 0n) {
    const inv = gfInverse(F, a);
    if (inv === null) {
      throw new RangeError('gfPow: exponente negativo y elemento no invertible');
    }
    return gfPow(F, inv, -exp);
  }
  // Por Lagrange, exp puede reducirse mod (p^n − 1) si a !== 0.
  // Mantenemos exp tal cual para simplicidad — squaring directo.
  let result = gfOne(F);
  let base = gfElement(F, a.coefficients.slice());
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = gfMul(F, result, base);
    }
    e >>= 1n;
    if (e > 0n) {
      base = gfMul(F, base, base);
    }
  }
  return result;
}

/**
 * Returns the multiplicative order of `a` in `F`: the minimum k >= 1 such that `a^k = 1`.
 * The result always divides `F.order - 1` (by Lagrange's theorem).
 * @throws When `a` is the zero element.
 */
export function order(F: GaloisField, a: GFElement): number {
  assertCompatible(F, a);
  if (isZero(a)) {
    throw new RangeError('order: indefinido para el elemento cero');
  }
  const groupOrder = F.order - 1;
  // Factorizar groupOrder y reducir cada factor primo hasta que la potencia caiga.
  // Inicialmente k = groupOrder; mientras a^(k/q) = 1 para algún q primo de k, k /= q.
  let k = groupOrder;
  const primes = primeDivisors(groupOrder);
  for (const q of primes) {
    while (k % q === 0) {
      const reduced = Math.floor(k / q);
      const ak = gfPow(F, a, BigInt(reduced));
      if (gfEq(ak, gfOne(F))) {
        k = reduced;
      } else {
        break;
      }
    }
  }
  return k;
}

/**
 * Finds a primitive element (generator of the multiplicative group) of `F`
 * by iterating over non-zero elements and checking multiplicative order.
 * @throws When no generator is found (should not happen for well-formed `F`).
 */
export function findPrimitive(F: GaloisField): GFElement {
  const groupOrder = F.order - 1;
  // Iteramos por todos los no-cero hasta encontrar uno de orden p^n − 1.
  const limit = F.order;
  for (let k = 1; k < limit; k++) {
    // Decodificar k a coeficientes en base p.
    const coeffs: number[] = zeros(F.degree);
    let x = k;
    for (let i = 0; i < F.degree; i++) {
      coeffs[i] = x % F.prime;
      x = Math.floor(x / F.prime);
    }
    const candidate = gfElement(F, coeffs);
    if (order(F, candidate) === groupOrder) {
      return candidate;
    }
  }
  throw new Error(`findPrimitive: no se encontró generador en GF(${F.prime}^${F.degree})`);
}

/**
 * Computes the discrete logarithm `k` such that `base^k = target` in `F`,
 * or `null` when no such `k` exists. Uses linear search — intended for small fields.
 */
export function discreteLog(F: GaloisField, base: GFElement, target: GFElement): number | null {
  assertCompatible(F, base, target);
  if (isZero(base) || isZero(target)) return null;
  const groupOrder = F.order - 1;
  let cur = gfOne(F);
  for (let k = 0; k < groupOrder; k++) {
    if (gfEq(cur, target)) return k;
    cur = gfMul(F, cur, base);
  }
  return null;
}

// Reed-Solomon-style encoding (toy): evalúa el polinomio cuyo vector de
// coeficientes es `message` en n puntos distintos del cuerpo.
// Devuelve los n valores resultantes (palabra-código).
// Para que sea útil como RS clásico, `n` debería ser <= F.order − 1 y los
// puntos de evaluación deberían ser las potencias de un primitivo, pero
// aquí simplemente usamos 1, g, g^2, ..., g^(n-1).
/**
 * Reed-Solomon-style encoding: evaluates the polynomial with coefficients `message`
 * at `n` points `{g^0, g^1, …, g^(n-1)}`, where `g` is a primitive element of `F`.
 * @param n - Number of evaluation points; must be <= `F.order - 1`.
 * @throws When `n` is out of range or `message` elements do not belong to `F`.
 */
export function rsEncode(F: GaloisField, message: GFElement[], n: number): GFElement[] {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`rsEncode: n=${n} debe ser entero >= 1`);
  }
  if (n > F.order - 1) {
    throw new RangeError(`rsEncode: n=${n} excede el grupo multiplicativo ${F.order - 1}`);
  }
  for (const c of message) assertCompatible(F, c);
  const g = findPrimitive(F);
  const out: GFElement[] = [];
  for (let i = 0; i < n; i++) {
    const xi = gfPow(F, g, BigInt(i));
    // Evaluar el polinomio en xi con Horner.
    let acc = gfZero(F);
    for (let j = message.length - 1; j >= 0; j--) {
      const mj = message[j];
      if (!mj) continue;
      acc = gfAdd(F, gfMul(F, acc, xi), mj);
    }
    out.push(acc);
  }
  return out;
}
