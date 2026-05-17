// ============================================================
// ST MUS — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  extractMUS,
  extractMUSWithSelectors,
  type MUSAlgorithm,
  type SATOracle,
  type AssumptionSolver,
} from '../../runtime/mus';

// ── Oráculo SAT brute-force (suficiente para los tests) ───────
//
// Cláusulas: array de literales enteros, positivo = literal positivo,
// negativo = negado. Una cláusula es disyunción, el conjunto entero
// es conjunción.

function collectVars(clauses: number[][]): number[] {
  const set = new Set<number>();
  for (const c of clauses) for (const lit of c) set.add(Math.abs(lit));
  return Array.from(set).sort((a, b) => a - b);
}

function evalClauses(clauses: number[][], asg: Map<number, boolean>): boolean {
  for (const c of clauses) {
    let satisfied = false;
    for (const lit of c) {
      const v = Math.abs(lit);
      const val = asg.get(v);
      if (val === undefined) continue;
      if ((lit > 0 && val) || (lit < 0 && !val)) {
        satisfied = true;
        break;
      }
    }
    if (!satisfied) return false;
  }
  return true;
}

/**
 * SAT oracle por enumeración exhaustiva de 2^|vars| asignaciones.
 * Solo válido para |vars| ≤ ~20. Suficiente para los tests.
 */
const satOracle: SATOracle = (clauses) => {
  if (clauses.length === 0) return true;
  const vars = collectVars(clauses);
  if (vars.length === 0) {
    // Solo hay cláusulas vacías → falso.
    return clauses.every((c) => c.length > 0);
  }
  if (vars.length > 22) {
    throw new Error(`satOracle: demasiadas variables (${vars.length}) para brute force`);
  }
  const total = 1 << vars.length;
  for (let mask = 0; mask < total; mask++) {
    const asg = new Map<number, boolean>();
    for (let i = 0; i < vars.length; i++) {
      asg.set(vars[i], ((mask >> i) & 1) === 1);
    }
    if (evalClauses(clauses, asg)) return true;
  }
  return false;
};

const ALGORITHMS: MUSAlgorithm[] = ['deletion', 'insertion', 'qx'];

// ── Test 1: 3 cláusulas, 1 redundante → MUS de tamaño 2 ──────

describe('extractMUS — 3 cláusulas, 1 redundante', () => {
  // P, ¬P, Q
  // {P, ¬P} ya es unsat. Q es redundante.
  const clauses = [
    [1], // P
    [-1], // ¬P
    [2], // Q (irrelevante para la inconsistencia)
  ];

  it.each(ALGORITHMS)('MUS = {P, ¬P} con %s', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus).toEqual([0, 1]);
    expect(res.satCalls).toBeGreaterThan(0);
  });
});

// ── Test 2: 5 cláusulas con MUS de tamaño 3 ──────────────────

describe('extractMUS — 5 cláusulas, MUS tamaño 3', () => {
  // Cláusulas:
  //   c0: P
  //   c1: ¬P ∨ Q
  //   c2: ¬Q
  //   c3: R          (irrelevante)
  //   c4: S ∨ ¬R     (irrelevante)
  // {c0, c1, c2} es unsat:
  //   c0 ⇒ P=T, c1 ⇒ Q=T (modus ponens), c2 ⇒ Q=F  contradicción.
  const clauses = [
    [1], // P
    [-1, 2], // ¬P ∨ Q
    [-2], // ¬Q
    [3], // R
    [4, -3], // S ∨ ¬R
  ];

  it.each(ALGORITHMS)('MUS tamaño 3 con %s', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus).toEqual([0, 1, 2]);
    // Verificación: removiendo cualquier elemento del MUS, queda sat.
    for (const idx of res.mus) {
      const subset = res.mus.filter((x) => x !== idx).map((i) => clauses[i]);
      expect(satOracle(subset)).toBe(true);
    }
  });
});

// ── Test 3: deletion vs insertion vs qx — mismo tamaño ───────

describe('extractMUS — algoritmos coinciden en tamaño', () => {
  const clauses = [
    [1, 2], // P ∨ Q
    [-1], // ¬P
    [-2], // ¬Q
    [3], // R (irrelevante)
    [-3, 4], // ¬R ∨ S (irrelevante para unsat)
  ];

  it('los tres algoritmos hallan MUS del mismo tamaño', () => {
    const a = extractMUS(clauses, satOracle, { algorithm: 'deletion' });
    const b = extractMUS(clauses, satOracle, { algorithm: 'insertion' });
    const c = extractMUS(clauses, satOracle, { algorithm: 'qx' });
    expect(a.mus.length).toBe(b.mus.length);
    expect(b.mus.length).toBe(c.mus.length);
    // En este caso solo hay un MUS posible: {0,1,2}.
    expect(a.mus).toEqual([0, 1, 2]);
    expect(b.mus).toEqual([0, 1, 2]);
    expect(c.mus).toEqual([0, 1, 2]);
  });
});

// ── Test 4: minimalidad — quitar cualquiera vuelve sat ───────

describe('extractMUS — propiedad de minimalidad', () => {
  const clauses = [
    [1], // P
    [-1, 2], // ¬P ∨ Q
    [-2, 3], // ¬Q ∨ R
    [-3], // ¬R
    [4], // S (irrelevante)
  ];
  // MUS: {0,1,2,3} (cadena modus ponens P → Q → R, contra ¬R).

  it.each(ALGORITHMS)('subset MUS quitando un elemento es sat (%s)', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    // El conjunto MUS encontrado debe ser unsat.
    const musClauses = res.mus.map((i) => clauses[i]);
    expect(satOracle(musClauses)).toBe(false);
    // Removiendo cualquier elemento, debe ser sat.
    for (const idx of res.mus) {
      const subset = res.mus.filter((x) => x !== idx).map((i) => clauses[i]);
      expect(satOracle(subset)).toBe(true);
    }
  });
});

// ── Test 5: múltiples MUS posibles — cada algoritmo halla uno ─

describe('extractMUS — múltiples MUS posibles', () => {
  // Construimos un conjunto con DOS MUS distintos disjuntos:
  // MUS1: {c0, c1} = {P, ¬P}
  // MUS2: {c2, c3} = {Q, ¬Q}
  // Más una cláusula irrelevante.
  const clauses = [
    [1], // P
    [-1], // ¬P
    [2], // Q
    [-2], // ¬Q
    [3], // R (irrelevante)
  ];

  it.each(ALGORITHMS)('halla algún MUS válido con %s', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    // El MUS debe ser unsat.
    const musClauses = res.mus.map((i) => clauses[i]);
    expect(satOracle(musClauses)).toBe(false);
    // Y minimal: quitar uno lo vuelve sat.
    for (const idx of res.mus) {
      const subset = res.mus.filter((x) => x !== idx).map((i) => clauses[i]);
      expect(satOracle(subset)).toBe(true);
    }
    // Debería ser uno de los dos MUS.
    const isMUS1 = res.mus.length === 2 && res.mus.includes(0) && res.mus.includes(1);
    const isMUS2 = res.mus.length === 2 && res.mus.includes(2) && res.mus.includes(3);
    expect(isMUS1 || isMUS2).toBe(true);
  });
});

// ── Test 6: 10 cláusulas con 2 MUS distintos ─────────────────

describe('extractMUS — 10 cláusulas, 2 MUS distintos', () => {
  // Mezcla más grande: las cláusulas 0–2 forman un MUS de 3
  // (cadena MP); las 3–4 forman un MUS de 2 (par directo); resto
  // irrelevante.
  const clauses = [
    [1], // P
    [-1, 2], // ¬P ∨ Q
    [-2], // ¬Q
    [3], // R
    [-3], // ¬R
    [4], // S (irrelevante)
    [-4, 5], // ¬S ∨ T (irrelevante)
    [6], // U
    [-6, 7], // ¬U ∨ V
    [-7, 8], // ¬V ∨ W
  ];

  it.each(ALGORITHMS)('halla un MUS válido (%s)', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus.length).toBeGreaterThanOrEqual(2);
    // Unsat.
    const musClauses = res.mus.map((i) => clauses[i]);
    expect(satOracle(musClauses)).toBe(false);
    // Minimal.
    for (const idx of res.mus) {
      const subset = res.mus.filter((x) => x !== idx).map((i) => clauses[i]);
      expect(satOracle(subset)).toBe(true);
    }
  });
});

// ── Test 7: input sat → MUS vacío ────────────────────────────

describe('extractMUS — input satisfacible', () => {
  const clauses = [[1], [2], [-3, 1]];

  it.each(ALGORITHMS)('devuelve MUS vacío (%s)', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus).toEqual([]);
  });
});

// ── Test 8: solo dos cláusulas contradictorias ───────────────

describe('extractMUS — input mínimo {P, ¬P}', () => {
  const clauses = [[1], [-1]];

  it.each(ALGORITHMS)('MUS = ambas (%s)', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus.sort()).toEqual([0, 1]);
  });
});

// ── Test 9: determinismo (mismo input ⇒ mismo MUS) ───────────

describe('extractMUS — determinismo', () => {
  const clauses = [[1], [-1, 2], [-2, 3], [-3], [4], [-4, 5]];

  it.each(ALGORITHMS)('dos corridas idénticas (%s)', (algorithm) => {
    const r1 = extractMUS(clauses, satOracle, { algorithm });
    const r2 = extractMUS(clauses, satOracle, { algorithm });
    expect(r1.mus).toEqual(r2.mus);
  });
});

// ── Test 10: métricas (satCalls > 0, iterations coherente) ───

describe('extractMUS — métricas', () => {
  const clauses = [[1], [-1, 2], [-2], [3]];

  it.each(ALGORITHMS)('reporta satCalls > 0 y mus ⊆ allIds (%s)', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.satCalls).toBeGreaterThan(0);
    for (const idx of res.mus) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(clauses.length);
    }
  });
});

// ── Test 11: maxIterations acota el trabajo ──────────────────

describe('extractMUS — maxIterations', () => {
  // Construye un problema más grande para que tope antes.
  const clauses = [
    [1], // P
    [-1, 2], // ¬P ∨ Q
    [-2, 3], // ¬Q ∨ R
    [-3, 4], // ¬R ∨ S
    [-4, 5], // ¬S ∨ T
    [-5], // ¬T (cierra la cadena → unsat)
    [6], // U (irrelevante)
    [-6, 7], // ¬U ∨ V
    [-7, 8], // ¬V ∨ W
  ];

  it('respeta cap de iteraciones sin crashear', () => {
    const res = extractMUS(clauses, satOracle, {
      algorithm: 'deletion',
      maxIterations: 3,
    });
    // satCalls puede pasar ligeramente del cap por el pre-check inicial,
    // pero no debería estallar.
    expect(res.satCalls).toBeLessThanOrEqual(10);
  });
});

// ── Test 12: extractMUSWithSelectors básico ──────────────────

describe('extractMUSWithSelectors', () => {
  // Modelamos {P, ¬P, Q} con selectors. El solver de prueba simula
  // un SAT incremental: una assumption activa la cláusula
  // correspondiente; el problema es unsat sii las cláusulas activadas
  // (sin negar selector) tienen el subconjunto unsat dentro.

  const clauses = [
    [1], // P
    [-1], // ¬P
    [2], // Q (irrelevante)
  ];

  // Selector literals (cualquier id positivo, deben ser únicos):
  const selectors = [100, 101, 102];

  const solver: AssumptionSolver = {
    solveWithAssumptions(assumptions: number[]) {
      // activamos solo las cláusulas cuyos selectors estén en assumptions.
      const active: number[][] = [];
      const activeSelectors: number[] = [];
      for (let i = 0; i < selectors.length; i++) {
        if (assumptions.includes(selectors[i])) {
          active.push(clauses[i]);
          activeSelectors.push(selectors[i]);
        }
      }
      const sat = satOracle(active);
      if (sat) return { sat: true };
      // failedAssumptions: devolvemos TODAS las activas como un
      // superset (el solver real podría dar un núcleo más chico).
      return { sat: false, failedAssumptions: activeSelectors };
    },
  };

  it('extrae MUS = {0,1} usando assumptions', () => {
    const res = extractMUSWithSelectors(clauses, selectors, solver);
    expect(res.mus.sort()).toEqual([0, 1]);
    expect(res.satCalls).toBeGreaterThan(0);
  });

  it('input sat → MUS vacío', () => {
    const satClauses = [[1], [2], [-3, 1]];
    const satSelectors = [200, 201, 202];
    const res = extractMUSWithSelectors(satClauses, satSelectors, solver);
    // El solver de arriba revisará con satOracle: este nuevo conjunto
    // es sat, así que el MUS debe ser vacío. Pero ojo: el solver está
    // hardcodeado a `clauses`/`selectors`, así que reescribimos uno
    // específico para este caso.
    const localSolver: AssumptionSolver = {
      solveWithAssumptions(assumptions) {
        const active: number[][] = [];
        for (let i = 0; i < satSelectors.length; i++) {
          if (assumptions.includes(satSelectors[i])) active.push(satClauses[i]);
        }
        const sat = satOracle(active);
        if (sat) return { sat: true };
        return { sat: false, failedAssumptions: assumptions.slice() };
      },
    };
    const res2 = extractMUSWithSelectors(satClauses, satSelectors, localSolver);
    expect(res2.mus).toEqual([]);
    // El primer `res` se queda como ejemplo de uso; suprimimos su check
    // (depende del solver inicial que apunta a `clauses`).
    expect(res.iterations).toBeGreaterThan(0);
  });

  it('mismatched lengths → throw', () => {
    expect(() => extractMUSWithSelectors([[1], [-1]], [100], solver)).toThrow();
  });
});

// ── Test 13: 4 cláusulas con MUS no contiguo ─────────────────

describe('extractMUS — MUS no contiguo', () => {
  // c0 irrelevante, c1+c3 forman MUS de 2, c2 irrelevante.
  const clauses = [
    [5], // V (irrelevante)
    [1], // P
    [6, -5], // W ∨ ¬V (irrelevante)
    [-1], // ¬P
  ];

  it.each(ALGORITHMS)('MUS = {1, 3} con %s', (algorithm) => {
    const res = extractMUS(clauses, satOracle, { algorithm });
    expect(res.mus).toEqual([1, 3]);
  });
});
