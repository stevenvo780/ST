// ============================================================
// ST Tests — Parser
// ============================================================

import { describe, it, expect } from 'vitest';
import { Parser } from '../parser/parser';
import {
  LogicDeclNode,
  AxiomDeclNode,
  DeriveCmdNode,
  LetPassageNode,
  LetFormalizeNode,
  ConfidenceDeclNode,
  ContextDeclNode,
} from '../ast/nodes';

describe('Parser — logic declaration', () => {
  it('parsea logic classical.propositional', () => {
    const parser = new Parser();
    const program = parser.parse('logic classical.propositional');
    expect(program.statements.length).toBe(1);
    expect(program.statements[0].kind).toBe('logic_decl');
    expect((program.statements[0] as LogicDeclNode).profile).toBe('classical.propositional');
  });
});

describe('Parser — axiom declaration', () => {
  it('parsea axiom simple', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a1 = P');
    expect(program.statements.length).toBe(1);
    expect(program.statements[0].kind).toBe('axiom_decl');
    expect((program.statements[0] as AxiomDeclNode).name).toBe('a1');
  });

  it('parsea axiom con implicacion', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a1 = P -> Q');
    expect(program.statements.length).toBe(1);
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('implies');
  });
});

describe('Parser — formulas', () => {
  it('parsea negacion', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = !P');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('not');
    expect(f.args?.[0].kind).toBe('atom');
  });

  it('parsea conjuncion', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = P & Q');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('and');
  });

  it('parsea disyuncion', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = P | Q');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('or');
  });

  it('parsea bicondicional', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = P <-> Q');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('biconditional');
  });

  it('respeta precedencia: & antes que |', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = P | Q & R');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    // Debe ser P | (Q & R), no (P | Q) & R
    expect(f.kind).toBe('or');
    expect(f.args?.[1].kind).toBe('and');
  });

  it('parsea parentesis', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = (P | Q) & R');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('and');
    expect(f.args?.[0].kind).toBe('or');
  });

  it('asocia implicacion a la derecha', () => {
    const parser = new Parser();
    const program = parser.parse('axiom a = P -> Q -> R');
    const f = (program.statements[0] as AxiomDeclNode).formula;
    expect(f.kind).toBe('implies');
    expect(f.args?.[1].kind).toBe('implies');
  });
});

describe('Parser — commands', () => {
  it('parsea derive', () => {
    const parser = new Parser();
    const program = parser.parse('derive Q from {a1, a2}');
    expect(program.statements.length).toBe(1);
    expect(program.statements[0].kind).toBe('derive_cmd');
    expect((program.statements[0] as DeriveCmdNode).premises.length).toBe(2);
  });

  it('parsea check valid', () => {
    const parser = new Parser();
    const program = parser.parse('check valid (P -> Q)');
    expect(program.statements.length).toBe(1);
    expect(program.statements[0].kind).toBe('check_valid_cmd');
  });

  it('parsea check satisfiable', () => {
    const parser = new Parser();
    const program = parser.parse('check satisfiable (P & Q)');
    expect(program.statements[0].kind).toBe('check_satisfiable_cmd');
  });

  it('parsea countermodel', () => {
    const parser = new Parser();
    const program = parser.parse('countermodel (P -> Q)');
    expect(program.statements[0].kind).toBe('countermodel_cmd');
  });

  it('parsea truth_table', () => {
    const parser = new Parser();
    const program = parser.parse('truth_table (P & Q)');
    expect(program.statements[0].kind).toBe('truth_table_cmd');
  });

  it('parsea prove', () => {
    const parser = new Parser();
    const program = parser.parse('prove Q from {a1, a2}');
    expect(program.statements[0].kind).toBe('prove_cmd');
  });
});

describe('Parser — text layer', () => {
  it('parsea let passage', () => {
    const parser = new Parser();
    const program = parser.parse('let p = passage([[clase-logica.md#b8]])');
    expect(program.statements.length).toBe(1);
    const stmt = program.statements[0] as LetPassageNode;
    expect(stmt.kind).toBe('let_decl');
    expect(stmt.letType).toBe('passage');
    expect(stmt.anchorPath).toContain('clase-logica');
  });

  it('parsea let formalize', () => {
    const parser = new Parser();
    const program = parser.parse('let phi = formalize p as (P -> Q)');
    const stmt = program.statements[0] as LetFormalizeNode;
    expect(stmt.kind).toBe('let_decl');
    expect(stmt.letType).toBe('formalize');
    expect(stmt.passageName).toBe('p');
  });

  it('parsea support', () => {
    const parser = new Parser();
    const program = parser.parse('support c1 <- p');
    expect(program.statements[0].kind).toBe('support_decl');
  });

  it('parsea confidence', () => {
    const parser = new Parser();
    const program = parser.parse('confidence c1 = 0.84');
    const stmt = program.statements[0] as ConfidenceDeclNode;
    expect(stmt.kind).toBe('confidence_decl');
    expect(stmt.value).toBe(0.84);
  });

  it('parsea context', () => {
    const parser = new Parser();
    const program = parser.parse('context c1 = "contexto de ejemplo"');
    const stmt = program.statements[0] as ContextDeclNode;
    expect(stmt.kind).toBe('context_decl');
    expect(stmt.text).toBe('contexto de ejemplo');
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
    expect(parser.diagnostics.filter((d) => d.severity === 'error').length).toBe(0);
    expect(program.statements.length).toBeGreaterThanOrEqual(4);
  });

  it('reporta errores de sintaxis', () => {
    const parser = new Parser();
    parser.parse('axiom = invalid syntax 123 @@');
    expect(parser.diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });
});
