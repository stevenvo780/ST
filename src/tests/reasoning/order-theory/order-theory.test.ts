import { describe, expect, it } from 'vitest';
import {
  coverRelations,
  dilworth,
  greatestElement,
  hasseDot,
  height,
  infimum,
  isAntichain,
  isAntisymmetric,
  isChain,
  isPoset,
  isReflexive,
  isTotal,
  isTransitive,
  isWellOrdered,
  leastElement,
  maximalAntichains,
  maximalChains,
  maximalElements,
  minimalElements,
  type Poset,
  supremum,
  wellFoundedInduction,
  width,
  zornsLemmaWitness,
} from '../../../reasoning/order-theory';

// ────────────────────────────────────────────────────────────────────
// Helpers: canonical posets
// ────────────────────────────────────────────────────────────────────

const divides = (a: number, b: number): boolean => b % a === 0;

/** Divisibility poset on {1,2,3,6}. */
const divPoset: Poset<number> = {
  elements: [1, 2, 3, 6],
  leq: divides,
};

/** Total order on [1..n]. */
const totalChain = (n: number): Poset<number> => ({
  elements: Array.from({ length: n }, (_, i) => i + 1),
  leq: (a: number, b: number) => a <= b,
});

/** Pure antichain: n incomparable elements. */
const antichainPoset = (n: number): Poset<number> => ({
  elements: Array.from({ length: n }, (_, i) => i),
  leq: (a: number, b: number) => a === b,
});

/** Diamond poset {⊥, a, b, ⊤} with a, b incomparable. */
const diamondPoset: Poset<string> = {
  elements: ['bot', 'a', 'b', 'top'],
  leq: (x: string, y: string): boolean => {
    if (x === y) return true;
    if (x === 'bot') return true;
    if (y === 'top') return true;
    return false;
  },
};

// ────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────

describe('Order theory — relational axioms', () => {
  it('divisibility {1,2,3,6} es un poset', () => {
    expect(isReflexive(divPoset)).toBe(true);
    expect(isAntisymmetric(divPoset)).toBe(true);
    expect(isTransitive(divPoset)).toBe(true);
    expect(isPoset(divPoset)).toBe(true);
  });

  it('total order [1..5] es total y por tanto poset', () => {
    const T = totalChain(5);
    expect(isPoset(T)).toBe(true);
    expect(isTotal(T)).toBe(true);
  });

  it('divisibility {1,2,3,6} NO es total (2 y 3 incomparables)', () => {
    expect(isTotal(divPoset)).toBe(false);
  });

  it('antichain de 3 elementos es poset pero no total', () => {
    const A = antichainPoset(3);
    expect(isPoset(A)).toBe(true);
    expect(isTotal(A)).toBe(false);
  });

  it('una relación no transitiva no es poset', () => {
    const bad: Poset<number> = {
      elements: [1, 2, 3],
      leq: (a, b) => a === b || (a === 1 && b === 2) || (a === 2 && b === 3),
    };
    expect(isTransitive(bad)).toBe(false);
    expect(isPoset(bad)).toBe(false);
  });
});

describe('Order theory — chains y antichains', () => {
  it('[1,2,6] es cadena en divisibilidad pero [2,3] es anticadena', () => {
    expect(isChain(divPoset, [1, 2, 6])).toBe(true);
    expect(isChain(divPoset, [2, 3])).toBe(false);
    expect(isAntichain(divPoset, [2, 3])).toBe(true);
    expect(isAntichain(divPoset, [1, 2])).toBe(false);
  });

  it('width de una cadena total = 1, height = n', () => {
    const T = totalChain(5);
    expect(width(T)).toBe(1);
    expect(height(T)).toBe(5);
  });

  it('width de una anticadena pura = n, height = 1', () => {
    const A = antichainPoset(4);
    expect(width(A)).toBe(4);
    expect(height(A)).toBe(1);
  });

  it('divisibility {1,2,3,6}: width=2 (anticadena {2,3}), height=3', () => {
    expect(width(divPoset)).toBe(2);
    expect(height(divPoset)).toBe(3);
  });

  it('maximalChains de divisibility {1,2,3,6} contiene 1→2→6 y 1→3→6', () => {
    const chains = maximalChains(divPoset);
    const flat = chains.map((c) => c.join('-'));
    expect(flat).toContain('1-2-6');
    expect(flat).toContain('1-3-6');
  });

  it('maximalAntichains de divisibility {1,2,3,6} incluye {2,3}', () => {
    const ants = maximalAntichains(divPoset);
    const has23 = ants.some((a) => a.length === 2 && a.includes(2) && a.includes(3));
    expect(has23).toBe(true);
  });
});

describe('Order theory — Dilworth', () => {
  it('partición de Dilworth en divisibilidad {1,2,3,6} usa ≤ width cadenas', () => {
    const chains = dilworth(divPoset);
    expect(chains.length).toBeLessThanOrEqual(width(divPoset));
    // Cubre todos los elementos.
    const covered = new Set<number>();
    for (const c of chains) for (const x of c) covered.add(x);
    expect(covered.size).toBe(divPoset.elements.length);
    // Cada parte es una cadena.
    for (const c of chains) expect(isChain(divPoset, c)).toBe(true);
  });

  it('partición de Dilworth en anticadena pura tiene exactamente n cadenas singleton', () => {
    const A = antichainPoset(3);
    const chains = dilworth(A);
    expect(chains.length).toBe(3);
    for (const c of chains) expect(c.length).toBe(1);
  });

  it('partición de Dilworth en cadena total es una sola cadena', () => {
    const T = totalChain(4);
    const chains = dilworth(T);
    expect(chains.length).toBe(1);
    expect(chains[0]?.length).toBe(4);
  });
});

describe('Order theory — extrema y well-ordering', () => {
  it('minimalElements/maximalElements en divisibility {1,2,3,6}', () => {
    expect(minimalElements(divPoset)).toEqual([1]);
    expect(maximalElements(divPoset)).toEqual([6]);
  });

  it('least/greatest en subconjunto', () => {
    expect(leastElement(divPoset, [2, 3, 6])).toBeUndefined();
    expect(greatestElement(divPoset, [1, 2, 6])).toBe(6);
    expect(leastElement(totalChain(5), [3, 4, 5])).toBe(3);
  });

  it('isWellOrdered true para [1..N] y false para divisibilidad', () => {
    expect(isWellOrdered(totalChain(7))).toBe(true);
    expect(isWellOrdered(divPoset)).toBe(false);
  });

  it('greatestElement del poset diamante NO existe para {a,b}', () => {
    expect(greatestElement(diamondPoset, ['a', 'b'])).toBeUndefined();
    expect(leastElement(diamondPoset, ['a', 'b'])).toBeUndefined();
  });
});

describe('Order theory — Hasse', () => {
  it('cover relations en divisibility {1,2,3,6}: 1<2, 1<3, 2<6, 3<6', () => {
    const covers = coverRelations(divPoset).map(([a, b]) => `${a}<${b}`);
    expect(covers).toContain('1<2');
    expect(covers).toContain('1<3');
    expect(covers).toContain('2<6');
    expect(covers).toContain('3<6');
    expect(covers).not.toContain('1<6'); // no es cover (pasa por 2 o 3)
  });

  it('hasseDot produce código DOT válido con los nodos', () => {
    const dot = hasseDot(divPoset);
    expect(dot).toMatch(/^digraph Hasse/);
    expect(dot).toContain('"1"');
    expect(dot).toContain('"6"');
    expect(dot).toContain('"1" -> "2"');
  });
});

describe('Order theory — infimum/supremum', () => {
  it('en divisibility {1,2,3,6}: sup{2,3}=6, inf{2,3}=1', () => {
    expect(supremum(divPoset, [2, 3])).toBe(6);
    expect(infimum(divPoset, [2, 3])).toBe(1);
  });

  it('sup/inf en cadena total coincide con max/min del subconjunto', () => {
    const T = totalChain(6);
    expect(supremum(T, [2, 4, 5])).toBe(5);
    expect(infimum(T, [2, 4, 5])).toBe(2);
  });
});

describe('Order theory — Zorn finito', () => {
  it('Zorn devuelve un maximal en cadena finita', () => {
    const T = totalChain(4);
    const w = zornsLemmaWitness(T);
    expect(w).toBe(4);
  });

  it('Zorn en divisibility {1,2,3,6} devuelve 6', () => {
    expect(zornsLemmaWitness(divPoset)).toBe(6);
  });

  it('Zorn en poset diamante devuelve "top"', () => {
    expect(zornsLemmaWitness(diamondPoset)).toBe('top');
  });

  it('Zorn falla con carrier vacío', () => {
    const empty: Poset<number> = { elements: [], leq: (a, b) => a <= b };
    const r = zornsLemmaWitness(empty);
    expect(r).toHaveProperty('error');
  });
});

describe('Order theory — well-founded induction', () => {
  it('predicado siempre-true pasa la inducción', () => {
    expect(wellFoundedInduction(divPoset, () => true)).toBe(true);
  });

  it('predicado que falla en un minimal rompe la inducción', () => {
    // En la divisibilidad {1,2,3,6}, 1 es minimal: sus predecesores
    // estrictos son ∅, así que la premisa "∀y<x, P(y)" es vacuamente
    // verdadera. Si P(1) = false, la implicación falla en x=1.
    expect(wellFoundedInduction(divPoset, (n) => n !== 1)).toBe(false);
  });

  it('predicado "es divisor de 6" es consistente bajo well-founded induction', () => {
    // Cualquier elemento del poset divide a 6, así que la propiedad
    // es trivialmente preservada por la inducción.
    expect(wellFoundedInduction(divPoset, (n) => 6 % n === 0)).toBe(true);
  });
});
