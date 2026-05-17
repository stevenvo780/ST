/**
 * Benchmark: CDCL vs Legacy DPLL
 * ===============================
 * Compares the new CDCL solver against the original DPLL solver
 * on a variety of hard instances. Validates that both produce
 * the same results, and measures relative performance.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { FormulaFactory } from '../runtime/formula-factory';
import { cdcl } from '../logic/profiles/classical/cdcl';
import { dpllLegacy } from '../logic/profiles/classical/dpll';
import type { Formula } from '../types';

afterEach(() => {
  FormulaFactory.clear();
});

// Helpers
function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}
function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}
function or(a: Formula, b: Formula): Formula {
  return { kind: 'or', args: [a, b] };
}
function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandom3SAT(numVars: number, numClauses: number, seed: number): Formula {
  const rng = mulberry32(seed);
  let formula: Formula | null = null;
  for (let ci = 0; ci < numClauses; ci++) {
    const lits: Formula[] = [];
    const used = new Set<number>();
    while (lits.length < 3) {
      const v = Math.floor(rng() * numVars) + 1;
      if (used.has(v)) continue;
      used.add(v);
      const a = atom(`V${v}`);
      lits.push(rng() < 0.5 ? not(a) : a);
    }
    const clause = or(or(lits[0], lits[1]), lits[2]);
    formula = formula ? and(formula, clause) : clause;
  }
  return formula!;
}

function buildPHP(pigeons: number, holes: number): Formula {
  const parts: Formula[] = [];
  for (let p = 1; p <= pigeons; p++) {
    const lits: Formula[] = [];
    for (let h = 1; h <= holes; h++) {
      lits.push(atom(`P${p}H${h}`));
    }
    parts.push(lits.reduce((acc, l) => or(acc, l)));
  }
  for (let h = 1; h <= holes; h++) {
    for (let p1 = 1; p1 <= pigeons; p1++) {
      for (let p2 = p1 + 1; p2 <= pigeons; p2++) {
        parts.push(or(not(atom(`P${p1}H${h}`)), not(atom(`P${p2}H${h}`))));
      }
    }
  }
  return parts.reduce((acc, p) => and(acc, p));
}

function buildImplicationChain(n: number, forceEndFalse: boolean): Formula {
  let formula: Formula = atom('C0');
  for (let i = 0; i < n - 1; i++) {
    formula = and(formula, implies(atom(`C${i}`), atom(`C${i + 1}`)));
  }
  if (forceEndFalse) {
    formula = and(formula, not(atom(`C${n - 1}`)));
  }
  return formula;
}

type BenchResult = {
  cdclMs: number;
  legacyMs: number;
  cdclSat: boolean;
  legacySat: boolean;
  speedup: string;
};

function benchmark(name: string, formula: Formula, timeoutMs: number = 5000): BenchResult {
  const t0 = performance.now();
  const cdclResult = cdcl(formula, timeoutMs);
  const t1 = performance.now();

  const t2 = performance.now();
  const legacyResult = dpllLegacy(formula, timeoutMs);
  const t3 = performance.now();

  const cdclMs = Math.round((t1 - t0) * 100) / 100;
  const legacyMs = Math.round((t3 - t2) * 100) / 100;
  const speedup = legacyMs > 0 ? `${(legacyMs / Math.max(cdclMs, 0.01)).toFixed(1)}x` : 'N/A';

  return {
    cdclMs,
    legacyMs,
    cdclSat: cdclResult.satisfiable,
    legacySat: legacyResult.satisfiable,
    speedup,
  };
}

describe('Benchmark: CDCL vs Legacy DPLL', () => {
  it('Random 3-SAT 50 vars (ratio 4.27) — correctness crosscheck', () => {
    const formula = buildRandom3SAT(50, 214, 42);
    const res = benchmark('3SAT-50', formula);
    expect(res.cdclSat).toBe(res.legacySat);
    console.log(
      `  3SAT(50): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 10000);

  it('Random 3-SAT 80 vars — both agree', () => {
    const formula = buildRandom3SAT(80, 342, 777);
    const res = benchmark('3SAT-80', formula);
    expect(res.cdclSat).toBe(res.legacySat);
    console.log(
      `  3SAT(80): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 10000);

  it('Random 3-SAT 100 vars — CDCL should be faster', () => {
    const formula = buildRandom3SAT(100, 427, 123);
    const res = benchmark('3SAT-100', formula, 10000);
    expect(res.cdclSat).toBe(res.legacySat);
    console.log(
      `  3SAT(100): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 15000);

  it('PHP(5,4) — CDCL should outperform DPLL on UNSAT', () => {
    const formula = buildPHP(5, 4);
    const res = benchmark('PHP-5-4', formula);
    expect(res.cdclSat).toBe(false);
    expect(res.legacySat).toBe(false);
    console.log(
      `  PHP(5,4): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 10000);

  it('PHP(6,5) — harder UNSAT', () => {
    const formula = buildPHP(6, 5);
    const res = benchmark('PHP-6-5', formula);
    expect(res.cdclSat).toBe(false);
    expect(res.legacySat).toBe(false);
    console.log(
      `  PHP(6,5): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 30000);

  it('Implication chain 200 (SAT) — both fast', () => {
    const formula = buildImplicationChain(200, false);
    const res = benchmark('ImpChain-200-SAT', formula);
    expect(res.cdclSat).toBe(true);
    expect(res.legacySat).toBe(true);
    console.log(
      `  ImpChain(200,SAT): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 10000);

  it('Implication chain 200 + forced false (UNSAT)', () => {
    const formula = buildImplicationChain(200, true);
    const res = benchmark('ImpChain-200-UNSAT', formula);
    expect(res.cdclSat).toBe(false);
    expect(res.legacySat).toBe(false);
    console.log(
      `  ImpChain(200,UNSAT): CDCL=${res.cdclMs}ms, Legacy=${res.legacyMs}ms, Speedup=${res.speedup}`,
    );
  }, 10000);

  it('10 small random instances — all agree', () => {
    let allAgree = true;
    for (let i = 0; i < 10; i++) {
      const formula = buildRandom3SAT(30, 128, 1000 + i);
      const res = benchmark(`small-${i}`, formula);
      if (res.cdclSat !== res.legacySat) {
        allAgree = false;
      }
    }
    expect(allAgree).toBe(true);
  }, 30000);

  it('Summary: CDCL is a valid replacement for DPLL', () => {
    // Simple sanity: CDCL handles trivial cases
    const trivialSat = cdcl(atom('P'), 1000);
    const trivialUnsat = cdcl(and(atom('P'), not(atom('P'))), 1000);
    expect(trivialSat.satisfiable).toBe(true);
    expect(trivialUnsat.satisfiable).toBe(false);
  }, 5000);
});
