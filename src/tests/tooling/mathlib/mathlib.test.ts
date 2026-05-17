// ============================================================
// Tests: ST Mathlib — order theory, group theory, ring theory,
// instancias estándar y lemas.
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  // order
  isReflexive,
  isAntisymmetric,
  isTransitive,
  isLattice,
  verifyPartialOrder,
  // group
  isAssociative,
  isCommutative,
  hasIdentity,
  hasInverses,
  verifyGroup,
  verifyAbelianGroup,
  // ring
  verifyRing,
  isField,
  // instances
  intAdditiveGroup,
  intRing,
  rationalsField,
  rational,
  rationalEq,
  rationalDiv,
  zModN,
  zModNElements,
  zModNDiv,
  sym3,
  sym3Elements,
  perm3Eq,
  // lemmas
  STANDARD_LEMMAS,
} from '../../../tooling/mathlib';

// ============================================================
// Order theory
// ============================================================

describe('order theory — divisibility poset on {1,2,3,6}', () => {
  const divides = { leq: (a: number, b: number) => b % a === 0 };
  const elements = [1, 2, 3, 6];

  it('isReflexive: todo n divide a n', () => {
    expect(isReflexive(divides, elements)).toBe(true);
  });

  it('isAntisymmetric: a|b ∧ b|a ⇒ a=b sobre naturales positivos', () => {
    expect(isAntisymmetric(divides, elements)).toBe(true);
  });

  it('isTransitive: a|b ∧ b|c ⇒ a|c', () => {
    expect(isTransitive(divides, elements)).toBe(true);
  });

  it('verifyPartialOrder: divisibilidad es poset válido', () => {
    const result = verifyPartialOrder(divides, elements);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('isLattice: {1,2,3,6} con divisibilidad es lattice (mcm=6, mcd=1)', () => {
    expect(isLattice(divides, elements)).toBe(true);
  });

  it('isLattice: {2,3} sin 1 ni 6 NO es lattice (no hay join ni meet)', () => {
    expect(isLattice(divides, [2, 3])).toBe(false);
  });

  it('detecta no-transitividad en relación cooked-up', () => {
    // a R b si |a-b| ≤ 1 — no transitiva: 1 R 2, 2 R 3, pero 1 ¬R 3.
    const closeRel = { leq: (a: number, b: number) => Math.abs(a - b) <= 1 };
    expect(isTransitive(closeRel, [1, 2, 3])).toBe(false);
  });
});

// ============================================================
// Group theory
// ============================================================

describe('group theory — Z aditivo', () => {
  const sample = [-2n, -1n, 0n, 1n, 2n];

  it('intAdditiveGroup: asociatividad', () => {
    expect(isAssociative(intAdditiveGroup, sample)).toBe(true);
  });

  it('intAdditiveGroup: conmutatividad', () => {
    expect(isCommutative(intAdditiveGroup, sample)).toBe(true);
  });

  it('intAdditiveGroup: 0 es identidad aditiva', () => {
    expect(hasIdentity(intAdditiveGroup, sample, intAdditiveGroup.identity)).toBe(true);
  });

  it('intAdditiveGroup: cada n tiene inverso -n', () => {
    expect(hasInverses(intAdditiveGroup, sample)).toBe(true);
  });

  it('verifyGroup(Z, +) pasa todos los axiomas', () => {
    const result = verifyGroup(intAdditiveGroup, sample);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('verifyAbelianGroup(Z, +) incluye conmutatividad y pasa', () => {
    const result = verifyAbelianGroup(intAdditiveGroup, sample);
    expect(result.valid).toBe(true);
  });
});

describe('group theory — S_3 simétrico', () => {
  it('sym3: es grupo (asociativo + identidad + inversos)', () => {
    const result = verifyGroup(sym3, sym3Elements, perm3Eq);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('sym3: NO es abeliano — (0 1) ∘ (0 2) ≠ (0 2) ∘ (0 1)', () => {
    expect(isCommutative(sym3, sym3Elements, perm3Eq)).toBe(false);
  });

  it('sym3: verifyAbelianGroup falla en conmutatividad', () => {
    const result = verifyAbelianGroup(sym3, sym3Elements, perm3Eq);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain('conmutatividad');
  });

  it('sym3: el inverso de un elemento aplicado dos veces es el original', () => {
    for (const p of sym3Elements) {
      const inv = sym3.inverse(p);
      const reconstructed = sym3.inverse(inv);
      expect(perm3Eq(reconstructed, p)).toBe(true);
    }
  });
});

// ============================================================
// Ring theory
// ============================================================

describe('ring theory — Z anillo', () => {
  const sample = [-2n, -1n, 0n, 1n, 2n];

  it('verifyRing(Z): pasa todos los axiomas', () => {
    const result = verifyRing(intRing, sample);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('intRing: zero=0, one=1', () => {
    expect(intRing.zero).toBe(0n);
    expect(intRing.one).toBe(1n);
  });

  it('intRing: distributividad explícita 2*(3+4)=2*3+2*4', () => {
    const left = intRing.mul(2n, intRing.add(3n, 4n));
    const right = intRing.add(intRing.mul(2n, 3n), intRing.mul(2n, 4n));
    expect(left).toBe(right);
  });

  it('intRing NO es campo (2 no tiene inverso multiplicativo en Z)', () => {
    // div definida solo cuando divide exacta — usamos undefined si no divisible.
    const intDiv = (a: bigint, b: bigint): bigint | undefined =>
      b !== 0n && a % b === 0n ? a / b : undefined;
    expect(isField(intRing, sample, intDiv)).toBe(false);
  });
});

describe('ring theory — Z/nZ', () => {
  it('zModN(5): es anillo válido', () => {
    const r = zModN(5n);
    const result = verifyRing(r, zModNElements(5n));
    expect(result.valid).toBe(true);
  });

  it('zModN(5): es campo (5 es primo)', () => {
    const r = zModN(5n);
    expect(isField(r, zModNElements(5n), zModNDiv(5n))).toBe(true);
  });

  it('zModN(7): es campo (7 es primo)', () => {
    const r = zModN(7n);
    expect(isField(r, zModNElements(7n), zModNDiv(7n))).toBe(true);
  });

  it('zModN(4): NO es campo (4 no es primo, 2 no tiene inverso)', () => {
    const r = zModN(4n);
    expect(isField(r, zModNElements(4n), zModNDiv(4n))).toBe(false);
  });

  it('zModN(6): NO es campo', () => {
    const r = zModN(6n);
    expect(isField(r, zModNElements(6n), zModNDiv(6n))).toBe(false);
  });

  it('zModN(5): 3 + 4 = 2 (mod 5)', () => {
    const r = zModN(5n);
    expect(r.add(3n, 4n)).toBe(2n);
  });

  it('zModN(5): 3 * 4 = 2 (mod 5)', () => {
    const r = zModN(5n);
    expect(r.mul(3n, 4n)).toBe(2n);
  });
});

describe('ring theory — racionales como campo', () => {
  const sample = [
    rational(0n, 1n),
    rational(1n, 1n),
    rational(-1n, 1n),
    rational(1n, 2n),
    rational(2n, 3n),
  ];

  it('rationalsField: anillo válido sobre muestreo', () => {
    const result = verifyRing(rationalsField, sample, rationalEq);
    expect(result.valid).toBe(true);
  });

  it('rationalsField: es campo (todo no-cero invertible)', () => {
    expect(isField(rationalsField, sample, rationalDiv, rationalEq)).toBe(true);
  });

  it('rational: 2/4 se reduce a 1/2', () => {
    const r = rational(2n, 4n);
    expect(r.num).toBe(1n);
    expect(r.den).toBe(2n);
  });

  it('rationalDiv: división por cero devuelve undefined', () => {
    expect(rationalDiv(rational(1n, 1n), rational(0n, 1n))).toBeUndefined();
  });

  it('rational: normaliza signos (1/-2 → -1/2)', () => {
    const r = rational(1n, -2n);
    expect(r.num).toBe(-1n);
    expect(r.den).toBe(2n);
  });

  it('rational: error si denominador es 0', () => {
    expect(() => rational(1n, 0n)).toThrow();
  });
});

// ============================================================
// Lemmas
// ============================================================

describe('standard lemmas', () => {
  it('STANDARD_LEMMAS contiene al menos 8 lemas', () => {
    expect(STANDARD_LEMMAS.length).toBeGreaterThanOrEqual(8);
  });

  it('cada lemma tiene name y statement no vacíos', () => {
    for (const l of STANDARD_LEMMAS) {
      expect(l.name).toBeTruthy();
      expect(l.statement.length).toBeGreaterThan(0);
    }
  });

  it('group.inverse_unique es aplicable a estructura con op', () => {
    const lemma = STANDARD_LEMMAS.find((l) => l.name === 'group.inverse_unique');
    expect(lemma).toBeDefined();
    const struct = {
      name: 'test',
      elements: [],
      operations: new Map<string, (...args: unknown[]) => unknown>([['op', (a, b) => [a, b]]]),
      axioms: [],
    };
    expect(lemma!.applicableTo(struct)).toBe(true);
  });

  it('ring.zero_times_anything requiere ops add y mul', () => {
    const lemma = STANDARD_LEMMAS.find((l) => l.name === 'ring.zero_times_anything');
    expect(lemma).toBeDefined();
    const onlyAdd = {
      name: 'test',
      elements: [],
      operations: new Map<string, (...args: unknown[]) => unknown>([['add', (a, b) => [a, b]]]),
      axioms: [],
    };
    expect(lemma!.applicableTo(onlyAdd)).toBe(false);
  });
});
