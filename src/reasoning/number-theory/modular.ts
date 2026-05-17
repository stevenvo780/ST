// ============================================================
// Aritmética modular sobre bigint.
// ============================================================
// modPow      — exponenciación modular por squaring.
// modInverse  — inverso multiplicativo usando Bézout (null si no existe).
// modSolve    — resuelve a·x ≡ b (mod m) (null si no hay solución).
// Convención: el resultado siempre vive en [0, m) cuando m > 0.

import { extendedGcd, gcd } from './gcd';

function mod(a: bigint, m: bigint): bigint {
  if (m <= 0n) {
    throw new RangeError(`modulus must be positive, got ${m}`);
  }
  const r = a % m;
  return r < 0n ? r + m : r;
}

export function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  if (m <= 0n) {
    throw new RangeError(`modulus must be positive, got ${m}`);
  }
  if (m === 1n) return 0n;
  if (exp < 0n) {
    // a^(-k) mod m = (a^-1)^k mod m  (si a^-1 existe).
    const inv = modInverse(base, m);
    if (inv === null) {
      throw new RangeError(`modPow: base ${base} no invertible mod ${m}`);
    }
    return modPow(inv, -exp, m);
  }
  let result = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) result = (result * b) % m;
    e >>= 1n;
    b = (b * b) % m;
  }
  return result;
}

export function modInverse(a: bigint, m: bigint): bigint | null {
  if (m <= 0n) {
    throw new RangeError(`modulus must be positive, got ${m}`);
  }
  const { gcd: g, x } = extendedGcd(mod(a, m), m);
  if (g !== 1n) return null;
  return mod(x, m);
}

// Resuelve a·x ≡ b (mod m). Solución única (mod m/gcd) cuando existe.
// Devolvemos la solución mínima no-negativa.
export function modSolve(a: bigint, b: bigint, m: bigint): bigint | null {
  if (m <= 0n) {
    throw new RangeError(`modulus must be positive, got ${m}`);
  }
  const aR = mod(a, m);
  const bR = mod(b, m);
  const g = gcd(aR, m);
  if (bR % g !== 0n) return null;
  const aR2 = aR / g;
  const bR2 = bR / g;
  const m2 = m / g;
  const inv = modInverse(aR2, m2);
  if (inv === null) return null;
  return mod(bR2 * inv, m2);
}

// Exponer mod como helper interno para los demás módulos.
export { mod };
