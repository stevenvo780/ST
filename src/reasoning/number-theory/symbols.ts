// ============================================================
// Símbolos de Legendre y Jacobi.
// ============================================================
// legendreSymbol(a, p): a^((p-1)/2) mod p, normalizado a {-1, 0, 1}.
//                      Requiere p primo impar.
// jacobiSymbol(a, n):  generalización a n impar > 0 vía reciprocidad
//                      cuadrática. Coincide con Legendre cuando n es
//                      primo y siempre satisface jacobi(a,n) ∈ {-1,0,1}.

import { modPow, mod } from './modular';

export function legendreSymbol(a: bigint, p: bigint): -1 | 0 | 1 {
  if (p < 3n || (p & 1n) === 0n) {
    throw new RangeError(`legendreSymbol: p debe ser primo impar, recibido ${p}`);
  }
  const aR = mod(a, p);
  if (aR === 0n) return 0;
  const r = modPow(aR, (p - 1n) / 2n, p);
  if (r === 1n) return 1;
  if (r === p - 1n) return -1;
  // Si p no es primo, modPow no garantiza ±1; lo reportamos como 0
  // (el contrato exige p primo, pero somos defensivos).
  return 0;
}

export function jacobiSymbol(a: bigint, n: bigint): -1 | 0 | 1 {
  if (n <= 0n || (n & 1n) === 0n) {
    throw new RangeError(`jacobiSymbol: n debe ser positivo impar, recibido ${n}`);
  }
  let aR = mod(a, n);
  let nR = n;
  let result: 1 | -1 = 1;
  while (aR !== 0n) {
    while ((aR & 1n) === 0n) {
      aR >>= 1n;
      const r = nR & 7n; // nR mod 8
      if (r === 3n || r === 5n) result = -result as 1 | -1;
    }
    // Swap (a,n).
    const tmp = aR;
    aR = nR;
    nR = tmp;
    if ((aR & 3n) === 3n && (nR & 3n) === 3n) {
      result = -result as 1 | -1;
    }
    aR = aR % nR;
  }
  if (nR === 1n) return result;
  return 0;
}
