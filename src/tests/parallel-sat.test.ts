/**
 * ST Parallel SAT Solver — Tests
 * ================================
 * Valida:
 *   - packClauses / unpackClauses (serialización round-trip)
 *   - workersAvailable() (detección de entorno)
 *   - cdclAsync / dpllAsync (resultados correctos vs secuencial)
 *   - tryParallelSolve fallback (fórmulas pequeñas → null)
 *   - Portfolio racing con SAT / UNSAT conocidos
 *   - Consistencia paralelo vs secuencial
 */
import { describe, it, expect, afterEach } from 'vitest';
import { FormulaFactory } from '../runtime/formula-factory';
import { cdcl, cdclAsync } from '../profiles/classical/cdcl';
import { dpll, dpllAsync } from '../profiles/classical/dpll';
import {
  packClauses,
  unpackClauses,
  workersAvailable,
  tryParallelSolve,
  PARALLEL_THRESHOLD,
} from '../profiles/classical/parallel-sat';
import { Formula } from '../types';

afterEach(() => {
  FormulaFactory.clear();
});

// ============================================================
// 1. SERIALIZATION: packClauses / unpackClauses
// ============================================================
describe('Parallel SAT: Serialization', () => {
  it('pack/unpack round-trip — empty clauses', () => {
    const clauses: Int32Array[] = [];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked).toEqual([]);
  });

  it('pack/unpack round-trip — single unit clause', () => {
    const clauses = [new Int32Array([3])];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(1);
    expect(Array.from(unpacked[0])).toEqual([3]);
  });

  it('pack/unpack round-trip — multiple clauses', () => {
    const clauses = [new Int32Array([1, -2, 3]), new Int32Array([-4, 5]), new Int32Array([6])];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(3);
    expect(Array.from(unpacked[0])).toEqual([1, -2, 3]);
    expect(Array.from(unpacked[1])).toEqual([-4, 5]);
    expect(Array.from(unpacked[2])).toEqual([6]);
  });

  it('pack/unpack round-trip — large random clauses', () => {
    const clauses: Int32Array[] = [];
    for (let i = 0; i < 200; i++) {
      const len = 1 + Math.floor(Math.random() * 10);
      const lits: number[] = [];
      for (let j = 0; j < len; j++) {
        const v = 1 + Math.floor(Math.random() * 100);
        lits.push(Math.random() < 0.5 ? v : -v);
      }
      clauses.push(new Int32Array(lits));
    }
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(unpacked.length).toBe(clauses.length);
    for (let i = 0; i < clauses.length; i++) {
      expect(Array.from(unpacked[i])).toEqual(Array.from(clauses[i]));
    }
  });

  it('pack/unpack with negative literals', () => {
    const clauses = [new Int32Array([-1, -2, -3])];
    const packed = packClauses(clauses);
    const unpacked = unpackClauses(packed);
    expect(Array.from(unpacked[0])).toEqual([-1, -2, -3]);
  });
});

// ============================================================
// 2. ENVIRONMENT DETECTION
// ============================================================
describe('Parallel SAT: Environment Detection', () => {
  it('workersAvailable() returns boolean', () => {
    const result = workersAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('workersAvailable() is true in Node.js (worker_threads available)', () => {
    // En Node.js con vitest, worker_threads debería estar disponible
    expect(workersAvailable()).toBe(true);
  });

  it('PARALLEL_THRESHOLD is a reasonable number', () => {
    expect(PARALLEL_THRESHOLD).toBeGreaterThanOrEqual(20);
    expect(PARALLEL_THRESHOLD).toBeLessThanOrEqual(500);
  });
});

// ============================================================
// 3. tryParallelSolve — THRESHOLD GUARD
// ============================================================
describe('Parallel SAT: Threshold Guard', () => {
  it('returns null for small formulas (below threshold)', () => {
    const smallClauses = [new Int32Array([1, 2]), new Int32Array([-1, 3])];
    const result = tryParallelSolve(smallClauses, 3, ['a', 'b', 'c'], 5000);
    expect(result).toBeNull();
  });

  it('returns non-null for formulas at/above threshold when workers available', () => {
    // Crear fórmulas con suficientes variables
    const clauses: Int32Array[] = [];
    const numVars = PARALLEL_THRESHOLD + 10;
    const names: string[] = [];
    for (let i = 0; i < numVars; i++) names.push(`x${i}`);

    // Random 3-SAT
    for (let i = 0; i < numVars * 4; i++) {
      const lits: number[] = [];
      for (let j = 0; j < 3; j++) {
        const v = 1 + Math.floor(Math.random() * numVars);
        lits.push(Math.random() < 0.5 ? v : -v);
      }
      clauses.push(new Int32Array(lits));
    }

    if (workersAvailable()) {
      const result = tryParallelSolve(clauses, numVars, names, 5000);
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Promise);
    }
  });
});

// ============================================================
// 4. cdclAsync — CORRECTNESS
// ============================================================
describe('Parallel SAT: cdclAsync correctness', () => {
  // Helper: construir fórmula desde string de átomos con operadores
  function makeAnd(atoms: string[]): Formula {
    if (atoms.length === 1) return { kind: 'atom', name: atoms[0] };
    return {
      kind: 'and',
      args: [{ kind: 'atom', name: atoms[0] }, makeAnd(atoms.slice(1))],
    };
  }

  function makeOr(atoms: string[]): Formula {
    if (atoms.length === 1) return { kind: 'atom', name: atoms[0] };
    return {
      kind: 'or',
      args: [{ kind: 'atom', name: atoms[0] }, makeOr(atoms.slice(1))],
    };
  }

  it('trivially SAT (conjunction of atoms)', async () => {
    const atoms = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const formula = makeAnd(atoms);

    const syncResult = cdcl(formula);
    const asyncResult = await cdclAsync(formula);

    expect(asyncResult.satisfiable).toBe(true);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });

  it('trivially UNSAT (p & ¬p)', async () => {
    const formula: Formula = {
      kind: 'and',
      args: [
        { kind: 'atom', name: 'p' },
        { kind: 'not', args: [{ kind: 'atom', name: 'p' }] },
      ],
    };

    const syncResult = cdcl(formula);
    const asyncResult = await cdclAsync(formula);

    expect(asyncResult.satisfiable).toBe(false);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });

  it('medium formula — sync vs async agree', async () => {
    // Chain implication: p0 → p1 → ... → pN & p0 & ¬pN
    const N = 30;
    const atoms: string[] = [];
    for (let i = 0; i <= N; i++) atoms.push(`q${i}`);

    // Build: (q0 → q1) & (q1 → q2) & ... & q0 & ¬qN
    let formula: Formula = { kind: 'atom', name: 'q0' };
    for (let i = 0; i < N; i++) {
      const impl: Formula = {
        kind: 'or',
        args: [
          { kind: 'not', args: [{ kind: 'atom', name: `q${i}` }] },
          { kind: 'atom', name: `q${i + 1}` },
        ],
      };
      formula = { kind: 'and', args: [formula, impl] };
    }
    // Assert q0 = true and qN = false → UNSAT
    formula = {
      kind: 'and',
      args: [formula, { kind: 'not', args: [{ kind: 'atom', name: `q${N}` }] }],
    };

    const syncResult = cdcl(formula, 10000);
    const asyncResult = await cdclAsync(formula, 10000);

    expect(asyncResult.satisfiable).toBe(false);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });

  it('disjunction of many atoms — SAT', async () => {
    const atoms = Array.from({ length: 50 }, (_, i) => `d${i}`);
    const formula = makeOr(atoms);

    const syncResult = cdcl(formula);
    const asyncResult = await cdclAsync(formula);

    expect(asyncResult.satisfiable).toBe(true);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });
});

// ============================================================
// 5. dpllAsync — CORRECTNESS
// ============================================================
describe('Parallel SAT: dpllAsync correctness', () => {
  it('simple SAT — dpllAsync matches dpll', async () => {
    const formula: Formula = {
      kind: 'or',
      args: [
        { kind: 'atom', name: 'a' },
        { kind: 'atom', name: 'b' },
      ],
    };

    const syncResult = dpll(formula);
    const asyncResult = await dpllAsync(formula);

    expect(asyncResult.satisfiable).toBe(true);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });

  it('UNSAT — dpllAsync matches dpll', async () => {
    const formula: Formula = {
      kind: 'and',
      args: [
        { kind: 'atom', name: 'x' },
        { kind: 'not', args: [{ kind: 'atom', name: 'x' }] },
      ],
    };

    const syncResult = dpll(formula);
    const asyncResult = await dpllAsync(formula);

    expect(asyncResult.satisfiable).toBe(false);
    expect(asyncResult.satisfiable).toBe(syncResult.satisfiable);
  });
});

// ============================================================
// 6. PARALLEL PORTFOLIO — LARGE FORMULA (cuando workers disponibles)
// ============================================================
describe('Parallel SAT: Portfolio Racing (large formulas)', () => {
  it('random 3-SAT with 100 vars — parallel returns correct result', async () => {
    // Generar fórmula SAT satisfacible: asignar todo true, generar cláusulas que lo satisfagan
    const numVars = 100;
    const atoms: string[] = [];
    for (let i = 0; i < numVars; i++) atoms.push(`v${i}`);

    // Crear fórmula con bajo ratio → debería ser SAT
    // Ratio ~2.0 (well below phase transition 4.27) → almost certainly SAT
    const numClauses = numVars * 2;
    let formula: Formula | null = null;

    for (let c = 0; c < numClauses; c++) {
      const litFormulas: Formula[] = [];
      for (let j = 0; j < 3; j++) {
        const v = Math.floor(Math.random() * numVars);
        const positive = Math.random() < 0.5;
        const atom: Formula = { kind: 'atom', name: atoms[v] };
        litFormulas.push(positive ? atom : { kind: 'not', args: [atom] });
      }
      const clause: Formula = {
        kind: 'or',
        args: [litFormulas[0], { kind: 'or', args: [litFormulas[1], litFormulas[2]] }],
      };
      formula = formula ? { kind: 'and', args: [formula, clause] } : clause;
    }

    if (!formula) return;

    const asyncResult = await cdclAsync(formula, 15000);
    // Con ratio 2.0 debería ser SAT (probabilidad ~99.9%)
    expect(asyncResult.satisfiable).toBe(true);
    expect(asyncResult.model).toBeDefined();
  }, 20000);

  it('pigeonhole n=5 (6 pigeons, 5 holes) — UNSAT via parallel', async () => {
    // PHP(6,5): 6 pigeons into 5 holes → UNSAT
    // Variables: p_{i,j} = pigeon i in hole j (i: 0..5, j: 0..4) → 30 vars
    const n = 5;
    const pigeons = n + 1;
    const holes = n;

    function varName(pigeon: number, hole: number): string {
      return `ph_${pigeon}_${hole}`;
    }

    // Each pigeon must be in at least one hole
    let formula: Formula | null = null;
    for (let i = 0; i < pigeons; i++) {
      const holeAtoms: Formula[] = [];
      for (let j = 0; j < holes; j++) {
        holeAtoms.push({ kind: 'atom', name: varName(i, j) });
      }
      let clause: Formula = holeAtoms[0];
      for (let j = 1; j < holeAtoms.length; j++) {
        clause = { kind: 'or', args: [clause, holeAtoms[j]] };
      }
      formula = formula ? { kind: 'and', args: [formula, clause] } : clause;
    }

    // No two pigeons in same hole
    for (let j = 0; j < holes; j++) {
      for (let i1 = 0; i1 < pigeons; i1++) {
        for (let i2 = i1 + 1; i2 < pigeons; i2++) {
          const clash: Formula = {
            kind: 'or',
            args: [
              { kind: 'not', args: [{ kind: 'atom', name: varName(i1, j) }] },
              { kind: 'not', args: [{ kind: 'atom', name: varName(i2, j) }] },
            ],
          };
          formula = { kind: 'and', args: [formula!, clash] };
        }
      }
    }

    const asyncResult = await cdclAsync(formula!, 15000);
    expect(asyncResult.satisfiable).toBe(false);
  }, 20000);

  it('known satisfiable — model validates clauses', async () => {
    // Simple but larger formula: (a0 | a1 | a2) & (a3 | a4 | a5) & ...
    const numVars = 90;
    const atoms: string[] = [];
    for (let i = 0; i < numVars; i++) atoms.push(`m${i}`);

    // Pure positive 3-clauses → trivially SAT (any all-true assignment works)
    let formula: Formula | null = null;
    for (let c = 0; c < numVars; c++) {
      const i0 = c % numVars;
      const i1 = (c + 1) % numVars;
      const i2 = (c + 2) % numVars;
      const clause: Formula = {
        kind: 'or',
        args: [
          { kind: 'atom', name: atoms[i0] },
          {
            kind: 'or',
            args: [
              { kind: 'atom', name: atoms[i1] },
              { kind: 'atom', name: atoms[i2] },
            ],
          },
        ],
      };
      formula = formula ? { kind: 'and', args: [formula, clause] } : clause;
    }

    const asyncResult = await cdclAsync(formula!, 10000);
    expect(asyncResult.satisfiable).toBe(true);
    expect(asyncResult.model).toBeDefined();

    // Verify: at least one atom in each clause should be true
    if (asyncResult.model) {
      for (let c = 0; c < numVars; c++) {
        const i0 = c % numVars;
        const i1 = (c + 1) % numVars;
        const i2 = (c + 2) % numVars;
        const clauseSat =
          asyncResult.model[atoms[i0]] ||
          asyncResult.model[atoms[i1]] ||
          asyncResult.model[atoms[i2]];
        expect(clauseSat).toBe(true);
      }
    }
  }, 15000);
});
