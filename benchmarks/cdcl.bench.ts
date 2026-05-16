/**
 * CDCL SAT Solver Benchmarks
 * --------------------------
 * Instancias representativas: triviales, medianas (3-SAT), duras (PHP).
 * Todos los seeds son fijos → resultados deterministas.
 */
import { bench, describe, afterEach } from 'vitest';
import { cdcl } from '../src/profiles/classical/cdcl';
import { dpllLegacy } from '../src/profiles/classical/dpll';
import { FormulaFactory } from '../src/runtime/formula-factory';
import type { Formula } from '../src/types';

afterEach(() => {
  FormulaFactory.clear();
});

// ── Formula builders ─────────────────────────────────────────

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

/** Mulberry32 — PRNG determinista */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build3SAT(vars: number, clauses: number, seed: number): Formula {
  const rng = mulberry32(seed);
  let formula: Formula | null = null;
  for (let ci = 0; ci < clauses; ci++) {
    const lits: Formula[] = [];
    const used = new Set<number>();
    while (lits.length < 3) {
      const v = Math.floor(rng() * vars) + 1;
      if (used.has(v)) continue;
      used.add(v);
      const a = atom(`V${v}`);
      lits.push(rng() < 0.5 ? not(a) : a);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clause = or(or(lits[0]!, lits[1]!), lits[2]!);
    formula = formula ? and(formula, clause) : clause;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return formula!;
}

function buildPHP(pigeons: number, holes: number): Formula {
  const parts: Formula[] = [];
  for (let p = 1; p <= pigeons; p++) {
    const lits: Formula[] = [];
    for (let h = 1; h <= holes; h++) lits.push(atom(`P${p}H${h}`));
    parts.push(lits.reduce((a, l) => or(a, l)));
  }
  for (let h = 1; h <= holes; h++) {
    for (let p1 = 1; p1 <= pigeons; p1++) {
      for (let p2 = p1 + 1; p2 <= pigeons; p2++) {
        parts.push(or(not(atom(`P${p1}H${h}`)), not(atom(`P${p2}H${h}`))));
      }
    }
  }
  return parts.reduce((a, p) => and(a, p));
}

function buildImplicationChain(n: number, forceEndFalse: boolean): Formula {
  let f: Formula = atom('C0');
  for (let i = 0; i < n - 1; i++) {
    f = and(f, implies(atom(`C${i}`), atom(`C${i + 1}`)));
  }
  if (forceEndFalse) f = and(f, not(atom(`C${n - 1}`)));
  return f;
}

// ── Pre-build formulas (outside bench loop for fair timing) ──

const F_TRIVIAL_SAT = atom('P');
const F_TRIVIAL_UNSAT = and(atom('P'), not(atom('P')));
const F_3SAT_SMALL = build3SAT(30, 128, 42);   // ~sat
const F_3SAT_MED   = build3SAT(50, 214, 42);   // phase transition
const F_3SAT_LARGE = build3SAT(80, 342, 777);  // harder
const F_PHP_4_3    = buildPHP(4, 3);            // UNSAT, small
const F_PHP_5_4    = buildPHP(5, 4);            // UNSAT, medium
const F_IMP_SAT    = buildImplicationChain(100, false);
const F_IMP_UNSAT  = buildImplicationChain(100, true);

// ── Benchmarks ────────────────────────────────────────────────

describe('CDCL: trivial instances', () => {
  bench('cdcl trivial SAT (single atom)', () => {
    cdcl(F_TRIVIAL_SAT, 1000);
  });

  bench('cdcl trivial UNSAT (P & !P)', () => {
    cdcl(F_TRIVIAL_UNSAT, 1000);
  });
});

describe('CDCL: 3-SAT instances (seed=42)', () => {
  bench('cdcl 3-SAT small (30 vars, 128 clauses)', () => {
    cdcl(F_3SAT_SMALL, 5000);
  });

  bench('cdcl 3-SAT medium (50 vars, 214 clauses — phase transition)', () => {
    cdcl(F_3SAT_MED, 5000);
  });

  bench('cdcl 3-SAT large (80 vars, 342 clauses)', () => {
    cdcl(F_3SAT_LARGE, 10000);
  });
});

describe('CDCL: Pigeonhole Principle (hard UNSAT)', () => {
  bench('cdcl PHP(4,3) — 12 vars UNSAT', () => {
    cdcl(F_PHP_4_3, 5000);
  });

  bench('cdcl PHP(5,4) — 20 vars UNSAT', () => {
    cdcl(F_PHP_5_4, 10000);
  });
});

describe('CDCL: Implication chains', () => {
  bench('cdcl implication chain 100 (SAT)', () => {
    cdcl(F_IMP_SAT, 5000);
  });

  bench('cdcl implication chain 100 (UNSAT)', () => {
    cdcl(F_IMP_UNSAT, 5000);
  });
});

describe('CDCL vs Legacy DPLL: 3-SAT medium', () => {
  bench('cdcl 3-SAT medium', () => {
    cdcl(F_3SAT_MED, 5000);
  });

  bench('dpllLegacy 3-SAT medium', () => {
    dpllLegacy(F_3SAT_MED, 5000);
  });
});
