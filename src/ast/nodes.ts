// ============================================================
// ST AST — Nodos del Árbol de Sintaxis Abstracta
// ============================================================

import { Formula, SourceLocation } from '../types';

// --- Tipos de nodos top-level ---

export type StatementKind =
  | 'logic_decl'
  | 'axiom_decl'
  | 'theorem_decl'
  | 'derive_cmd'
  | 'check_valid_cmd'
  | 'check_satisfiable_cmd'
  | 'check_equivalent_cmd'
  | 'prove_cmd'
  | 'countermodel_cmd'
  | 'truth_table_cmd'
  | 'let_decl'
  | 'claim_decl'
  | 'support_decl'
  | 'confidence_decl'
  | 'context_decl'
  | 'render_cmd'
  | 'analyze_cmd'
  | 'explain_cmd'
  | 'import_decl'
  | 'proof_block'
  | 'theory_decl'
  | 'print_cmd'
  | 'set_cmd'
  | 'if_stmt'
  | 'for_stmt'
  | 'while_stmt'
  | 'fn_decl'
  | 'return_stmt'
  | 'fn_call'
  | 'export_decl';

export interface ASTNode {
  kind: StatementKind;
  source: SourceLocation;
}

// --- Declaraciones ---

export interface LogicDeclNode extends ASTNode {
  kind: 'logic_decl';
  profile: string; // e.g. "classical.propositional"
}

export interface AxiomDeclNode extends ASTNode {
  kind: 'axiom_decl';
  name: string;
  formula: Formula;
}

export interface TheoremDeclNode extends ASTNode {
  kind: 'theorem_decl';
  name: string;
  formula: Formula;
}

// --- Comandos lógicos ---

export interface DeriveCmdNode extends ASTNode {
  kind: 'derive_cmd';
  goal: Formula;
  premises: string[];
}

export interface CheckValidCmdNode extends ASTNode {
  kind: 'check_valid_cmd';
  formula: Formula;
}

export interface CheckSatisfiableCmdNode extends ASTNode {
  kind: 'check_satisfiable_cmd';
  formula: Formula;
}

export interface CheckEquivalentCmdNode extends ASTNode {
  kind: 'check_equivalent_cmd';
  left: Formula;
  right: Formula;
}

export interface ProveCmdNode extends ASTNode {
  kind: 'prove_cmd';
  goal: Formula;
  premises: string[];
}

export interface CountermodelCmdNode extends ASTNode {
  kind: 'countermodel_cmd';
  formula: Formula;
}

export type ActionExprKind =
  | 'check_valid'
  | 'check_satisfiable'
  | 'check_equivalent'
  | 'derive'
  | 'prove'
  | 'countermodel'
  | 'truth_table'
  | 'explain';

export interface ActionExprNode {
  kind: 'action_expr';
  action: ActionExprKind;
  source: SourceLocation;
  formula?: Formula;
  left?: Formula;
  right?: Formula;
  goal?: Formula;
  premises?: string[];
}

export interface TruthTableCmdNode extends ASTNode {
  kind: 'truth_table_cmd';
  formula: Formula;
}

export interface RenderCmdNode extends ASTNode {
  kind: 'render_cmd';
  target: string;
  format: string;
}

export interface AnalyzeCmdNode extends ASTNode {
  kind: 'analyze_cmd';
  premises: Formula[];
  conclusion: Formula;
}

export interface ExplainCmdNode extends ASTNode {
  kind: 'explain_cmd';
  formula: Formula;
}

export interface ImportDeclNode extends ASTNode {
  kind: 'import_decl';
  path: string;
}

export interface ProofBlockNode extends ASTNode {
  kind: 'proof_block';
  assumptions: { name: string; formula: Formula }[];
  goal: Formula;
  body: Statement[]; // derivar, check, etc. dentro del bloque
}

export interface TheoryMember {
  statement: Statement;
  visibility: 'public' | 'private';
}

export interface TheoryDeclNode extends ASTNode {
  kind: 'theory_decl';
  name: string;
  params?: string[]; // Parámetros del "constructor"
  parent?: string; // extends Parent
  members: TheoryMember[];
}

// --- Control flow & funciones ---

export interface PrintCmdNode extends ASTNode {
  kind: 'print_cmd';
  value: string | null; // string literal (null si es fórmula)
  formula?: Formula; // fórmula a imprimir
}

export interface SetCmdNode extends ASTNode {
  kind: 'set_cmd';
  name: string;
  formula: Formula;
}

export interface IfBranch {
  condition: 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid';
  formula: Formula;
  body: Statement[];
}

export interface IfStmtNode extends ASTNode {
  kind: 'if_stmt';
  branches: IfBranch[]; // if + else if branches
  elseBranch?: Statement[]; // else branch
}

export interface ForStmtNode extends ASTNode {
  kind: 'for_stmt';
  variable: string;
  items: Formula[]; // {A, B, C}
  body: Statement[];
}

export interface WhileStmtNode extends ASTNode {
  kind: 'while_stmt';
  condition: 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid';
  formula: Formula;
  body: Statement[];
  maxIterations: number; // safety limit
}

export interface FnDeclNode extends ASTNode {
  kind: 'fn_decl';
  name: string;
  params: string[];
  body: Statement[];
}

export interface ReturnStmtNode extends ASTNode {
  kind: 'return_stmt';
  formula?: Formula;
}

export interface FnCallNode extends ASTNode {
  kind: 'fn_call';
  name: string;
  args: Formula[];
}

export interface ExportDeclNode extends ASTNode {
  kind: 'export_decl';
  statement: Statement;
}

// --- Text Layer ---

export interface LetPassageNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'passage';
  anchorPath: string;
}

export interface LetFormalizeNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'formalize';
  passageName: string;
  formula: Formula;
}

export interface LetFormulaNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'formula';
  formula: Formula;
  description?: string; // descripción textual opcional
}

export interface LetDescriptionNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'description';
  description: string; // texto semántico: let P = "Socrates es un hombre"
}

export interface LetActionNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'action';
  action: ActionExprNode;
}

export type LetDeclNode =
  | LetPassageNode
  | LetFormalizeNode
  | LetFormulaNode
  | LetDescriptionNode
  | LetActionNode;

export interface ClaimDeclNode extends ASTNode {
  kind: 'claim_decl';
  name: string;
  value: string; // nombre de variable o fórmula serializada
  formula?: Formula;
  formalization?: string;
}

export interface SupportDeclNode extends ASTNode {
  kind: 'support_decl';
  claimName: string;
  sourceName: string;
}

export interface ConfidenceDeclNode extends ASTNode {
  kind: 'confidence_decl';
  claimName: string;
  value: number;
}

export interface ContextDeclNode extends ASTNode {
  kind: 'context_decl';
  claimName: string;
  text: string;
}

// --- Programa completo ---

export type Statement =
  | LogicDeclNode
  | AxiomDeclNode
  | TheoremDeclNode
  | DeriveCmdNode
  | CheckValidCmdNode
  | CheckSatisfiableCmdNode
  | CheckEquivalentCmdNode
  | ProveCmdNode
  | CountermodelCmdNode
  | TruthTableCmdNode
  | LetDeclNode
  | ClaimDeclNode
  | SupportDeclNode
  | ConfidenceDeclNode
  | ContextDeclNode
  | RenderCmdNode
  | AnalyzeCmdNode
  | ExplainCmdNode
  | ImportDeclNode
  | ProofBlockNode
  | TheoryDeclNode
  | PrintCmdNode
  | SetCmdNode
  | IfStmtNode
  | ForStmtNode
  | WhileStmtNode
  | FnDeclNode
  | ReturnStmtNode
  | FnCallNode
  | ExportDeclNode;

export interface Program {
  statements: Statement[];
  file: string;
}
