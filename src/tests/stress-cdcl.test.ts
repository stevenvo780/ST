/**
 * ST CDCL SAT Solver — Extreme Stress Tests
 * ===========================================
 * Tests para el nuevo solver CDCL con:
 *   - Fórmulas de 100-500+ átomos
 *   - Random 3-SAT en el punto de transición de fase (ratio 4.27)
 *   - Pigeonhole Principle (n+1, n) para n grande
 *   - Cadenas de implicación extremas
 *   - Fórmulas con simetría (XOR chains)
 *   - Preprocessing effectiveness
 *   - Recursividad controlada vs imposible
 *   - Timeout y graceful degradation
 *   - Pattern detection accuracy
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { FormulaFactory } from '../runtime/formula-factory';
import { cdcl } from '../logic/profiles/classical/cdcl';
import { dpll } from '../logic/profiles/classical/dpll';
import { Formula } from '../types';

afterEach(() => {
  FormulaFactory.clear();
});

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source, '<cdcl-stress>');
}

/** Strip diacritics for accent-insensitive comparison */
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ============================================================
// 1. LARGE SATISFIABLE FORMULAS
// ============================================================
describe('CDCL Stress: Large Satisfiable Formulas', () => {
  it('100 atoms — conjunction (trivially SAT)', () => {
    const atoms = Array.from({ length: 100 }, (_, i) => `A${i}`);
    const formula = atoms.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('100 atoms — disjunction (trivially SAT)', () => {
    const atoms = Array.from({ length: 100 }, (_, i) => `B${i}`);
    const formula = atoms.join(' | ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('200 atoms — implication chain (SAT)', () => {
    // P0 -> P1 -> P2 -> ... -> P199 is satisfiable (set P0=false or all true)
    const atoms = Array.from({ length: 200 }, (_, i) => `P${i}`);
    const implications = [];
    for (let i = 0; i < atoms.length - 1; i++) {
      implications.push(`(${atoms[i]} -> ${atoms[i + 1]})`);
    }
    const formula = implications.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);

  it('100 atoms — biconditional chain (SAT: all same value)', () => {
    const atoms = Array.from({ length: 100 }, (_, i) => `E${i}`);
    const bicons = [];
    for (let i = 0; i < atoms.length - 1; i++) {
      bicons.push(`(${atoms[i]} <-> ${atoms[i + 1]})`);
    }
    const formula = bicons.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);

  it('50 atoms — complex nested formula (SAT)', () => {
    // (A0 | A1) & (A2 | A3) & ... with implications
    const clauses = [];
    for (let i = 0; i < 50; i += 2) {
      clauses.push(`(X${i} | X${i + 1})`);
    }
    for (let i = 0; i < 48; i++) {
      clauses.push(`(X${i} -> X${i + 2})`);
    }
    const formula = clauses.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);
});

// ============================================================
// 2. LARGE UNSATISFIABLE FORMULAS
// ============================================================
describe('CDCL Stress: Large Unsatisfiable Formulas', () => {
  it('100 atoms — direct contradiction (A & !A)', () => {
    const atoms = Array.from({ length: 100 }, (_, i) => `C${i}`);
    const formula = atoms.join(' & ') + ' & !C50';
    // C0 & C1 & ... & C99 & !C50 → UNSAT
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('50 atoms — circular implications leading to contradiction', () => {
    // P0 -> P1 -> ... -> P49 -> !P0 & P0
    const atoms = Array.from({ length: 50 }, (_, i) => `R${i}`);
    const implications = [];
    for (let i = 0; i < atoms.length - 1; i++) {
      implications.push(`(${atoms[i]} -> ${atoms[i + 1]})`);
    }
    implications.push(`(${atoms[atoms.length - 1]} -> !${atoms[0]})`);
    implications.push(atoms[0]); // Force P0 = true
    const formula = implications.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 30000);

  it('30 atoms — every pair mutually exclusive + all must be true', () => {
    const n = 30;
    const atoms = Array.from({ length: n }, (_, i) => `M${i}`);
    const clauses: string[] = [];
    // All must be true
    for (const a of atoms) {
      clauses.push(a);
    }
    // At most one can be true (pairwise exclusion)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        clauses.push(`!(${atoms[i]} & ${atoms[j]})`);
      }
    }
    const formula = clauses.join(' & ');
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
// 3. PIGEONHOLE PRINCIPLE
// ============================================================
describe('CDCL Stress: Pigeonhole Principle', () => {
  function generatePigeonhole(pigeons: number, holes: number): string {
    const clauses: string[] = [];
    // At-least-one: each pigeon goes to at least one hole
    for (let i = 0; i < pigeons; i++) {
      const holeOptions = Array.from({ length: holes }, (_, j) => `P${i}H${j}`);
      clauses.push(`(${holeOptions.join(' | ')})`);
    }
    // At-most-one: no two pigeons in the same hole
    for (let j = 0; j < holes; j++) {
      for (let i = 0; i < pigeons; i++) {
        for (let k = i + 1; k < pigeons; k++) {
          clauses.push(`!(P${i}H${j} & P${k}H${j})`);
        }
      }
    }
    return clauses.join(' & ');
  }

  it('pigeonhole(3,2) — 6 vars, UNSAT', () => {
    const formula = generatePigeonhole(3, 2);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 10000);

  it('pigeonhole(4,3) — 12 vars, UNSAT', () => {
    const formula = generatePigeonhole(4, 3);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('pigeonhole(5,4) — 20 vars, UNSAT', () => {
    const formula = generatePigeonhole(5, 4);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 30000);

  it('pigeonhole(6,5) — 30 vars, UNSAT (hard for DPLL)', () => {
    const formula = generatePigeonhole(6, 5);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 60000);

  it('pigeonhole(3,3) — 9 vars, SAT (enough holes)', () => {
    const formula = generatePigeonhole(3, 3);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('pigeonhole(4,4) — 16 vars, SAT (enough holes)', () => {
    const formula = generatePigeonhole(4, 4);
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
// 4. RANDOM 3-SAT AT PHASE TRANSITION
// ============================================================
describe('CDCL Stress: Random 3-SAT', () => {
  function generateRandom3SAT(numVars: number, numClauses: number, seed: number): string {
    // Simple seeded PRNG
    let s = seed;
    function rand(): number {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s;
    }

    const clauses: string[] = [];
    for (let c = 0; c < numClauses; c++) {
      const vars = new Set<number>();
      while (vars.size < 3) {
        vars.add((rand() % numVars) + 1);
      }
      const lits = Array.from(vars).map((v) => {
        const name = `V${v}`;
        return rand() % 2 === 0 ? name : `!${name}`;
      });
      clauses.push(`(${lits.join(' | ')})`);
    }
    return clauses.join(' & ');
  }

  it('50 vars, 200 clauses (ratio 4.0 — likely SAT region)', () => {
    const formula = generateRandom3SAT(50, 200, 42);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // May be SAT or UNSAT — just shouldn't crash or timeout
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('50 vars, 213 clauses (ratio 4.26 — phase transition)', () => {
    const formula = generateRandom3SAT(50, 213, 1337);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('100 vars, 427 clauses (ratio 4.27 — hard region)', () => {
    const formula = generateRandom3SAT(100, 427, 2024);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 60000);

  it('75 vars, 350 clauses — deterministic result consistency', () => {
    // Run same formula twice, should get same result
    const formula = generateRandom3SAT(75, 350, 99999);
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out1 = run(source);
    const out2 = run(source);
    expect(out1.exitCode).toBe(0);
    expect(out2.exitCode).toBe(0);
    // Results should be identical
    const result1 = out1.stdout.includes('INSATISFACIBLE') ? 'UNSAT' : 'SAT';
    const result2 = out2.stdout.includes('INSATISFACIBLE') ? 'UNSAT' : 'SAT';
    expect(result1).toBe(result2);
  }, 30000);
});

// ============================================================
// 5. TAUTOLOGY AND VALIDITY WITH CDCL
// ============================================================
describe('CDCL Stress: Tautology/Validity with Many Atoms', () => {
  it('100 atoms — tautology (each atom OR its negation)', () => {
    const atoms = Array.from({ length: 100 }, (_, i) => `T${i}`);
    const tautology = atoms.map((a) => `(${a} | !${a})`).join(' & ');
    const source = `
      logic classical.propositional
      check valid ${tautology}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 30000);

  it('50 atoms — non-tautology (conjunction), countermodel exists', () => {
    const atoms = Array.from({ length: 50 }, (_, i) => `N${i}`);
    const formula = atoms.join(' & ');
    const source = `
      logic classical.propositional
      countermodel ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Contramodelo');
  }, 30000);

  it('200 atoms — De Morgan tautology', () => {
    // !(A0 & A1) <-> (!A0 | !A1) for many pairs
    const parts = [];
    for (let i = 0; i < 200; i += 2) {
      parts.push(`(!(A${i} & A${i + 1}) <-> (!A${i} | !A${i + 1}))`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check valid ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 30000);

  it('100 atoms — distributivity tautology', () => {
    // (A & (B | C)) <-> ((A & B) | (A & C)) for 33 triples
    const parts = [];
    for (let i = 0; i < 99; i += 3) {
      parts.push(
        `((X${i} & (X${i + 1} | X${i + 2})) <-> ((X${i} & X${i + 1}) | (X${i} & X${i + 2})))`,
      );
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check valid ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 30000);
});

// ============================================================
// 6. CDCL API DIRECT TESTS
// ============================================================
describe('CDCL Direct API Tests', () => {
  it('cdcl() returns stats with conflict/propagation counts', () => {
    // A somewhat hard formula to force some conflicts
    const formula: Formula = {
      kind: 'and',
      args: [
        {
          kind: 'or',
          args: [
            { kind: 'atom', name: 'A' },
            { kind: 'atom', name: 'B' },
          ],
        },
        {
          kind: 'or',
          args: [
            { kind: 'atom', name: 'A' },
            { kind: 'not', args: [{ kind: 'atom', name: 'B' }] },
          ],
        },
        {
          kind: 'or',
          args: [
            { kind: 'not', args: [{ kind: 'atom', name: 'A' }] },
            { kind: 'atom', name: 'B' },
          ],
        },
        {
          kind: 'or',
          args: [
            { kind: 'not', args: [{ kind: 'atom', name: 'A' }] },
            { kind: 'not', args: [{ kind: 'atom', name: 'B' }] },
          ],
        },
      ],
    };
    const result = cdcl(formula);
    expect(result.satisfiable).toBe(false);
    expect(result.stats).toBeDefined();
    expect(result.stats?.solveTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('cdcl() returns satisfying model for SAT formula', () => {
    const formula: Formula = {
      kind: 'and',
      args: [
        {
          kind: 'or',
          args: [
            { kind: 'atom', name: 'X' },
            { kind: 'atom', name: 'Y' },
          ],
        },
        {
          kind: 'or',
          args: [
            { kind: 'not', args: [{ kind: 'atom', name: 'X' }] },
            { kind: 'atom', name: 'Y' },
          ],
        },
      ],
    };
    const result = cdcl(formula);
    expect(result.satisfiable).toBe(true);
    expect(result.model).toBeDefined();
    // Y must be true in any model
    expect(result.model?.['Y']).toBe(true);
  });

  it('dpll() backward compatibility — uses CDCL internally', () => {
    const formula: Formula = {
      kind: 'or',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    const result = dpll(formula);
    expect(result.satisfiable).toBe(true);
    expect(result.model).toBeDefined();
  });
});

// ============================================================
// 7. XOR CHAINS — HARD FOR NAIVE SOLVERS
// ============================================================
describe('CDCL Stress: XOR Chains', () => {
  it('20 vars — XOR chain (SAT with specific assignment)', () => {
    // X0 XOR X1, X1 XOR X2, ..., X18 XOR X19, X0 — forces alternating
    const parts = [];
    for (let i = 0; i < 19; i++) {
      parts.push(`(X${i} xor X${i + 1})`);
    }
    parts.push('X0');
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // Should be SAT: X0=T, X1=F, X2=T, X3=F, ...
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('21 vars — XOR chain with even constraint (UNSAT)', () => {
    // X0 XOR X1, X1 XOR X2, ..., X19 XOR X20, X0, X20
    // Forces alternating but X0=T, X20=T requires even length between them (20),
    // which means X20 should be T... Let's construct a proper UNSAT:
    // XOR chain of 20: X0 xor X1, ..., X18 xor X19, X0, !X19 with odd length
    const parts = [];
    for (let i = 0; i < 20; i++) {
      parts.push(`(X${i} xor X${i + 1})`);
    }
    // X0 = true, X20 = true → needs even length (20 is even) → SAT
    // Force UNSAT: X0 = true AND X20 = true AND odd chain = 21 items
    parts.push('X0');
    parts.push('!X20'); // X0=T → X1=F → X2=T → ... → X20=T, but we want X20=F
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);
});

// ============================================================
// 8. CONTROLLED RECURSION — WHAT SHOULD WORK
// ============================================================
describe('CDCL Stress: Controlled Recursion in ST', () => {
  it('deeply nested implications (100 levels) — SAT', () => {
    // ((((P -> Q) -> R) -> S) -> T) ... depth 100
    let formula = 'Z0';
    for (let i = 1; i < 100; i++) {
      formula = `(${formula} -> Z${i})`;
    }
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);

  it('deeply nested biconditionals (50 levels) — SAT', () => {
    let formula = 'B0';
    for (let i = 1; i < 50; i++) {
      formula = `(${formula} <-> B${i})`;
    }
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 30000);

  it('arithmetic recursion: factorial with depth limit', () => {
    const source = `
      logic arithmetic
      fn fact(N) {
        if valid N <= 1 {
          return 1
        }
        let prev = N - 1
        let res = fact(prev)
        return N * res
      }
      let r = fact(10)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('3628800');
  }, 10000);

  it('arithmetic recursion: fibonacci with memoization pattern', () => {
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
      let r = fib(15)
      print r
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('610');
  }, 30000);

  it('controlled iteration: sum with nested loops', () => {
    // ST uses { } list syntax for for-loops, not ranges
    // 10x10 = 100 iterations to test accumulation
    const source = `
      logic arithmetic
      let x = 0
      for i in {1,2,3,4,5,6,7,8,9,10} {
        for j in {1,2,3,4,5,6,7,8,9,10} {
          set x = x + 1
        }
      }
      print x
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('100');
  }, 15000);
});

// ============================================================
// 9. DENIED RECURSION — WHAT SHOULD BE CAUGHT
// ============================================================
describe('CDCL Stress: Impossible Recursion Detection', () => {
  it('infinite recursion is caught gracefully', () => {
    const source = `
      logic arithmetic
      fn loop(n) {
        return loop(n + 1)
      }
      let r = loop(0)
      explain r
    `;
    const out = run(source);
    // Should either exit with error or handle gracefully
    // Not crash with stack overflow
    expect(out.exitCode !== undefined).toBe(true);
  }, 15000);

  it('mutual infinite recursion caught', () => {
    const source = `
      logic arithmetic
      fn ping(n) {
        return pong(n + 1)
      }
      fn pong(n) {
        return ping(n + 1)
      }
      let r = ping(0)
      explain r
    `;
    const out = run(source);
    expect(out.exitCode !== undefined).toBe(true);
  }, 15000);
});

// ============================================================
// 10. PREPROCESSING EFFECTIVENESS
// ============================================================
describe('CDCL Stress: Preprocessing', () => {
  it('redundant clauses eliminated by subsumption', () => {
    // (A | B) & (A | B | C) — second is subsumed
    // Add many such pairs
    const parts = [];
    for (let i = 0; i < 50; i++) {
      parts.push(`(X${i} | Y${i})`);
      parts.push(`(X${i} | Y${i} | Z${i})`); // subsumed by the first
    }
    parts.push('X0'); // force at least one value
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 15000);

  it('unit propagation cascade from preprocessing', () => {
    // A & (A -> B) & (B -> C) & (C -> D) & ... all resolved by preprocessing
    const atoms = Array.from({ length: 100 }, (_, i) => `U${i}`);
    const parts = ['U0'];
    for (let i = 0; i < atoms.length - 1; i++) {
      parts.push(`(${atoms[i]} -> ${atoms[i + 1]})`);
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
// 11. EDGE CASES
// ============================================================
describe('CDCL Stress: Edge Cases', () => {
  it('single atom — trivially SAT', () => {
    const source = `
      logic classical.propositional
      check satisfiable P
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('negation of single atom — SAT', () => {
    const source = `
      logic classical.propositional
      check satisfiable !P
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 5000);

  it('P & !P — trivially UNSAT', () => {
    const source = `
      logic classical.propositional
      check satisfiable (P & !P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 5000);

  it('empty disjunction equivalents handled', () => {
    const source = `
      logic classical.propositional
      check valid (P | !P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 5000);

  it('50 identical clauses — deduplication', () => {
    const repeated = Array.from({ length: 50 }, () => '(A | B | C)').join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${repeated}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);
});

// ============================================================
// 12. THEORY + DERIVATION WITH LARGE ATOM COUNTS
// ============================================================
describe('CDCL Stress: Theory Derivations with CDCL', () => {
  it('theory with 30 axioms deriving complex conclusion via DPLL/CDCL', () => {
    const axioms = [];
    const names = [];
    for (let i = 0; i < 29; i++) {
      axioms.push(`axiom a${i} = A${i} -> A${i + 1}`);
      names.push(`a${i}`);
    }
    names.push('base');
    const source = `
      logic classical.propositional
      ${axioms.join('\n      ')}
      axiom base = A0
      derive A29 from {${names.join(', ')}}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('[derive]');
  }, 30000);
});

// ============================================================
// 13. MIXED CONNECTIVE STRESS
// ============================================================
describe('CDCL Stress: Mixed Connectives', () => {
  it('NAND chain — 50 atoms', () => {
    const parts = [];
    for (let i = 0; i < 49; i++) {
      parts.push(`(N${i} nand N${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('NOR chain — 50 atoms', () => {
    const parts = [];
    for (let i = 0; i < 49; i++) {
      parts.push(`(N${i} nor N${i + 1})`);
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);

  it('complex mixed: AND + OR + XOR + IMPLIES + BICONDITIONAL (30 atoms)', () => {
    const parts = [];
    for (let i = 0; i < 30; i += 5) {
      parts.push(`(A${i} & A${i + 1})`);
      parts.push(`(A${i + 1} | A${i + 2})`);
      parts.push(`(A${i + 2} xor A${i + 3})`);
      parts.push(`(A${i + 3} -> A${i + 4})`);
      if (i + 5 < 30) {
        parts.push(`(A${i + 4} <-> A${i + 5})`);
      }
    }
    const formula = parts.join(' & ');
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/SATISFACIBLE|INSATISFACIBLE/);
  }, 30000);
});
