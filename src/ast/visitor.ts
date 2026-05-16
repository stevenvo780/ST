// ============================================================
// ST AST — Visitor pattern tipado
// ============================================================
//
// Define `ASTVisitor<T>` y un dispatcher `visit(node, visitor)`
// para consumir el AST sin escribir un switch enorme cada vez.
// Es opcional: el interprete actual sigue usando switch directo.
// Este modulo existe para que consumidores nuevos (linter,
// formatter, type-checker, etc.) tengan una API uniforme.

import {
  Statement,
  Program,
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
} from './nodes';

export interface ASTVisitor<T> {
  visitLogicDecl(node: LogicDeclNode): T;
  visitAxiomDecl(node: AxiomDeclNode): T;
  visitTheoremDecl(node: TheoremDeclNode): T;
  visitDeriveCmd(node: DeriveCmdNode): T;
  visitCheckValidCmd(node: CheckValidCmdNode): T;
  visitCheckSatisfiableCmd(node: CheckSatisfiableCmdNode): T;
  visitCheckEquivalentCmd(node: CheckEquivalentCmdNode): T;
  visitProveCmd(node: ProveCmdNode): T;
  visitCountermodelCmd(node: CountermodelCmdNode): T;
  visitTruthTableCmd(node: TruthTableCmdNode): T;
  visitLetDecl(node: LetDeclNode): T;
  visitClaimDecl(node: ClaimDeclNode): T;
  visitSupportDecl(node: SupportDeclNode): T;
  visitConfidenceDecl(node: ConfidenceDeclNode): T;
  visitContextDecl(node: ContextDeclNode): T;
  visitRenderCmd(node: RenderCmdNode): T;
  visitAnalyzeCmd(node: AnalyzeCmdNode): T;
  visitExplainCmd(node: ExplainCmdNode): T;
  visitImportDecl(node: ImportDeclNode): T;
  visitProofBlock(node: ProofBlockNode): T;
  visitTheoryDecl(node: TheoryDeclNode): T;
  visitPrintCmd(node: PrintCmdNode): T;
  visitSetCmd(node: SetCmdNode): T;
  visitIfStmt(node: IfStmtNode): T;
  visitForStmt(node: ForStmtNode): T;
  visitWhileStmt(node: WhileStmtNode): T;
  visitFnDecl(node: FnDeclNode): T;
  visitReturnStmt(node: ReturnStmtNode): T;
  visitFnCall(node: FnCallNode): T;
  visitExportDecl(node: ExportDeclNode): T;
  visitDefineDecl(node: DefineDeclNode): T;
  visitUnfoldCmd(node: UnfoldCmdNode): T;
  visitFoldCmd(node: FoldCmdNode): T;
  visitSourceDecl(node: SourceDeclNode): T;
  visitInterpretCmd(node: InterpretCmdNode): T;
  visitGlossaryCmd(node: GlossaryCmdNode): T;
}

/**
 * Dispatch tipado: rutea un `Statement` al metodo correspondiente del visitor.
 * Exhaustivo por discriminated union — si se agrega un kind nuevo,
 * TypeScript marca el switch como incompleto.
 */
export function visit<T>(node: Statement, visitor: ASTVisitor<T>): T {
  switch (node.kind) {
    case 'logic_decl':
      return visitor.visitLogicDecl(node);
    case 'axiom_decl':
      return visitor.visitAxiomDecl(node);
    case 'theorem_decl':
      return visitor.visitTheoremDecl(node);
    case 'derive_cmd':
      return visitor.visitDeriveCmd(node);
    case 'check_valid_cmd':
      return visitor.visitCheckValidCmd(node);
    case 'check_satisfiable_cmd':
      return visitor.visitCheckSatisfiableCmd(node);
    case 'check_equivalent_cmd':
      return visitor.visitCheckEquivalentCmd(node);
    case 'prove_cmd':
      return visitor.visitProveCmd(node);
    case 'countermodel_cmd':
      return visitor.visitCountermodelCmd(node);
    case 'truth_table_cmd':
      return visitor.visitTruthTableCmd(node);
    case 'let_decl':
      return visitor.visitLetDecl(node);
    case 'claim_decl':
      return visitor.visitClaimDecl(node);
    case 'support_decl':
      return visitor.visitSupportDecl(node);
    case 'confidence_decl':
      return visitor.visitConfidenceDecl(node);
    case 'context_decl':
      return visitor.visitContextDecl(node);
    case 'render_cmd':
      return visitor.visitRenderCmd(node);
    case 'analyze_cmd':
      return visitor.visitAnalyzeCmd(node);
    case 'explain_cmd':
      return visitor.visitExplainCmd(node);
    case 'import_decl':
      return visitor.visitImportDecl(node);
    case 'proof_block':
      return visitor.visitProofBlock(node);
    case 'theory_decl':
      return visitor.visitTheoryDecl(node);
    case 'print_cmd':
      return visitor.visitPrintCmd(node);
    case 'set_cmd':
      return visitor.visitSetCmd(node);
    case 'if_stmt':
      return visitor.visitIfStmt(node);
    case 'for_stmt':
      return visitor.visitForStmt(node);
    case 'while_stmt':
      return visitor.visitWhileStmt(node);
    case 'fn_decl':
      return visitor.visitFnDecl(node);
    case 'return_stmt':
      return visitor.visitReturnStmt(node);
    case 'fn_call':
      return visitor.visitFnCall(node);
    case 'export_decl':
      return visitor.visitExportDecl(node);
    case 'define_decl':
      return visitor.visitDefineDecl(node);
    case 'unfold_cmd':
      return visitor.visitUnfoldCmd(node);
    case 'fold_cmd':
      return visitor.visitFoldCmd(node);
    case 'source_decl':
      return visitor.visitSourceDecl(node);
    case 'interpret_cmd':
      return visitor.visitInterpretCmd(node);
    case 'glossary_cmd':
      return visitor.visitGlossaryCmd(node);
    default: {
      const _exhaustive: never = node;
      throw new Error(
        `visit: kind no manejado en switch exhaustivo: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

/**
 * Recorre todos los statements de un programa aplicando el visitor.
 * Devuelve la lista de resultados.
 */
export function visitProgram<T>(program: Program, visitor: ASTVisitor<T>): T[] {
  return program.statements.map((stmt) => visit(stmt, visitor));
}

/**
 * Visitor base con default a `undefined`. Subclases sobrescriben solo
 * los metodos que les interesan. Util para herramientas que solo se
 * preocupan por algunos kinds (ej: linter que solo mira theory_decl).
 */
export abstract class BaseASTVisitor<T> implements ASTVisitor<T> {
  protected abstract defaultResult(node: Statement): T;

  visitLogicDecl(node: LogicDeclNode): T {
    return this.defaultResult(node);
  }
  visitAxiomDecl(node: AxiomDeclNode): T {
    return this.defaultResult(node);
  }
  visitTheoremDecl(node: TheoremDeclNode): T {
    return this.defaultResult(node);
  }
  visitDeriveCmd(node: DeriveCmdNode): T {
    return this.defaultResult(node);
  }
  visitCheckValidCmd(node: CheckValidCmdNode): T {
    return this.defaultResult(node);
  }
  visitCheckSatisfiableCmd(node: CheckSatisfiableCmdNode): T {
    return this.defaultResult(node);
  }
  visitCheckEquivalentCmd(node: CheckEquivalentCmdNode): T {
    return this.defaultResult(node);
  }
  visitProveCmd(node: ProveCmdNode): T {
    return this.defaultResult(node);
  }
  visitCountermodelCmd(node: CountermodelCmdNode): T {
    return this.defaultResult(node);
  }
  visitTruthTableCmd(node: TruthTableCmdNode): T {
    return this.defaultResult(node);
  }
  visitLetDecl(node: LetDeclNode): T {
    return this.defaultResult(node);
  }
  visitClaimDecl(node: ClaimDeclNode): T {
    return this.defaultResult(node);
  }
  visitSupportDecl(node: SupportDeclNode): T {
    return this.defaultResult(node);
  }
  visitConfidenceDecl(node: ConfidenceDeclNode): T {
    return this.defaultResult(node);
  }
  visitContextDecl(node: ContextDeclNode): T {
    return this.defaultResult(node);
  }
  visitRenderCmd(node: RenderCmdNode): T {
    return this.defaultResult(node);
  }
  visitAnalyzeCmd(node: AnalyzeCmdNode): T {
    return this.defaultResult(node);
  }
  visitExplainCmd(node: ExplainCmdNode): T {
    return this.defaultResult(node);
  }
  visitImportDecl(node: ImportDeclNode): T {
    return this.defaultResult(node);
  }
  visitProofBlock(node: ProofBlockNode): T {
    return this.defaultResult(node);
  }
  visitTheoryDecl(node: TheoryDeclNode): T {
    return this.defaultResult(node);
  }
  visitPrintCmd(node: PrintCmdNode): T {
    return this.defaultResult(node);
  }
  visitSetCmd(node: SetCmdNode): T {
    return this.defaultResult(node);
  }
  visitIfStmt(node: IfStmtNode): T {
    return this.defaultResult(node);
  }
  visitForStmt(node: ForStmtNode): T {
    return this.defaultResult(node);
  }
  visitWhileStmt(node: WhileStmtNode): T {
    return this.defaultResult(node);
  }
  visitFnDecl(node: FnDeclNode): T {
    return this.defaultResult(node);
  }
  visitReturnStmt(node: ReturnStmtNode): T {
    return this.defaultResult(node);
  }
  visitFnCall(node: FnCallNode): T {
    return this.defaultResult(node);
  }
  visitExportDecl(node: ExportDeclNode): T {
    return this.defaultResult(node);
  }
  visitDefineDecl(node: DefineDeclNode): T {
    return this.defaultResult(node);
  }
  visitUnfoldCmd(node: UnfoldCmdNode): T {
    return this.defaultResult(node);
  }
  visitFoldCmd(node: FoldCmdNode): T {
    return this.defaultResult(node);
  }
  visitSourceDecl(node: SourceDeclNode): T {
    return this.defaultResult(node);
  }
  visitInterpretCmd(node: InterpretCmdNode): T {
    return this.defaultResult(node);
  }
  visitGlossaryCmd(node: GlossaryCmdNode): T {
    return this.defaultResult(node);
  }
}
