// ============================================================
// ST Types — Todos los tipos base del lenguaje
// ============================================================

// --- Resultado lógico ---

export type LogicStatus =
  | 'valid'
  | 'invalid'
  | 'satisfiable'
  | 'unsatisfiable'
  | 'provable'
  | 'refutable'
  | 'unknown'
  | 'error';

// --- Severidad de diagnósticos ---

export type Severity = 'error' | 'warning' | 'info' | 'hint';

// --- Diagnóstico ---

export interface Diagnostic {
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  code?: string;
  suggestion?: string;
}

// --- Fórmula (AST de fórmulas lógicas) ---

export type FormulaKind =
  | 'atom'
  | 'list'
  | 'not'
  | 'and'
  | 'or'
  | 'implies'
  | 'biconditional'
  | 'forall'
  | 'exists'
  | 'predicate'
  | 'equals'
  | 'modal_necessity'
  | 'modal_possibility'
  | 'temporal_next'
  | 'temporal_until'
  | 'nand'
  | 'nor'
  | 'xor'
  // Constantes lógicas (⊤/⊥, true/false)
  | 'true'
  | 'false'
  // Arithmetic
  | 'number'
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'modulo'
  | 'less'
  | 'greater'
  | 'less_eq'
  | 'greater_eq'
  | 'fn_call';

const FORMULA_KIND_SET: ReadonlySet<FormulaKind> = new Set<FormulaKind>([
  'atom',
  'list',
  'not',
  'and',
  'or',
  'implies',
  'biconditional',
  'forall',
  'exists',
  'predicate',
  'equals',
  'modal_necessity',
  'modal_possibility',
  'temporal_next',
  'temporal_until',
  'nand',
  'nor',
  'xor',
  'true',
  'false',
  'number',
  'add',
  'subtract',
  'multiply',
  'divide',
  'modulo',
  'less',
  'greater',
  'less_eq',
  'greater_eq',
  'fn_call',
]);

export interface Formula {
  kind: FormulaKind;
  name?: string; // para átomos y predicados
  args?: Formula[]; // sub-fórmulas
  variable?: string; // para cuantificadores
  terms?: string[]; // para predicados (alias de params)
  params?: string[]; // para predicados (usado en parser)
  value?: number; // para literales numéricos (kind === 'number')
  source?: SourceLocation;
}

export function isFormula(value: unknown): value is Formula {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Formula>;
  if (typeof candidate.kind !== 'string') return false;
  return FORMULA_KIND_SET.has(candidate.kind);
}

export interface SourceLocation {
  file?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// --- Text Layer State ---

export interface TextLayerState {
  passages: Map<string, Passage>;
  formalizations: Map<string, Formalization>;
  claims: Map<string, Claim>;
  supports: Support[];
  confidences: Confidence[];
  contexts: Context[];
  /** v3: Formal definitions */
  definitions: Map<string, DefinitionEntry>;
  /** v3: Bibliographic sources */
  sources: Map<string, SourceInfo>;
  /** v3: Interpretations (text → formula mappings) */
  interpretations: Map<string, InterpretationEntry>;
}

// --- v3: Definitions ---

export interface DefinitionEntry {
  name: string;
  params?: string[];
  body: Formula;
  description?: string;
}

// --- v3: Sources ---

export interface SourceInfo {
  id: string;
  author?: string;
  work?: string;
  year?: number;
  section?: string;
  edition?: string;
  url?: string;
}

// --- v3: Interpretations ---

export interface InterpretationEntry {
  text: string;
  passageRef?: string;
  formula: Formula;
}

// --- Valuación ---

export type Valuation = Record<string, boolean>;

// --- Modelo ---

export interface Model {
  type: 'propositional' | 'first_order' | 'modal' | 'belnap';
  valuation?: Valuation;
  domain?: string[];
  interpretation?: Record<string, unknown>;
  worlds?: World[];
  designation?: string;
}

export interface World {
  name: string;
  valuation: Valuation;
  accessible: string[];
}

// --- Juicio ---

export interface Judgment {
  name: string;
  formula: Formula;
  status: LogicStatus;
  justification?: string;
  source?: SourceLocation;
}

// --- Teoría ---

export interface Theory {
  profile: string;
  axioms: Map<string, Formula>;
  theorems: Map<string, Formula>;
  claims: Map<string, Claim>;
  judgments: Judgment[];
}

// --- Prueba ---

export type ProofStepSource = 'premise' | 'assumption' | 'rule' | 'semantic' | 'subproof' | 'goal';

export interface ProofStep {
  stepNumber: number;
  formula: Formula;
  justification: string;
  premises: number[];
  subproofs?: Proof[];
  /** Fuente estructural del paso. Preferir sobre parsear justification. */
  source?: ProofStepSource;
}

export type ProofMethod = 'natural_deduction' | 'tableau' | 'semantic' | 'sat';

export interface PremiseRef {
  name: string;
  location?: SourceLocation;
}

export interface ProofMetadata {
  createdAt?: string;
  profile?: string;
}

export interface Proof {
  goal: Formula;
  steps: ProofStep[];
  status: 'complete' | 'incomplete' | 'failed';
  derivedFrom?: string[];
  premiseRefs?: PremiseRef[];
  method?: ProofMethod;
  subproofs?: Proof[];
  metadata?: ProofMetadata;
}

// --- Resultado de ejecución ---

export interface TableauTraceEntry {
  message: string;
  branchId?: string;
  depth?: number;
  rule?:
    | 'start'
    | 'literal'
    | 'close'
    | 'open'
    | 'alpha'
    | 'beta'
    | 'gamma'
    | 'delta'
    | 'frame'
    | 'limit'
    | 'info';
  status?: 'expanded' | 'closed' | 'open' | 'limit';
  world?: string;
  formula?: string;
  nodeId?: string;
  parentNodeId?: string;
}

export interface RunResult {
  status: LogicStatus;
  output?: string;
  proof?: Proof;
  model?: Model;
  truthTable?: TruthTableResult;
  diagnostics: Diagnostic[];
  formula?: Formula;
  reasoningType?: string;
  reasoningSchema?: string;
  formulaClassification?: string;
  normalForms?: {
    nnf?: string;
    cnf?: string;
    dnf?: string;
    pnf?: string;
    skolem?: string;
  };
  formulaAnalysis?: {
    mainConnective?: string;
    depth?: number;
    complexity?: number;
    subFormulas?: string[];
    atomCount?: number;
    connectivesUsed?: string[];
  };
  crossSystemComparison?: Record<string, string>;
  tableauTrace?: TableauTraceEntry[];
  educationalNote?: string;
  paradoxWarning?: string;
}

export interface TruthTableResult {
  variables: string[];
  rows: TruthTableRow[];
  isTautology: boolean;
  isContradiction: boolean;
  isSatisfiable: boolean;
  subFormulas?: { formula: Formula; label: string }[];
  subFormulaValues?: Record<string, boolean | string>[];
  satisfyingCount?: number;
  totalCount?: number;
}

export interface TruthTableRow {
  valuation: Valuation;
  result: boolean | string;
}

// --- Perfil lógico ---

export interface LogicProfile {
  name: string;
  description: string;

  checkWellFormed(formula: Formula): Diagnostic[];
  checkValid(formula: Formula): RunResult;
  checkSatisfiable(formula: Formula): RunResult;
  /**
   * prove acepta una lista opcional de nombres de premisas a usar.
   * Si premises es indefinido o vacío, se usa la teoría completa (axiomas + teoremas).
   * Si premises trae nombres, sólo esos axiomas/teoremas se consideran.
   */
  prove(goal: Formula, theory: Theory, premises?: string[]): RunResult;
  derive(goal: Formula, premises: string[], theory: Theory): RunResult;
  countermodel(formula: Formula): RunResult;
  explain(formula: Formula): RunResult;
  truthTable?(formula: Formula): TruthTableResult;
  checkEquivalent?(a: Formula, b: Formula): RunResult;
}

// --- Text Layer ---

export interface Anchor {
  path: string;
  fragment?: string; // heading, bloque, rango
  type: 'block' | 'paragraph' | 'heading' | 'range';
}

export interface Passage {
  name: string;
  anchor: Anchor;
  rawText?: string;
  source?: SourceLocation;
}

export interface Formalization {
  name: string;
  passage: string; // nombre del passage
  formula: Formula;
  source?: SourceLocation;
}

export interface Claim {
  name: string;
  formula?: Formula;
  formalization?: string; // nombre de la formalización
  support?: string; // nombre del passage/source
  confidence?: number;
  context?: string;
  source?: SourceLocation;
}

export interface Support {
  claimName: string;
  sourceName: string;
}

export interface Confidence {
  claimName: string;
  value: number;
}

export interface Context {
  claimName: string;
  text: string;
}

// --- Editor Protocol ---

export type ProtocolMethod =
  | 'parse'
  | 'check'
  | 'run'
  | 'render'
  | 'hover'
  | 'symbols'
  | 'goto_definition'
  | 'completion';

export interface ProtocolRequest {
  id: number;
  method: ProtocolMethod;
  params: Record<string, unknown>;
}

export interface ProtocolResponse {
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
  diagnostics?: Diagnostic[];
}

export interface SymbolInfo {
  name: string;
  kind:
    | 'axiom'
    | 'theorem'
    | 'claim'
    | 'passage'
    | 'variable'
    | 'formula'
    | 'definition'
    | 'source'
    | 'interpretation'
    | 'function';
  description?: string;
  detail?: string;
  location: SourceLocation;
}

export interface HoverInfo {
  content: string;
  range?: SourceLocation;
}

export interface CompletionItem {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
}

// --- Canales de ejecución ---

export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  diagnostics: Diagnostic[];
  results: RunResult[];
  letDescriptions?: Record<string, string>;
}
