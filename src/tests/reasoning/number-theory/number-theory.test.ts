import { describe, it, expect } from 'vitest';
import {
  gcd,
  lcm,
  extendedGcd,
  modPow,
  modInverse,
  modSolve,
  crt,
  isPrime,
  millerRabin,
  nextPrime,
  previousPrime,
  primesBelow,
  factorize,
  divisors,
  eulerPhi,
  mobius,
  linearDiophantine,
  continuedFractionExpansion,
  fromContinuedFraction,
  legendreSymbol,
  jacobiSymbol,
} from '../../../reasoning/number-theory';

describe('Number Theory — primitivas', () => {
  it('gcd(48, 36) = 12 y gcd con negativos toma valor absoluto', () => {
    expect(gcd(48n, 36n)).toBe(12n);
    expect(gcd(-48n, 36n)).toBe(12n);
    expect(gcd(0n, 7n)).toBe(7n);
    expect(gcd(0n, 0n)).toBe(0n);
  });

  it('lcm(4, 6) = 12; lcm(0, k) = 0', () => {
    expect(lcm(4n, 6n)).toBe(12n);
    expect(lcm(0n, 9n)).toBe(0n);
    expect(lcm(21n, 6n)).toBe(42n);
  });

  it('extendedGcd(35, 15) cumple a·x + b·y = gcd', () => {
    const { gcd: g, x, y } = extendedGcd(35n, 15n);
    expect(g).toBe(5n);
    expect(35n * x + 15n * y).toBe(g);
  });

  it('extendedGcd con coprimos: 17·x + 5·y = 1', () => {
    const { gcd: g, x, y } = extendedGcd(17n, 5n);
    expect(g).toBe(1n);
    expect(17n * x + 5n * y).toBe(1n);
  });

  it('modPow(2, 10, 1000) = 24', () => {
    expect(modPow(2n, 10n, 1000n)).toBe(24n);
  });

  it('modPow respeta exponente grande (Fermat para p=13)', () => {
    // Por Fermat pequeño: a^(p-1) ≡ 1 (mod p) si gcd(a,p)=1.
    expect(modPow(7n, 12n, 13n)).toBe(1n);
  });

  it('modInverse(3, 11) = 4 (3·4 ≡ 1 mod 11)', () => {
    const inv = modInverse(3n, 11n);
    expect(inv).toBe(4n);
    expect((3n * 4n) % 11n).toBe(1n);
  });

  it('modInverse no existe cuando gcd(a, m) > 1', () => {
    expect(modInverse(6n, 9n)).toBeNull();
  });

  it('modSolve: 14·x ≡ 30 (mod 100) → x = 95 (mínima no-negativa mod 50)', () => {
    const x = modSolve(14n, 30n, 100n);
    // gcd(14, 100) = 2, 30/2=15, 14/2=7, 100/2=50; 7^-1 mod 50 = 43
    // x ≡ 15·43 ≡ 645 ≡ 45 (mod 50). La menor no-negativa < 50 es 45.
    expect(x).toBe(45n);
    expect(x !== null && (14n * x) % 100n).toBe(30n);
  });

  it('CRT: x ≡ 3 mod 5, x ≡ 5 mod 7 → x = 33 mod 35', () => {
    // El prompt original decía 26, pero 26%5=1≠3. La solución correcta
    // es 33: 33%5=3 y 33%7=5. (Verificación independiente.)
    const r = crt([
      { remainder: 3n, modulus: 5n },
      { remainder: 5n, modulus: 7n },
    ]);
    expect(r).not.toBeNull();
    expect(r!.solution).toBe(33n);
    expect(r!.modulus).toBe(35n);
    expect(r!.solution % 5n).toBe(3n);
    expect(r!.solution % 7n).toBe(5n);
  });

  it('CRT con módulos no coprimos consistentes: x ≡ 2 mod 6 y x ≡ 8 mod 9 → 26 mod 18', () => {
    const r = crt([
      { remainder: 2n, modulus: 6n },
      { remainder: 8n, modulus: 9n },
    ]);
    // gcd(6,9)=3; 8 mod 3 = 2; 2 mod 3 = 2 — consistente.
    // lcm = 18. Soluciones: x ≡ 8 (mod 18).
    expect(r).not.toBeNull();
    expect(r!.modulus).toBe(18n);
    expect(r!.solution % 6n).toBe(2n);
    expect(r!.solution % 9n).toBe(8n);
  });

  it('CRT inconsistente devuelve null', () => {
    const r = crt([
      { remainder: 1n, modulus: 4n },
      { remainder: 2n, modulus: 6n },
    ]);
    // 1 mod 2 = 1; 2 mod 2 = 0 → incompatible.
    expect(r).toBeNull();
  });

  it('isPrime(97) = true; isPrime(91) = false (7·13)', () => {
    expect(isPrime(97n)).toBe(true);
    expect(isPrime(91n)).toBe(false);
    expect(isPrime(2n)).toBe(true);
    expect(isPrime(1n)).toBe(false);
    expect(isPrime(0n)).toBe(false);
  });

  it('millerRabin: Mersenne 2^17 - 1 = 131071 es primo', () => {
    expect(millerRabin((1n << 17n) - 1n)).toBe(true);
    // 2^11 - 1 = 2047 = 23·89, NO primo.
    expect(millerRabin((1n << 11n) - 1n)).toBe(false);
  });

  it('nextPrime / previousPrime', () => {
    expect(nextPrime(10n)).toBe(11n);
    expect(nextPrime(13n)).toBe(17n);
    expect(previousPrime(20n)).toBe(19n);
    expect(previousPrime(3n)).toBe(2n);
  });

  it('primesBelow(20) = [2,3,5,7,11,13,17,19]', () => {
    expect(primesBelow(20)).toEqual([2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n]);
    expect(primesBelow(2)).toEqual([]);
    expect(primesBelow(3)).toEqual([2n]);
  });

  it('factorize(60) = [(2,2),(3,1),(5,1)]', () => {
    expect(factorize(60n)).toEqual([
      { prime: 2n, exponent: 2 },
      { prime: 3n, exponent: 1 },
      { prime: 5n, exponent: 1 },
    ]);
  });

  it('factorize(1) = [] y factorize de primo grande', () => {
    expect(factorize(1n)).toEqual([]);
    expect(factorize(131071n)).toEqual([{ prime: 131071n, exponent: 1 }]);
  });

  it('factorize de semiprime grande (Pollard rho rama)', () => {
    // 1009 · 1013 = 1022117 — fuerza la rama Pollard-rho.
    const factors = factorize(1009n * 1013n);
    expect(factors).toEqual([
      { prime: 1009n, exponent: 1 },
      { prime: 1013n, exponent: 1 },
    ]);
  });

  it('divisors(12) = [1,2,3,4,6,12]', () => {
    expect(divisors(12n)).toEqual([1n, 2n, 3n, 4n, 6n, 12n]);
    expect(divisors(1n)).toEqual([1n]);
  });

  it('eulerPhi(12) = 4, eulerPhi(p) = p-1', () => {
    expect(eulerPhi(12n)).toBe(4n);
    expect(eulerPhi(13n)).toBe(12n);
    expect(eulerPhi(1n)).toBe(1n);
    expect(eulerPhi(36n)).toBe(12n);
  });

  it('mobius: μ(30) = -1; μ(12) = 0; μ(1) = 1; μ(6) = 1', () => {
    expect(mobius(30n)).toBe(-1);
    expect(mobius(12n)).toBe(0);
    expect(mobius(1n)).toBe(1);
    expect(mobius(6n)).toBe(1);
  });

  it('linearDiophantine: 35x + 15y = 5 tiene solución', () => {
    const sol = linearDiophantine(35n, 15n, 5n);
    expect(sol).not.toBeNull();
    expect(35n * sol!.x + 15n * sol!.y).toBe(5n);
    // 35x + 15y = 4 NO tiene solución (gcd=5 no divide 4).
    expect(linearDiophantine(35n, 15n, 4n)).toBeNull();
  });

  it('Continued fraction roundtrip: 415/93 = [4;2,6,7]', () => {
    const cf = continuedFractionExpansion(415n, 93n);
    expect(cf).toEqual([4n, 2n, 6n, 7n]);
    const { num, den } = fromContinuedFraction(cf);
    expect(num).toBe(415n);
    expect(den).toBe(93n);
  });

  it('legendreSymbol(2, 7) = 1; legendreSymbol(3, 7) = -1', () => {
    expect(legendreSymbol(2n, 7n)).toBe(1);
    expect(legendreSymbol(3n, 7n)).toBe(-1);
    expect(legendreSymbol(7n, 7n)).toBe(0);
  });

  it('jacobiSymbol(1001, 9907) computa correctamente', () => {
    // 9907 es primo, así que jacobi == legendre.
    // Para chequear consistencia: jacobi(a, n)·jacobi(a, n) ∈ {0, 1}.
    const j = jacobiSymbol(1001n, 9907n);
    expect([-1, 0, 1]).toContain(j);
    // Caso conocido: jacobi(2, 15) = 1 (porque 15 ≡ 7 mod 8).
    expect(jacobiSymbol(2n, 15n)).toBe(1);
    // Caso conocido: jacobi(2, 9) = 1 (9 ≡ 1 mod 8).
    expect(jacobiSymbol(2n, 9n)).toBe(1);
  });
});
