// ============================================================
// ST Constructive Reals — Números reales computables
// ============================================================
// Cada real x se representa como una función `approxBig(n)` que
// devuelve un entero `b` tal que
//
//     | x - b / 2^n |  <  2^{-n}
//
// (es decir, una aproximación dyádica con cota de error explícita).
//
// La función `approx(p)` expuesta como API pública devuelve el par
// `{ numerator, denominator }` con `denominator = 2^p`, garantizando
// la misma cota de error |x - numerator/denominator| < 2^{-p}.
//
// Esto es esencialmente la formulación de Bishop/Bridges para los
// reales constructivos: secuencias de Cauchy con módulo explícito de
// convergencia. No usamos `number` (IEEE-754) excepto como entrada;
// internamente todo es `bigint`.
//
// Operaciones implementadas (todas devuelven CReal):
//   fromInt, fromRational, neg, abs
//   add, sub, mul, div   (div: requiere b ≠ 0)
//   sqrt                  (requiere x ≥ 0)
//   PI, E, SQRT2          (constantes)
//   compareWithEpsilon, toString
//
// Decisiones de implementación:
//   • Internamente usamos cache memoizado por precisión: una vez
//     calculada una aproximación a precisión n, queda guardada.
//     Esto evita recomputar series largas para PI/E al imprimirlas.
//   • Las operaciones binarias piden a sus operandos precisiones
//     mayores (precisión de trabajo) tal que el error acumulado
//     siga acotado por 2^{-p} en el resultado.
//   • Para mul/div necesitamos cotas superiores/inferiores sobre
//     |a| y |b|; las obtenemos consultando una aproximación gruesa
//     primero, ajustando el tamaño en bits.
//
// Nota sobre redondeo: usamos "round half away from zero" para
// convertir un entero escalado de precisión `n+k` a `n`. La cota
// de error de redondeo es entonces ≤ 1/2 en la unidad de precisión
// `n`, equivalente a 2^{-(n+1)}.
// ============================================================

// ── Tipo público ────────────────────────────────────────────

export interface CReal {
  /**
   * Devuelve una aproximación dyádica de x con error < 2^{-precision}.
   * numerator / denominator ≈ x, denominator = 2^precision.
   */
  approx(precision: number): { numerator: bigint; denominator: bigint };
}

// ── Helpers internos ────────────────────────────────────────

/** Eleva 2 a un entero no negativo. */
function pow2(n: number): bigint {
  if (n < 0) throw new RangeError(`pow2: n debe ser >= 0, recibí ${n}`);
  return 1n << BigInt(n);
}

/**
 * Divide entero con "round half away from zero".
 *   shiftRight(x, k) ≈ x / 2^k redondeado.
 * Garantiza |shiftRight(x,k) - x/2^k| ≤ 1/2.
 */
function shiftRight(x: bigint, k: number): bigint {
  if (k <= 0) return x << BigInt(-k);
  const half = 1n << BigInt(k - 1);
  return x >= 0n ? (x + half) >> BigInt(k) : -(((-x) + half) >> BigInt(k));
}

/**
 * Calcula el número de bits del entero (|x| en binario).
 * bitLength(0) = 0, bitLength(1) = 1, bitLength(7) = 3, bitLength(8) = 4.
 */
function bitLength(x: bigint): number {
  if (x < 0n) x = -x;
  if (x === 0n) return 0;
  // Toma el string binario; para bigint muy grandes podríamos
  // hacer un loop, pero `toString(2).length` es eficiente.
  return x.toString(2).length;
}

/**
 * Construye un CReal a partir de la función interna scaled (bigint).
 * approxBig(n) debe satisfacer |x - approxBig(n) / 2^n| < 2^{-n}.
 *
 * Memoiza por valor de `n` para no recomputar.
 */
function makeCReal(approxBig: (n: number) => bigint): CReal {
  const cache = new Map<number, bigint>();
  function getBig(n: number): bigint {
    if (n < 0) {
      // Para precisión negativa simplemente desplazamos a la baja.
      const v = getBig(0);
      return shiftRight(v, -n);
    }
    const cached = cache.get(n);
    if (cached !== undefined) return cached;
    const v = approxBig(n);
    cache.set(n, v);
    return v;
  }
  // Exponemos también approxBig internamente vía un símbolo "interno"
  // para que las operaciones lo aprovechen sin parsear el objeto público.
  const r: CReal & { __approxBig?: (n: number) => bigint } = {
    approx(precision: number) {
      const num = getBig(precision);
      const denom = precision >= 0 ? pow2(precision) : 1n;
      // Si precision < 0, "denominador 2^p" no es entero; convertimos
      // a forma estándar denominador 1 y multiplicador del lado num.
      // (Caso raro pero correcto: num = round(x / 2^{-p}).)
      if (precision < 0) {
        return { numerator: num, denominator: 1n };
      }
      return { numerator: num, denominator: denom };
    },
  };
  r.__approxBig = getBig;
  return r;
}

/** Extrae el accessor bigint interno de un CReal creado por makeCReal. */
function approxBigOf(r: CReal): (n: number) => bigint {
  const fn = (r as { __approxBig?: (n: number) => bigint }).__approxBig;
  if (fn) return fn;
  // Fallback (CReal externo no creado por makeCReal): reconstruye desde approx().
  return (n: number) => {
    const { numerator, denominator } = r.approx(n);
    // numerator/denominator ≈ x, queremos round(x * 2^n).
    // Si denominator = 2^n exactamente, numerator ya está en esa escala.
    if (denominator === pow2(n)) return numerator;
    // Caso general: round(numerator * 2^n / denominator).
    const scaled = numerator * pow2(Math.max(n, 0));
    const half = denominator / 2n;
    return numerator >= 0n
      ? (scaled + half) / denominator
      : -(((-scaled) + half) / denominator);
  };
}

// ── Constructores ───────────────────────────────────────────

export function fromInt(n: number | bigint): CReal {
  const v = typeof n === 'bigint' ? n : BigInt(Math.trunc(n));
  if (typeof n === 'number' && !Number.isFinite(n)) {
    throw new RangeError(`fromInt: número no finito ${n}`);
  }
  if (typeof n === 'number' && !Number.isInteger(n)) {
    throw new RangeError(`fromInt: esperaba entero, recibí ${n}`);
  }
  return makeCReal((prec: number) => v << BigInt(Math.max(prec, 0)));
}

export function fromRational(p: number | bigint, q: number | bigint): CReal {
  const num = typeof p === 'bigint' ? p : BigInt(Math.trunc(p));
  const denom = typeof q === 'bigint' ? q : BigInt(Math.trunc(q));
  if (typeof p === 'number' && !Number.isInteger(p)) {
    throw new RangeError(`fromRational: numerador no entero ${p}`);
  }
  if (typeof q === 'number' && !Number.isInteger(q)) {
    throw new RangeError(`fromRational: denominador no entero ${q}`);
  }
  if (denom === 0n) throw new RangeError('fromRational: denominador 0');
  // Normalizamos signo: denom > 0.
  const sign = denom < 0n ? -1n : 1n;
  const n0 = num * sign;
  const d0 = denom * sign;
  return makeCReal((prec: number) => {
    // round(num/denom * 2^prec) = round(num * 2^prec / denom).
    const p = Math.max(prec, 0);
    const scaled = n0 << BigInt(p);
    const half = d0 >> 1n; // floor(d0/2). suficiente para round-half-to-even? usamos away-from-zero.
    return n0 >= 0n
      ? (scaled + half) / d0
      : -(((-scaled) + half) / d0);
  });
}

// ── Operaciones aritméticas ────────────────────────────────

export function neg(a: CReal): CReal {
  const aa = approxBigOf(a);
  return makeCReal((prec: number) => -aa(prec));
}

export function abs(a: CReal): CReal {
  const aa = approxBigOf(a);
  return makeCReal((prec: number) => {
    const v = aa(prec);
    return v < 0n ? -v : v;
  });
}

/**
 * add(a,b) a precisión p:
 *   pedimos a y b a precisión p+2.
 *   error de cada uno < 2^{-(p+2)} → error en a+b < 2·2^{-(p+2)} = 2^{-(p+1)}.
 *   Al pasar de escala p+2 a p (shift de 2), introducimos error
 *   de redondeo ≤ 1/2 en la unidad p, = 2^{-(p+1)}.
 *   Total: < 2^{-(p+1)} + 2^{-(p+1)} = 2^{-p}.  ✓
 */
export function add(a: CReal, b: CReal): CReal {
  const aa = approxBigOf(a);
  const bb = approxBigOf(b);
  return makeCReal((prec: number) => {
    const work = prec + 2;
    const s = aa(work) + bb(work);
    return shiftRight(s, 2);
  });
}

export function sub(a: CReal, b: CReal): CReal {
  const aa = approxBigOf(a);
  const bb = approxBigOf(b);
  return makeCReal((prec: number) => {
    const work = prec + 2;
    const s = aa(work) - bb(work);
    return shiftRight(s, 2);
  });
}

/**
 * mul(a,b) a precisión p:
 *   Necesitamos cotas sobre |a| y |b|. Tomamos una aproximación gruesa
 *   a precisión 0 para estimar el tamaño en bits.
 *   Sean |a| ≤ 2^A, |b| ≤ 2^B (con A,B no-negativos).
 *   Trabajamos a precisión p + A + B + 3.
 *   En esa escala el producto cabe y la cota de error queda < 2^{-p}.
 *
 *   Detalle del error: si â = a + ε_a con |ε_a| < 2^{-w} y análogamente
 *   para b̂ (w = work precision en los operandos), entonces
 *      â·b̂ - a·b = a·ε_b + b·ε_a + ε_a·ε_b.
 *   |a·ε_b| ≤ 2^A · 2^{-w}, idem para b.
 *   Eligiendo w = p + A + B + 3 ese error queda < 2·2^{-(p+B+3)}
 *   acotado holgadamente por 2^{-(p+1)}, y el shift final añade otro
 *   2^{-(p+1)}, dando < 2^{-p}.
 */
export function mul(a: CReal, b: CReal): CReal {
  const aa = approxBigOf(a);
  const bb = approxBigOf(b);
  return makeCReal((prec: number) => {
    // Estimamos cota superior en bits para |a| y |b| con una aprox gruesa.
    // aa(8) ≈ round(a * 256). bitLength(aa(8)) - 8 ≈ ceil(log2|a|).
    const probePrec = 8;
    const aProbe = aa(probePrec);
    const bProbe = bb(probePrec);
    // |a| ≤ (|aProbe| + 1) / 2^probePrec. Así A_bits cubre eso.
    const aBits = Math.max(0, bitLength(aProbe) - probePrec + 1);
    const bBits = Math.max(0, bitLength(bProbe) - probePrec + 1);
    const work = Math.max(prec + aBits + bBits + 4, 4);
    const aw = aa(work);
    const bw = bb(work);
    // aw * bw ≈ a * b * 2^{2·work}. Queremos resultado en escala 2^prec.
    // → shift right (2·work - prec).
    const product = aw * bw;
    return shiftRight(product, 2 * work - prec);
  });
}

/**
 * Encuentra un k ≥ 0 tal que |b| ≥ 2^{-k} (es decir, b está acotado
 * lejos de cero por 2^{-k}). Para ello escaneamos precisiones
 * crecientes hasta que la aproximación sea claramente distinta de cero.
 * Si b es realmente cero, esto diverge — el caller debe asegurar b ≠ 0.
 */
function findLowerBoundExp(b: (n: number) => bigint, maxK: number = 4096): number {
  let k = 4;
  while (k <= maxK) {
    const v = b(k);
    // |v| ≥ 2 garantiza |b - v/2^k| < 2^{-k} → |b| ≥ |v|/2^k - 2^{-k} ≥ 2^{-k}.
    if (v > 1n || v < -1n) return k;
    k *= 2;
  }
  throw new RangeError(
    'div/findLowerBoundExp: no pude separar el divisor de cero — ' +
      'probablemente es 0 o demasiado pequeño',
  );
}

/**
 * div(a,b) a precisión p (b ≠ 0).
 *   Encontramos k tal que |b| ≥ 2^{-k}.
 *   Necesitamos también cota superior A_bits sobre |a|.
 *   Trabajamos a precisión w = p + 2k + A_bits + 4.
 *
 *   Si â = a + ε_a, b̂ = b + ε_b, entonces
 *     â/b̂ - a/b = (ε_a · b - a · ε_b) / (b · b̂).
 *   |b · b̂| ≥ (2^{-k}) · (2^{-k} - 2^{-w}) ≥ 2^{-2k-1}.
 *   |ε_a · b| ≤ 2^{-w} · (|b̂|+2^{-w}).
 *   |a · ε_b| ≤ |â+2^{-w}| · 2^{-w}.
 *   Tomando w = p + 2k + A_bits + 4 acotamos por < 2^{-p}.
 */
export function div(a: CReal, b: CReal): CReal {
  const aa = approxBigOf(a);
  const bb = approxBigOf(b);
  return makeCReal((prec: number) => {
    const k = findLowerBoundExp(bb);
    const probePrec = 8;
    const aProbe = aa(probePrec);
    const aBits = Math.max(0, bitLength(aProbe) - probePrec + 1);
    const work = Math.max(prec + 2 * k + aBits + 4, 4);
    const aw = aa(work);
    const bw = bb(work);
    if (bw === 0n) {
      // Sólo debería pasar si findLowerBoundExp falló silenciosamente.
      throw new RangeError('div: divisor evaluado a 0 a precisión de trabajo');
    }
    // (aw/2^work) / (bw/2^work) = aw/bw. Queremos round(aw/bw * 2^prec).
    // = round(aw * 2^prec / bw).
    const numScaled = aw << BigInt(Math.max(prec, 0));
    const absDen = bw < 0n ? -bw : bw;
    const absNum = numScaled < 0n ? -numScaled : numScaled;
    const half = absDen >> 1n;
    // round-half-away-from-zero.
    const signNum = numScaled < 0n ? -1n : 1n;
    const signDen = bw < 0n ? -1n : 1n;
    const q = (absNum + half) / absDen;
    return signNum * signDen * q;
  });
}

/**
 * sqrt(a) para a ≥ 0. Si a < 0 (detectado con cota), lanza.
 * Implementación: Newton-Raphson en bigint sobre x² = N donde
 * N = aprox(a) a precisión 2·prec + buffer. La raíz cuadrada entera
 * de N da nuestra aproximación a √a a precisión prec.
 */
export function sqrt(a: CReal): CReal {
  const aa = approxBigOf(a);
  return makeCReal((prec: number) => {
    // Pedimos a a precisión 2·prec + 4 para tener margen.
    const work = 2 * Math.max(prec, 0) + 4;
    const aw = aa(work);
    if (aw < 0n) {
      // Podría ser a ≈ 0 desde abajo por ruido de aproximación. Tolerar
      // -1 (que corresponde a a ∈ (-2^{-work}, 0]) como cero.
      if (aw > -4n) return 0n;
      throw new RangeError(`sqrt: a < 0 (aproximación = ${aw}/2^${work})`);
    }
    // √(aw/2^work) ≈ √aw / 2^{work/2}. Como work es par, scale = work/2.
    const scale = work / 2;
    // Queremos round(√aw). Newton sobre enteros.
    const rootInt = isqrt(aw);
    // rootInt = floor(√aw). Equivalente en escala scale.
    // Resultado en escala prec: shift de (scale - prec) bits a la derecha.
    return shiftRight(rootInt, scale - prec);
  });
}

/** Raíz cuadrada entera (floor) de n ≥ 0 vía Newton. */
function isqrt(n: bigint): bigint {
  if (n < 0n) throw new RangeError('isqrt: n < 0');
  if (n < 2n) return n;
  // Estimación inicial: 2^(ceil(bits/2)).
  const bits = bitLength(n);
  let x = 1n << BigInt(Math.ceil(bits / 2));
  // Newton: x_{k+1} = (x_k + n/x_k) / 2. Converge cuadráticamente.
  while (true) {
    const next = (x + n / x) >> 1n;
    if (next >= x) break;
    x = next;
  }
  return x;
}

// ── Comparación ────────────────────────────────────────────

/**
 * compareWithEpsilon(a, b, epsPrec):
 *   Si |a - b| < 2^{-epsPrec}, devuelve 0 (indistinguibles).
 *   Si a > b + 2^{-epsPrec}, devuelve 1.
 *   Si a < b - 2^{-epsPrec}, devuelve -1.
 *
 *   Implementación: comparamos aproximaciones a precisión epsPrec + 3.
 *   |aw/2^w - a| < 2^{-w}, idem b. Entonces
 *     (aw - bw)/2^w  está dentro de  (a - b) ± 2·2^{-w}.
 *   Eligiendo w = epsPrec + 3:
 *     • Si (aw - bw) > 2^{w - epsPrec} + 2 = 8 + 2 = 10 (en escala w),
 *       entonces a - b > 2^{-epsPrec}, devolvemos 1.
 *     • Análogo para -10.
 *     • En otro caso, devolvemos 0.
 */
export function compareWithEpsilon(a: CReal, b: CReal, epsilonPrecision: number): -1 | 0 | 1 {
  const aa = approxBigOf(a);
  const bb = approxBigOf(b);
  const w = epsilonPrecision + 3;
  const diff = aa(w) - bb(w);
  // 2^{-epsilonPrecision} en escala 2^{-w} = 2^{w - epsilonPrecision} = 2^3 = 8.
  // Margen de 2 por el error doble de aproximación.
  const threshold = 8n + 2n;
  if (diff > threshold) return 1;
  if (diff < -threshold) return -1;
  return 0;
}

// ── Representación decimal ─────────────────────────────────

/**
 * toString(r, digits): representación decimal con `digits` dígitos
 * después del punto. Usa precisión binaria suficiente:
 *   2^p > 10^digits  ⇔  p > digits · log2(10) ≈ digits · 3.322.
 * Tomamos p = ceil(digits · 4) + 8 para holgura.
 */
export function toString(r: CReal, digits: number): string {
  if (digits < 0) throw new RangeError(`toString: digits debe ser ≥ 0, recibí ${digits}`);
  const prec = Math.ceil(digits * 4) + 8;
  const { numerator, denominator } = r.approx(prec);
  // Queremos floor(numerator * 10^digits / denominator), con signo.
  const sign = numerator < 0n ? '-' : '';
  const absNum = numerator < 0n ? -numerator : numerator;
  const tenPow = 10n ** BigInt(digits);
  // round-half-away-from-zero al pasar a base-10.
  const half = denominator / 2n;
  const scaled = (absNum * tenPow + half) / denominator;
  const s = scaled.toString().padStart(digits + 1, '0');
  if (digits === 0) return sign + s;
  const intPart = s.slice(0, s.length - digits);
  const fracPart = s.slice(s.length - digits);
  return sign + intPart + '.' + fracPart;
}

// ── Transcendentales ───────────────────────────────────────
//
// Implementamos exp, log (ln), sin, cos vía expansiones en serie
// con reducción de argumento. Mantenemos las pruebas formales del
// error en los comentarios; el patrón es similar al de PI/E:
//   • escala 2^work con work = prec + buffer
//   • sumar términos hasta que |término| < 1 en esa escala
//   • el buffer absorbe el error acumulado de divisiones enteras.

/**
 * exp(x) = Σ x^k / k!. Para que la serie converja rápido reducimos
 * primero el argumento: escribimos x = q · ln(2) + r con |r| ≤ ln(2)/2
 * usando q = round(x / ln(2)). Luego exp(x) = 2^q · exp(r).
 *
 * Para esta versión inicial hacemos una reducción más simple: si
 * |x| > 1, dividimos por 2^k hasta que |x/2^k| < 1, calculamos
 * exp(x/2^k) por serie, y elevamos al cuadrado k veces (exp(y)² = exp(2y)).
 * Esto mantiene la convergencia de la serie acotada a ~prec términos.
 */
export function exp(x: CReal): CReal {
  const xa = approxBigOf(x);
  return makeCReal((prec: number) => {
    // Estimar |x| con aproximación gruesa.
    const probePrec = 8;
    const xProbe = xa(probePrec);
    const xBits = bitLength(xProbe) - probePrec; // ≈ log2(|x|)
    // k tal que |x/2^k| ≤ 1/2. Si xBits ≤ -1, ya está bien.
    const k = Math.max(0, xBits + 2);
    const work = prec + k + 24;
    // y = x / 2^k, en escala 2^work: yScaled = aprox(x, work) >> k.
    const xWork = xa(work);
    const yScaled = shiftRight(xWork, k);
    // Serie: e^y en escala 2^work.
    //   sum_0 = 2^work
    //   term_{n+1} = term_n · y / (n+1)  donde term_n está en escala 2^work
    //                                     e y en escala 2^work
    //                                     ⇒ multiplicar y dividir por 2^work.
    let sum = pow2(work);
    let term = pow2(work);
    let n = 1n;
    while (term !== 0n) {
      term = (term * yScaled) / pow2(work) / n;
      sum += term;
      n += 1n;
      // Cota de seguridad: si la serie no decae (no debería pasar con |y|≤1/2),
      // salimos al llegar a ~prec términos.
      if (n > BigInt(prec + 200)) break;
    }
    // Ahora elevamos al cuadrado k veces para recuperar e^x.
    let result = sum;
    for (let i = 0; i < k; i++) {
      // (result/2^work)² = result²/2^{2·work}, en escala 2^work necesitamos /2^work.
      result = (result * result) / pow2(work);
    }
    return shiftRight(result, work - prec);
  });
}

/**
 * log(x) = ln(x), para x > 0. Reducimos a [1, 2) escribiendo x = 2^k · m,
 * luego ln(x) = k·ln(2) + ln(m). Para ln(m) con m ∈ [1, 2) usamos
 *   ln(1+u) = u - u²/2 + u³/3 - …, con u = m - 1 ∈ [0, 1).
 * Converge lento para u cerca de 1; aceptable para este nivel.
 *
 * Para ln(2) usamos la serie atanh: ln(2) = 2·atanh(1/3) = 2·(1/3 + 1/(3·27) + …).
 */
function lnHalf(n: number): bigint {
  // ln(2) en escala 2^n. atanh(1/3) = Σ 1/((2k+1)·3^{2k+1}).
  const scale = pow2(n);
  let sum = 0n;
  let xPow = scale / 3n; // 1/3 en escala 2^n.
  let k = 0n;
  while (xPow !== 0n) {
    sum += xPow / (2n * k + 1n);
    xPow = xPow / 9n;
    k += 1n;
  }
  return 2n * sum;
}

export function log(x: CReal): CReal {
  const xa = approxBigOf(x);
  return makeCReal((prec: number) => {
    const probePrec = 8;
    const xProbe = xa(probePrec);
    if (xProbe <= 0n) {
      // Necesitamos x > 0 estrictamente. Refinemos para no rechazar
      // por ruido en el probe.
      const refined = xa(prec + 4);
      if (refined <= 1n) {
        throw new RangeError(
          `log: x debe ser > 0, aproximación = ${refined}/2^${prec + 4}`,
        );
      }
    }
    const work = prec + 32;
    const xWork = xa(work);
    // Encontrar k tal que xWork / 2^work ∈ [1, 2): k = bitLength(xWork) - work - 1.
    // (porque 2^{bitLength-1} ≤ xWork < 2^bitLength.)
    const k = bitLength(xWork) - work - 1;
    // m = x / 2^k, en escala 2^work: mScaled = xWork con shift.
    const mScaled = k >= 0 ? xWork >> BigInt(k) : xWork << BigInt(-k);
    // u = m - 1 en escala 2^work.
    const uScaled = mScaled - pow2(work);
    // ln(m) = u - u²/2 + u³/3 - …
    let sum = 0n;
    let uPow = uScaled;
    let n = 1n;
    let sign = 1n;
    const safety = BigInt(work * 4 + 200);
    while (uPow !== 0n) {
      sum += (sign * uPow) / n;
      uPow = (uPow * uScaled) / pow2(work);
      sign = -sign;
      n += 1n;
      if (n > safety) break;
    }
    // ln(x) = k·ln(2) + sum.
    const ln2 = lnHalf(work);
    const total = BigInt(k) * ln2 + sum;
    return shiftRight(total, work - prec);
  });
}

/**
 * sin(x), cos(x) vía serie de Taylor con reducción de argumento
 * a [-π, π] por sustracción de múltiplos de 2π, y luego a
 * [-π/4, π/4] para acelerar convergencia.
 *
 * Para mantener la implementación contenida, hacemos solo la
 * primera reducción usando π precomputada a la precisión de trabajo.
 */
function sinSeries(xScaled: bigint, work: number): bigint {
  // Σ (-1)^k x^{2k+1} / (2k+1)!. Asume |x/2^work| ≤ π.
  const scale = pow2(work);
  let sum = xScaled;
  let term = xScaled;
  let k = 1n;
  let sign = -1n;
  const xSq = (xScaled * xScaled) / scale;
  while (term !== 0n) {
    term = (term * xSq) / scale / ((2n * k) * (2n * k + 1n));
    sum += sign * term;
    sign = -sign;
    k += 1n;
    if (k > BigInt(work * 2 + 200)) break;
  }
  return sum;
}

function cosSeries(xScaled: bigint, work: number): bigint {
  const scale = pow2(work);
  let sum = scale;
  let term = scale;
  let k = 1n;
  let sign = -1n;
  const xSq = (xScaled * xScaled) / scale;
  while (term !== 0n) {
    term = (term * xSq) / scale / ((2n * k - 1n) * (2n * k));
    sum += sign * term;
    sign = -sign;
    k += 1n;
    if (k > BigInt(work * 2 + 200)) break;
  }
  return sum;
}

export function sin(x: CReal): CReal {
  const xa = approxBigOf(x);
  return makeCReal((prec: number) => {
    const work = prec + 32;
    const xWork = xa(work);
    // Reducir mod 2π: q = round(x / (2π)).
    const piScaled = computePiAtPrecision(work);
    const twoPi = 2n * piScaled;
    // q en bigint: round(xWork / twoPi).
    const half = (twoPi < 0n ? -twoPi : twoPi) >> 1n;
    const absX = xWork < 0n ? -xWork : xWork;
    const absQ = (absX + half) / twoPi;
    const q = xWork < 0n ? -absQ : absQ;
    const reduced = xWork - q * twoPi; // ∈ [-π, π] aproximadamente.
    const result = sinSeries(reduced, work);
    return shiftRight(result, work - prec);
  });
}

export function cos(x: CReal): CReal {
  const xa = approxBigOf(x);
  return makeCReal((prec: number) => {
    const work = prec + 32;
    const xWork = xa(work);
    const piScaled = computePiAtPrecision(work);
    const twoPi = 2n * piScaled;
    const half = twoPi >> 1n;
    const absX = xWork < 0n ? -xWork : xWork;
    const absQ = (absX + half) / twoPi;
    const q = xWork < 0n ? -absQ : absQ;
    const reduced = xWork - q * twoPi;
    const result = cosSeries(reduced, work);
    return shiftRight(result, work - prec);
  });
}

/**
 * pow(a, b) = exp(b · log(a)) para a > 0.
 * Caso especial: si b es un entero, hacemos exponenciación rápida
 * sobre CReal para evitar log de a (lo que permite a ≤ 0 si b es entero).
 */
export function pow(a: CReal, b: CReal | number): CReal {
  // Caso b entero: repetir multiplicación.
  if (typeof b === 'number' && Number.isInteger(b)) {
    if (b === 0) return fromInt(1);
    if (b < 0) return div(fromInt(1), pow(a, -b));
    // b > 0 entero: exponenciación rápida.
    let result = fromInt(1);
    let base = a;
    let exponent = b;
    while (exponent > 0) {
      if (exponent & 1) result = mul(result, base);
      base = mul(base, base);
      exponent = exponent >>> 1;
    }
    return result;
  }
  // Caso general: pow(a, b) = exp(b · log(a)).
  const bReal = typeof b === 'number' ? fromRational(Math.round(b * 1e9), 1e9) : b;
  return exp(mul(bReal, log(a)));
}

// ── Constantes ─────────────────────────────────────────────

/**
 * PI vía la serie de Machin:
 *   π/4 = 4·arctan(1/5) - arctan(1/239)
 * arctan(1/x) = 1/x - 1/(3·x³) + 1/(5·x⁵) - …
 * Esta serie converge muy rápido para x grande (≈ log_x(2^p) términos).
 *
 * Implementación: calculamos arctan(1/x) escalado por 2^prec en bigint.
 */
function arctanReciprocal(x: bigint, prec: number): bigint {
  // arctan(1/x) en escala 2^prec.
  // Sumando_k = (-1)^k / ((2k+1) · x^{2k+1})  → escalado: 2^prec / ((2k+1) · x^{2k+1})
  // Truncamos cuando |sumando| < 1 (en escala 2^prec).
  const scale = pow2(prec);
  let sum = 0n;
  const xSq = x * x;
  let term = scale / x; // primer término positivo: 2^prec / x.
  let k = 0n;
  let sign = 1n;
  while (term !== 0n) {
    const denom = 2n * k + 1n;
    sum += (sign * term) / denom;
    term = term / xSq;
    sign = -sign;
    k += 1n;
  }
  return sum;
}

function computePiAtPrecision(prec: number): bigint {
  // Trabajamos con buffer extra para que el error acumulado por la
  // suma de muchas divisiones enteras quede dominado.
  const work = prec + 16;
  const at1_5 = arctanReciprocal(5n, work);
  const at1_239 = arctanReciprocal(239n, work);
  // π = 4 · (4·at(1/5) - at(1/239))
  const piWork = 4n * (4n * at1_5 - at1_239);
  return shiftRight(piWork, work - prec);
}

export const PI: CReal = makeCReal(computePiAtPrecision);

/**
 * E vía la serie e = Σ 1/k!. Trunca cuando 1/k! < 2^{-prec}.
 */
function computeEAtPrecision(prec: number): bigint {
  const work = prec + 16;
  const scale = pow2(work);
  let sum = 0n;
  let term = scale; // k=0: 1/0! = 1.
  let k = 1n;
  while (term !== 0n) {
    sum += term;
    term = term / k;
    k += 1n;
  }
  return shiftRight(sum, work - prec);
}

export const E: CReal = makeCReal(computeEAtPrecision);

/**
 * SQRT2 = sqrt(2). Se construye directamente desde sqrt(fromInt(2))
 * pero exponemos un cálculo dedicado vía isqrt para evitar la indirección.
 */
function computeSqrt2AtPrecision(prec: number): bigint {
  // √2 en escala 2^prec = floor(√(2 · 2^{2·prec})) = isqrt(2^{2·prec+1}).
  const big = pow2(2 * prec + 1);
  return isqrt(big);
}

export const SQRT2: CReal = makeCReal(computeSqrt2AtPrecision);

// ── Exportación de utilidades internas para tests ──────────

/** @internal Exposed for whitebox tests. */
export const __internals = {
  shiftRight,
  bitLength,
  isqrt,
  pow2,
};
