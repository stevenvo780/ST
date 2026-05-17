// ============================================================
// ST Mathlib — Instancias estándar
// Z aditivo, anillo Z, racionales como campo, Z/nZ, S_3.
// ============================================================

import type { AbelianGroup, Group, Ring } from './types';

// ------------------------------------------------------------
// (Z, +): grupo abeliano aditivo de enteros.
// ------------------------------------------------------------
export const intAdditiveGroup: AbelianGroup<bigint> = {
  op: (a, b) => a + b,
  identity: 0n,
  inverse: (a) => -a,
};

// ------------------------------------------------------------
// (Z, +, ·): anillo conmutativo con unidad.
// ------------------------------------------------------------
export const intRing: Ring<bigint> = {
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  zero: 0n,
  one: 1n,
  neg: (a) => -a,
};

// ------------------------------------------------------------
// Racionales como campo: representados como fracciones reducidas.
// El campo NO se modela como Ring<Rational> con conjunto finito —
// se exponen utilidades de construcción y un Ring que usa
// igualdad por valor normalizado.
// ------------------------------------------------------------
export interface Rational {
  num: bigint;
  den: bigint; // siempre > 0n
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0n ? 1n : x;
}

export function rational(num: bigint, den: bigint): Rational {
  if (den === 0n) throw new Error('rational: denominador cero');
  const sign = den < 0n ? -1n : 1n;
  const n = num * sign;
  const d = den * sign;
  const g = gcd(n < 0n ? -n : n, d);
  return { num: n / g, den: d / g };
}

export function rationalEq(a: Rational, b: Rational): boolean {
  return a.num === b.num && a.den === b.den;
}

export const rationalsField: Ring<Rational> = {
  add: (a, b) => rational(a.num * b.den + b.num * a.den, a.den * b.den),
  mul: (a, b) => rational(a.num * b.num, a.den * b.den),
  zero: { num: 0n, den: 1n },
  one: { num: 1n, den: 1n },
  neg: (a) => ({ num: -a.num, den: a.den }),
};

/**
 * División en Q. `undefined` solo cuando b = 0/1 (división por cero).
 */
export function rationalDiv(a: Rational, b: Rational): Rational | undefined {
  if (b.num === 0n) return undefined;
  return rational(a.num * b.den, a.den * b.num);
}

// ------------------------------------------------------------
// Z/nZ: enteros módulo n. Es campo sii n es primo.
// ------------------------------------------------------------
function mod(a: bigint, n: bigint): bigint {
  const r = a % n;
  return r < 0n ? r + n : r;
}

export function zModN(n: bigint): Ring<bigint> {
  if (n <= 0n) throw new Error('zModN: n debe ser positivo');
  return {
    add: (a, b) => mod(a + b, n),
    mul: (a, b) => mod(a * b, n),
    zero: 0n,
    one: mod(1n, n),
    neg: (a) => mod(-a, n),
  };
}

/**
 * Lista los n representantes canónicos {0, 1, ..., n-1}.
 */
export function zModNElements(n: bigint): bigint[] {
  const out: bigint[] = [];
  for (let i = 0n; i < n; i++) out.push(i);
  return out;
}

/**
 * División modular: busca b tal que a · b ≡ 1 (mod n) por fuerza bruta
 * sobre el dominio finito. Devuelve undefined si no existe inverso.
 */
export function zModNDiv(n: bigint): (a: bigint, b: bigint) => bigint | undefined {
  return (a, b) => {
    if (b === 0n) return undefined;
    for (let x = 0n; x < n; x++) {
      if (mod(b * x, n) === 1n) return mod(a * x, n);
    }
    return undefined;
  };
}

// ------------------------------------------------------------
// S_3: grupo simétrico sobre {0,1,2}. Representado como permutación
// [σ(0), σ(1), σ(2)]. 6 elementos, no abeliano.
// ------------------------------------------------------------
export type Perm3 = [number, number, number];

export const sym3Elements: Perm3[] = [
  [0, 1, 2], // identidad
  [1, 0, 2], // transposición (0 1)
  [2, 1, 0], // transposición (0 2)
  [0, 2, 1], // transposición (1 2)
  [1, 2, 0], // ciclo (0 1 2)
  [2, 0, 1], // ciclo (0 2 1)
];

function composePerm3(a: Perm3, b: Perm3): Perm3 {
  // (a ∘ b)(i) = a(b(i))
  return [a[b[0]], a[b[1]], a[b[2]]];
}

function invertPerm3(a: Perm3): Perm3 {
  const out: Perm3 = [0, 0, 0];
  out[a[0]] = 0;
  out[a[1]] = 1;
  out[a[2]] = 2;
  return out;
}

export function perm3Eq(a: Perm3, b: Perm3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export const sym3: Group<Perm3> = {
  op: composePerm3,
  identity: [0, 1, 2],
  inverse: invertPerm3,
};
