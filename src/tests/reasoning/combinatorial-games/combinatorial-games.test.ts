// ============================================================
// ST Combinatorial Games — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  mex,
  grundyValue,
  isWinning,
  nimSum,
  multiGameGrundy,
  nim,
  nim1d,
  chompGame,
  ZERO,
  ONE,
  MINUS_ONE,
  STAR,
  fromInt,
  add,
  negate,
  compare,
  isFuzzy,
  simplify,
} from '../../../reasoning/combinatorial-games';

describe('combinatorial-games — mex', () => {
  it('mex(∅) = 0', () => {
    expect(mex(new Set())).toBe(0);
  });
  it('mex({0,1,3}) = 2', () => {
    expect(mex(new Set([0, 1, 3]))).toBe(2);
  });
  it('mex({1,2}) = 0', () => {
    expect(mex(new Set([1, 2]))).toBe(0);
  });
  it('mex({0,1,2,3,4}) = 5', () => {
    expect(mex(new Set([0, 1, 2, 3, 4]))).toBe(5);
  });
});

describe('combinatorial-games — nimSum', () => {
  it('nimSum([]) = 0', () => {
    expect(nimSum([])).toBe(0);
  });
  it('XOR de Nim(3,4,5) = 2', () => {
    expect(nimSum([3, 4, 5])).toBe(2);
  });
  it('XOR de a,a = 0 (autoinverso)', () => {
    expect(nimSum([7, 7])).toBe(0);
  });
});

describe('combinatorial-games — Nim 1D (un solo montón)', () => {
  it('grundy(0) = 0 (terminal)', () => {
    expect(grundyValue(nim1d(0), 0)).toBe(0);
  });
  it('grundy(n) = n para n ∈ [0..7]', () => {
    for (let n = 0; n <= 7; n += 1) {
      expect(grundyValue(nim1d(n), n)).toBe(n);
    }
  });
  it('isWinning para n>0', () => {
    expect(isWinning(nim1d(5), 5)).toBe(true);
  });
});

describe('combinatorial-games — Nim multi-pila', () => {
  it('Nim(3,4,5) grundy = 2 (winning position)', () => {
    const g = nim([3, 4, 5]);
    expect(grundyValue(g, g.initial)).toBe(2);
    expect(isWinning(g, g.initial)).toBe(true);
  });
  it('Nim(3,3) grundy = 0 (losing for player to move)', () => {
    const g = nim([3, 3]);
    expect(grundyValue(g, g.initial)).toBe(0);
    expect(isWinning(g, g.initial)).toBe(false);
  });
  it('Nim(1,2,3) grundy = 0', () => {
    const g = nim([1, 2, 3]);
    expect(grundyValue(g, g.initial)).toBe(0);
  });
  it('Nim() vacío es terminal (grundy 0)', () => {
    const g = nim([]);
    expect(grundyValue(g, g.initial)).toBe(0);
    expect(isWinning(g, g.initial)).toBe(false);
  });
});

describe('combinatorial-games — Chomp', () => {
  it('Chomp 1x1 grundy = 0 (poison cell, losing)', () => {
    const g = chompGame(1, 1);
    expect(grundyValue(g, g.initial)).toBe(0);
    expect(isWinning(g, g.initial)).toBe(false);
  });
  it('Chomp 2x2 es ganador para el primer jugador (grundy ≠ 0)', () => {
    const g = chompGame(2, 2);
    expect(isWinning(g, g.initial)).toBe(true);
  });
  it('Chomp 3x2 es ganador para el primer jugador', () => {
    const g = chompGame(3, 2);
    expect(isWinning(g, g.initial)).toBe(true);
  });
});

describe('combinatorial-games — multiGameGrundy (suma disjunta)', () => {
  it('XOR de Grundys = grundy del compuesto', () => {
    const g1 = nim1d(3);
    const g2 = nim1d(4);
    const g3 = nim1d(5);
    // Cada uno tiene grundy igual a su valor → XOR = 3⊕4⊕5 = 2.
    expect(multiGameGrundy([g1, g2, g3], [3, 4, 5])).toBe(2);
  });
  it('Suma de dos Nim(2) iguales = 0', () => {
    const g = nim1d(2);
    expect(multiGameGrundy([g, g], [2, 2])).toBe(0);
  });
  it('multiGameGrundy con longitudes desiguales lanza', () => {
    expect(() => multiGameGrundy([nim1d(1)], [1, 2])).toThrow();
  });
});

describe('combinatorial-games — Surreal numbers básicos', () => {
  it('ZERO es { | }', () => {
    expect(ZERO.left).toEqual([]);
    expect(ZERO.right).toEqual([]);
  });
  it('ONE es { 0 | } y compara igual a fromInt(1)', () => {
    expect(ONE.left).toHaveLength(1);
    expect(ONE.right).toHaveLength(0);
    expect(compare(ONE, fromInt(1))).toBe(0);
  });
  it('fromInt(0) = ZERO', () => {
    expect(compare(fromInt(0), ZERO)).toBe(0);
  });
  it('fromInt(3) > fromInt(2) > fromInt(1) > 0', () => {
    expect(compare(fromInt(3), fromInt(2))).toBe(1);
    expect(compare(fromInt(2), fromInt(1))).toBe(1);
    expect(compare(fromInt(1), ZERO)).toBe(1);
  });
  it('compare(ONE, ZERO) = 1', () => {
    expect(compare(ONE, ZERO)).toBe(1);
  });
});

describe('combinatorial-games — Surreal: negate / add', () => {
  it('negate(ONE) ≡ -1', () => {
    expect(compare(negate(ONE), MINUS_ONE)).toBe(0);
    expect(compare(negate(ONE), fromInt(-1))).toBe(0);
  });
  it('negate(negate(x)) ≡ x', () => {
    const two = fromInt(2);
    expect(compare(negate(negate(two)), two)).toBe(0);
  });
  it('add(ONE, ONE) ≡ fromInt(2)', () => {
    expect(compare(add(ONE, ONE), fromInt(2))).toBe(0);
  });
  it('add(ZERO, x) ≡ x (identidad)', () => {
    const three = fromInt(3);
    expect(compare(add(ZERO, three), three)).toBe(0);
  });
  it('add(x, negate(x)) ≡ 0', () => {
    const two = fromInt(2);
    expect(compare(add(two, negate(two)), ZERO)).toBe(0);
  });
  it('add(fromInt(2), fromInt(3)) ≡ fromInt(5)', () => {
    expect(compare(add(fromInt(2), fromInt(3)), fromInt(5))).toBe(0);
  });
});

describe('combinatorial-games — Surreal: STAR y fuzzy', () => {
  it('STAR es fuzzy con 0', () => {
    expect(isFuzzy(STAR)).toBe(true);
  });
  it('ZERO no es fuzzy consigo mismo', () => {
    expect(isFuzzy(ZERO)).toBe(false);
  });
  it('ONE no es fuzzy con 0', () => {
    expect(isFuzzy(ONE)).toBe(false);
  });
  it('compare(STAR, ZERO) lanza (incomparables)', () => {
    expect(() => compare(STAR, ZERO)).toThrow();
  });
  it('STAR + STAR ≡ 0 (auto-inverso bajo suma)', () => {
    expect(compare(add(STAR, STAR), ZERO)).toBe(0);
  });
});

describe('combinatorial-games — simplify (dominancia)', () => {
  it('simplify elimina opciones Left dominadas', () => {
    // { 0, 1 | } debería reducir a { 1 | } ≡ 2 ya que 1 ≥ 0.
    const raw = { left: [ZERO, ONE], right: [] };
    const s = simplify(raw);
    expect(s.left).toHaveLength(1);
    // El sobreviviente Left debe ser ONE (la mejor opción).
    expect(compare(s.left[0], ONE)).toBe(0);
  });
  it('simplify deja STAR intacto (opciones no dominables entre sí)', () => {
    const s = simplify(STAR);
    expect(s.left).toHaveLength(1);
    expect(s.right).toHaveLength(1);
  });
  it('simplify es idempotente para ZERO', () => {
    const s = simplify(ZERO);
    expect(s.left).toEqual([]);
    expect(s.right).toEqual([]);
  });
});

describe('combinatorial-games — propiedades estructurales', () => {
  it('grundyValue usa caché entre invocaciones', () => {
    const cache = new Map<string, number>();
    const g = nim([2, 2]);
    const v1 = grundyValue(g, g.initial, cache);
    const size = cache.size;
    const v2 = grundyValue(g, g.initial, cache);
    expect(v1).toBe(v2);
    // Tras la segunda llamada, el caché no crece (hit en raíz).
    expect(cache.size).toBe(size);
  });
  it('nim rechaza pilas negativas', () => {
    expect(() => nim([1, -1])).toThrow();
  });
  it('nim1d rechaza negativos', () => {
    expect(() => nim1d(-1)).toThrow();
  });
  it('chompGame rechaza dims < 1', () => {
    expect(() => chompGame(0, 1)).toThrow();
    expect(() => chompGame(1, 0)).toThrow();
  });
});
