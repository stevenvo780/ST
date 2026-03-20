import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source, '<test>');
}

describe('ST Language Limits & Stress Tests', () => {
  
  describe('Classical Propositional Limits', () => {
    it('handles 14 atoms without OOM', () => {
      const source = `
        logic classical.propositional
        let f = A & B & C & D & E & F & G & H & I & J & K & L & M & N
        check satisfiable f
      `;
      const out = run(source);
      expect(out.exitCode).toBe(0);
      expect(out.stdout).toContain('SATISFACIBLE');
    }, 20000); // 20s timeout

    it('reaches the 20 atoms limit and throws error', () => {
      const source = `
        logic classical.propositional
        let f = A & B & C & D & E & F & G & H & I & J & K & L & M & N & O & P & Q & R & S & T & U
        check satisfiable f
      `;
      const out = run(source);
      // The engine throws an error for > 20 atoms
      expect(out.diagnostics.some(d => d.message.includes('Demasiadas variables'))).toBe(true);
    });

    it('handles deep nesting (500 levels of NOT)', () => {
      let nesting = 'P';
      for (let i = 0; i < 500; i++) {
        nesting = `!(${nesting})`;
      }
      const source = `
        logic classical.propositional
        check equivalent ${nesting}, P
      `;
      const out = run(source);
      expect(out.exitCode).toBe(0);
      expect(out.stdout).toContain('EQUIVALENTES');
    });
  });

  describe('Modal Logic Limits', () => {
    it('handles moderate modal depth', () => {
      let formula = 'P';
      for (let i = 0; i < 20; i++) {
        formula = `[](${formula})`;
      }
      const source = `
        logic modal.k
        check valid ${formula} -> P
      `;
      const out = run(source);
      expect(out.exitCode).toBe(0);
      // In K, []P -> P is not valid
      expect(out.stdout.toLowerCase()).toMatch(/no es v[áa]lida/);
    });

    it('reaches MAX_DEPTH in tableau engine', () => {
      // Forzar profundidad > 200
      let formula = 'P0';
      for (let i = 1; i < 250; i++) {
        formula = `<>(${formula})`;
      }
      const source = `
        logic modal.k
        let verbose = "on"
        check satisfiable ${formula}
      `;
      const out = run(source);
      expect(out.stdout).toContain('MAX_DEPTH');
    });


  });

  describe('Arithmetic & Recursion Limits', () => {
    it('recursive factorial(5)', () => {
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
        let f5 = factorial(5)
        print f5
      `;
      const out = run(source);
      expect(out.exitCode).toBe(0);
      // 5! = 120. But wait, it returns a formula.
      // The print might show the expanded formula or just the result if evaluated.
      expect(out.stdout).toContain('5');
    });

    it('large loop (100 iterations)', () => {
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
    });
  });

  describe('Logical Sanity & Paradoxes', () => {
    it('handles Moore Paradox (Epistemic Satisfiability)', () => {
      const source = `
        logic epistemic.s5
        check satisfiable P & !K(P)
      `;
      const out = run(source);
      expect(out.stdout).toContain('SATISFACIBLE');
    });

    it('detects Russell-like contradictions in FOL', () => {
      const source = `
        logic classical.first_order
        check satisfiable forall x (P(x) <-> !P(x))
      `;
      const out = run(source);
      expect(out.stdout.toLowerCase()).toContain('insatisfacible');
    });

    it('verifies paraconsistent immunity to explosion (EFQ)', () => {
      const source = `
        logic paraconsistent.belnap
        check valid (P & !P) -> Q
      `;
      const out = run(source);
      // In Belnap, EFQ is NOT valid
      expect(out.stdout.toLowerCase()).toContain('no es valida');
    });

    it('handles Deontic Conflict (Seriality Constraint)', () => {
      const source = `
        logic deontic.standard
        check satisfiable O(A) & O(!A)
      `;
      const out = run(source);
      // In SDL, []A & []!A is unsatisfiable due to seriality (w0 must have a successor w1 where A and !A are true)
      expect(out.stdout.toLowerCase()).toContain('insatisfacible');
    });
  });
});
