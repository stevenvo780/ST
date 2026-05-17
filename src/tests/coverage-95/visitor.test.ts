import { describe, it, expect } from 'vitest';
import { visit, visitProgram, BaseASTVisitor, type ASTVisitor } from '../../ast/visitor';
import type {
  Program,
  Statement,
  LogicDeclNode,
  AxiomDeclNode,
  TheoremDeclNode,
  DeriveCmdNode,
  CheckValidCmdNode,
  CheckSatisfiableCmdNode,
  CheckEquivalentCmdNode,
  ProveCmdNode,
  CountermodelCmdNode,
  TruthTableCmdNode,
  LetDeclNode,
  ClaimDeclNode,
  SupportDeclNode,
  ConfidenceDeclNode,
  ContextDeclNode,
  RenderCmdNode,
  AnalyzeCmdNode,
  ExplainCmdNode,
  ImportDeclNode,
  ProofBlockNode,
  TheoryDeclNode,
  PrintCmdNode,
  SetCmdNode,
  IfStmtNode,
  ForStmtNode,
  WhileStmtNode,
  FnDeclNode,
  ReturnStmtNode,
  FnCallNode,
  ExportDeclNode,
  DefineDeclNode,
  UnfoldCmdNode,
  FoldCmdNode,
  SourceDeclNode,
  InterpretCmdNode,
  GlossaryCmdNode,
} from '../../ast/nodes';
import type { Formula, SourceLocation } from '../../types';

const loc: SourceLocation = { file: '<test>', line: 1, column: 1 };
const atom = (name: string): Formula => ({ kind: 'atom', name });

const counted: ASTVisitor<string> = {
  visitLogicDecl: () => 'logic_decl',
  visitAxiomDecl: () => 'axiom_decl',
  visitTheoremDecl: () => 'theorem_decl',
  visitDeriveCmd: () => 'derive_cmd',
  visitCheckValidCmd: () => 'check_valid_cmd',
  visitCheckSatisfiableCmd: () => 'check_satisfiable_cmd',
  visitCheckEquivalentCmd: () => 'check_equivalent_cmd',
  visitProveCmd: () => 'prove_cmd',
  visitCountermodelCmd: () => 'countermodel_cmd',
  visitTruthTableCmd: () => 'truth_table_cmd',
  visitLetDecl: () => 'let_decl',
  visitClaimDecl: () => 'claim_decl',
  visitSupportDecl: () => 'support_decl',
  visitConfidenceDecl: () => 'confidence_decl',
  visitContextDecl: () => 'context_decl',
  visitRenderCmd: () => 'render_cmd',
  visitAnalyzeCmd: () => 'analyze_cmd',
  visitExplainCmd: () => 'explain_cmd',
  visitImportDecl: () => 'import_decl',
  visitProofBlock: () => 'proof_block',
  visitTheoryDecl: () => 'theory_decl',
  visitPrintCmd: () => 'print_cmd',
  visitSetCmd: () => 'set_cmd',
  visitIfStmt: () => 'if_stmt',
  visitForStmt: () => 'for_stmt',
  visitWhileStmt: () => 'while_stmt',
  visitFnDecl: () => 'fn_decl',
  visitReturnStmt: () => 'return_stmt',
  visitFnCall: () => 'fn_call',
  visitExportDecl: () => 'export_decl',
  visitDefineDecl: () => 'define_decl',
  visitUnfoldCmd: () => 'unfold_cmd',
  visitFoldCmd: () => 'fold_cmd',
  visitSourceDecl: () => 'source_decl',
  visitInterpretCmd: () => 'interpret_cmd',
  visitGlossaryCmd: () => 'glossary_cmd',
};

const nodes: Statement[] = [
  { kind: 'logic_decl', source: loc, profile: 'classical.propositional' } as LogicDeclNode,
  { kind: 'axiom_decl', source: loc, name: 'A', formula: atom('P') } as AxiomDeclNode,
  { kind: 'theorem_decl', source: loc, name: 'T', formula: atom('Q') } as TheoremDeclNode,
  { kind: 'derive_cmd', source: loc, goal: atom('P'), premises: [] } as DeriveCmdNode,
  { kind: 'check_valid_cmd', source: loc, formula: atom('P') } as CheckValidCmdNode,
  { kind: 'check_satisfiable_cmd', source: loc, formula: atom('P') } as CheckSatisfiableCmdNode,
  {
    kind: 'check_equivalent_cmd',
    source: loc,
    left: atom('P'),
    right: atom('Q'),
  } as CheckEquivalentCmdNode,
  { kind: 'prove_cmd', source: loc, goal: atom('P'), premises: [] } as ProveCmdNode,
  { kind: 'countermodel_cmd', source: loc, formula: atom('P') } as CountermodelCmdNode,
  {
    kind: 'truth_table_cmd',
    source: loc,
    formula: atom('P'),
  } as unknown as TruthTableCmdNode,
  { kind: 'let_decl', source: loc, name: 'x', value: atom('P') } as unknown as LetDeclNode,
  { kind: 'claim_decl', source: loc, name: 'c1' } as unknown as ClaimDeclNode,
  { kind: 'support_decl', source: loc } as unknown as SupportDeclNode,
  { kind: 'confidence_decl', source: loc } as unknown as ConfidenceDeclNode,
  { kind: 'context_decl', source: loc } as unknown as ContextDeclNode,
  { kind: 'render_cmd', source: loc } as unknown as RenderCmdNode,
  { kind: 'analyze_cmd', source: loc } as unknown as AnalyzeCmdNode,
  { kind: 'explain_cmd', source: loc } as unknown as ExplainCmdNode,
  { kind: 'import_decl', source: loc } as unknown as ImportDeclNode,
  { kind: 'proof_block', source: loc } as unknown as ProofBlockNode,
  { kind: 'theory_decl', source: loc } as unknown as TheoryDeclNode,
  { kind: 'print_cmd', source: loc } as unknown as PrintCmdNode,
  { kind: 'set_cmd', source: loc } as unknown as SetCmdNode,
  { kind: 'if_stmt', source: loc } as unknown as IfStmtNode,
  { kind: 'for_stmt', source: loc } as unknown as ForStmtNode,
  { kind: 'while_stmt', source: loc } as unknown as WhileStmtNode,
  { kind: 'fn_decl', source: loc } as unknown as FnDeclNode,
  { kind: 'return_stmt', source: loc } as unknown as ReturnStmtNode,
  { kind: 'fn_call', source: loc } as unknown as FnCallNode,
  { kind: 'export_decl', source: loc } as unknown as ExportDeclNode,
  { kind: 'define_decl', source: loc } as unknown as DefineDeclNode,
  { kind: 'unfold_cmd', source: loc } as unknown as UnfoldCmdNode,
  { kind: 'fold_cmd', source: loc } as unknown as FoldCmdNode,
  { kind: 'source_decl', source: loc } as unknown as SourceDeclNode,
  { kind: 'interpret_cmd', source: loc } as unknown as InterpretCmdNode,
  { kind: 'glossary_cmd', source: loc } as unknown as GlossaryCmdNode,
];

describe('ast/visitor — visit() dispatches to each visitor method', () => {
  it('dispatches all 36 statement kinds to the correct visitor method', () => {
    const results = nodes.map((n) => visit(n, counted));
    expect(results).toEqual(nodes.map((n) => n.kind));
  });

  it('visitProgram() returns one result per statement', () => {
    const program: Program = {
      kind: 'program',
      statements: nodes.slice(0, 5),
    } as unknown as Program;
    const out = visitProgram(program, counted);
    expect(out.length).toBe(5);
    expect(out[0]).toBe('logic_decl');
  });

  it('throws on an unknown kind through exhaustiveness guard', () => {
    const fake = { kind: 'totally_unknown', source: loc } as unknown as Statement;
    expect(() => visit(fake, counted)).toThrow(/no manejado/);
  });
});

describe('ast/visitor — BaseASTVisitor default behavior', () => {
  class CountVisitor extends BaseASTVisitor<number> {
    public count = 0;
    protected defaultResult(): number {
      this.count++;
      return this.count;
    }
  }

  it('every visitor method falls back to defaultResult', () => {
    const visitor = new CountVisitor();
    for (const n of nodes) {
      visit(n, visitor);
    }
    expect(visitor.count).toBe(nodes.length);
  });

  it('subclass can override selectively', () => {
    class OverrideVisitor extends BaseASTVisitor<string> {
      protected defaultResult(): string {
        return 'default';
      }
      override visitLogicDecl(_node: LogicDeclNode): string {
        return 'override-logic';
      }
    }
    const v = new OverrideVisitor();
    expect(visit(nodes[0], v)).toBe('override-logic');
    expect(visit(nodes[1], v)).toBe('default');
  });
});
