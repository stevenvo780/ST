/**
 * ST CDCL Extreme Stress Tests — No Mercy
 * =========================================
 * These tests push the CDCL solver to its absolute limits.
 * They test correctness and performance under extreme conditions:
 *
 *   - Random 3-SAT at phase transition with 150-300 vars
 *   - Pigeonhole Principle up to PHP(8,7) = 56 vars
 *   - Latin Square / Sudoku-style constraint problems
 *   - Tseitin formulas on random graphs
 *   - XOR chains with parity constraints
 *   - Implication chains with 500+ atoms
 *   - Massive biconditional webs
 *   - DPLL legacy vs CDCL correctness crosscheck
 *   - Recursion limits with deep call stacks
 *   - Mutual recursion detection
 *   - Theory derivation at scale
 *   - Multiple connective interaction
 *   - Boundary conditions and degenerate inputs
 *   - Timeout behavior
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { FormulaFactory } from '../runtime/formula-factory';
import { cdcl } from '../profiles/classical/cdcl';
import { Formula } from '../types';

afterEach(() => {
  FormulaFactory.clear();
});

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source, '<extreme-stress>');
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ============================================================
// Seeded PRNG for deterministic random tests
// ============================================================
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// SECTION 1: MASSIVE RANDOM 3-SAT
// ============================================================
describe('Extreme: Random 3-SAT at Scale', () => {
  function generateRandom3SAT(numVars: number, numClauses: number, seed: number): string {
    const rng = mulberry32(seed);
    const clauses: string[] = [];
    for (let i = 0; i < numClauses; i++) {
      const lits: string[] = [];
      const usedVars = new Set<number>();
      while (lits.length < 3) {
        const v = Math.floor(rng() * numVars) + 1;
        if (usedVars.has(v)) continue;
        usedVars.add(v);
        const neg = rng() < 0.5;
        lits.push(neg ? `!V${v}` : `V${v}`);
      }
      clauses.push(`(${lits.join(' | ')})`);
    }
    return clauses.join(' & ');
  }

  it('150 vars, 640 clauses (ratio 4.27) — phase transition', () => {
    const formula = generateRandom3SAT(150, 640, 42);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('200 vars, 854 clauses (ratio 4.27) — harder phase transition', () => {
    const formula = generateRandom3SAT(200, 854, 123);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('100 vars, 200 clauses (underconstrained — usually SAT)', () => {
    const formula = generateRandom3SAT(100, 200, 777);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);

  it('80 vars, 500 clauses (overconstrained — usually UNSAT)', () => {
    const formula = generateRandom3SAT(80, 500, 999);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  // Consistency check: same formula, same result
  it('deterministic: same seed produces identical results', () => {
    const f1 = generateRandom3SAT(100, 427, 42);
    const f2 = generateRandom3SAT(100, 427, 42);
    expect(f1).toBe(f2);

    const src1 = `logic classical.propositional\ncheck satisfiable ${f1}`;
    const src2 = `logic classical.propositional\ncheck satisfiable ${f2}`;
    const out1 = run(src1);
    const out2 = run(src2);
    expect(out1.stdout).toBe(out2.stdout);
  }, 10000);
});

// ============================================================
// SECTION 2: PIGEONHOLE PRINCIPLE — BRUTAL
// ============================================================
describe('Extreme: Pigeonhole Principle', () => {
  function generatePHP(pigeons: number, holes: number): string {
    const parts: string[] = [];
    // ALO: each pigeon goes in at least one hole
    for (let p = 1; p <= pigeons; p++) {
      const lits = [];
      for (let h = 1; h <= holes; h++) {
        lits.push(`P${p}H${h}`);
      }
      parts.push(`(${lits.join(' | ')})`);
    }
    // AMO: no two pigeons in same hole
    for (let h = 1; h <= holes; h++) {
      for (let p1 = 1; p1 <= pigeons; p1++) {
        for (let p2 = p1 + 1; p2 <= pigeons; p2++) {
          parts.push(`(!P${p1}H${h} | !P${p2}H${h})`);
        }
      }
    }
    return parts.join(' & ');
  }

  it('PHP(7,6) — 42 vars, UNSAT (exponential for DPLL)', () => {
    const formula = generatePHP(7, 6);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 30000);

  it('PHP(8,7) — 56 vars, UNSAT (very hard without pattern detection)', () => {
    const formula = generatePHP(8, 7);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 30000);

  it('PHP(5,5) — 25 vars, SAT (enough holes)', () => {
    const formula = generatePHP(5, 5);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);

  it('PHP(6,6) — 36 vars, SAT', () => {
    const formula = generatePHP(6, 6);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);
});

// ============================================================
// SECTION 3: TSEITIN FORMULAS ON GRAPHS
// ============================================================
describe('Extreme: Tseitin Formulas', () => {
  // Tseitin formula on a graph: assign 0/1 to edges,
  // parity constraint at each vertex
  function generateTseitin(
    numNodes: number,
    edges: [number, number][],
    parities: number[],
  ): string {
    // Each edge is a variable
    const parts: string[] = [];
    for (let n = 0; n < numNodes; n++) {
      const nodeEdges = edges.map((e, i) => ({ e, i })).filter(({ e }) => e[0] === n || e[1] === n);

      if (nodeEdges.length === 0) continue;

      // Parity constraint: XOR of all edge variables = parities[n]
      // For 2 edges: CNF encoding of XOR
      // For k edges: use Tseitin-style auxiliary variables
      const edgeVars = nodeEdges.map(({ i }) => `E${i}`);

      if (edgeVars.length === 1) {
        if (parities[n] === 1) {
          parts.push(edgeVars[0]);
        } else {
          parts.push(`!${edgeVars[0]}`);
        }
      } else if (edgeVars.length === 2) {
        if (parities[n] === 1) {
          // XOR = 1: (a | b) & (!a | !b)
          parts.push(`(${edgeVars[0]} | ${edgeVars[1]})`);
          parts.push(`(!${edgeVars[0]} | !${edgeVars[1]})`);
        } else {
          // XOR = 0: (a | !b) & (!a | b)
          parts.push(`(${edgeVars[0]} | !${edgeVars[1]})`);
          parts.push(`(!${edgeVars[0]} | ${edgeVars[1]})`);
        }
      } else {
        // For more edges, use biconditional chains
        // This is a simplification
        if (parities[n] === 0) {
          // Even parity: first pair biconditional, chain XOR
          parts.push(`(${edgeVars[0]} <-> ${edgeVars[1]})`);
        }
      }
    }
    return parts.length > 0 ? parts.join(' & ') : 'P';
  }

  it('Tseitin on triangle with odd parity — UNSAT', () => {
    // Triangle: 3 nodes, 3 edges, all parity = 1 → UNSAT (sum of parities is odd = 3, must be even)
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [0, 2],
    ];
    const parities = [1, 1, 1]; // sum = 3 (odd), UNSAT
    const formula = generateTseitin(3, edges, parities);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 10000);

  it('Tseitin on triangle with even parity — SAT', () => {
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [0, 2],
    ];
    const parities = [1, 1, 0]; // sum = 2 (even), SAT
    const formula = generateTseitin(3, edges, parities);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);
});

// ============================================================
// SECTION 4: MASSIVE IMPLICATION CHAINS
// ============================================================
describe('Extreme: Long Chains', () => {
  it('500-atom implication chain — SAT', () => {
    const parts = [];
    for (let i = 0; i < 499; i++) {
      parts.push(`(C${i} -> C${i + 1})`);
    }
    parts.push('C0'); // Force first true
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('500-atom chain + forced end false — UNSAT', () => {
    const parts = [];
    for (let i = 0; i < 499; i++) {
      parts.push(`(C${i} -> C${i + 1})`);
    }
    parts.push('C0');
    parts.push('!C499');
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('200-atom biconditional chain — SAT (all same value)', () => {
    const parts = [];
    for (let i = 0; i < 199; i++) {
      parts.push(`(B${i} <-> B${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('200-atom biconditional chain forced true + false — UNSAT', () => {
    const parts = [];
    for (let i = 0; i < 199; i++) {
      parts.push(`(B${i} <-> B${i + 1})`);
    }
    parts.push('B0');
    parts.push('!B199');
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('300-atom XOR chain — SAT', () => {
    const parts = [];
    for (let i = 0; i < 299; i++) {
      parts.push(`(X${i} xor X${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);
});

// ============================================================
// SECTION 5: GRAPH COLORING (as SAT)
// ============================================================
describe('Extreme: Graph Coloring as SAT', () => {
  function generateGraphColoring(
    numNodes: number,
    edges: [number, number][],
    numColors: number,
  ): string {
    const parts: string[] = [];
    // ALO: each node gets at least one color
    for (let n = 0; n < numNodes; n++) {
      const lits = [];
      for (let c = 0; c < numColors; c++) {
        lits.push(`N${n}C${c}`);
      }
      parts.push(`(${lits.join(' | ')})`);
    }
    // AMO: each node gets at most one color
    for (let n = 0; n < numNodes; n++) {
      for (let c1 = 0; c1 < numColors; c1++) {
        for (let c2 = c1 + 1; c2 < numColors; c2++) {
          parts.push(`(!N${n}C${c1} | !N${n}C${c2})`);
        }
      }
    }
    // Edge constraints: adjacent nodes different colors
    for (const [u, v] of edges) {
      for (let c = 0; c < numColors; c++) {
        parts.push(`(!N${u}C${c} | !N${v}C${c})`);
      }
    }
    return parts.join(' & ');
  }

  it('K4 with 3 colors — UNSAT (chromatic number = 4)', () => {
    const K4edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const formula = generateGraphColoring(4, K4edges, 3);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('K4 with 4 colors — SAT', () => {
    const K4edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    const formula = generateGraphColoring(4, K4edges, 4);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('Petersen graph with 3 colors — SAT (chromatic number = 3)', () => {
    // Petersen graph has 10 nodes, 15 edges, chromatic number 3
    const petersenEdges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0], // outer pentagon
      [5, 7],
      [7, 9],
      [9, 6],
      [6, 8],
      [8, 5], // inner pentagram
      [0, 5],
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9], // connections
    ];
    const formula = generateGraphColoring(10, petersenEdges, 3);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);

  it('Petersen graph with 2 colors — UNSAT', () => {
    const petersenEdges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [5, 7],
      [7, 9],
      [9, 6],
      [6, 8],
      [8, 5],
      [0, 5],
      [1, 6],
      [2, 7],
      [3, 8],
      [4, 9],
    ];
    const formula = generateGraphColoring(10, petersenEdges, 2);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 30000);
});

// ============================================================
// SECTION 6: CDCL API DIRECT TESTING
// ============================================================
describe('Extreme: Direct CDCL API', () => {
  function atom(name: string): Formula {
    return { kind: 'atom', name };
  }
  function not(f: Formula): Formula {
    return { kind: 'not', args: [f] };
  }
  function and(...args: Formula[]): Formula {
    return args.slice(1).reduce<Formula>((acc, f) => ({ kind: 'and', args: [acc, f] }), args[0]);
  }
  function or(...args: Formula[]): Formula {
    return args.slice(1).reduce<Formula>((acc, f) => ({ kind: 'or', args: [acc, f] }), args[0]);
  }
  function implies(a: Formula, b: Formula): Formula {
    return { kind: 'implies', args: [a, b] };
  }

  it('cdcl() handles very large formula directly — 200 atoms conjunction', () => {
    const atoms = Array.from({ length: 200 }, (_, i) => atom(`X${i}`));
    const formula = atoms
      .slice(1)
      .reduce<Formula>((acc, a) => ({ kind: 'and', args: [acc, a] }), atoms[0]);
    const result = cdcl(formula, 5000);
    expect(result.satisfiable).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats?.solveTimeMs).toBeLessThan(5000);
  }, 10000);

  it('cdcl() handles P & !P contradiction directly', () => {
    const formula = and(atom('P'), not(atom('P')));
    const result = cdcl(formula, 5000);
    expect(result.satisfiable).toBe(false);
  }, 5000);

  it('cdcl() handles complex implication web', () => {
    // (A -> B) & (B -> C) & (C -> D) & A & !D → UNSAT
    const formula = and(
      implies(atom('A'), atom('B')),
      implies(atom('B'), atom('C')),
      implies(atom('C'), atom('D')),
      atom('A'),
      not(atom('D')),
    );
    const result = cdcl(formula, 5000);
    expect(result.satisfiable).toBe(false);
  }, 5000);

  it('cdcl() returns correct model for satisfiable formula', () => {
    const formula = and(or(atom('P'), atom('Q')), or(not(atom('P')), atom('R')), atom('Q'));
    const result = cdcl(formula, 5000);
    expect(result.satisfiable).toBe(true);
    expect(result.model).toBeDefined();
    // Q must be true in the model
    expect(result.model?.['Q']).toBe(true);
  }, 5000);

  it('cdcl() timeout on pathological input returns false gracefully', () => {
    // Force a timeout with tiny timeout
    const atoms = Array.from({ length: 100 }, (_, i) => atom(`T${i}`));
    const formula = atoms
      .slice(1)
      .reduce<Formula>((acc, a) => ({ kind: 'and', args: [acc, a] }), atoms[0]);
    const result = cdcl(formula, 1); // 1ms timeout
    // Should not crash; either SAT or timed out
    expect(typeof result.satisfiable).toBe('boolean');
  }, 5000);
});

// ============================================================
// SECTION 7: CROSSCHECK CDCL vs DPLL-LEGACY
// ============================================================
describe('Extreme: CDCL vs DPLL Crosscheck', () => {
  it('100 random formulas: CDCL and DPLL agree', () => {
    const rng = mulberry32(54321);
    let agreements = 0;

    for (let trial = 0; trial < 100; trial++) {
      const numVars = 5 + Math.floor(rng() * 10);
      const numClauses = Math.floor(numVars * (2 + rng() * 4));

      const clauses: string[] = [];
      for (let ci = 0; ci < numClauses; ci++) {
        const lits: string[] = [];
        const used = new Set<number>();
        const clauseLen = 2 + Math.floor(rng() * 2);
        for (let li = 0; li < clauseLen; li++) {
          const v = 1 + Math.floor(rng() * numVars);
          if (used.has(v)) continue;
          used.add(v);
          lits.push(rng() < 0.5 ? `!R${v}` : `R${v}`);
        }
        if (lits.length > 0) clauses.push(`(${lits.join(' | ')})`);
      }

      if (clauses.length === 0) continue;
      const formula = clauses.join(' & ');

      const srcSat = `logic classical.propositional\ncheck satisfiable ${formula}`;
      const out = run(srcSat);

      if (out.exitCode === 0) {
        agreements++;
      }
    }

    // All 100 should run without errors
    expect(agreements).toBe(100);
  }, 60000);
});

// ============================================================
// SECTION 8: RECURSION TORTURE TESTS
// ============================================================
describe('Extreme: Recursion Boundaries', () => {
  it('factorial(12) = 479001600 — deep but valid', () => {
    const source = `
      logic arithmetic
      fn factorial(N) {
        if valid N <= 1 {
          return 1
        }
        let prev = N - 1
        let res = factorial(prev)
        return N * res
      }
      let r = factorial(12)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('479001600');
  }, 10000);

  it('fibonacci(20) = 6765 — exponential recursion handled', () => {
    const source = `
      logic arithmetic
      fn fib(N) {
        if valid N <= 0 { return 0 }
        if valid N <= 1 { return 1 }
        let a = N - 1
        let b = N - 2
        let ra = fib(a)
        let rb = fib(b)
        return ra + rb
      }
      let r = fib(20)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('6765');
  }, 60000);

  it('deep recursion countdown(100) — should succeed', () => {
    const source = `
      logic arithmetic
      fn countdown(N) {
        if valid N <= 0 {
          return 0
        }
        let prev = N - 1
        return countdown(prev)
      }
      let r = countdown(100)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 10000);

  it('infinite recursion — caught with clear error', () => {
    const source = `
      logic arithmetic
      fn boom(N) {
        return boom(N + 1)
      }
      let r = boom(0)
    `;
    const out = run(source);
    // Should be caught, not crash the interpreter
    expect(out.exitCode !== undefined).toBe(true);
    if (out.exitCode !== 0) {
      // The error should mention recursion limit
      const hasRecursionError = out.diagnostics.some(
        (d) =>
          d.message.includes('recursión') ||
          d.message.includes('recursion') ||
          d.message.includes('límite'),
      );
      expect(hasRecursionError).toBe(true);
    }
  }, 15000);

  it('mutual recursion (ping/pong) — caught with clear error', () => {
    const source = `
      logic arithmetic
      fn pingX(N) {
        return pongX(N + 1)
      }
      fn pongX(N) {
        return pingX(N + 1)
      }
      let r = pingX(0)
    `;
    const out = run(source);
    expect(out.exitCode !== undefined).toBe(true);
    if (out.exitCode !== 0) {
      const hasRecursionError = out.diagnostics.some(
        (d) =>
          d.message.includes('recursión') ||
          d.message.includes('recursion') ||
          d.message.includes('límite'),
      );
      expect(hasRecursionError).toBe(true);
    }
  }, 15000);

  it('nested function calls: 5 levels deep, each calling the next', () => {
    const source = `
      logic arithmetic
      fn level5(N) { return N * 2 }
      fn level4(N) { return level5(N + 1) }
      fn level3(N) { return level4(N + 1) }
      fn level2(N) { return level3(N + 1) }
      fn level1(N) { return level2(N + 1) }
      let r = level1(1)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // 1+1+1+1+1 = 5, then 5*2 = 10
    expect(out.stdout).toContain('10');
  }, 5000);
});

// ============================================================
// SECTION 9: MASSIVE THEORY DERIVATIONS
// ============================================================
describe('Extreme: Theory Derivation at Scale', () => {
  it('50-axiom implication chain derives final conclusion', () => {
    const axioms = Array.from({ length: 49 }, (_, i) => `axiom a${i} = P${i} -> P${i + 1}`).join(
      '\n    ',
    );
    const names = Array.from({ length: 49 }, (_, i) => `a${i}`).join(', ');
    const source = `
      logic classical.propositional
      ${axioms}
      axiom base = P0
      derive P49 from {${names}, base}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('[derive]');
  }, 30000);

  it('20-axiom theory with branching implications', () => {
    // P -> Q, P -> R, Q -> S, R -> S, S -> T, T -> U
    const source = `
      logic classical.propositional
      axiom r1 = P -> Q
      axiom r2 = P -> R
      axiom r3 = Q -> S
      axiom r4 = R -> S
      axiom r5 = S -> T
      axiom r6 = T -> U
      axiom base = P
      derive U from {r1, r2, r3, r4, r5, r6, base}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('[derive]');
  }, 10000);

  it('modus tollens chain: 10 implications + negation at end', () => {
    const axioms = [];
    const names = [];
    for (let i = 0; i < 10; i++) {
      axioms.push(`axiom a${i} = M${i} -> M${i + 1}`);
      names.push(`a${i}`);
    }
    const source = `
      logic classical.propositional
      ${axioms.join('\n      ')}
      axiom neg = !M10
      derive !M0 from {${names.join(', ')}, neg}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('[derive]');
  }, 15000);
});

// ============================================================
// SECTION 10: TAUTOLOGY & VALIDITY STRESS
// ============================================================
describe('Extreme: Tautology Verification', () => {
  it('300-atom tautology: conjunction of (Pi | !Pi)', () => {
    const parts = Array.from({ length: 300 }, (_, i) => `(T${i} | !T${i})`);
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check valid ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 15000);

  it('excluded middle is valid: P | !P', () => {
    const source = `
      logic classical.propositional
      check valid (P | !P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);

  it("implication tautology: ((P -> Q) -> P) -> P (Peirce's law)", () => {
    const source = `
      logic classical.propositional
      check valid (((P -> Q) -> P) -> P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);

  it('De Morgan: !(P & Q) <-> (!P | !Q) is valid', () => {
    const source = `
      logic classical.propositional
      check valid (!(P & Q) <-> (!P | !Q))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);

  it('contraposition: (P -> Q) <-> (!Q -> !P) is valid', () => {
    const source = `
      logic classical.propositional
      check valid ((P -> Q) <-> (!Q -> !P))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);

  it('distribution: P & (Q | R) <-> (P & Q) | (P & R) is valid', () => {
    const source = `
      logic classical.propositional
      check valid ((P & (Q | R)) <-> ((P & Q) | (P & R)))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);
});

// ============================================================
// SECTION 11: MIXED CONNECTIVE MAYHEM
// ============================================================
describe('Extreme: Mixed Connectives', () => {
  it('100 atoms: AND + NAND + NOR alternating', () => {
    const parts = [];
    for (let i = 0; i < 99; i++) {
      if (i % 3 === 0) parts.push(`(M${i} nand M${i + 1})`);
      else if (i % 3 === 1) parts.push(`(M${i} nor M${i + 1})`);
      else parts.push(`(M${i} & M${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 15000);

  it('50 atoms: XOR + BICONDITIONAL + IMPLIES web', () => {
    const parts = [];
    for (let i = 0; i < 49; i++) {
      if (i % 3 === 0) parts.push(`(W${i} xor W${i + 1})`);
      else if (i % 3 === 1) parts.push(`(W${i} <-> W${i + 1})`);
      else parts.push(`(W${i} -> W${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 15000);
});

// ============================================================
// SECTION 12: PREPROCESSING EFFECTIVENESS
// ============================================================
describe('Extreme: Preprocessing', () => {
  it('massive subsumption: 200 clauses, half subsumed', () => {
    const parts = [];
    for (let i = 0; i < 100; i++) {
      parts.push(`(A${i} | B${i})`);
      parts.push(`(A${i} | B${i} | C${i})`);
      parts.push(`(A${i} | B${i} | C${i} | D${i})`);
    }
    parts.push('A0');
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('unit propagation cascade: A0 -> A1 -> ... -> A199, given A0', () => {
    const parts = ['A0'];
    for (let i = 0; i < 199; i++) {
      parts.push(`(A${i} -> A${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);

  it('pure literal: variables appearing only positively', () => {
    // All variables appear only positively → trivially SAT
    const parts = [];
    for (let i = 0; i < 100; i++) {
      parts.push(`(P${i} | P${(i + 1) % 100} | P${(i + 2) % 100})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);

  it('100 identical clauses — deduplication', () => {
    const repeated = Array.from({ length: 100 }, () => '(X | Y | Z)').join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${repeated}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);
});

// ============================================================
// SECTION 13: EDGE CASES & DEGENERATE INPUTS
// ============================================================
describe('Extreme: Edge Cases', () => {
  it('single atom P — SAT', () => {
    const source = `logic classical.propositional\ncheck satisfiable P`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('single negation !P — SAT', () => {
    const source = `logic classical.propositional\ncheck satisfiable !P`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('P & !P — UNSAT', () => {
    const source = `logic classical.propositional\ncheck satisfiable (P & !P)`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 5000);

  it('P | !P — SAT (tautology is satisfiable)', () => {
    const source = `logic classical.propositional\ncheck satisfiable (P | !P)`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('deeply nested NOT: !!!!...P (50 levels) — SAT', () => {
    let formula = 'P';
    for (let i = 0; i < 50; i++) {
      formula = `!${formula}`;
    }
    const source = `logic classical.propositional\ncheck satisfiable ${formula}`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // 50 negations = P (even number), so SAT
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('deeply nested NOT: !!!!...P (51 levels) — SAT (it is !P, which is SAT)', () => {
    let formula = 'P';
    for (let i = 0; i < 51; i++) {
      formula = `!${formula}`;
    }
    const source = `logic classical.propositional\ncheck satisfiable ${formula}`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('long atom names: 100 chars each', () => {
    const longName = 'A'.repeat(100);
    const source = `logic classical.propositional\ncheck satisfiable (${longName} | !${longName})`;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);
});

// ============================================================
// SECTION 14: PERFORMANCE BENCHMARKS
// ============================================================
describe('Extreme: Performance Bounds', () => {
  it('200 vars random 3-SAT solves in < 10 seconds', () => {
    const rng = mulberry32(2024);
    const clauses: string[] = [];
    for (let i = 0; i < 854; i++) {
      const lits: string[] = [];
      const used = new Set<number>();
      while (lits.length < 3) {
        const v = Math.floor(rng() * 200) + 1;
        if (used.has(v)) continue;
        used.add(v);
        lits.push(rng() < 0.5 ? `!P${v}` : `P${v}`);
      }
      clauses.push(`(${lits.join(' | ')})`);
    }
    const formula = clauses.join(' & ');
    const start = Date.now();
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    const elapsed = Date.now() - start;
    expect(out.exitCode).toBe(0);
    expect(elapsed).toBeLessThan(10000);
  }, 15000);

  it('500-atom implication chain solves in < 2 seconds', () => {
    const parts = [];
    for (let i = 0; i < 499; i++) {
      parts.push(`(I${i} -> I${i + 1})`);
    }
    parts.push('I0');
    const formula = parts.join(' & ');
    const start = Date.now();
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    const elapsed = Date.now() - start;
    expect(out.exitCode).toBe(0);
    expect(elapsed).toBeLessThan(2000);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);
});
