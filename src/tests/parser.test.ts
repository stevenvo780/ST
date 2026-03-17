// ============================================================
// ST Tests — Parser
// ============================================================

import { describe, it, assert, assertEqual, assertIncludes } from './runner';
import { Parser } from '../parser/parser';

export function runParserTests(): void {
  describe('Parser — logic declaration', () => {
    it('parsea logic classical.propositional', () => {
      const parser = new Parser();
      const program = parser.parse('logic classical.propositional');
      assertEqual(program.statements.length, 1);
      assertEqual(program.statements[0].kind, 'logic_decl');
      assertEqual((program.statements[0] as any).profile, 'classical.propositional');
    });
  });

  describe('Parser — axiom declaration', () => {
    it('parsea axiom simple', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a1 = P');
      assertEqual(program.statements.length, 1);
      assertEqual(program.statements[0].kind, 'axiom_decl');
      assertEqual((program.statements[0] as any).name, 'a1');
    });

    it('parsea axiom con implicacion', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a1 = P -> Q');
      assertEqual(program.statements.length, 1);
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'implies');
    });
  });

  describe('Parser — formulas', () => {
    it('parsea negacion', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = !P');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'not');
      assertEqual(f.args[0].kind, 'atom');
    });

    it('parsea conjuncion', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = P & Q');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'and');
    });

    it('parsea disyuncion', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = P | Q');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'or');
    });

    it('parsea bicondicional', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = P <-> Q');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'biconditional');
    });

    it('respeta precedencia: & antes que |', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = P | Q & R');
      const f = (program.statements[0] as any).formula;
      // Debe ser P | (Q & R), no (P | Q) & R
      assertEqual(f.kind, 'or');
      assertEqual(f.args[1].kind, 'and');
    });

    it('parsea parentesis', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = (P | Q) & R');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'and');
      assertEqual(f.args[0].kind, 'or');
    });

    it('asocia implicacion a la derecha', () => {
      const parser = new Parser();
      const program = parser.parse('axiom a = P -> Q -> R');
      const f = (program.statements[0] as any).formula;
      assertEqual(f.kind, 'implies');
      assertEqual(f.args[1].kind, 'implies');
    });
  });

  describe('Parser — commands', () => {
    it('parsea derive', () => {
      const parser = new Parser();
      const program = parser.parse('derive Q from {a1, a2}');
      assertEqual(program.statements.length, 1);
      assertEqual(program.statements[0].kind, 'derive_cmd');
      assertEqual((program.statements[0] as any).premises.length, 2);
    });

    it('parsea check valid', () => {
      const parser = new Parser();
      const program = parser.parse('check valid (P -> Q)');
      assertEqual(program.statements.length, 1);
      assertEqual(program.statements[0].kind, 'check_valid_cmd');
    });

    it('parsea check satisfiable', () => {
      const parser = new Parser();
      const program = parser.parse('check satisfiable (P & Q)');
      assertEqual(program.statements[0].kind, 'check_satisfiable_cmd');
    });

    it('parsea countermodel', () => {
      const parser = new Parser();
      const program = parser.parse('countermodel (P -> Q)');
      assertEqual(program.statements[0].kind, 'countermodel_cmd');
    });

    it('parsea truth_table', () => {
      const parser = new Parser();
      const program = parser.parse('truth_table (P & Q)');
      assertEqual(program.statements[0].kind, 'truth_table_cmd');
    });

    it('parsea prove', () => {
      const parser = new Parser();
      const program = parser.parse('prove Q from {a1, a2}');
      assertEqual(program.statements[0].kind, 'prove_cmd');
    });
  });

  describe('Parser — text layer', () => {
    it('parsea let passage', () => {
      const parser = new Parser();
      const program = parser.parse('let p = passage([[clase-logica.md#b8]])');
      assertEqual(program.statements.length, 1);
      const stmt = program.statements[0] as any;
      assertEqual(stmt.kind, 'let_decl');
      assertEqual(stmt.letType, 'passage');
      assertIncludes(stmt.anchorPath, 'clase-logica');
    });

    it('parsea let formalize', () => {
      const parser = new Parser();
      const program = parser.parse('let phi = formalize p as (P -> Q)');
      const stmt = program.statements[0] as any;
      assertEqual(stmt.kind, 'let_decl');
      assertEqual(stmt.letType, 'formalize');
      assertEqual(stmt.passageName, 'p');
    });

    it('parsea support', () => {
      const parser = new Parser();
      const program = parser.parse('support c1 <- p');
      assertEqual(program.statements[0].kind, 'support_decl');
    });

    it('parsea confidence', () => {
      const parser = new Parser();
      const program = parser.parse('confidence c1 = 0.84');
      const stmt = program.statements[0] as any;
      assertEqual(stmt.kind, 'confidence_decl');
      assertEqual(stmt.value, 0.84);
    });

    it('parsea context', () => {
      const parser = new Parser();
      const program = parser.parse('context c1 = "contexto de ejemplo"');
      const stmt = program.statements[0] as any;
      assertEqual(stmt.kind, 'context_decl');
      assertEqual(stmt.text, 'contexto de ejemplo');
    });
  });

  describe('Parser — programa completo', () => {
    it('parsea script multi-linea', () => {
      const source = `
logic classical.propositional

axiom a1 = P -> Q
axiom a2 = P

derive Q from {a1, a2}
check valid ((P -> Q) -> (!Q -> !P))
`;
      const parser = new Parser();
      const program = parser.parse(source);
      assertEqual(parser.diagnostics.filter(d => d.severity === 'error').length, 0);
      assert(program.statements.length >= 4, `Esperaba >= 4 statements, got ${program.statements.length}`);
    });

    it('reporta errores de sintaxis', () => {
      const parser = new Parser();
      parser.parse('axiom = invalid syntax 123 @@');
      assert(parser.diagnostics.some(d => d.severity === 'error'), 'Deberia reportar errores');
    });
  });
}
