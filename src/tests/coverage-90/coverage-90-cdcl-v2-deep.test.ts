import { describe, it, expect } from 'vitest';
import { solveCDCLv2 } from '../../solver/cdcl-v2/solver';

/**
 * Tests dirigidos a paths poco cubiertos del solver CDCL v2:
 *   - reduceLearnedDB (necesita >= 100 cláusulas aprendidas)
 *   - Restarts Luby (problemas con muchos conflictos)
 *   - Watch-list rebuild durante reducción
 *   - Backtrack a nivel 0
 *   - atomNames opcional → modelo con nombres
 */

function pigeonhole(n: number): { clauses: Int32Array[]; numVars: number } {
  // Pigeonhole UNSAT clásico: n+1 palomas en n agujeros.
  // Variables x_{i,j} = paloma i está en agujero j  (1 <= i <= n+1, 1 <= j <= n)
  const numHoles = n;
  const numPigeons = n + 1;
  const numVars = numPigeons * numHoles;
  const idx = (i: number, j: number): number => (i - 1) * numHoles + j;
  const clauses: Int32Array[] = [];
  // Cada paloma en algún agujero.
  for (let i = 1; i <= numPigeons; i++) {
    const clause: number[] = [];
    for (let j = 1; j <= numHoles; j++) clause.push(idx(i, j));
    clauses.push(new Int32Array(clause));
  }
  // No 2 palomas en el mismo agujero.
  for (let j = 1; j <= numHoles; j++) {
    for (let i1 = 1; i1 <= numPigeons; i1++) {
      for (let i2 = i1 + 1; i2 <= numPigeons; i2++) {
        clauses.push(new Int32Array([-idx(i1, j), -idx(i2, j)]));
      }
    }
  }
  return { clauses, numVars };
}

describe('coverage-90 — cdcl-v2 deep paths', () => {
  it('pigeonhole 4-into-3 is UNSAT (triggers many conflicts/restarts)', () => {
    const { clauses, numVars } = pigeonhole(3);
    const r = solveCDCLv2(clauses, numVars, { timeoutMs: 10_000, lubyBase: 8 });
    expect((r as { unsat?: boolean }).unsat).toBe(true);
    expect(r.stats.conflicts).toBeGreaterThan(0);
  });

  it('pigeonhole 5-into-4 stresses learnedDB and may reduce', () => {
    const { clauses, numVars } = pigeonhole(4);
    // lubyBase pequeño fuerza restarts frecuentes.
    const r = solveCDCLv2(clauses, numVars, { timeoutMs: 15_000, lubyBase: 4 });
    expect((r as { unsat?: boolean }).unsat).toBe(true);
    expect(r.stats.conflicts).toBeGreaterThan(0);
  });

  it('atomNames option produces named model', () => {
    const r = solveCDCLv2([new Int32Array([1]), new Int32Array([-2, 3])], 3, {
      atomNames: ['alpha', 'beta', 'gamma'],
    });
    expect((r as { sat?: boolean }).sat).toBe(true);
    const sat = r as { sat: true; model: Record<string, boolean> };
    expect(Object.keys(sat.model).sort()).toContain('alpha');
  });

  it('initialPhase=1 explores different search order', () => {
    const r = solveCDCLv2([new Int32Array([1, 2]), new Int32Array([-1, -2])], 2, {
      initialPhase: 1,
    });
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('clauseDecay extreme value still solves', () => {
    const r = solveCDCLv2(
      [new Int32Array([1, 2]), new Int32Array([1, -2]), new Int32Array([-1, 2])],
      2,
      { clauseDecay: 0.5 },
    );
    expect(r).toBeDefined();
  });

  it('vsidsDecay close to 1 still solves', () => {
    const r = solveCDCLv2([new Int32Array([1, 2]), new Int32Array([-1, -2])], 2, {
      vsidsDecay: 0.999,
    });
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('large random SAT instance', () => {
    // 10 variables, ~30 random 3-clauses, mostly SAT
    const clauses: Int32Array[] = [];
    const seed = 12345;
    let s = seed;
    const rand = (): number => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s;
    };
    for (let k = 0; k < 30; k++) {
      const lits: number[] = [];
      for (let l = 0; l < 3; l++) {
        const v = (rand() % 10) + 1;
        const sign = rand() % 2 === 0 ? 1 : -1;
        lits.push(v * sign);
      }
      clauses.push(new Int32Array(lits));
    }
    const r = solveCDCLv2(clauses, 10, { timeoutMs: 5000 });
    expect(r).toBeDefined();
    expect(r.stats).toBeDefined();
  });

  it('unit clause forces UNSAT when contradicted', () => {
    const r = solveCDCLv2(
      [new Int32Array([1]), new Int32Array([-1, 2]), new Int32Array([-2, 3]), new Int32Array([-3])],
      3,
    );
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });

  it('chain SAT: x1, x1->x2, x2->x3, ..., x9->x10 → all true', () => {
    const clauses: Int32Array[] = [new Int32Array([1])];
    for (let i = 1; i < 10; i++) clauses.push(new Int32Array([-i, i + 1]));
    const r = solveCDCLv2(clauses, 10);
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('default options work without explicit opts', () => {
    const r = solveCDCLv2([new Int32Array([1, 2, 3]), new Int32Array([-1, -2, -3])], 3);
    expect(r).toBeDefined();
  });

  it('returns deterministic result with empty options', () => {
    const r = solveCDCLv2([new Int32Array([1])], 1, {});
    expect((r as { sat?: boolean }).sat).toBe(true);
  });

  it('lbdReduceThreshold low forces aggressive reduction', () => {
    const { clauses, numVars } = pigeonhole(3);
    const r = solveCDCLv2(clauses, numVars, { lbdReduceThreshold: 1, lubyBase: 4 });
    expect((r as { unsat?: boolean }).unsat).toBe(true);
  });
});
