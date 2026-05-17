// ============================================================
// Markov Logic Networks — Tests
// ============================================================
//
// La teoría canónica es la "smoking network" de Richardson & Domingos:
//
//   Smokes(x) → Cancer(x)                    w = 1.5
//   Friends(x, y) ∧ Smokes(x) → Smokes(y)    w = 1.1
//   Smokes(x)                                w = 0.5   (prior)
//
// con un universo de 3 personas (Anna, Bob, Carl). Esa teoría aparece
// en varios tests con distintos hyperparámetros.

import { describe, expect, it } from 'vitest';
import {
  allGroundAtoms,
  exactMarginals,
  exactPartition,
  freeVariables,
  gibbsMarginals,
  gibbsSample,
  ground,
  mapInference,
  parseFOL,
  probability,
  weight,
  type MLNTheory,
  type MLNWorld,
} from '../../../reasoning/markov-logic';

// ── Fixtures ─────────────────────────────────────────────────

const smoking3: MLNTheory = {
  predicates: [
    { name: 'Smokes', types: ['Person'] },
    { name: 'Cancer', types: ['Person'] },
    { name: 'Friends', types: ['Person', 'Person'] },
  ],
  constants: { Person: ['Anna', 'Bob', 'Carl'] },
  formulas: [
    { formula: 'Smokes(x) → Cancer(x)', weight: 1.5 },
    { formula: 'Friends(x, y) ∧ Smokes(x) → Smokes(y)', weight: 1.1 },
    { formula: 'Smokes(x)', weight: 0.5 },
  ],
};

const smokingSmall: MLNTheory = {
  predicates: [
    { name: 'Smokes', types: ['Person'] },
    { name: 'Friends', types: ['Person', 'Person'] },
  ],
  constants: { Person: ['Anna', 'Bob'] },
  formulas: [
    { formula: 'Friends(x, y) ∧ Smokes(x) → Smokes(y)', weight: 1.5 },
    { formula: 'Smokes(x)', weight: 0.5 },
  ],
};

// PRNG determinista (mulberry32) para tests reproducibles.
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── parseFOL ─────────────────────────────────────────────────

describe('parseFOL', () => {
  it('parsea un átomo simple', () => {
    const ast = parseFOL('Smokes(x)');
    expect(ast).toEqual({ kind: 'atom', predicate: 'Smokes', args: ['x'] });
  });

  it('reconoce variables libres', () => {
    const ast = parseFOL('Friends(x, y) ∧ Smokes(x) → Smokes(y)');
    expect(freeVariables(ast)).toEqual(['x', 'y']);
  });

  it('acepta sintaxis ASCII alternativa (&, |, ->, !)', () => {
    const a = parseFOL('Smokes(x) -> Cancer(x)');
    const b = parseFOL('Smokes(x) → Cancer(x)');
    expect(a).toEqual(b);
    const c = parseFOL('!Smokes(x) & Cancer(x)');
    const d = parseFOL('¬Smokes(x) ∧ Cancer(x)');
    expect(c).toEqual(d);
  });

  it('respeta precedencia ¬ > ∧ > ∨ > →', () => {
    // ¬A ∨ B ∧ C  ≡  (¬A) ∨ (B ∧ C)
    const ast = parseFOL('¬A(x) ∨ B(x) ∧ C(x)');
    expect(ast).toEqual({
      kind: 'or',
      left: { kind: 'not', arg: { kind: 'atom', predicate: 'A', args: ['x'] } },
      right: {
        kind: 'and',
        left: { kind: 'atom', predicate: 'B', args: ['x'] },
        right: { kind: 'atom', predicate: 'C', args: ['x'] },
      },
    });
  });

  it('falla con error claro ante sintaxis inválida', () => {
    expect(() => parseFOL('Smokes(x')).toThrow();
    expect(() => parseFOL('∧ Cancer(x)')).toThrow();
  });
});

// ── ground ───────────────────────────────────────────────────

describe('ground', () => {
  it('produce N² ground formulas para una regla con 2 variables', () => {
    // Friends(x,y) ∧ Smokes(x) → Smokes(y) sobre n=3 personas → 9 ground formulas.
    const grounded = ground({
      ...smoking3,
      formulas: [{ formula: 'Friends(x, y) ∧ Smokes(x) → Smokes(y)', weight: 1.1 }],
    });
    expect(grounded).toHaveLength(9);
  });

  it('inhibe variables con tipos inconsistentes', () => {
    const badTheory: MLNTheory = {
      predicates: [
        { name: 'OnTopic', types: ['Course'] },
        { name: 'Friends', types: ['Person', 'Person'] },
      ],
      constants: { Person: ['A'], Course: ['Math'] },
      formulas: [{ formula: 'OnTopic(x) ∧ Friends(x, x)', weight: 1.0 }],
    };
    expect(() => ground(badTheory)).toThrow(/tipos distintos/);
  });

  it('enumera todos los ground atoms (Herbrand base)', () => {
    const atoms = allGroundAtoms(smokingSmall);
    // Smokes: 2, Friends: 2x2 = 4 → 6 atoms totales.
    expect(atoms).toHaveLength(6);
    expect(atoms).toContain('Smokes(Anna)');
    expect(atoms).toContain('Friends(Anna,Bob)');
  });

  it('groundFormula.satisfied y violations son consistentes', () => {
    const [g] = ground({
      predicates: [{ name: 'P', types: ['T'] }],
      constants: { T: ['a'] },
      formulas: [{ formula: 'P(x)', weight: 1.0 }],
    });
    expect(g).toBeDefined();
    const wTrue: MLNWorld = { groundAtoms: { 'P(a)': true } };
    const wFalse: MLNWorld = { groundAtoms: { 'P(a)': false } };
    expect(g.satisfied(wTrue)).toBe(true);
    expect(g.violations(wTrue)).toBe(0);
    expect(g.satisfied(wFalse)).toBe(false);
    expect(g.violations(wFalse)).toBe(1);
  });
});

// ── weight & probability ─────────────────────────────────────

describe('weight', () => {
  it('asigna peso 0 a un mundo vacío sin fórmulas satisfechas', () => {
    const theory: MLNTheory = {
      predicates: [{ name: 'P', types: ['T'] }],
      constants: { T: ['a', 'b'] },
      formulas: [{ formula: 'P(x)', weight: 2.0 }],
    };
    // mundo donde ningún P() es true → ninguna fórmula satisfecha → score 0.
    const w: MLNWorld = { groundAtoms: { 'P(a)': false, 'P(b)': false } };
    expect(weight(theory, w)).toBe(0);
  });

  it('penaliza mundos con menos fórmulas satisfechas (score menor)', () => {
    const allSmoke: MLNWorld = {
      groundAtoms: {
        'Smokes(Anna)': true,
        'Smokes(Bob)': true,
        'Cancer(Anna)': true,
        'Cancer(Bob)': true,
        'Friends(Anna,Bob)': false,
        'Friends(Bob,Anna)': false,
        'Friends(Anna,Anna)': false,
        'Friends(Bob,Bob)': false,
      },
    };
    const noSmoke: MLNWorld = {
      groundAtoms: {
        'Smokes(Anna)': false,
        'Smokes(Bob)': false,
        'Cancer(Anna)': false,
        'Cancer(Bob)': false,
        'Friends(Anna,Bob)': false,
        'Friends(Bob,Anna)': false,
        'Friends(Anna,Anna)': false,
        'Friends(Bob,Bob)': false,
      },
    };
    const theory: MLNTheory = {
      predicates: [
        { name: 'Smokes', types: ['Person'] },
        { name: 'Cancer', types: ['Person'] },
        { name: 'Friends', types: ['Person', 'Person'] },
      ],
      constants: { Person: ['Anna', 'Bob'] },
      formulas: [
        { formula: 'Smokes(x) → Cancer(x)', weight: 1.5 },
        { formula: 'Friends(x, y) ∧ Smokes(x) → Smokes(y)', weight: 1.1 },
        { formula: 'Smokes(x)', weight: 0.5 },
      ],
    };
    const wSmoke = weight(theory, allSmoke);
    const wNoSmoke = weight(theory, noSmoke);
    // ambos satisfacen las implicaciones, pero allSmoke gana el prior Smokes(x).
    expect(wSmoke).toBeGreaterThan(wNoSmoke);
  });

  it('devuelve -Infinity si un hard constraint está violado', () => {
    const hardTheory: MLNTheory = {
      predicates: [{ name: 'P', types: ['T'] }],
      constants: { T: ['a'] },
      formulas: [{ formula: 'P(x)', weight: Infinity }],
    };
    const violator: MLNWorld = { groundAtoms: { 'P(a)': false } };
    expect(weight(hardTheory, violator)).toBe(Number.NEGATIVE_INFINITY);
    const satisfier: MLNWorld = { groundAtoms: { 'P(a)': true } };
    // hard constraint satisfecho aporta 0 al score, no Infinity.
    expect(weight(hardTheory, satisfier)).toBe(0);
  });

  it('probability(world, Z) = exp(weight)/Z y es consistente con la exacta', () => {
    const Z = exactPartition(smokingSmall);
    const marginals = exactMarginals(smokingSmall);
    // Suma de probabilidades sobre todos los mundos == 1.
    const atoms = allGroundAtoms(smokingSmall);
    let total = 0;
    const w: MLNWorld = { groundAtoms: {} };
    for (let mask = 0; mask < 1 << atoms.length; mask++) {
      for (let i = 0; i < atoms.length; i++) {
        w.groundAtoms[atoms[i]] = (mask & (1 << i)) !== 0;
      }
      total += probability(smokingSmall, w, Z);
    }
    expect(total).toBeCloseTo(1, 6);
    // marginales en [0,1]
    for (const a of atoms) {
      expect(marginals[a]).toBeGreaterThanOrEqual(0);
      expect(marginals[a]).toBeLessThanOrEqual(1);
    }
  });
});

// ── Gibbs sampling ───────────────────────────────────────────

describe('gibbsSample', () => {
  it('respeta la evidencia (no flippea átomos fijos)', () => {
    const rng = makeRng(42);
    const evidence: Partial<MLNWorld> = {
      groundAtoms: { 'Smokes(Anna)': true, 'Friends(Anna,Bob)': true },
    };
    const samples = gibbsSample(smokingSmall, evidence, 100, { rng, burnIn: 20 });
    expect(samples).toHaveLength(100);
    for (const s of samples) {
      expect(s.groundAtoms['Smokes(Anna)']).toBe(true);
      expect(s.groundAtoms['Friends(Anna,Bob)']).toBe(true);
    }
  });

  it('converge a marginales cercanas a la distribución exacta', () => {
    const exact = exactMarginals(smokingSmall);
    const rng = makeRng(2024);
    const approx = gibbsMarginals(smokingSmall, {}, 8000, { rng, burnIn: 500 });
    for (const atom of Object.keys(exact)) {
      const diff = Math.abs((exact[atom] ?? 0) - (approx[atom] ?? 0));
      // tolerancia generosa pero suficiente para detectar bugs estructurales.
      expect(diff).toBeLessThan(0.07);
    }
  });

  it('cadena estabiliza: dos corridas largas con la misma semilla dan marginales muy cercanas', () => {
    const m1 = gibbsMarginals(smokingSmall, {}, 4000, {
      rng: makeRng(7),
      burnIn: 500,
    });
    const m2 = gibbsMarginals(smokingSmall, {}, 4000, {
      rng: makeRng(7),
      burnIn: 500,
    });
    for (const a of Object.keys(m1)) {
      expect((m1[a] ?? 0) - (m2[a] ?? 0)).toBe(0); // misma semilla → mismo resultado bit-exacto
    }
  });

  it('detecta correlación entre amigos: si Anna fuma, Bob tiende a fumar más', () => {
    const rng = makeRng(123);
    const evidenceA: Partial<MLNWorld> = {
      groundAtoms: {
        'Smokes(Anna)': true,
        'Friends(Anna,Bob)': true,
        'Friends(Bob,Anna)': true,
        'Friends(Anna,Anna)': false,
        'Friends(Bob,Bob)': false,
      },
    };
    const evidenceB: Partial<MLNWorld> = {
      groundAtoms: {
        'Smokes(Anna)': false,
        'Friends(Anna,Bob)': true,
        'Friends(Bob,Anna)': true,
        'Friends(Anna,Anna)': false,
        'Friends(Bob,Bob)': false,
      },
    };
    const mWith = gibbsMarginals(smokingSmall, evidenceA, 4000, { rng, burnIn: 500 });
    const mWithout = gibbsMarginals(smokingSmall, evidenceB, 4000, {
      rng: makeRng(124),
      burnIn: 500,
    });
    // Con Anna fumando y amigos↔, Bob fuma más que sin Anna fumando.
    expect(mWith['Smokes(Bob)']).toBeGreaterThan(mWithout['Smokes(Bob)']);
  });
});

// ── MAP inference ────────────────────────────────────────────

describe('mapInference', () => {
  it('encuentra un mundo cuyo weight no es menor al óptimo exacto', () => {
    const rng = makeRng(99);
    const result = mapInference(
      smokingSmall,
      {},
      {
        rng,
        maxFlips: 2000,
        restarts: 6,
      },
    );
    // Calcular óptimo exacto enumerando mundos pequeños.
    const atoms = allGroundAtoms(smokingSmall);
    let bestExact = Number.NEGATIVE_INFINITY;
    const w: MLNWorld = { groundAtoms: {} };
    for (let mask = 0; mask < 1 << atoms.length; mask++) {
      for (let i = 0; i < atoms.length; i++) {
        w.groundAtoms[atoms[i]] = (mask & (1 << i)) !== 0;
      }
      const s = weight(smokingSmall, w);
      if (s > bestExact) bestExact = s;
    }
    const found = weight(smokingSmall, result);
    expect(found).toBeCloseTo(bestExact, 6);
  });

  it('respeta hard constraints en la MAP', () => {
    const theory: MLNTheory = {
      predicates: [
        { name: 'P', types: ['T'] },
        { name: 'Q', types: ['T'] },
      ],
      constants: { T: ['a'] },
      formulas: [
        { formula: 'P(x)', weight: Infinity }, // hard: P(a) debe ser true
        { formula: '¬Q(x)', weight: 0.5 }, // soft: preferimos ¬Q(a)
      ],
    };
    const rng = makeRng(5);
    const result = mapInference(theory, {}, { rng, restarts: 3, maxFlips: 200 });
    expect(result.groundAtoms['P(a)']).toBe(true);
    expect(result.groundAtoms['Q(a)']).toBe(false);
  });

  it('respeta evidencia', () => {
    const rng = makeRng(11);
    const evidence: Partial<MLNWorld> = {
      groundAtoms: { 'Smokes(Anna)': false, 'Friends(Anna,Bob)': true },
    };
    const result = mapInference(smokingSmall, evidence, { rng, restarts: 3, maxFlips: 500 });
    expect(result.groundAtoms['Smokes(Anna)']).toBe(false);
    expect(result.groundAtoms['Friends(Anna,Bob)']).toBe(true);
  });
});

// ── Smoking-3: cordura general ───────────────────────────────

describe('Smoking network (3 personas)', () => {
  it('ground produce 3+9+3 = 15 ground formulas para la teoría completa', () => {
    const grounded = ground(smoking3);
    // Smokes→Cancer: 3, Friends∧Smokes→Smokes: 3² = 9, Smokes prior: 3 → 15
    expect(grounded).toHaveLength(15);
  });

  it('atoms Herbrand: 3 Smokes + 3 Cancer + 9 Friends = 15', () => {
    const atoms = allGroundAtoms(smoking3);
    expect(atoms).toHaveLength(15);
  });
});
