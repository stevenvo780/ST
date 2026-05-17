// ============================================================
// Diofantinas lineales y fracciones continuas.
// ============================================================
// linearDiophantine        — soluciona a·x + b·y = c sobre enteros.
// continuedFractionExpansion — coeficientes de la expansión simple
//                              de num/den (Euclides clásico).
// fromContinuedFraction    — reconstruye num/den a partir de [a0;a1,...].

import { extendedGcd, gcd } from './gcd';

export function linearDiophantine(
  a: bigint,
  b: bigint,
  c: bigint,
): { x: bigint; y: bigint } | null {
  if (a === 0n && b === 0n) {
    if (c === 0n) return { x: 0n, y: 0n };
    return null;
  }
  if (a === 0n) {
    if (c % b !== 0n) return null;
    return { x: 0n, y: c / b };
  }
  if (b === 0n) {
    if (c % a !== 0n) return null;
    return { x: c / a, y: 0n };
  }
  const g = gcd(a, b);
  if (c % g !== 0n) return null;
  const { x, y } = extendedGcd(a, b);
  const factor = c / g;
  return { x: x * factor, y: y * factor };
}

// Expansión simple de num/den. Soporta numeradores negativos
// devolviendo el cociente "floor" en a0 (estándar matemático).
export function continuedFractionExpansion(num: bigint, den: bigint, maxLen = 64): bigint[] {
  if (den === 0n) {
    throw new RangeError('continuedFractionExpansion: denominador 0');
  }
  let p = num;
  let q = den;
  // Normalizamos q > 0 para que floor sea consistente.
  if (q < 0n) {
    p = -p;
    q = -q;
  }
  const result: bigint[] = [];
  for (let i = 0; i < maxLen; i++) {
    // Floor division: dividend = q * a + r, 0 <= r < q.
    let a = p / q;
    let r = p % q;
    if (r < 0n) {
      a -= 1n;
      r += q;
    }
    result.push(a);
    if (r === 0n) return result;
    p = q;
    q = r;
  }
  return result;
}

export function fromContinuedFraction(coefs: bigint[]): { num: bigint; den: bigint } {
  if (coefs.length === 0) {
    throw new RangeError('fromContinuedFraction: array vacío');
  }
  // Recurrencia clásica: h_n = a_n·h_{n-1} + h_{n-2}; k similar.
  // h_{-1}=1, h_{-2}=0, k_{-1}=0, k_{-2}=1.
  let hPrev = 1n;
  let hPrev2 = 0n;
  let kPrev = 0n;
  let kPrev2 = 1n;
  for (const a of coefs) {
    const h = a * hPrev + hPrev2;
    const k = a * kPrev + kPrev2;
    hPrev2 = hPrev;
    hPrev = h;
    kPrev2 = kPrev;
    kPrev = k;
  }
  return { num: hPrev, den: kPrev };
}
