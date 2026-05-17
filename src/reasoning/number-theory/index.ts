// ============================================================
// ST Number Theory — barrel público.
// ============================================================
// Primitivas:
//   gcd / lcm / extendedGcd            — Euclides + Bézout.
//   modPow / modInverse / modSolve     — aritmética modular.
//   crt                                — Chinese Remainder generalizado.
//   isPrime / millerRabin              — primalidad determinístico-ish.
//   nextPrime / previousPrime / primesBelow
//   factorize / divisors / eulerPhi / mobius
//   linearDiophantine                  — Bézout sobre ax+by=c.
//   continuedFractionExpansion / fromContinuedFraction
//   legendreSymbol / jacobiSymbol      — residuos cuadráticos.
// ============================================================

export { gcd, lcm, extendedGcd } from './gcd';
export { modPow, modInverse, modSolve } from './modular';
export type { Congruence } from './crt';
export { crt } from './crt';
export { isPrime, millerRabin, nextPrime, previousPrime, primesBelow } from './primality';
export { factorize, divisors, eulerPhi, mobius } from './factorization';
export {
  linearDiophantine,
  continuedFractionExpansion,
  fromContinuedFraction,
} from './diophantine';
export { legendreSymbol, jacobiSymbol } from './symbols';
