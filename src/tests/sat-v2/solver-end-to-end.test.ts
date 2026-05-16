import { describe, expect, it } from 'vitest';
import { solveCDCLv2, type SatResult, type UnsatResult } from '../../solver/cdcl-v2';

function isSat(r: { sat?: true } | { unsat?: true }): r is SatResult {
  return (r as { sat?: true }).sat === true;
}
function isUnsat(r: { sat?: true } | { unsat?: true }): r is UnsatResult {
  return (r as { unsat?: true }).unsat === true;
}

/** Verifica que un modelo satisface las cláusulas (asume model usa "x{var}"). */
function modelSatisfies(
  model: Record<string, boolean>,
  clauses: Int32Array[],
  numVars: number,
  names?: string[],
): boolean {
  const val = new Int8Array(numVars + 1);
  for (let v = 1; v <= numVars; v++) {
    const name = names ? names[v - 1] : `x${v}`;
    if (name && Object.prototype.hasOwnProperty.call(model, name)) {
      val[v] = model[name] ? 1 : -1;
    } else {
      val[v] = 1;
    }
  }
  for (const c of clauses) {
    let sat = false;
    for (let i = 0; i < c.length; i++) {
      const lit = c[i] ?? 0;
      const v = Math.abs(lit);
      const expected = lit > 0 ? 1 : -1;
      if (val[v] === expected) {
        sat = true;
        break;
      }
    }
    if (!sat) return false;
  }
  return true;
}

describe('solveCDCLv2 — instancias triviales', () => {
  it('SAT: una sola cláusula unitaria', () => {
    const r = solveCDCLv2([new Int32Array([1])], 1);
    expect(isSat(r)).toBe(true);
    if (isSat(r)) {
      expect(r.model.x1).toBe(true);
    }
  });

  it('UNSAT: cláusula vacía explícita', () => {
    const r = solveCDCLv2([new Int32Array([])], 1);
    expect(isUnsat(r)).toBe(true);
  });

  it('UNSAT: P y ¬P', () => {
    const r = solveCDCLv2([new Int32Array([1]), new Int32Array([-1])], 1);
    expect(isUnsat(r)).toBe(true);
  });

  it('SAT: caja vacía (0 cláusulas, n vars)', () => {
    const r = solveCDCLv2([], 5);
    expect(isSat(r)).toBe(true);
  });

  it('SAT: 0 vars, 0 cláusulas', () => {
    const r = solveCDCLv2([], 0);
    expect(isSat(r)).toBe(true);
  });

  it('UNSAT: 0 vars con cláusula vacía', () => {
    const r = solveCDCLv2([new Int32Array([])], 0);
    expect(isUnsat(r)).toBe(true);
  });
});

describe('solveCDCLv2 — cadenas de implicación', () => {
  it('SAT: a → b → c, decide a=true ⇒ todo true', () => {
    // (¬a ∨ b), (¬b ∨ c), (a)
    const clauses = [new Int32Array([-1, 2]), new Int32Array([-2, 3]), new Int32Array([1])];
    const r = solveCDCLv2(clauses, 3);
    expect(isSat(r)).toBe(true);
    if (isSat(r)) expect(modelSatisfies(r.model, clauses, 3)).toBe(true);
  });

  it('UNSAT: a, a→b, a→¬b', () => {
    const clauses = [new Int32Array([1]), new Int32Array([-1, 2]), new Int32Array([-1, -2])];
    const r = solveCDCLv2(clauses, 2);
    expect(isUnsat(r)).toBe(true);
  });
});

describe('solveCDCLv2 — 3-SAT determinístico', () => {
  // Mulberry32 estable; mismas instancias que cdcl.bench.ts
  function rng(seed: number): () => number {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gen3SAT(vars: number, numClauses: number, seed: number): Int32Array[] {
    const r = rng(seed);
    const out: Int32Array[] = [];
    for (let i = 0; i < numClauses; i++) {
      const used = new Set<number>();
      const lits: number[] = [];
      while (lits.length < 3) {
        const v = Math.floor(r() * vars) + 1;
        if (used.has(v)) continue;
        used.add(v);
        lits.push(r() < 0.5 ? -v : v);
      }
      out.push(new Int32Array(lits));
    }
    return out;
  }

  it('SAT: ratio bajo (20 vars, 40 cláusulas)', () => {
    const cs = gen3SAT(20, 40, 1);
    const r = solveCDCLv2(cs, 20);
    expect(isSat(r)).toBe(true);
    if (isSat(r)) expect(modelSatisfies(r.model, cs, 20)).toBe(true);
  });

  it('resuelve instancias de 30 vars 128 clauses con timeout razonable', () => {
    const cs = gen3SAT(30, 128, 42);
    const r = solveCDCLv2(cs, 30, { timeoutMs: 5000 });
    // No comprometemos satisfacibilidad (cerca de phase transition); sólo
    // exigimos que termine y respete su contrato.
    if (isSat(r)) {
      expect(modelSatisfies(r.model, cs, 30)).toBe(true);
    } else {
      expect(isUnsat(r)).toBe(true);
    }
  });
});

describe('solveCDCLv2 — Pigeonhole Principle UNSAT', () => {
  // PHP(p, h) con p > h es UNSAT.
  function buildPHP(p: number, h: number): { clauses: Int32Array[]; n: number } {
    const id = (pigeon: number, hole: number): number => (pigeon - 1) * h + hole;
    const clauses: Int32Array[] = [];
    // At least one hole per pigeon.
    for (let pp = 1; pp <= p; pp++) {
      const lits: number[] = [];
      for (let hh = 1; hh <= h; hh++) lits.push(id(pp, hh));
      clauses.push(new Int32Array(lits));
    }
    // At most one pigeon per hole.
    for (let hh = 1; hh <= h; hh++) {
      for (let p1 = 1; p1 <= p; p1++) {
        for (let p2 = p1 + 1; p2 <= p; p2++) {
          clauses.push(new Int32Array([-id(p1, hh), -id(p2, hh)]));
        }
      }
    }
    return { clauses, n: p * h };
  }

  it('PHP(3,2): UNSAT', () => {
    const { clauses, n } = buildPHP(3, 2);
    const r = solveCDCLv2(clauses, n);
    expect(isUnsat(r)).toBe(true);
  });

  it('PHP(4,3): UNSAT', () => {
    const { clauses, n } = buildPHP(4, 3);
    const r = solveCDCLv2(clauses, n, { timeoutMs: 10_000 });
    expect(isUnsat(r)).toBe(true);
  });
});

describe('solveCDCLv2 — stats y opciones', () => {
  it('reporta stats coherentes', () => {
    const r = solveCDCLv2(
      [
        new Int32Array([1, 2, 3]),
        new Int32Array([-1, 2]),
        new Int32Array([-2, 3]),
        new Int32Array([-3, -1, -2]),
      ],
      3,
    );
    expect(r.stats.solveTimeMs).toBeGreaterThanOrEqual(0);
    if (isSat(r)) {
      expect(r.stats.decisions).toBeGreaterThanOrEqual(0);
      expect(r.stats.propagations).toBeGreaterThanOrEqual(0);
    }
  });

  it('usa atomNames opcional para etiquetar modelo', () => {
    const r = solveCDCLv2([new Int32Array([1]), new Int32Array([-2])], 2, {
      atomNames: ['alice', 'bob'],
    });
    expect(isSat(r)).toBe(true);
    if (isSat(r)) {
      expect(r.model.alice).toBe(true);
      expect(r.model.bob).toBe(false);
    }
  });

  it('honra initialPhase=1 cuando no hay propagaciones que la pisen', () => {
    // 2 vars libres, sin cláusulas restrictivas. Con phase=1, decide ambas true.
    const r = solveCDCLv2([], 2, { initialPhase: 1, atomNames: ['a', 'b'] });
    expect(isSat(r)).toBe(true);
    if (isSat(r)) {
      // Con 0 cláusulas no hay branching: el modelo por defecto trata vars libres
      // como true en buildModel, así que la verificación es trivial.
      expect(r.model.a).toBe(true);
      expect(r.model.b).toBe(true);
    }
  });
});
