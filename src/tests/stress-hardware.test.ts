/**
 * ST Hardware Stress Tests
 * ========================
 * Objetivo: que muera el PC antes que el lenguaje.
 * Cada test valida que ST maneje cargas extremas sin:
 *   - Stack overflow
 *   - Infinite loops / hangs
 *   - OOM sin control (debe fallar con mensaje, no con crash)
 *   - Resultados incorrectos bajo presión
 *
 * Categorías:
 *   1. Bitset Evaluation (propositional, saturar BigInt)
 *   2. Hash-Consing / DAG (ataque de fórmulas fractales)
 *   3. Tableau Engine (explosión de ramas)
 *   4. FOL (explosión de cuantificadores)
 *   5. Arithmetic (recursión profunda, loops masivos)
 *   6. Belnap (4-valued bitset bajo presión)
 *   7. Multi-profile whiplash (cambios rápidos de perfil)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { FormulaFactory } from '../runtime/formula-factory';

afterEach(() => {
  FormulaFactory.clear();
});

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source, '<stress>');
}

/** Strip diacritics for accent-insensitive comparison */
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ============================================================
// 1. BITSET PROPOSITIONAL — SATURAR EVALUACIÓN VECTORIZADA
// ============================================================
describe('Stress: Bitset Propositional', () => {
  it('20 atoms — maximum truth table materialization (1M rows)', () => {
    const atoms = Array.from({ length: 20 }, (_, i) => `V${i}`);
    const formula = atoms.join(' & ');
    const source = `
      logic classical.propositional
      truth_table ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('valuaciones analizadas');
  }, 30000);

  it('20 atoms — tautology check via bitset (instant)', () => {
    const atoms = Array.from({ length: 20 }, (_, i) => `P${i}`);
    const tautology = atoms.map((a) => `(${a} | !${a})`).join(' & ');
    const source = `
      logic classical.propositional
      check valid ${tautology}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 10000);

  it('26 atoms — validity check without materialization', () => {
    // 2^26 = 67M combinations — bitset should handle this without creating rows
    const atoms = Array.from({ length: 26 }, (_, i) => `X${i}`);
    const tautology = atoms.map((a) => `(${a} | !${a})`).join(' & ');
    const source = `
      logic classical.propositional
      check valid ${tautology}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 15000);

  it('26 atoms — satisfiability (instant contradiction detection)', () => {
    const atoms = Array.from({ length: 26 }, (_, i) => `Z${i}`);
    const contradiction = atoms.map((a) => `(${a} & !${a})`).join(' | ');
    const source = `
      logic classical.propositional
      check satisfiable ${contradiction}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('INSATISFACIBLE');
  }, 15000);

  it('countermodel for non-tautology with 15 atoms (instant)', () => {
    const atoms = Array.from({ length: 15 }, (_, i) => `M${i}`);
    // M0 & M1 & ... & M14 is satisfiable but not a tautology
    const formula = atoms.join(' & ');
    const source = `
      logic classical.propositional
      countermodel ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // Should find a countermodel quickly
  }, 10000);

  it('XOR chain with 14 atoms — complex bitset evaluation', () => {
    const atoms = Array.from({ length: 14 }, (_, i) => `Q${i}`);
    let formula = atoms[0];
    for (let i = 1; i < atoms.length; i++) {
      formula = `(${formula} ^ ${atoms[i]})`;
    }
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);

  it('deeply nested implications (20 levels, bitset fast path)', () => {
    let formula = 'Z';
    for (let i = 0; i < 20; i++) {
      formula = `(P${i} -> ${formula})`;
    }
    const source = `
      logic classical.propositional
      check valid ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);
});

// ============================================================
// 2. HASH-CONSING / DAG — ATAQUE FRACTAL DE FORMULAS
// ============================================================
describe('Stress: Hash-Consing / Formula Sharing', () => {
  it('exponential formula doubling (8 iterations = 4^8 theoretical nodes)', () => {
    // Each iteration quadruples the formula: f = (f | f) & (f | f)
    // Tests that the engine handles formula growth gracefully
    const source = `
      logic classical.propositional
      let f = A
      for i in {1,2,3,4,5,6,7,8} {
        set f = (f | f) & (f | f)
      }
      check satisfiable f
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('SATISFACIBLE');
  }, 10000);

  it('100 axioms sharing same subformulas', () => {
    const axioms = Array.from({ length: 100 }, (_, i) =>
      `axiom a${i} = (P -> Q) & (Q -> R) & (R -> S${i})`
    ).join('\n');
    const source = `
      logic classical.propositional
      ${axioms}
      check valid (P -> Q)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 10000);

  it('deep chain of biconditionals (20 levels, bitset fast path)', () => {
    const atoms = Array.from({ length: 20 }, (_, i) => `B${i}`);
    let formula = atoms[0];
    for (let i = 1; i < atoms.length; i++) {
      formula = `(${formula} <-> ${atoms[i]})`;
    }
    const source = `
      logic classical.propositional
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);
});

// ============================================================
// 3. TABLEAU ENGINE — EXPLOSIÓN DE RAMAS
// ============================================================
describe('Stress: Tableau Engine', () => {
  it('modal K — 30 levels of diamond nesting', () => {
    let formula = 'P';
    for (let i = 0; i < 30; i++) {
      formula = `<>(${formula})`;
    }
    const source = `
      logic modal.k
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 20000);

  it('modal S5 — validity of axiom 5 with deep nesting', () => {
    const source = `
      logic epistemic.s5
      check valid (<>P -> []<>P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 10000);

  it('deontic — 20 levels of obligation nesting', () => {
    let formula = 'A';
    for (let i = 0; i < 20; i++) {
      formula = `O(${formula})`;
    }
    const source = `
      logic deontic.standard
      check valid ${formula} -> ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);

  it('temporal — nested G/F/X operators', () => {
    const source = `
      logic temporal.ltl
      check satisfiable G(P -> F(X(Q)))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);

  it('intuitionistic — Peirce law is NOT valid', () => {
    const source = `
      logic intuitionistic.propositional
      check valid (((P -> Q) -> P) -> P)
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout.toLowerCase()).toContain('no es');
  }, 10000);
});

// ============================================================
// 4. FOL — EXPLOSIÓN DE CUANTIFICADORES
// ============================================================
describe('Stress: First-Order Logic', () => {
  it('valid universal instantiation with 5 constants', () => {
    const source = `
      logic classical.first_order
      check valid (forall x P(x)) -> (P(a) & P(b) & P(c) & P(d) & P(e))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 15000);

  it('existential from specific — P(a) -> exists x P(x)', () => {
    const source = `
      logic classical.first_order
      check valid (P(a) -> exists x P(x))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 10000);

  it('Barbara syllogism (forall x (P(x)->Q(x))) & P(a) -> Q(a)', () => {
    const source = `
      logic classical.first_order
      check valid ((forall x (P(x) -> Q(x))) -> (P(a) -> Q(a)))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toUpperCase()).toContain('VALIDA');
  }, 15000);

  it('nested quantifiers — forall x exists y is satisfiable (does not hang)', () => {
    const source = `
      logic classical.first_order
      check satisfiable forall x exists y R(x,y)
    `;
    const out = run(source);
    // Should complete without hanging. May return satisfiable or hit depth limit.
    expect([0, 3]).toContain(out.exitCode);
  }, 20000);

  it('invalid formula correctly detected — exists -> forall', () => {
    const source = `
      logic classical.first_order
      check valid (exists x P(x)) -> (forall x P(x))
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout.toLowerCase()).toContain('no es');
  }, 15000);

  it('derivation with 10 axioms in FOL', () => {
    const axioms = Array.from({ length: 9 }, (_, i) =>
      `axiom a${i} = forall x (P${i}(x) -> P${i + 1}(x))`
    ).join('\n');
    const source = `
      logic classical.first_order
      ${axioms}
      axiom base = P0(a)
      derive P9(a) from {a0, a1, a2, a3, a4, a5, a6, a7, a8, base}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 20000);
});

// ============================================================
// 5. ARITHMETIC — RECURSIÓN Y LOOPS MASIVOS
// ============================================================
describe('Stress: Arithmetic & Recursion', () => {
  it('500 iterations of set x = x + 1', () => {
    let setLines = '';
    for (let i = 0; i < 500; i++) {
      setLines += `  set x = x + 1\n`;
    }
    const source = `
      logic arithmetic
      let x = 0
${setLines}
      print x
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('500');
  }, 15000);

  it('recursive function hitting call depth limit gracefully', () => {
    const source = `
      logic arithmetic
      fn infinite(N) {
        let next = N + 1
        return infinite(next)
      }
      let r = infinite(1)
    `;
    const out = run(source);
    // Should not crash — should report a recursion/call limit error
    expect(
      out.diagnostics.some(
        (d) =>
          d.message.includes('recursión') ||
          d.message.includes('recursion') ||
          d.message.includes('Límite') ||
          d.message.includes('llamadas'),
      ),
    ).toBe(true);
  }, 15000);

  it('nested for loops (10x10x10 = 1000 iterations)', () => {
    const source = `
      logic arithmetic
      let count = 0
      for i in {1,2,3,4,5,6,7,8,9,10} {
        for j in {1,2,3,4,5,6,7,8,9,10} {
          for k in {1,2,3,4,5,6,7,8,9,10} {
            set count = count + 1
          }
        }
      }
      print count
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('1000');
  }, 30000);

  it('factorial(10) via recursion', () => {
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
      let f10 = factorial(10)
      print f10
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // 10! = 3628800
    expect(out.stdout).toContain('3628800');
  }, 10000);

  it('fibonacci(12) via recursion', () => {
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
      let f12 = fib(12)
      print f12
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // fib(12) = 144
    expect(out.stdout).toContain('144');
  }, 30000);

  it('division by zero does not crash', () => {
    const source = `
      logic arithmetic
      axiom bad = 10 / 0
      explain 10 / 0
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.diagnostics.some((d) => d.message.includes('División por cero'))).toBe(true);
  }, 5000);
});

// ============================================================
// 6. BELNAP 4-VALUED — BITSET UNDER PRESSURE
// ============================================================
describe('Stress: Belnap Paraconsistent', () => {
  it('8 atoms — Belnap truth table (4^8 = 65K rows via bitset)', () => {
    const atoms = Array.from({ length: 8 }, (_, i) => `B${i}`);
    const formula = atoms.join(' & ');
    const source = `
      logic paraconsistent.belnap
      check valid ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 30000);

  it('Belnap EFQ is NOT valid (P & !P) -> Q', () => {
    const source = `
      logic paraconsistent.belnap
      check valid (P & !P) -> Q
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(stripAccents(out.stdout).toLowerCase()).toContain('no es valida');
  }, 10000);

  it('8 atoms — Belnap satisfiability', () => {
    const atoms = Array.from({ length: 8 }, (_, i) => `C${i}`);
    const formula = atoms.map((a) => `(${a} | !${a})`).join(' & ');
    const source = `
      logic paraconsistent.belnap
      check satisfiable ${formula}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 15000);
});

// ============================================================
// 7. MULTI-PROFILE WHIPLASH — CAMBIOS RÁPIDOS DE PERFIL
// ============================================================
describe('Stress: Multi-Profile Whiplash', () => {
  it('rapid profile switching (10 profiles in one program)', () => {
    const source = `
      logic classical.propositional
      check valid (P -> P)

      logic modal.k
      check valid [](P -> P)

      logic deontic.standard
      check valid O(P) -> O(P)

      logic temporal.ltl
      check satisfiable (P U Q)

      logic epistemic.s5
      check satisfiable K(P) & !P

      logic paraconsistent.belnap
      check satisfiable P & !P

      logic intuitionistic.propositional
      check valid (P -> P)

      logic classical.first_order
      check valid (forall x P(x)) -> P(a)

      logic arithmetic
      explain 2 + 3

      logic probabilistic.basic
      check satisfiable Pr(A) = 0.5
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.results.length).toBeGreaterThanOrEqual(10);
  }, 15000);

  it('all profiles produce correct results', () => {
    const source = `
      logic classical.propositional
      check valid (P | !P)
    `;
    const out1 = run(source);
    expect(out1.results[0].status).toBe('valid');

    const source2 = `
      logic paraconsistent.belnap
      check valid (P | !P)
    `;
    const out2 = run(source2);
    // Belnap: P | !P is NOT valid (fails for Both value)
    expect(out2.results[0].status).not.toBe('valid');
  }, 10000);
});

// ============================================================
// 8. COMBINADO — PRUEBA OMEGA FINAL
// ============================================================
describe('Stress: Omega Final', () => {
  it('theory with 50 axioms + derivation chain', () => {
    const axioms = Array.from({ length: 49 }, (_, i) =>
      `axiom a${i} = P${i} -> P${i + 1}`
    ).join('\n');
    const source = `
      logic classical.propositional
      ${axioms}
      axiom base = P0
      derive P49 from {${Array.from({ length: 49 }, (_, i) => `a${i}`).join(', ')}, base}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('[derive]');
  }, 30000);

  it('proof block with complex premise set', () => {
    const source = `
      logic classical.propositional
      axiom a1 = P -> Q
      axiom a2 = Q -> R
      axiom a3 = R -> S
      axiom a4 = S -> T
      axiom base = P
      prove T from {a1, a2, a3, a4, base}
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
  }, 10000);

  it('massive theory render (50 axioms + 50 theorems)', () => {
    const decls = Array.from({ length: 50 }, (_, i) =>
      `axiom a${i} = P${i} -> Q${i}`
    ).join('\n') + '\n' +
    Array.from({ length: 50 }, (_, i) =>
      `theorem t${i} = Q${i} -> R${i}`
    ).join('\n');
    const source = `
      logic classical.propositional
      ${decls}
      render theory
    `;
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('render');
  }, 10000);
});
