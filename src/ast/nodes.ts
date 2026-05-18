// ============================================================
// ST AST — Nodos del Árbol de Sintaxis Abstracta
// ============================================================

import { Formula, SourceLocation } from '../types';

// --- Tipos de nodos top-level ---

/** Discriminante de todos los nodos de sentencia del AST de ST. */
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
  | 'export_decl'
  | 'define_decl'
  | 'unfold_cmd'
  | 'fold_cmd'
  | 'source_decl'
  | 'interpret_cmd'
  | 'glossary_cmd';

/** Nodo base del AST. Todos los nodos de sentencia extienden esta interfaz. */
export interface ASTNode {
  kind: StatementKind;
  source: SourceLocation;
}

// --- Declaraciones ---

/** Declaración de perfil lógico activo: `logic classical.propositional`. */
export interface LogicDeclNode extends ASTNode {
  kind: 'logic_decl';
  profile: string; // e.g. "classical.propositional"
}

/** Declaración de axioma: `axiom <nombre> := <fórmula>`. */
export interface AxiomDeclNode extends ASTNode {
  kind: 'axiom_decl';
  name: string;
  formula: Formula;
}

/** Declaración de teorema: `theorem <nombre> := <fórmula>`. */
export interface TheoremDeclNode extends ASTNode {
  kind: 'theorem_decl';
  name: string;
  formula: Formula;
}

// --- Comandos lógicos ---

/** Comando `derive <goal> from <premises...>`: deriva una fórmula a partir de premisas nombradas. */
export interface DeriveCmdNode extends ASTNode {
  kind: 'derive_cmd';
  goal: Formula;
  premises: string[];
}

/** Comando `check valid <fórmula>`: verifica si la fórmula es tautología. */
export interface CheckValidCmdNode extends ASTNode {
  kind: 'check_valid_cmd';
  formula: Formula;
}

/** Comando `check satisfiable <fórmula>`: verifica si existe valoración que satisfaga la fórmula. */
export interface CheckSatisfiableCmdNode extends ASTNode {
  kind: 'check_satisfiable_cmd';
  formula: Formula;
}

/** Comando `check equivalent <A> <B>`: comprueba equivalencia lógica entre dos fórmulas. */
export interface CheckEquivalentCmdNode extends ASTNode {
  kind: 'check_equivalent_cmd';
  left: Formula;
  right: Formula;
}

/** Comando `prove <goal> from <premises...>`: intenta construir una prueba formal del goal. */
export interface ProveCmdNode extends ASTNode {
  kind: 'prove_cmd';
  goal: Formula;
  premises: string[];
}

/** Comando `countermodel <fórmula>`: busca un modelo que falsifique la fórmula. */
export interface CountermodelCmdNode extends ASTNode {
  kind: 'countermodel_cmd';
  formula: Formula;
}

/** Discriminante de las acciones que puede encapsular un `let x = <acción>`. */
export type ActionExprKind =
  | 'check_valid'
  | 'check_satisfiable'
  | 'check_equivalent'
  | 'derive'
  | 'prove'
  | 'countermodel'
  | 'truth_table'
  | 'explain';

/** Expresión de acción usada dentro de `let x = <acción>`. */
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

/** Comando `truth_table <fórmula>`: genera la tabla de verdad completa. */
export interface TruthTableCmdNode extends ASTNode {
  kind: 'truth_table_cmd';
  formula: Formula;
}

/** Comando `render <target> as <format>`: serializa un símbolo a un formato dado. */
export interface RenderCmdNode extends ASTNode {
  kind: 'render_cmd';
  target: string;
  format: string;
}

/** Comando `analyze <premises> therefore <conclusion>`: analiza la validez de un argumento. */
export interface AnalyzeCmdNode extends ASTNode {
  kind: 'analyze_cmd';
  premises: Formula[];
  conclusion: Formula;
}

/** Comando `explain <fórmula>`: produce una explicación en lenguaje natural de la fórmula. */
export interface ExplainCmdNode extends ASTNode {
  kind: 'explain_cmd';
  formula: Formula;
}

/** Declaración `import "<path>"`: importa otro archivo ST al scope actual. */
export interface ImportDeclNode extends ASTNode {
  kind: 'import_decl';
  path: string;
}

/** Bloque de prueba estructurado con supuestos locales y goal explícito. */
export interface ProofBlockNode extends ASTNode {
  kind: 'proof_block';
  assumptions: { name: string; formula: Formula }[];
  goal: Formula;
  body: Statement[]; // derivar, check, etc. dentro del bloque
}

/** Miembro de una teoría con control de visibilidad pública/privada. */
export interface TheoryMember {
  statement: Statement;
  visibility: 'public' | 'private';
}

/** Declaración de teoría con herencia opcional: `theory T extends Parent { ... }`. */
export interface TheoryDeclNode extends ASTNode {
  kind: 'theory_decl';
  name: string;
  params?: string[]; // Parámetros del "constructor"
  parent?: string; // extends Parent
  members: TheoryMember[];
}

// --- Control flow & funciones ---

/** Comando `print <expr>`: imprime un valor o fórmula en stdout. */
export interface PrintCmdNode extends ASTNode {
  kind: 'print_cmd';
  value: string | null; // string literal (null si es fórmula)
  formula?: Formula; // fórmula a imprimir
}

/** Comando `set <nombre> := <fórmula>`: asigna una fórmula a una variable mutable. */
export interface SetCmdNode extends ASTNode {
  kind: 'set_cmd';
  name: string;
  formula: Formula;
}

/** Rama condicional de un `if` con condición lógica sobre una fórmula. */
export interface IfBranch {
  condition: 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid';
  formula: Formula;
  body: Statement[];
}

/** Sentencia `if <condición lógica> { ... } else { ... }` del control flow de ST. */
export interface IfStmtNode extends ASTNode {
  kind: 'if_stmt';
  branches: IfBranch[]; // if + else if branches
  elseBranch?: Statement[]; // else branch
}

/** Sentencia `for <var> in {A, B, C} { ... }`: itera sobre un conjunto de fórmulas. */
export interface ForStmtNode extends ASTNode {
  kind: 'for_stmt';
  variable: string;
  items: Formula[]; // {A, B, C}
  body: Statement[];
}

/** Sentencia `while <condición lógica> <fórmula> { ... }` con límite de iteraciones por seguridad. */
export interface WhileStmtNode extends ASTNode {
  kind: 'while_stmt';
  condition: 'valid' | 'satisfiable' | 'unsatisfiable' | 'invalid';
  formula: Formula;
  body: Statement[];
  maxIterations: number; // safety limit
}

/** Declaración de función ST: `fn <nombre>(<params>) { ... }`. */
export interface FnDeclNode extends ASTNode {
  kind: 'fn_decl';
  name: string;
  params: string[];
  body: Statement[];
}

/** Sentencia `return <fórmula>` dentro de una función ST. */
export interface ReturnStmtNode extends ASTNode {
  kind: 'return_stmt';
  formula?: Formula;
}

/** Llamada a función ST: `<nombre>(<args...>)`. */
export interface FnCallNode extends ASTNode {
  kind: 'fn_call';
  name: string;
  args: Formula[];
}

/** Declara una sentencia como pública al importar el módulo ST. */
export interface ExportDeclNode extends ASTNode {
  kind: 'export_decl';
  statement: Statement;
}

// --- v3: Definitions, sources, glossary ---

/** Declaración `define <nombre>[(<params>)] := <body>`: crea una abreviación de fórmula. */
export interface DefineDeclNode extends ASTNode {
  kind: 'define_decl';
  name: string;
  params?: string[]; // define F(x,y) := ...
  body: Formula;
  description?: string;
}

/** Comando `unfold <fórmula>`: expande las definiciones en la fórmula dada. */
export interface UnfoldCmdNode extends ASTNode {
  kind: 'unfold_cmd';
  formula: Formula;
}

/** Comando `fold <fórmula>`: contrae subexpresiones que coinciden con definiciones. */
export interface FoldCmdNode extends ASTNode {
  kind: 'fold_cmd';
  formula: Formula;
}

/** Campo clave-valor de una declaración `source`. */
export interface SourceField {
  key: string;
  value: string | number;
}

/** Declaración bibliográfica `source <nombre> { author: ..., year: ... }`. */
export interface SourceDeclNode extends ASTNode {
  kind: 'source_decl';
  name: string;
  fields: SourceField[];
}

/** Comando `interpret "<texto>" as <fórmula>`: vincula un texto en lenguaje natural a su formalización. */
export interface InterpretCmdNode extends ASTNode {
  kind: 'interpret_cmd';
  text: string;
  passageRef?: string; // interpret p as FORMULA
  formula: Formula;
}

/** Comando `glossary`: imprime el glosario semántico del documento actual. */
export interface GlossaryCmdNode extends ASTNode {
  kind: 'glossary_cmd';
}

// --- Text Layer ---

/** Nodo `let <nombre> = passage "<path>"`: vincula un pasaje textual externo. */
export interface LetPassageNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'passage';
  anchorPath: string;
}

/** Nodo `let <nombre> = formalize <pasaje> as <fórmula>`: asocia una formalización a un pasaje. */
export interface LetFormalizeNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'formalize';
  passageName: string;
  formula: Formula;
}

/** Nodo `let <nombre> = <fórmula>`: declara un alias de fórmula con descripción opcional. */
export interface LetFormulaNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'formula';
  formula: Formula;
  description?: string; // descripción textual opcional
}

/** Nodo `let <nombre> = "<texto>"`: asigna una descripción semántica en lenguaje natural. */
export interface LetDescriptionNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'description';
  description: string; // texto semántico: let P = "Socrates es un hombre"
}

/** Nodo `let <nombre> = <acción>`: almacena el resultado de una acción lógica en una variable. */
export interface LetActionNode extends ASTNode {
  kind: 'let_decl';
  name: string;
  letType: 'action';
  action: ActionExprNode;
}

/** Unión discriminada de todas las variantes de la declaración `let`. */
export type LetDeclNode =
  | LetPassageNode
  | LetFormalizeNode
  | LetFormulaNode
  | LetDescriptionNode
  | LetActionNode;

/** Declaración de aserto: `claim <nombre> := <variable o fórmula>`. */
export interface ClaimDeclNode extends ASTNode {
  kind: 'claim_decl';
  name: string;
  value: string; // nombre de variable o fórmula serializada
  formula?: Formula;
  formalization?: string;
}

/** Declaración `support <claim> from <source>`: vincula evidencia bibliográfica a un aserto. */
export interface SupportDeclNode extends ASTNode {
  kind: 'support_decl';
  claimName: string;
  sourceName: string;
}

/** Declara un nivel de confianza numérico (0-1) para un aserto. */
export interface ConfidenceDeclNode extends ASTNode {
  kind: 'confidence_decl';
  claimName: string;
  value: number;
}

/** Declaración de contexto textual adicional para un aserto. */
export interface ContextDeclNode extends ASTNode {
  kind: 'context_decl';
  claimName: string;
  text: string;
}

// --- Programa completo ---

/** Unión discriminada de todas las sentencias válidas en un programa ST. */
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
  | ExportDeclNode
  | DefineDeclNode
  | UnfoldCmdNode
  | FoldCmdNode
  | SourceDeclNode
  | InterpretCmdNode
  | GlossaryCmdNode;

/** Representa un programa ST completo: lista de sentencias + ruta del archivo fuente. */
export interface Program {
  statements: Statement[];
  file: string;
}
