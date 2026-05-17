import { describe, it, expect } from 'vitest';
import { Parser } from '../../parser/parser';
import { Interpreter } from '../../runtime/interpreter';

function parse(src: string): ReturnType<Parser['parse']> {
  return new Parser('<test>').parse(src);
}

describe('parser — top-level commands', () => {
  it('parses logic decl with multiple profiles', () => {
    for (const prof of [
      'classical.propositional',
      'classical.first_order',
      'modal.k',
      'paraconsistent.belnap',
      'deontic.standard',
      'epistemic.s5',
      'intuitionistic.propositional',
      'temporal.ltl',
      'aristotelian.syllogistic',
      'probabilistic.basic',
      'arithmetic',
    ]) {
      const p = parse(`logic ${prof}\n`);
      expect(p.statements[0]?.kind).toBe('logic_decl');
    }
  });

  it('parses axiom and theorem', () => {
    const p = parse(`logic classical.propositional
axiom a1 : P
theorem t1 : P -> P
`);
    expect(p.statements.map((s) => s.kind)).toEqual(['logic_decl', 'axiom_decl', 'theorem_decl']);
  });

  it('parses derive with premises', () => {
    const p = parse(`logic classical.propositional
axiom a1 : P
axiom a2 : P -> Q
derive Q from a1, a2
`);
    expect(p.statements[3]?.kind).toBe('derive_cmd');
  });

  it('parses prove with from and without', () => {
    const p1 = parse(`logic classical.propositional
prove P
`);
    expect(p1.statements[1]?.kind).toBe('prove_cmd');

    const p2 = parse(`logic classical.propositional
axiom a : P
prove Q from a
`);
    expect(p2.statements[2]?.kind).toBe('prove_cmd');
  });

  it('parses check valid / satisfiable / equivalent', () => {
    const p = parse(`logic classical.propositional
check valid (P -> P)
check satisfiable (P)
check equivalent (P & Q), (Q & P)
`);
    expect(p.statements.length).toBeGreaterThanOrEqual(3);
  });

  it('parses countermodel and truth_table', () => {
    const p = parse(`logic classical.propositional
countermodel (P -> Q)
truth_table (P & Q)
`);
    expect(p.statements[1]?.kind).toBe('countermodel_cmd');
    expect(p.statements[2]?.kind).toBe('truth_table_cmd');
  });

  it('parses analyze command (best effort)', () => {
    const src = `logic classical.propositional
analyze (P -> Q), P |- Q
`;
    const p = parse(src);
    expect(p.statements.length).toBeGreaterThanOrEqual(1);
  });

  it('parses let-formula variant', () => {
    const p = parse(`logic classical.propositional
let alpha = P -> Q
`);
    expect(p.statements[1]?.kind).toBe('let_decl');
  });

  it('parses import declaration', () => {
    const p = parse(`logic classical.propositional
import "shared.st"
`);
    expect(p.statements[1]?.kind).toBe('import_decl');
  });

  it('parses theory with extends and private members', () => {
    const p = parse(`logic classical.propositional
theory Persona(n) {
  axiom existencia : P
  private axiom secret : Q
  let id = n
}
theory Empleado(n) extends Persona {
  theorem t1 : P
}
`);
    expect(p.statements.some((s) => s.kind === 'theory_decl')).toBe(true);
  });

  it('parses print statements', () => {
    const p = parse(`logic classical.propositional
print "hello"
print P
`);
    expect(p.statements.some((s) => s.kind === 'print_cmd')).toBe(true);
  });

  it('parses define and unfold and fold', () => {
    const p = parse(`logic classical.propositional
define Mortal(x) := P -> Q
unfold Mortal(s)
fold P -> Q
`);
    expect(p.statements.some((s) => s.kind === 'define_decl')).toBe(true);
    expect(p.statements.some((s) => s.kind === 'unfold_cmd')).toBe(true);
    expect(p.statements.some((s) => s.kind === 'fold_cmd')).toBe(true);
  });

  it('parses source declaration', () => {
    const p = parse(`logic classical.propositional
source Kant24 { author "Kant"; year 2024 }
`);
    expect(p.statements[1]?.kind).toBe('source_decl');
  });

  it('parses glossary command', () => {
    const p = parse(`logic classical.propositional
glossary
`);
    expect(p.statements[1]?.kind).toBe('glossary_cmd');
  });

  it('parses export of various declarations', () => {
    const p = parse(`logic classical.propositional
export axiom shared : P
export define M(x) := P
export fn util(a) { return a }
`);
    const exports = p.statements.filter((s) => s.kind === 'export_decl');
    expect(exports.length).toBe(3);
  });

  it('parses fn declaration', () => {
    const p = parse(`logic classical.propositional
fn helper(p, q) {
  return p
}
`);
    expect(p.statements[1]?.kind).toBe('fn_decl');
  });

  it('parses explain command', () => {
    const p = parse(`logic classical.propositional
explain (P -> P)
`);
    expect(p.statements[1]?.kind).toBe('explain_cmd');
  });

  it('reports errors on malformed input', () => {
    const p = new Parser('<test>');
    p.parse(`logic classical.propositional
axiom a :: ::
`);
    expect(p.diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });

  it('recovers and continues after error', () => {
    const p = parse(`logic classical.propositional
axiom bad ::
axiom a : P
`);
    // Still parses subsequent statements
    expect(p.statements.length).toBeGreaterThan(1);
  });
});

describe('parser/formulas — operator variants', () => {
  function parseAxiom(formulaText: string): boolean {
    const out = new Interpreter().execute(
      `logic classical.propositional\naxiom test : ${formulaText}`,
    );
    return out.exitCode === 0;
  }

  it('accepts ASCII operators -> <-> & | !', () => {
    expect(parseAxiom('P -> Q')).toBe(true);
    expect(parseAxiom('P <-> Q')).toBe(true);
    expect(parseAxiom('P & Q')).toBe(true);
    expect(parseAxiom('P | Q')).toBe(true);
    expect(parseAxiom('!P')).toBe(true);
  });

  it('accepts Unicode → ↔ ∧ ∨ ¬', () => {
    expect(parseAxiom('P → Q')).toBe(true);
    expect(parseAxiom('P ↔ Q')).toBe(true);
    expect(parseAxiom('P ∧ Q')).toBe(true);
    expect(parseAxiom('P ∨ Q')).toBe(true);
    expect(parseAxiom('¬P')).toBe(true);
  });

  it('accepts modal operators in modal.k', () => {
    const out = new Interpreter().execute('logic modal.k\naxiom a : []P\naxiom b : <>Q\n');
    expect(out.exitCode).toBe(0);
  });

  it('accepts nand/nor/xor (ASCII and Unicode)', () => {
    expect(parseAxiom('P ↑ Q')).toBe(true);
    expect(parseAxiom('P ↓ Q')).toBe(true);
    expect(parseAxiom('P ⊕ Q')).toBe(true);
  });

  it('accepts constants ⊤ and ⊥', () => {
    expect(parseAxiom('⊤')).toBe(true);
    expect(parseAxiom('⊥')).toBe(true);
  });

  it('parses quantifiers forall/exists in FOL', () => {
    const out = new Interpreter().execute(`logic classical.first_order
axiom a : forall x P(x)
axiom b : exists y Q(y)
`);
    expect(out.exitCode).toBe(0);
  });
});
