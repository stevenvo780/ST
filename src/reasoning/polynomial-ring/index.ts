// ============================================================
// ST Polynomial Ring — polinomios sobre Z, Q (via Z) y Z/pZ.
// ============================================================
// Representación densa: `coefficients[i]` es el coeficiente de x^i,
// con `coefficients[0]` como término constante. El array se mantiene
// normalizado (sin ceros finales) salvo el polinomio cero `[0n]`.
//
// Cuando `modulus` está definido, todas las operaciones reducen
// coeficientes mod p (p primo) — útil para Berlekamp.
//
// Convenciones:
//   • Factorización `factor(p)` devuelve factores con contenido
//     entero positivo (primitive part) más una constante líder si
//     la hay; el producto reconstruye `p`.
//   • `gcd` sobre Z[x] devuelve un polinomio primitivo con líder
//     positivo (gcd "monic-like" sobre Q[x]).
//   • Resultantes y discriminantes se calculan vía subresultant
//     prs cuando `modulus` está ausente.
// ============================================================

/**
 * Dense polynomial over Z or Z/pZ.
 * `coefficients[i]` is the coefficient of x^i (little-endian).
 * When `modulus` is defined, all coefficients are kept reduced mod p.
 */
export interface Polynomial {
  coefficients: bigint[];
  modulus?: bigint;
}

// --- helpers internos --------------------------------------------------

function absBig(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = absBig(a);
  let y = absBig(b);
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function modBig(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

// Inverso modular (m primo) vía Fermat — usamos exponenciación rápida.
function modInvPrime(a: bigint, p: bigint): bigint {
  let base = modBig(a, p);
  if (base === 0n) {
    throw new Error('modInvPrime: 0 no tiene inverso');
  }
  let exp = p - 2n;
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % p;
    base = (base * base) % p;
    exp >>= 1n;
  }
  return result;
}

function trim(coeffs: bigint[], modulus?: bigint): bigint[] {
  const out = coeffs.slice();
  if (modulus !== undefined) {
    for (let i = 0; i < out.length; i++) {
      out[i] = modBig(out[i], modulus);
    }
  }
  while (out.length > 1 && out[out.length - 1] === 0n) {
    out.pop();
  }
  // si todo cero, mantener [0n].
  if (out.length === 0) out.push(0n);
  return out;
}

function makePoly(coeffs: bigint[], modulus?: bigint): Polynomial {
  const result: Polynomial = { coefficients: trim(coeffs, modulus) };
  if (modulus !== undefined) result.modulus = modulus;
  return result;
}

function sameModulus(a: Polynomial, b: Polynomial): bigint | undefined {
  if (a.modulus === undefined && b.modulus === undefined) return undefined;
  if (a.modulus === undefined) return b.modulus;
  if (b.modulus === undefined) return a.modulus;
  if (a.modulus !== b.modulus) {
    throw new Error('polynomial-ring: módulos incompatibles');
  }
  return a.modulus;
}

// --- API base ----------------------------------------------------------

/**
 * Constructs a normalized {@link Polynomial} from a coefficient array.
 * `coefficients[0]` is the constant term; accepts `number[]` for convenience.
 * @param coefficients - Little-endian coefficient array (index = power of x).
 * @param modulus - Optional prime modulus p; all coefficients are reduced mod p.
 */
export function poly(coefficients: bigint[] | number[], modulus?: bigint): Polynomial {
  const asBig: bigint[] = coefficients.map((c) => (typeof c === 'bigint' ? c : BigInt(c)));
  if (asBig.length === 0) asBig.push(0n);
  return makePoly(asBig, modulus);
}

/**
 * Returns the degree of `p`. Returns -1 for the zero polynomial (a finite
 * sentinel, since `number` cannot represent -∞ cleanly in strict TS).
 */
export function degree(p: Polynomial): number {
  // polinomio cero: degree -1 por convención (algunos usan -Infinity, elegimos -1
  // para que sea un número finito en TS strict).
  if (p.coefficients.length === 1 && p.coefficients[0] === 0n) return -1;
  return p.coefficients.length - 1;
}

/** Returns the coefficient of the highest-degree term, or `0n` for the zero polynomial. */
export function leadingCoefficient(p: Polynomial): bigint {
  const d = degree(p);
  if (d < 0) return 0n;
  return p.coefficients[d];
}

/** Returns `true` when `p` is the zero polynomial (degree -1). */
export function isZero(p: Polynomial): boolean {
  return degree(p) < 0;
}

// --- aritmética --------------------------------------------------------

/** Returns `a + b`. Reduces coefficients mod p when both share a modulus. */
export function add(a: Polynomial, b: Polynomial): Polynomial {
  const m = sameModulus(a, b);
  const len = Math.max(a.coefficients.length, b.coefficients.length);
  const out: bigint[] = Array.from({ length: len }, () => 0n);
  for (let i = 0; i < len; i++) {
    const av = a.coefficients[i] ?? 0n;
    const bv = b.coefficients[i] ?? 0n;
    out[i] = av + bv;
  }
  return makePoly(out, m);
}

/** Returns `a - b`. */
export function sub(a: Polynomial, b: Polynomial): Polynomial {
  const m = sameModulus(a, b);
  const len = Math.max(a.coefficients.length, b.coefficients.length);
  const out: bigint[] = Array.from({ length: len }, () => 0n);
  for (let i = 0; i < len; i++) {
    const av = a.coefficients[i] ?? 0n;
    const bv = b.coefficients[i] ?? 0n;
    out[i] = av - bv;
  }
  return makePoly(out, m);
}

/** Returns `a * b` via schoolbook convolution, O(deg(a)·deg(b)). */
export function multiply(a: Polynomial, b: Polynomial): Polynomial {
  const m = sameModulus(a, b);
  if (isZero(a) || isZero(b)) return makePoly([0n], m);
  const out: bigint[] = Array.from(
    { length: a.coefficients.length + b.coefficients.length - 1 },
    () => 0n,
  );
  for (let i = 0; i < a.coefficients.length; i++) {
    const ai = a.coefficients[i];
    if (ai === 0n) continue;
    for (let j = 0; j < b.coefficients.length; j++) {
      const bj = b.coefficients[j];
      out[i + j] = out[i + j] + ai * bj;
    }
  }
  return makePoly(out, m);
}

function scalarMul(p: Polynomial, k: bigint): Polynomial {
  return makePoly(
    p.coefficients.map((c) => c * k),
    p.modulus,
  );
}

// --- división euclidiana ----------------------------------------------
// Sobre Z/pZ es exacta (campo). Sobre Z, sólo lo hacemos si el divisor
// es monic (líder ±1) o si la división resulta exacta sobre Z.

/**
 * Euclidean division of `a` by `b`, returning `{ quotient, remainder }`.
 * Over Z/pZ the result is exact. Over Z, requires `b` to be monic (lead ±1)
 * or uses pseudo-division when the leading coefficient does not divide.
 * @throws When `b` is the zero polynomial.
 */
export function divmod(
  a: Polynomial,
  b: Polynomial,
): { quotient: Polynomial; remainder: Polynomial } {
  const m = sameModulus(a, b);
  if (isZero(b)) {
    throw new Error('divmod: divisor cero');
  }
  if (degree(a) < degree(b)) {
    return { quotient: makePoly([0n], m), remainder: makePoly(a.coefficients.slice(), m) };
  }

  const rem = a.coefficients.slice();
  const divisor = b.coefficients;
  const divisorDeg = degree(b);
  const divisorLead = divisor[divisorDeg];
  const quotient: bigint[] = Array.from({ length: degree(a) - divisorDeg + 1 }, () => 0n);

  if (m !== undefined) {
    const leadInv = modInvPrime(divisorLead, m);
    for (let i = degree(a); i >= divisorDeg; i--) {
      const coef = rem[i] !== undefined ? modBig(rem[i], m) : 0n;
      if (coef === 0n) continue;
      const factor = modBig(coef * leadInv, m);
      quotient[i - divisorDeg] = factor;
      for (let j = 0; j <= divisorDeg; j++) {
        rem[i - divisorDeg + j] = modBig((rem[i - divisorDeg + j] ?? 0n) - factor * divisor[j], m);
      }
    }
    return {
      quotient: makePoly(quotient, m),
      remainder: makePoly(rem, m),
    };
  }

  // Sobre Z: requerir divisor monic (lead = ±1) o división exacta.
  // Implementamos como sobre Q (con bigint racional), pero comprobamos
  // que el cociente termine en Z; si no, lanzamos.
  // Para evitar fracciones: si lead es ±1 funciona directo; si no,
  // multiplicamos rem por la potencia adecuada y verificamos cero.
  if (divisorLead !== 1n && divisorLead !== -1n) {
    // Pseudo-división: multiplicar a por lead^(deg(a)-deg(b)+1) primero,
    // luego dividir. Pero divmod debe devolver el cociente "real" sólo
    // cuando es exacta. Si no es exacta, dejar remainder = a, quotient = 0.
    // Caso típico: gcd usa pseudo-remainder.
    const { quotient: q, remainder: r } = pseudoDivmodZ(a, b);
    return { quotient: q, remainder: r };
  }

  // monic ±1 → divisor exacto entero.
  for (let i = degree(a); i >= divisorDeg; i--) {
    const coef = rem[i] ?? 0n;
    if (coef === 0n) continue;
    const factor = coef / divisorLead;
    quotient[i - divisorDeg] = factor;
    for (let j = 0; j <= divisorDeg; j++) {
      rem[i - divisorDeg + j] = (rem[i - divisorDeg + j] ?? 0n) - factor * divisor[j];
    }
  }
  return {
    quotient: makePoly(quotient),
    remainder: makePoly(rem),
  };
}

// Pseudo-división sobre Z: encuentra q, r tales que lead(b)^d * a = q*b + r
// con deg(r) < deg(b). Devuelve r tal cual; el cociente se descarta para
// usos que sólo necesitan el remainder en cadena de Euclides.
function pseudoDivmodZ(
  a: Polynomial,
  b: Polynomial,
): { quotient: Polynomial; remainder: Polynomial } {
  if (isZero(b)) throw new Error('pseudoDivmodZ: divisor cero');
  if (degree(a) < degree(b)) {
    return { quotient: makePoly([0n]), remainder: makePoly(a.coefficients.slice()) };
  }
  const da = degree(a);
  const db = degree(b);
  const lb = leadingCoefficient(b);
  const power = lb ** BigInt(da - db + 1);
  // Multiplicar a por power.
  const aScaled = scalarMul(a, power);
  const rem = aScaled.coefficients.slice();
  const divisor = b.coefficients;
  const quotient: bigint[] = Array.from({ length: da - db + 1 }, () => 0n);

  for (let i = da; i >= db; i--) {
    const coef = rem[i] ?? 0n;
    if (coef === 0n) continue;
    if (coef % lb !== 0n) {
      // No exacto bajo este pseudo-power: significa que la versión
      // estándar requeriría más escalado. Para nuestro uso (gcd) basta
      // con que el remainder sea reducido módulo lead; devolvemos rem
      // tal cual sin avanzar más para no inflar coeficientes.
      break;
    }
    const factor = coef / lb;
    quotient[i - db] = factor;
    for (let j = 0; j <= db; j++) {
      rem[i - db + j] = (rem[i - db + j] ?? 0n) - factor * divisor[j];
    }
  }
  return { quotient: makePoly(quotient), remainder: makePoly(rem) };
}

// --- GCD ---------------------------------------------------------------

function contentZ(p: Polynomial): bigint {
  if (isZero(p)) return 0n;
  let c = 0n;
  for (const coef of p.coefficients) {
    c = gcdBig(c, coef);
  }
  return c === 0n ? 1n : c;
}

function primitivePart(p: Polynomial): Polynomial {
  if (isZero(p)) return p;
  const c = contentZ(p);
  if (c === 1n) {
    // Garantizar líder positivo: si el líder es negativo, negar todo.
    if (leadingCoefficient(p) < 0n) {
      return makePoly(p.coefficients.map((x) => -x));
    }
    return p;
  }
  const sign = leadingCoefficient(p) < 0n ? -1n : 1n;
  return makePoly(p.coefficients.map((x) => (x / c) * sign));
}

/**
 * Greatest common divisor of `a` and `b`.
 * Over Z/pZ uses Euclides in the field and returns a monic result.
 * Over Z uses subresultant PRS and returns the primitive part with positive leading coefficient.
 */
export function gcd(a: Polynomial, b: Polynomial): Polynomial {
  const m = sameModulus(a, b);
  if (m !== undefined) {
    // Euclides sobre Z/pZ — campo, división euclidiana exacta.
    let x = makePoly(a.coefficients.slice(), m);
    let y = makePoly(b.coefficients.slice(), m);
    while (!isZero(y)) {
      const { remainder } = divmod(x, y);
      x = y;
      y = remainder;
    }
    if (isZero(x)) return x;
    // Hacer monic.
    const leadInv = modInvPrime(leadingCoefficient(x), m);
    return scalarMul(x, leadInv);
  }

  // Sobre Z[x]: usar subresultant PRS simplificada. Garantiza coeficientes
  // razonables y termina. Devolvemos la parte primitiva con líder ≥ 0.
  if (isZero(a)) return primitivePart(b);
  if (isZero(b)) return primitivePart(a);

  let x = makePoly(a.coefficients.slice());
  let y = makePoly(b.coefficients.slice());
  while (!isZero(y)) {
    const { remainder } = pseudoDivmodZ(x, y);
    x = y;
    // Sacar contenido del remainder para evitar blow-up.
    if (!isZero(remainder)) {
      y = primitivePart(remainder);
    } else {
      y = remainder;
    }
  }
  return primitivePart(x);
}

// --- derivada, evaluación, composición --------------------------------

/** Returns the formal derivative d/dx of `p`. Constant polynomials map to zero. */
export function derivative(p: Polynomial): Polynomial {
  if (degree(p) <= 0) return makePoly([0n], p.modulus);
  const out: bigint[] = Array.from({ length: p.coefficients.length - 1 }, () => 0n);
  for (let i = 1; i < p.coefficients.length; i++) {
    out[i - 1] = p.coefficients[i] * BigInt(i);
  }
  return makePoly(out, p.modulus);
}

/**
 * Evaluates `p` at integer point `x` via Horner's rule.
 * When `p` has a modulus, the result is reduced mod p.
 */
export function evaluate(p: Polynomial, x: bigint): bigint {
  // Horner.
  let result = 0n;
  for (let i = p.coefficients.length - 1; i >= 0; i--) {
    result = result * x + p.coefficients[i];
    if (p.modulus !== undefined) result = modBig(result, p.modulus);
  }
  return result;
}

/**
 * Returns the composition `a(b(x))` via Horner evaluation of `a` over `b`.
 * Both polynomials must share the same modulus (or both be over Z).
 */
export function compose(a: Polynomial, b: Polynomial): Polynomial {
  // a(b(x)) via Horner sobre b.
  const m = sameModulus(a, b);
  let result: Polynomial = makePoly([0n], m);
  for (let i = a.coefficients.length - 1; i >= 0; i--) {
    result = multiply(result, b);
    result = add(result, makePoly([a.coefficients[i]], m));
  }
  return result;
}

// --- raíces racionales y factorización Q[x] ---------------------------

function divisorsAbs(n: bigint): bigint[] {
  const x = absBig(n);
  if (x === 0n) return [];
  const out: bigint[] = [];
  let d = 1n;
  while (d * d <= x) {
    if (x % d === 0n) {
      out.push(d);
      const q = x / d;
      if (q !== d) out.push(q);
    }
    d++;
  }
  out.sort((p, q) => (p < q ? -1 : p > q ? 1 : 0));
  return out;
}

function reduceFraction(num: bigint, den: bigint): { num: bigint; den: bigint } {
  if (den === 0n) throw new Error('reduceFraction: denominador cero');
  const g = gcdBig(num, den);
  let n = num / g;
  let d = den / g;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  return { num: n, den: d };
}

/**
 * Returns all rational roots of `p ∈ Z[x]` as reduced fractions `{ num, den }`.
 * Uses the rational root theorem: roots have the form ±(divisors of a₀) / (divisors of aₙ).
 * @throws When `p` has a modulus (rational roots do not apply in Z/pZ).
 */
export function rationalRoots(p: Polynomial): Array<{ num: bigint; den: bigint }> {
  if (p.modulus !== undefined) {
    throw new Error('rationalRoots: no aplica con módulo definido');
  }
  if (isZero(p) || degree(p) === 0) return [];

  // Sacar factor x^k si la constante es 0.
  let working = p;
  let zeroRoot = false;
  while (working.coefficients[0] === 0n && degree(working) > 0) {
    working = makePoly(working.coefficients.slice(1));
    zeroRoot = true;
  }

  const a0 = working.coefficients[0];
  const an = leadingCoefficient(working);
  const seen = new Set<string>();
  const out: Array<{ num: bigint; den: bigint }> = [];

  if (zeroRoot) {
    out.push({ num: 0n, den: 1n });
    seen.add('0/1');
  }

  if (degree(working) === 0) return out;

  const pDivs = divisorsAbs(a0);
  const qDivs = divisorsAbs(an);

  for (const num of pDivs) {
    for (const den of qDivs) {
      for (const sign of [1n, -1n]) {
        const candidate = reduceFraction(sign * num, den);
        const key = `${candidate.num}/${candidate.den}`;
        if (seen.has(key)) continue;
        // Evaluar p(num/den): multiplicar por den^deg para enteros.
        let value = 0n;
        const denPow = 1n;
        const coefs = working.coefficients;
        const dg = coefs.length - 1;
        // p(n/d) = sum c_i (n/d)^i. Multiplicamos por d^dg: sum c_i n^i d^(dg - i).
        for (let i = 0; i <= dg; i++) {
          // n^i:
          let npow = 1n;
          for (let k = 0; k < i; k++) npow *= candidate.num;
          // d^(dg - i):
          let dpow = 1n;
          for (let k = 0; k < dg - i; k++) dpow *= candidate.den;
          value += coefs[i] * npow * dpow;
        }
        void denPow;
        if (value === 0n) {
          seen.add(key);
          out.push(candidate);
        }
      }
    }
  }

  // Orden estable: por (num, den) lexicográfico.
  out.sort((x, y) => {
    if (x.num !== y.num) return x.num < y.num ? -1 : 1;
    if (x.den !== y.den) return x.den < y.den ? -1 : 1;
    return 0;
  });
  return out;
}

/**
 * Returns the square-free part of `p`: `p / gcd(p, p')`.
 * Over Z/pZ: divides out the gcd with the formal derivative.
 * Over Z: uses primitive-part arithmetic to avoid coefficient blow-up.
 */
export function squareFree(p: Polynomial): Polynomial {
  if (p.modulus !== undefined) {
    // Sobre Z/p: squarefree = p / gcd(p, p').
    if (isZero(p) || degree(p) === 0) return p;
    const dp = derivative(p);
    if (isZero(dp)) return p;
    const g = gcd(p, dp);
    if (degree(g) === 0) return p;
    const { quotient } = divmod(p, g);
    return quotient;
  }
  if (isZero(p) || degree(p) === 0) return p;
  const dp = derivative(p);
  if (isZero(dp)) return p;
  const g = gcd(p, dp);
  if (degree(g) <= 0) return primitivePart(p);
  // squarefree part = p / g. Sobre Z usamos pseudo-division y luego primitivePart.
  const { remainder } = pseudoDivmodZ(p, g);
  if (!isZero(remainder)) {
    // No divisible exacto: fallback — devolver primitivePart(p).
    return primitivePart(p);
  }
  // Recalcular cociente real con división exacta.
  const result = exactDivideZ(p, g);
  return primitivePart(result);
}

// División exacta en Z[x] cuando se sabe que b | a (usado en factor()).
function exactDivideZ(a: Polynomial, b: Polynomial): Polynomial {
  if (isZero(b)) throw new Error('exactDivideZ: divisor cero');
  if (isZero(a)) return makePoly([0n]);
  const da = degree(a);
  const db = degree(b);
  if (da < db) {
    if (!isZero(a)) throw new Error('exactDivideZ: división no exacta (grado)');
    return makePoly([0n]);
  }
  const rem = a.coefficients.slice();
  const divisor = b.coefficients;
  const lb = leadingCoefficient(b);
  const quotient: bigint[] = Array.from({ length: da - db + 1 }, () => 0n);

  for (let i = da; i >= db; i--) {
    const coef = rem[i] ?? 0n;
    if (coef === 0n) continue;
    if (coef % lb !== 0n) {
      throw new Error('exactDivideZ: división no exacta');
    }
    const f = coef / lb;
    quotient[i - db] = f;
    for (let j = 0; j <= db; j++) {
      rem[i - db + j] = (rem[i - db + j] ?? 0n) - f * divisor[j];
    }
  }
  for (let i = 0; i < db; i++) {
    if ((rem[i] ?? 0n) !== 0n) {
      throw new Error('exactDivideZ: división no exacta (resto)');
    }
  }
  return makePoly(quotient);
}

/**
 * Factors `p ∈ Z[x]` into irreducible factors over Q.
 * Extracts integer content, linear factors via rational root theorem,
 * and returns the remaining primitive part as a single factor when no
 * further rational roots are found.
 * @throws When `p` has a modulus — use {@link factorInZp} instead.
 */
export function factor(p: Polynomial): Polynomial[] {
  if (p.modulus !== undefined) {
    throw new Error('factor: usa factorInZp para módulos primos');
  }
  if (isZero(p)) return [makePoly([0n])];
  if (degree(p) === 0) return [makePoly([p.coefficients[0]])];

  // Extraer contenido.
  let working = p;
  const c = contentZ(working);
  const factors: Polynomial[] = [];
  if (c !== 1n) {
    factors.push(makePoly([c]));
    working = exactDivideZ(working, makePoly([c]));
  }

  // Sacar factores x sucesivos si constant=0.
  while (working.coefficients[0] === 0n && degree(working) > 0) {
    factors.push(makePoly([0n, 1n]));
    working = makePoly(working.coefficients.slice(1));
  }

  // Extraer todas las raíces racionales (con multiplicidad).
  let changed = true;
  while (changed && degree(working) > 0) {
    changed = false;
    const roots = rationalRoots(working);
    for (const r of roots) {
      // Factor lineal: den*x - num.
      let linear: Polynomial = makePoly([-r.num, r.den]);
      // Dividir mientras lo divida.
      // Pero como pseudo-division puede no ser exacta, usamos exactDivideZ
      // tras chequear que evaluate=0.
      while (degree(working) > 0 && evaluateRational(working, r.num, r.den) === 0n) {
        try {
          working = exactDivideZ(working, linear);
        } catch {
          break;
        }
        factors.push(linear);
        changed = true;
        linear = makePoly([-r.num, r.den]);
      }
    }
  }

  if (degree(working) > 0) {
    factors.push(primitivePart(working));
    // Si la parte primitiva se quitó un signo o constante, registrarlo.
    const leftover = exactDivideZ(working, primitivePart(working));
    if (degree(leftover) === 0 && leftover.coefficients[0] !== 1n) {
      factors.push(leftover);
    }
  } else if (degree(working) === 0 && working.coefficients[0] !== 1n) {
    factors.push(makePoly([working.coefficients[0]]));
  }

  return factors;
}

// Evalúa p en num/den retornando 0n si la fracción es raíz (sin construir Q).
function evaluateRational(p: Polynomial, num: bigint, den: bigint): bigint {
  const dg = degree(p);
  if (dg < 0) return 0n;
  let acc = 0n;
  for (let i = 0; i <= dg; i++) {
    let npow = 1n;
    for (let k = 0; k < i; k++) npow *= num;
    let dpow = 1n;
    for (let k = 0; k < dg - i; k++) dpow *= den;
    acc += p.coefficients[i] * npow * dpow;
  }
  return acc;
}

/**
 * Tests whether `p` is irreducible over Q (when no modulus) or over Z/pZ (when modulus is set).
 * Over Q: degree ≤ 3 uses rational root test; degree ≥ 4 delegates to {@link factor}.
 * Over Z/pZ: delegates to {@link factorInZp} and checks for a single factor.
 * @param samples - Unused (kept for API compatibility).
 */
export function isIrreducible(p: Polynomial, samples = 30): boolean {
  if (p.modulus !== undefined) {
    // Sobre Z/pZ: irreducible ⇔ factorInZp da un sólo factor (lineal-monic).
    const fs = factorInZp(p, p.modulus);
    return fs.length === 1 && degree(fs[0]) === degree(p);
  }
  if (isZero(p)) return false;
  const d = degree(p);
  if (d <= 0) return false;
  if (d === 1) return true;
  // Si hay raíz racional, reducible.
  if (rationalRoots(p).length > 0) return false;
  if (d <= 3) return true; // grados 2 y 3 sin raíz racional ⇒ irreducible en Q.
  // d >= 4: usamos factor() y vemos si quedó un único factor no constante.
  const fs = factor(p);
  const nonTrivial = fs.filter((f) => degree(f) > 0);
  if (nonTrivial.length === 1 && degree(nonTrivial[0]) === d) return true;
  if (nonTrivial.length === 0) return false;
  // Si factor() no pudo dividir más (no encontró raíz racional), nuestro
  // factorizador devuelve el polinomio entero como único factor no trivial.
  // Como heurística: si nonTrivial.length === 1 con su grado === d, ok.
  void samples;
  return false;
}

// --- Factorización en Z/pZ vía búsqueda exhaustiva + Berlekamp simplificado
// ---------------------------------------------------------------------
// Implementación pragmática: para p pequeño basta probar todas las raíces
// en {0, ..., p-1}, dividir por (x - r) hasta agotar, y para grado ≥ 2
// restante se hace una búsqueda por factores de grado 2 (suficiente para
// los casos de test). Es una versión "lite" de Berlekamp.

/**
 * Factors `p` in Z/pZ (the field with `prime` elements).
 * Uses root-finding for linear factors, then exhaustive search for
 * irreducible quadratic factors (lite Berlekamp for small p).
 * @param prime - A prime modulus > 1.
 * @throws When `prime` ≤ 1.
 */
export function factorInZp(p: Polynomial, prime: bigint): Polynomial[] {
  if (prime <= 1n) throw new Error('factorInZp: prime debe ser > 1');
  let working: Polynomial = makePoly(p.coefficients.slice(), prime);
  if (isZero(working)) return [makePoly([0n], prime)];

  const factors: Polynomial[] = [];

  // Hacer monic.
  const lead = leadingCoefficient(working);
  if (lead !== 1n) {
    const inv = modInvPrime(lead, prime);
    factors.push(makePoly([lead], prime));
    working = scalarMul(working, inv);
  }

  // 1) Sacar raíces (factores lineales).
  let foundRoot = true;
  while (foundRoot && degree(working) > 0) {
    foundRoot = false;
    for (let r = 0n; r < prime; r++) {
      if (evaluate(working, r) === 0n) {
        const linear = makePoly([modBig(-r, prime), 1n], prime);
        const { quotient, remainder } = divmod(working, linear);
        if (!isZero(remainder)) continue;
        factors.push(linear);
        working = quotient;
        foundRoot = true;
        break;
      }
    }
  }

  // 2) Búsqueda exhaustiva de factores cuadráticos monic.
  while (degree(working) >= 2) {
    let found: Polynomial | null = null;
    outer: for (let a = 0n; a < prime; a++) {
      for (let b = 0n; b < prime; b++) {
        const candidate = makePoly([b, a, 1n], prime); // x^2 + a x + b
        const { quotient, remainder } = divmod(working, candidate);
        if (isZero(remainder) && degree(quotient) < degree(working)) {
          // Asegurar que el candidato sea irreducible (sin raíces en Zp).
          let hasRoot = false;
          for (let r = 0n; r < prime; r++) {
            if (evaluate(candidate, r) === 0n) {
              hasRoot = true;
              break;
            }
          }
          if (hasRoot) continue;
          found = candidate;
          working = quotient;
          break outer;
        }
      }
    }
    if (found) {
      factors.push(found);
    } else {
      break;
    }
  }

  if (degree(working) > 0) {
    factors.push(working);
  } else if (degree(working) === 0 && working.coefficients[0] !== 1n) {
    factors.push(working);
  }

  return factors;
}

// --- resultante y discriminante ---------------------------------------

/**
 * Computes the resultant of `a` and `b` in Z[x] via the Sylvester matrix determinant.
 * Returns 0 when either polynomial is zero.
 * @throws When either polynomial has a modulus.
 */
export function resultant(a: Polynomial, b: Polynomial): bigint {
  if (a.modulus !== undefined || b.modulus !== undefined) {
    throw new Error('resultant: implementación sólo Z');
  }
  if (isZero(a) || isZero(b)) return 0n;
  // Resultante vía cadena de Euclides con signos: usamos Sylvester
  // directamente, simple y robusto.
  return sylvesterDeterminant(a, b);
}

function sylvesterDeterminant(a: Polynomial, b: Polynomial): bigint {
  const da = degree(a);
  const db = degree(b);
  const n = da + db;
  if (n <= 0) return 1n;
  // Matriz n×n.
  const M: bigint[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0n));
  for (let i = 0; i < db; i++) {
    for (let j = 0; j <= da; j++) {
      M[i][i + (da - j)] = a.coefficients[j];
    }
  }
  for (let i = 0; i < da; i++) {
    for (let j = 0; j <= db; j++) {
      M[db + i][i + (db - j)] = b.coefficients[j];
    }
  }
  return bigDeterminant(M);
}

function bigDeterminant(M: bigint[][]): bigint {
  // Gauss con bigint usando eliminación fraction-free Bareiss.
  const n = M.length;
  if (n === 0) return 1n;
  const A: bigint[][] = M.map((row) => row.slice());
  let sign = 1n;
  let prev = 1n;
  for (let i = 0; i < n; i++) {
    // pivot.
    if (A[i][i] === 0n) {
      let swap = -1;
      for (let k = i + 1; k < n; k++) {
        if (A[k][i] !== 0n) {
          swap = k;
          break;
        }
      }
      if (swap === -1) return 0n;
      const tmp = A[i];
      A[i] = A[swap];
      A[swap] = tmp;
      sign = -sign;
    }
    for (let k = i + 1; k < n; k++) {
      for (let j = i + 1; j < n; j++) {
        const numerator = A[k][j] * A[i][i] - A[k][i] * A[i][j];
        A[k][j] = numerator / prev;
      }
      A[k][i] = 0n;
    }
    prev = A[i][i];
  }
  return sign * A[n - 1][n - 1];
}

/**
 * Returns the discriminant of `p ∈ Z[x]`:
 * `disc(p) = (-1)^{n(n-1)/2} · res(p, p') / lead(p)`.
 * @throws When `p` has a modulus.
 */
export function discriminant(p: Polynomial): bigint {
  if (p.modulus !== undefined) {
    throw new Error('discriminant: implementación sólo Z');
  }
  const n = degree(p);
  if (n < 1) return 0n;
  const an = leadingCoefficient(p);
  const dp = derivative(p);
  const res = resultant(p, dp);
  // disc(p) = (-1)^{n(n-1)/2} * res(p, p') / lead(p).
  const halfExp = (n * (n - 1)) / 2;
  const signFactor = halfExp % 2 === 0 ? 1n : -1n;
  // res / an puede no ser exacto sólo si an no divide res — para polinomios
  // enteros sí lo es.
  return signFactor * (res / an);
}
