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
  | 'render_cmd';

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

export interface TruthTableCmdNode extends ASTNode {
  kind: 'truth_table_cmd';
  formula: Formula;
}

export interface RenderCmdNode extends ASTNode {
  kind: 'render_cmd';
  target: string;
  format: string;
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

export type LetDeclNode = LetPassageNode | LetFormalizeNode;

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
  | RenderCmdNode;

export interface Program {
  statements: Statement[];
  file: string;
}
