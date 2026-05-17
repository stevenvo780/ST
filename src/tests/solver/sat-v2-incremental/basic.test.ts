import { describe, expect, it } from 'vitest';
import { IncrementalCDCL } from '../../../solver/cdcl-v2-incremental';

describe('IncrementalCDCL — sat/unsat triviales', () => {
  it('SAT: sin cláusulas, 0 vars', () => {
    const s = new IncrementalCDCL(0);
    const r = s.solve();
    expect(r.sat).toBe(true);
    expect(r.model?.size).toBe(0);
  });

  it('SAT: sin cláusulas, 3 vars libres', () => {
    const s = new IncrementalCDCL(3);
    const r = s.solve();
    expect(r.sat).toBe(true);
    // 3 vars en el modelo.
    expect(r.model?.size).toBe(3);
  });

  it('SAT: unitaria positiva', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]);
    const r = s.solve();
    expect(r.sat).toBe(true);
    expect(r.model?.get(1)).toBe(true);
  });

  it('SAT: unitaria negativa', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([-1]);
    const r = s.solve();
    expect(r.sat).toBe(true);
    expect(r.model?.get(1)).toBe(false);
  });

  it('UNSAT: cláusula vacía explícita', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([]);
    const r = s.solve();
    expect(r.sat).toBe(false);
  });

  it('UNSAT: P y ¬P', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]);
    s.addClause([-1]);
    const r = s.solve();
    expect(r.sat).toBe(false);
  });
});

describe('IncrementalCDCL — addClause + solve', () => {
  it('SAT: cláusula binaria, modelo válido', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    const r = s.solve();
    expect(r.sat).toBe(true);
    expect(r.model?.get(1) === true || r.model?.get(2) === true).toBe(true);
  });

  it('SAT: 3-SAT pequeño', () => {
    const s = new IncrementalCDCL(3);
    s.addClause([1, 2, 3]);
    s.addClause([-1, -2]);
    s.addClause([-2, -3]);
    s.addClause([-1, -3]);
    const r = s.solve();
    expect(r.sat).toBe(true);
  });
});

describe('IncrementalCDCL — assumptions', () => {
  it('assumption fuerza el modelo: a ∨ b con [-a] ⇒ b=true', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]); // a ∨ b
    const r = s.solve([-1]); // ¬a
    expect(r.sat).toBe(true);
    expect(r.model?.get(1)).toBe(false);
    expect(r.model?.get(2)).toBe(true);
  });

  it('assumption inconsistente con unitaria: [a] + solve([-a]) ⇒ unsat + failedAssumptions=[-a]', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]); // unitaria a
    const r = s.solve([-1]);
    expect(r.sat).toBe(false);
    expect(r.failedAssumptions).toBeDefined();
    expect(r.failedAssumptions).toContain(-1);
  });

  it('solve sin assumptions tras solve con assumptions sigue siendo SAT', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    const r1 = s.solve([-1]);
    expect(r1.sat).toBe(true);
    const r2 = s.solve();
    expect(r2.sat).toBe(true);
  });

  it('múltiples assumptions consistentes', () => {
    const s = new IncrementalCDCL(3);
    s.addClause([1, 2, 3]); // a ∨ b ∨ c
    const r = s.solve([-1, -2]);
    expect(r.sat).toBe(true);
    expect(r.model?.get(3)).toBe(true);
  });

  it('múltiples assumptions inconsistentes: failedAssumptions cubre el conflicto', () => {
    // (a ∨ b), (a ∨ ¬b) → fuerza a=true. Assumir [-a, b] ⇒ unsat.
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    s.addClause([1, -2]);
    const r = s.solve([-1, 2]);
    expect(r.sat).toBe(false);
    expect(r.failedAssumptions).toBeDefined();
    // El core debe incluir al menos -a (la culpable directa).
    expect(r.failedAssumptions!).toContain(-1);
  });
});

describe('IncrementalCDCL — push/pop', () => {
  it('push → addClause unsat → pop ⇒ vuelve a SAT', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]); // a
    const before = s.solve();
    expect(before.sat).toBe(true);
    s.push();
    s.addClause([-1]); // contradice a
    const mid = s.solve();
    expect(mid.sat).toBe(false);
    s.pop();
    const after = s.solve();
    expect(after.sat).toBe(true);
    expect(after.model?.get(1)).toBe(true);
  });

  it('push → add → pop devuelve count de cláusulas al estado previo', () => {
    const s = new IncrementalCDCL(3);
    s.addClause([1, 2]);
    const c0 = s.stats().clauses;
    s.push();
    s.addClause([-1, 3]);
    s.addClause([-2, 3]);
    expect(s.stats().clauses).toBe(c0 + 2);
    s.pop();
    expect(s.stats().clauses).toBe(c0);
  });

  it('push anidados: 2 push → 1 pop → 1 pop revierte ambos', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    const c0 = s.stats().clauses;
    s.push();
    s.addClause([-1]);
    s.push();
    s.addClause([-2]);
    expect(s.solve().sat).toBe(false);
    s.pop();
    // Ahora hay [-1] pero no [-2]: forces b=true.
    const mid = s.solve();
    expect(mid.sat).toBe(true);
    expect(mid.model?.get(2)).toBe(true);
    s.pop();
    expect(s.stats().clauses).toBe(c0);
    expect(s.solve().sat).toBe(true);
  });

  it('pop(2) revierte dos checkpoints en una llamada', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    const c0 = s.stats().clauses;
    s.push();
    s.addClause([-1]);
    s.push();
    s.addClause([-2]);
    s.pop(2);
    expect(s.stats().clauses).toBe(c0);
  });

  it('pop sin checkpoint no falla', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]);
    s.pop(); // no-op
    expect(s.solve().sat).toBe(true);
  });
});

describe('IncrementalCDCL — newVar / reset', () => {
  it('newVar agrega variables dinámicamente', () => {
    const s = new IncrementalCDCL(0);
    const v1 = s.newVar();
    const v2 = s.newVar();
    const v3 = s.newVar();
    expect(v1).toBe(1);
    expect(v2).toBe(2);
    expect(v3).toBe(3);
    s.addClause([v1, v2, v3]);
    const r = s.solve();
    expect(r.sat).toBe(true);
    expect(s.stats().vars).toBe(3);
  });

  it('reset deja el solver vacío', () => {
    const s = new IncrementalCDCL(3);
    s.addClause([1, 2]);
    s.addClause([-1, 3]);
    s.solve();
    s.reset();
    expect(s.stats().vars).toBe(0);
    expect(s.stats().clauses).toBe(0);
    expect(s.solve().sat).toBe(true);
  });

  it('reset + reconstruir funciona end-to-end', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1]);
    s.addClause([-1]);
    expect(s.solve().sat).toBe(false);
    s.reset();
    const v1 = s.newVar();
    s.addClause([v1]);
    expect(s.solve().sat).toBe(true);
  });
});

describe('IncrementalCDCL — modelValue', () => {
  it('modelValue devuelve la polaridad asignada tras SAT', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1]);
    s.addClause([-2]);
    expect(s.solve().sat).toBe(true);
    expect(s.modelValue(1)).toBe(true);
    expect(s.modelValue(2)).toBe(false);
  });

  it('modelValue de var fuera de rango devuelve undefined', () => {
    const s = new IncrementalCDCL(1);
    s.addClause([1]);
    s.solve();
    expect(s.modelValue(0)).toBeUndefined();
    expect(s.modelValue(5)).toBeUndefined();
  });
});

describe('IncrementalCDCL — secuencias incrementales', () => {
  it('100 vars + 200 cláusulas + 10 solves consistentes', () => {
    const NVARS = 100;
    const NCLAUSES = 200;
    const s = new IncrementalCDCL(NVARS);

    // Generar 3-SAT determinístico.
    function rng(seed: number): () => number {
      return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const rand = rng(7);
    for (let i = 0; i < NCLAUSES; i++) {
      const lits: number[] = [];
      const used = new Set<number>();
      while (lits.length < 3) {
        const v = Math.floor(rand() * NVARS) + 1;
        if (used.has(v)) continue;
        used.add(v);
        lits.push(rand() < 0.5 ? -v : v);
      }
      s.addClause(lits);
    }

    // 10 solves con distintos assumptions; verificar que cada SAT realmente satisface
    // las cláusulas + assumptions.
    function verify(model: Map<number, boolean> | undefined, assumptions: number[]): boolean {
      if (!model) return false;
      for (const a of assumptions) {
        const v = Math.abs(a);
        const want = a > 0;
        const got = model.get(v);
        if (got !== want) return false;
      }
      return true;
    }

    let satCount = 0;
    let unsatCount = 0;
    for (let i = 0; i < 10; i++) {
      const assumps: number[] = [];
      const numA = (i % 4) + 1;
      const rrand = rng(31 + i);
      for (let k = 0; k < numA; k++) {
        const vv = Math.floor(rrand() * NVARS) + 1;
        assumps.push(rrand() < 0.5 ? -vv : vv);
      }
      const r = s.solve(assumps);
      if (r.sat) {
        satCount++;
        expect(verify(r.model, assumps)).toBe(true);
      } else {
        unsatCount++;
        expect(r.failedAssumptions).toBeDefined();
      }
    }
    expect(satCount + unsatCount).toBe(10);
  });
});

describe('IncrementalCDCL — learning persiste entre solves', () => {
  it('segundo solve tras agregar cláusula no rompe el modelo', () => {
    const s = new IncrementalCDCL(4);
    s.addClause([1, 2]);
    s.addClause([3, 4]);
    const r1 = s.solve();
    expect(r1.sat).toBe(true);

    // Agregar más cláusulas y volver a resolver.
    s.addClause([-1, 3]);
    s.addClause([-2, 4]);
    const r2 = s.solve();
    expect(r2.sat).toBe(true);
  });

  it('agregar cláusula UNSAT tras solve previo SAT detecta UNSAT', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1]); // a
    expect(s.solve().sat).toBe(true);
    s.addClause([-1]); // ¬a — contradice
    expect(s.solve().sat).toBe(false);
  });
});

describe('IncrementalCDCL — robustez', () => {
  it('addClause rechaza literal 0', () => {
    const s = new IncrementalCDCL(2);
    expect(() => s.addClause([1, 0, 2])).toThrow();
  });

  it('addClause rechaza var fuera de rango', () => {
    const s = new IncrementalCDCL(2);
    expect(() => s.addClause([1, 5])).toThrow();
  });

  it('solve rechaza assumption con var fuera de rango', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    expect(() => s.solve([5])).toThrow();
  });

  it('solve rechaza assumption 0', () => {
    const s = new IncrementalCDCL(2);
    s.addClause([1, 2]);
    expect(() => s.solve([0])).toThrow();
  });

  it('constructor rechaza numVars negativos', () => {
    expect(() => new IncrementalCDCL(-1)).toThrow();
  });
});

describe('IncrementalCDCL — pigeonhole bajo assumptions', () => {
  // Pigeonhole(3,2) clásico — UNSAT estructural.
  // 3 palomas, 2 huecos. p_{i,j} = paloma i en hueco j → var (i-1)*2 + j.
  it('PHP(3,2) es UNSAT', () => {
    const s = new IncrementalCDCL(6);
    const id = (i: number, j: number): number => (i - 1) * 2 + j;
    // Cada paloma en algún hueco.
    s.addClause([id(1, 1), id(1, 2)]);
    s.addClause([id(2, 1), id(2, 2)]);
    s.addClause([id(3, 1), id(3, 2)]);
    // No dos palomas en el mismo hueco.
    s.addClause([-id(1, 1), -id(2, 1)]);
    s.addClause([-id(1, 1), -id(3, 1)]);
    s.addClause([-id(2, 1), -id(3, 1)]);
    s.addClause([-id(1, 2), -id(2, 2)]);
    s.addClause([-id(1, 2), -id(3, 2)]);
    s.addClause([-id(2, 2), -id(3, 2)]);
    const r = s.solve();
    expect(r.sat).toBe(false);
  });
});
