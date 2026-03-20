import { describe, expect, it } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { formulaToString } from '../profiles/classical/propositional';

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