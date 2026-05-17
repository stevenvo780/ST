import { describe, expect, it } from 'vitest';
import {
  atoms,
  chain,
  coatoms,
  complement,
  containsDiamond,
  containsPentagon,
  dedekindAnalysis,
  diamondM3,
  divisibilityLattice,
  isBoolean,
  isComplemented,
  isDistributive,
  isHeyting,
  isLattice,
  isModular,
  makeLattice,
  pentagonN5,
  powerSetLattice,
  relativeComplement,
} from '../../../reasoning/lattice';

const eq = <T>(L: { leq: (a: T, b: T) => boolean }, a: T, b: T): boolean =>
  L.leq(a, b) && L.leq(b, a);

describe('Lattice — power set 2^{a,b}', () => {
  const L = powerSetLattice(['a', 'b']);

  it('contiene exactamente 4 elementos', () => {
    expect(L.elements.length).toBe(4);
  });

  it('es booleana: distributiva + complementada', () => {
    expect(isBoolean(L)).toBe(true);
    expect(isDistributive(L)).toBe(true);
    expect(isComplemented(L)).toBe(true);
  });

  it('es Heyting (corolario de distributividad finita)', () => {
    expect(isHeyting(L)).toBe(true);
  });

  it('cada subconjunto tiene complemento único (el complemento de conjuntos)', () => {
    for (const s of L.elements) {
      const c = complement(L, s);
      expect(c).not.toBeNull();
      // a ∪ c = top, a ∩ c = bottom
      expect(eq(L, L.join(s, c as Set<string>), L.top)).toBe(true);
      expect(eq(L, L.meet(s, c as Set<string>), L.bottom)).toBe(true);
    }
  });
});

describe('Lattice — divisores de 30', () => {
  const L = divisibilityLattice(30);

  it('elementos = {1,2,3,5,6,10,15,30}', () => {
    const sorted = L.elements.slice().sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 5, 6, 10, 15, 30]);
  });

  it('top = 30, bottom = 1', () => {
    expect(L.top).toBe(30);
    expect(L.bottom).toBe(1);
  });

  it('es distributiva (n libre de cuadrados ⇒ 2^k Booleana)', () => {
    expect(isDistributive(L)).toBe(true);
    expect(isBoolean(L)).toBe(true);
  });

  it('join = lcm, meet = gcd: join(6,10)=30, meet(6,10)=2', () => {
    expect(L.join(6, 10)).toBe(30);
    expect(L.meet(6, 10)).toBe(2);
  });

  it('átomos = primos {2,3,5}', () => {
    const a = atoms(L)
      .slice()
      .sort((x, y) => x - y);
    expect(a).toEqual([2, 3, 5]);
  });

  it('coátomos = {6,10,15}', () => {
    const c = coatoms(L)
      .slice()
      .sort((x, y) => x - y);
    expect(c).toEqual([6, 10, 15]);
  });
});

describe('Lattice — divisores de 12 (no libre de cuadrados)', () => {
  // 12 = 2^2 · 3: distributive pero NO complementada (2 y 6 no tienen complemento)
  const L = divisibilityLattice(12);

  it('es distributiva pero NO Booleana (12 no es libre de cuadrados)', () => {
    expect(isDistributive(L)).toBe(true);
    expect(isComplemented(L)).toBe(false);
    expect(isBoolean(L)).toBe(false);
  });

  it('el elemento 2 no tiene complemento', () => {
    expect(complement(L, 2)).toBeNull();
  });
});

describe('Lattice — chain(5)', () => {
  const L = chain(5);

  it('es totally ordered (lattice trivialmente)', () => {
    expect(L.elements.length).toBe(5);
    expect(L.top).toBe(4);
    expect(L.bottom).toBe(0);
  });

  it('es distributiva pero NO complementada (excepto en cadena de 2)', () => {
    expect(isDistributive(L)).toBe(true);
    expect(isComplemented(L)).toBe(false);
  });

  it('cadena de 2 sí es Booleana', () => {
    const L2 = chain(2);
    expect(isBoolean(L2)).toBe(true);
  });

  it('no contiene N5 ni M3', () => {
    expect(containsPentagon(L)).toBe(false);
    expect(containsDiamond(L)).toBe(false);
  });
});

describe('Lattice — pentágono N5', () => {
  const L = pentagonN5();

  it('contiene un subreticulado N5 (a sí mismo)', () => {
    expect(containsPentagon(L)).toBe(true);
  });

  it('NO es modular (Dedekind)', () => {
    expect(isModular(L)).toBe(false);
  });

  it('NO es distributivo', () => {
    expect(isDistributive(L)).toBe(false);
  });

  it('es complementado (cada elemento medio cumple a∨x=T, a∧x=B)', () => {
    // En N5 con {B,a,c,b,T}: complemento de 'a' es 'b'; de 'c' también es 'b';
    // 'b' tiene dos complementos posibles (a o c). Todos tienen alguno.
    expect(isComplemented(L)).toBe(true);
  });
});

describe('Lattice — diamante M3', () => {
  const L = diamondM3();

  it('contiene un subreticulado M3', () => {
    expect(containsDiamond(L)).toBe(true);
  });

  it('es modular pero NO distributivo', () => {
    expect(isModular(L)).toBe(true);
    expect(isDistributive(L)).toBe(false);
  });

  it('NO contiene N5', () => {
    expect(containsPentagon(L)).toBe(false);
  });

  it('es complementado pero no Booleano (complementos no únicos)', () => {
    expect(isComplemented(L)).toBe(true);
    expect(isBoolean(L)).toBe(false);
  });
});

describe('Lattice — Dedekind / Birkhoff', () => {
  it('Dedekind: modular ⇔ libre de N5', () => {
    expect(dedekindAnalysis(pentagonN5())).toMatchObject({
      modular: false,
      pentagonFree: false,
    });
    expect(dedekindAnalysis(diamondM3())).toMatchObject({
      modular: true,
      pentagonFree: true,
    });
    expect(dedekindAnalysis(chain(4))).toMatchObject({
      modular: true,
      pentagonFree: true,
    });
  });

  it('Birkhoff: distributiva ⇔ libre de N5 y M3', () => {
    expect(dedekindAnalysis(powerSetLattice(['a', 'b', 'c']))).toMatchObject({
      distributive: true,
      pentagonFree: true,
      diamondFree: true,
    });
    expect(dedekindAnalysis(diamondM3())).toMatchObject({
      distributive: false,
      diamondFree: false,
    });
    expect(dedekindAnalysis(pentagonN5())).toMatchObject({
      distributive: false,
      pentagonFree: false,
    });
  });
});

describe('Lattice — pseudo-complemento / Heyting', () => {
  const L = powerSetLattice(['x', 'y']);

  it('en una Booleana: a ⇒ b coincide con ¬a ∪ b', () => {
    const a = new Set(['x']);
    const b = new Set(['y']);
    const impl = relativeComplement(L, a, b);
    expect(impl).not.toBeNull();
    // ¬a ∪ b = {y} ∪ {y} = {y}
    expect(eq(L, impl as Set<string>, b)).toBe(true);
  });

  it('cadena finita es Heyting (distributiva finita)', () => {
    expect(isHeyting(chain(5))).toBe(true);
  });

  it('N5 NO es Heyting (no distributiva)', () => {
    expect(isHeyting(pentagonN5())).toBe(false);
  });
});

describe('Lattice — makeLattice rejection / validación', () => {
  it('rechaza un poset que no es lattice (V-shape sin top)', () => {
    // Elementos: {0, 1, 2}. 0 ≤ 1 y 0 ≤ 2; 1 y 2 incomparables y sin top.
    const els = [0, 1, 2];
    const leq = (a: number, b: number): boolean => {
      if (a === b) return true;
      if (a === 0) return true;
      return false;
    };
    expect(isLattice(els, leq)).toBe(false);
    expect(makeLattice(els, leq)).toBeNull();
  });

  it('rechaza relación no transitiva', () => {
    const els = [0, 1, 2];
    const leq = (a: number, b: number): boolean => {
      if (a === b) return true;
      // 0 ≤ 1, 1 ≤ 2, pero NO 0 ≤ 2 → no transitiva
      if (a === 0 && b === 1) return true;
      if (a === 1 && b === 2) return true;
      return false;
    };
    expect(isLattice(els, leq)).toBe(false);
  });

  it('acepta el lattice trivial de 1 elemento', () => {
    const L = makeLattice([42], (a: number, b: number) => a === b);
    expect(L).not.toBeNull();
    expect((L as NonNullable<typeof L>).top).toBe(42);
    expect((L as NonNullable<typeof L>).bottom).toBe(42);
  });
});

describe('Lattice — propiedades estructurales', () => {
  it('powerSet sobre 3 elementos: 8 átomos? No, 3 átomos (singletons)', () => {
    const L = powerSetLattice(['x', 'y', 'z']);
    expect(L.elements.length).toBe(8);
    expect(atoms(L).length).toBe(3);
    expect(coatoms(L).length).toBe(3);
  });

  it('toda lattice distributiva es modular', () => {
    const L = powerSetLattice(['a', 'b']);
    expect(isDistributive(L)).toBe(true);
    expect(isModular(L)).toBe(true);
  });

  it('en lattice Booleana el complemento es único', () => {
    const L = powerSetLattice(['a', 'b', 'c']);
    for (const s of L.elements) {
      // No hay dos complementos distintos.
      let found: Set<string> | null = null;
      for (const x of L.elements) {
        if (eq(L, L.join(s, x), L.top) && eq(L, L.meet(s, x), L.bottom)) {
          if (found !== null) {
            expect(eq(L, found, x)).toBe(true);
          }
          found = x;
        }
      }
      expect(found).not.toBeNull();
    }
  });
});
