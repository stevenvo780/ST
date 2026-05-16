/**
 * CDCL v2 vs v1 — Benchmark comparativo.
 * Operamos directamente sobre cláusulas CNF en formato Int32Array para
 * aislar el rendimiento del solver del overhead del encoder Tseitin.
 *
 * Las instancias 3-SAT usan Mulberry32 con seeds fijos → resultados deterministas.
 */
import { bench, describe } from 'vitest';
import { solveCDCLv2 } from '../src/solver/cdcl-v2';
import { cdcl as cdclV1 } from '../src/profiles/classical/cdcl';
import type { Formula } from '../src/types';

// ── PRNG determinista ─────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Generadores de instancias en formato dual ─────────────────

interface DualInstance {
  /** Cláusulas en formato Int32Array para v2. */
  rawClauses: Int32Array[];
  /** Misma instancia como Formula AST para v1 (cdcl(Formula)). */
  formula: Formula;
  numVars: number;
}

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

function rawClauseToFormula(c: Int32Array): Formula {
  const lits: Formula[] = [];
  for (let i = 0; i < c.length; i++) {
    const l = c[i] ?? 0;
    const name = `V${Math.abs(l)}`;
    lits.push(l > 0 ? atom(name) : not(atom(name)));
  }
  return lits.reduce((a, b) => or(a, b));
}

function clausesToFormula(clauses: Int32Array[]): Formula {
  return clauses.map(rawClauseToFormula).reduce((a, b) => and(a, b));
}

function gen3SAT(vars: number, numClauses: number, seed: number): DualInstance {
  const r = mulberry32(seed);
  const rawClauses: Int32Array[] = [];
  for (let i = 0; i < numClauses; i++) {
    const used = new Set<number>();
    const lits: number[] = [];
    while (lits.length < 3) {
      const v = Math.floor(r() * vars) + 1;
      if (used.has(v)) continue;
      used.add(v);
      lits.push(r() < 0.5 ? -v : v);
    }
    rawClauses.push(new Int32Array(lits));
  }
  return { rawClauses, formula: clausesToFormula(rawClauses), numVars: vars };
}

function genPHP(p: number, h: number): DualInstance {
  const id = (pigeon: number, hole: number): number => (pigeon - 1) * h + hole;
  const clauses: Int32Array[] = [];
  for (let pp = 1; pp <= p; pp++) {
    const lits: number[] = [];
    for (let hh = 1; hh <= h; hh++) lits.push(id(pp, hh));
    clauses.push(new Int32Array(lits));
  }
  for (let hh = 1; hh <= h; hh++) {
    for (let p1 = 1; p1 <= p; p1++) {
      for (let p2 = p1 + 1; p2 <= p; p2++) {
        clauses.push(new Int32Array([-id(p1, hh), -id(p2, hh)]));
      }
    }
  }
  return { rawClauses: clauses, formula: clausesToFormula(clauses), numVars: p * h };
}

// ── Instancias pre-construidas ────────────────────────────────

const I_3SAT_SMALL = gen3SAT(30, 128, 42);
const I_3SAT_MED = gen3SAT(50, 214, 42);
const I_3SAT_LARGE = gen3SAT(80, 342, 777);
const I_PHP_4_3 = genPHP(4, 3);
const I_PHP_5_4 = genPHP(5, 4);
const I_3SAT_SAT = gen3SAT(40, 100, 1);

// ── Benchmarks ────────────────────────────────────────────────

describe('CDCL v1 vs v2 — 3-SAT small (30 vars / 128 clauses)', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_3SAT_SMALL.formula, 5000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_3SAT_SMALL.rawClauses, I_3SAT_SMALL.numVars, { timeoutMs: 5000 });
  });
});

describe('CDCL v1 vs v2 — 3-SAT medium (50 vars / 214 clauses, phase transition)', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_3SAT_MED.formula, 5000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_3SAT_MED.rawClauses, I_3SAT_MED.numVars, { timeoutMs: 5000 });
  });
});

describe('CDCL v1 vs v2 — 3-SAT large (80 vars / 342 clauses)', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_3SAT_LARGE.formula, 10000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_3SAT_LARGE.rawClauses, I_3SAT_LARGE.numVars, { timeoutMs: 10000 });
  });
});

describe('CDCL v1 vs v2 — 3-SAT satisfiable (40 vars / 100 clauses)', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_3SAT_SAT.formula, 5000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_3SAT_SAT.rawClauses, I_3SAT_SAT.numVars, { timeoutMs: 5000 });
  });
});

describe('CDCL v1 vs v2 — PHP(4,3) UNSAT', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_PHP_4_3.formula, 5000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_PHP_4_3.rawClauses, I_PHP_4_3.numVars, { timeoutMs: 5000 });
  });
});

describe('CDCL v1 vs v2 — PHP(5,4) UNSAT', () => {
  bench('v1 cdcl()', () => {
    cdclV1(I_PHP_5_4.formula, 10000);
  });
  bench('v2 solveCDCLv2()', () => {
    solveCDCLv2(I_PHP_5_4.rawClauses, I_PHP_5_4.numVars, { timeoutMs: 10000 });
  });
});
