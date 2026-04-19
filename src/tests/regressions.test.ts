import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';

import { createInterpreter } from '../api';
import { Interpreter } from '../runtime/interpreter';

describe('Regression fixes', () => {
  it('invalidates function memoization when global bindings change', () => {
    const interpreter = new Interpreter();
    const output = interpreter.execute(
      `
        logic arithmetic
        let y = 1
        fn addY(x) {
          return x + y
        }
        print addY(1)
        set y = 2
        print addY(1)
      `,
      '<test>',
    );

    expect(output.exitCode).toBe(0);
    const lines = output.stdout.trim().split('\n');
    expect(lines.at(-1)).toBe('3');
  });

  it('reloads imports when the file content changes in a persistent interpreter', () => {
    const dir = mkdtempSync(join(tmpdir(), 'st-import-'));
    const file = join(dir, 'shared.st');
    const interpreter = createInterpreter();

    try {
      writeFileSync(file, 'export let val = 1\n', 'utf-8');
      const first = interpreter.exec(`logic arithmetic\nimport "${file}"\nprint val`);

      writeFileSync(file, 'export let val = 2\n', 'utf-8');
      const second = interpreter.exec(`import "${file}"\nprint val`);

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      expect(first.stdout.trim().split('\n').at(-1)).toBe('1');
      expect(second.stdout.trim().split('\n').at(-1)).toBe('2');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects oversized classical truth tables instead of returning bogus results', () => {
    const interpreter = new Interpreter();
    const atoms = Array.from({ length: 21 }, (_, i) => `P${i + 1}`).join(' | ');
    const output = interpreter.execute(
      `logic classical.propositional\ntruth_table (${atoms})`,
      '<test>',
    );

    expect(output.exitCode).toBe(3);
    expect(output.stderr).toContain('truth_table soporta hasta 20 variables');
    expect(output.results).toHaveLength(0);
  });

  // Fix #1: derive succeeds registering a theorem, not an axiom
  it('derive registers the conclusion as theorem, never as axiom', () => {
    const interpreter = new Interpreter();
    interpreter.execute(
      `
        logic classical.propositional
        axiom A1 = P -> Q
        axiom A2 = P
        derive Q from {A1, A2}
      `,
      '<test>',
    );
    const theory = interpreter.getTheory();
    const axiomNames = Array.from(theory.axioms.keys());
    const theoremNames = Array.from(theory.theorems.keys());
    expect(axiomNames).toEqual(['A1', 'A2']);
    expect(theoremNames.some((n) => n.startsWith('derived_'))).toBe(true);
  });

  // Fix #5: top-level `let` should not mutate theory.axioms
  it('top-level let does not pollute theory.axioms', () => {
    const interpreter = new Interpreter();
    interpreter.execute(
      `
        logic classical.propositional
        let shortcut = P & Q
      `,
      '<test>',
    );
    const theory = interpreter.getTheory();
    expect(theory.axioms.has('shortcut')).toBe(false);
  });

  // Fix #5 + ephemeral theory: let bindings can still be cited as premises in derive/prove
  it('let bindings remain citable as premises without being persisted as axioms', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        logic classical.propositional
        let A = P -> Q
        let B = P
        derive Q from {A, B}
      `,
      '<test>',
    );
    expect(out.exitCode).toBe(0);
    expect(interpreter.getTheory().axioms.has('A')).toBe(false);
    expect(interpreter.getTheory().axioms.has('B')).toBe(false);
  });

  // Fix #6: proof block must not leak intermediate theorems outside
  it('proof block restores theory state; only QED implication survives', () => {
    const interpreter = new Interpreter();
    interpreter.execute(
      `
        logic classical.propositional
        axiom base_ax = R
        assume h1 : P
        show P
          derive P from {h1}
        qed
      `,
      '<test>',
    );
    const theory = interpreter.getTheory();
    expect(Array.from(theory.axioms.keys())).toEqual(['base_ax']);
    const names = Array.from(theory.theorems.keys());
    // A successful proof block records a proof_* theorem; inner derived_* must not leak
    expect(names.some((n) => n.startsWith('proof_'))).toBe(true);
    expect(names.some((n) => n.startsWith('derived_'))).toBe(false);
  });

  // Fix #7: prove without explicit premises should use both axioms AND theorems
  it('prove without premises considers theorems, not only axioms', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        logic classical.propositional
        axiom A1 = P -> Q
        axiom A2 = P
        derive Q from {A1, A2}
        prove Q
      `,
      '<test>',
    );
    expect(out.exitCode).toBe(0);
    const last = out.results.at(-1);
    expect(last?.status === 'provable' || last?.status === 'valid').toBe(true);
  });

  // Fix #10: pre-scan of `logic` directive ignores strings and comments
  it('profile pre-scan ignores `logic` inside strings and comments', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        // logic modal.k
        /* logic modal.s5 */
        logic classical.propositional
        let msg = "logic intuitionistic.propositional"
        check valid P | !P
      `,
      '<test>',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/V[ÁA]LIDA/);
  });

  // Fix #2: mixing OR/XOR/NOR at same precedence level emits a warning
  it('mixing OR with XOR at same level emits a precedence warning', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        logic classical.propositional
        check satisfiable P | Q ^ R
      `,
      '<test>',
    );
    const hasWarn = out.diagnostics.some(
      (d) => d.severity === 'warning' && /Mezcla de conectivos/.test(d.message),
    );
    expect(hasWarn).toBe(true);
  });

  // Fix #3: identifyTheorem picks the paradox-specific reading over the generic one
  it('known-theorems resolves Omnisciencia Lógica over Axioma K in epistemic.s5', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        logic epistemic.s5
        check valid [](P -> Q) -> ([]P -> []Q)
      `,
      '<test>',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Omnisciencia');
  });

  // Fix #4: IPC checks emit a warning that the model search is bounded
  it('IPC checkValid emits a warning about bounded Kripke search', () => {
    const interpreter = new Interpreter();
    const out = interpreter.execute(
      `
        logic intuitionistic.propositional
        check valid (P -> Q) -> (!Q -> !P)
      `,
      '<test>',
    );
    const resultDiags = out.results.flatMap((r) => r.diagnostics ?? []);
    const hasWarn = resultDiags.some(
      (d) => d.severity === 'warning' && /IPC: búsqueda acotada/.test(d.message),
    );
    expect(hasWarn).toBe(true);
  });
});
