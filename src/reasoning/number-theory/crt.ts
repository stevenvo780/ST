// ============================================================
// Chinese Remainder Theorem generalizado.
// ============================================================
// Resuelve un sistema de congruencias { x ≡ r_i (mod m_i) }.
// No exige módulos coprimos: si hay módulos compartidos, fusiona
// usando Bézout y devuelve null si el sistema es inconsistente.
// Resultado: solución mínima no-negativa y módulo combinado lcm(m_i).

import { extendedGcd } from './gcd';
import { mod } from './modular';

export interface Congruence {
  remainder: bigint;
  modulus: bigint;
}

export function crt(congruences: Congruence[]): { solution: bigint; modulus: bigint } | null {
  if (congruences.length === 0) return { solution: 0n, modulus: 1n };
  for (const c of congruences) {
    if (c.modulus <= 0n) {
      throw new RangeError(`modulus must be positive, got ${c.modulus}`);
    }
  }
  const first = congruences[0];
  let solution = mod(first.remainder, first.modulus);
  let modulus = first.modulus;
  for (let i = 1; i < congruences.length; i++) {
    const c = congruences[i];
    const r2 = mod(c.remainder, c.modulus);
    const m2 = c.modulus;
    const { gcd: g, x } = extendedGcd(modulus, m2);
    const diff = r2 - solution;
    if (diff % g !== 0n) return null;
    const lcm = (modulus / g) * m2;
    const step = (diff / g) * x;
    solution = mod(solution + modulus * step, lcm);
    modulus = lcm;
  }
  return { solution, modulus };
}
