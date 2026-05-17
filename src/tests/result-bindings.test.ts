import { describe, expect, it } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { formulaToString } from '../logic/profiles/classical/propositional';

describe('Captured action results', () => {
  it('stores derivation results in variables with structured fields', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        axiom a1 = P -> Q
        axiom a2 = P
        let manual = Q
        let deriv = derive Q from {a1, a2}
        let same = formula_eq(deriv.formula, manual)
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(formulaToString(bindings.get('deriv')!)).toBe('Q');
    expect(bindings.get('deriv.status')?.name).toBe('"provable"');
    expect(bindings.get('deriv.command')?.name).toBe('"derive"');
    expect(bindings.get('same')?.kind).toBe('number');
    expect(bindings.get('same')?.value).toBe(1);
  });

  it('captures proof steps as list bindings and allows indexing them', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        axiom a1 = P -> Q
        axiom a2 = P
        let deriv = derive Q from {a1, a2}
        let total = len(deriv.steps)
        let third = at(deriv.steps, 2)
        let thirdOk = formula_eq(third, Q)
        let just = at(deriv.step_justifications, 2)
        let refs = at(deriv.step_premises, 2)
        let firstRef = at(refs, 0)
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(bindings.get('deriv.steps')?.kind).toBe('list');
    expect(bindings.get('deriv.steps_formulas')?.kind).toBe('list');
    expect(bindings.get('deriv.steps_count')?.value).toBe(3);
    expect(bindings.get('deriv.proof_method')?.name).toBe('"natural_deduction"');
    expect(bindings.get('deriv.semantic_fallback')?.value).toBe(0);
    expect(bindings.get('total')?.value).toBe(3);
    expect(bindings.get('third')?.kind).toBe('atom');
    expect(bindings.get('third')?.name).toBe('Q');
    expect(bindings.get('thirdOk')?.value).toBe(1);
    expect(bindings.get('just')?.name).toBe('"Modus Ponens"');
    expect(bindings.get('refs')?.kind).toBe('list');
    expect(bindings.get('firstRef')?.kind).toBe('number');
    expect(bindings.get('firstRef')?.value).toBe(1);
  });

  it('captures derive results that reference let-bound premises', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        let p1 = !(!P | !Q)
        let p2 = R -> !S
        let p3 = R | !Q
        let deriv = derive !S from {p1, p2, p3}
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(bindings.get('deriv.status')?.name).toBe('"provable"');
    expect(bindings.get('deriv.proof_method')?.name).toBe('"natural_deduction"');
    expect(bindings.get('deriv.semantic_fallback')?.value).toBe(0);
    expect(bindings.get('deriv.steps_count')?.kind).toBe('number');
    expect(bindings.get('deriv.steps_count')?.value ?? 0).toBeGreaterThan(0);

    const justifications = bindings.get('deriv.step_justifications')?.args ?? [];
    expect(
      justifications.some(
        (entry) => entry.kind === 'atom' && entry.name === '"Silogismo disyuntivo"',
      ),
    ).toBe(true);
  });

  it('allows numeric comparison helpers inside logical if branches', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        axiom a1 = P -> Q
        axiom a2 = P
        let deriv = derive Q from {a1, a2}
        let third = at(deriv.steps, 2)

        if valid formula_eq(third, Q) {
          print "step_match"
        }

        if invalid formula_eq(third, P) {
          print "step_diff"
        }
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('step_match');
    expect(out.stdout).toContain('step_diff');
  });

  it('supports bracket indexing syntax as sugar for at()', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        axiom a1 = P -> Q
        axiom a2 = P
        let deriv = derive Q from {a1, a2}
        let third = deriv.steps[2]
        let firstRef = deriv.step_premises[2][0]
        let ok = formula_eq(deriv.steps[2], Q)

        if valid formula_eq(deriv.steps[2], Q) {
          print "indexed_match"
        }
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(bindings.get('third')?.kind).toBe('atom');
    expect(bindings.get('third')?.name).toBe('Q');
    expect(bindings.get('firstRef')?.kind).toBe('number');
    expect(bindings.get('firstRef')?.value).toBe(1);
    expect(bindings.get('ok')?.kind).toBe('number');
    expect(bindings.get('ok')?.value).toBe(1);
    expect(out.stdout).toContain('indexed_match');
  });

  it('decomposes formulas into list values and supports indexing helpers', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        let f = (P & Q) -> R
        let atoms = atoms_of(f)
        let count = len(atoms)
        let second = at(atoms, 1)
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(bindings.get('atoms')?.kind).toBe('list');
    expect(bindings.get('count')?.value).toBe(3);
    expect(bindings.get('second')?.kind).toBe('atom');
    expect(bindings.get('second')?.name).toBe('Q');
  });

  it('captures truth table metadata as structured fields', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional
        let tt = truth_table (P & Q)
        let vars = tt.variables
        let first = at(vars, 0)
        let total = len(vars)
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);

    const bindings = interp.getLetBindings();
    expect(bindings.get('tt.status')?.name).toBe('"satisfiable"');
    expect(bindings.get('tt.rows_count')?.value).toBe(4);
    expect(bindings.get('vars')?.kind).toBe('list');
    expect(bindings.get('first')?.name).toBe('P');
    expect(bindings.get('total')?.value).toBe(2);
  });
});
