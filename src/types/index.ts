// ============================================================
// ST Types — Todos los tipos base del lenguaje
// ============================================================

// --- Resultado lógico ---

/** Resultado de una operación lógica sobre una fórmula o argumento. */
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

/** Severidad de un diagnóstico emitido por el linter o el motor de ST. */
export type Severity = 'error' | 'warning' | 'info' | 'hint';

// --- Diagnóstico ---

/** Diagnóstico emitido durante el parseo, análisis o ejecución de un programa ST. */
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

/** Discriminante del nodo AST de una fórmula lógica de ST. */
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

/** Nodo del AST de una fórmula lógica. Cubre lógica proposicional, modal, temporal, aritmética y FO. */
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

/** Posición en el archivo fuente (1-based). Usada en diagnósticos, nodos AST y el LSP. */
export interface SourceLocation {
  file?: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// --- Text Layer State ---

/** Estado del Text Layer en un momento de ejecución: passages, formalizaciones, asertos y más. */
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

/** Entrada del mapa de definiciones (v3): abreviaciones de fórmulas parametrizadas. */
export interface DefinitionEntry {
  name: string;
  params?: string[];
  body: Formula;
  description?: string;
}

// --- v3: Sources ---

/** Metadatos bibliográficos de una fuente declarada con `source { ... }`. */
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

/** Entrada de interpretación (v3): vínculo entre texto en lenguaje natural y una fórmula. */
export interface InterpretationEntry {
  text: string;
  passageRef?: string;
  formula: Formula;
}

// --- Valuación ---

/** Mapa de variables proposicionales a valores booleanos: `{ P: true, Q: false }`. */
export type Valuation = Record<string, boolean>;

// --- Modelo ---

/** Modelo semántico que satisface (o refuta) una fórmula. El tipo determina qué campos aplican. */
export interface Model {
  type: 'propositional' | 'first_order' | 'modal' | 'belnap';
  valuation?: Valuation;
  domain?: string[];
  interpretation?: Record<string, unknown>;
  worlds?: World[];
  designation?: string;
}

/** Mundo posible en un modelo modal de Kripke: valuación local y relación de accesibilidad. */
export interface World {
  name: string;
  valuation: Valuation;
  accessible: string[];
}

// --- Juicio ---

/** Juicio lógico: una fórmula nombrada con su status tras ser evaluada por el motor. */
export interface Judgment {
  name: string;
  formula: Formula;
  status: LogicStatus;
  justification?: string;
  source?: SourceLocation;
}

// --- Teoría ---

/** Teoría activa en el intérprete: axiomas, teoremas y juicios acumulados durante la ejecución. */
export interface Theory {
  profile: string;
  axioms: Map<string, Formula>;
  theorems: Map<string, Formula>;
  claims: Map<string, Claim>;
  judgments: Judgment[];
}

// --- Prueba ---

/** Origen estructural de un paso de prueba: cómo se justificó ese paso. */
export type ProofStepSource = 'premise' | 'assumption' | 'rule' | 'semantic' | 'subproof' | 'goal';

/** Paso individual en una prueba formal: fórmula, justificación y referencias a pasos anteriores. */
export interface ProofStep {
  stepNumber: number;
  formula: Formula;
  justification: string;
  premises: number[];
  subproofs?: Proof[];
  /** Fuente estructural del paso. Preferir sobre parsear justification. */
  source?: ProofStepSource;
}

/** Método de prueba empleado por el motor: deducción natural, tableau, semántico o SAT. */
export type ProofMethod = 'natural_deduction' | 'tableau' | 'semantic' | 'sat';

/** Referencia a una premisa nombrada (axioma o teorema) usada en una prueba. */
export interface PremiseRef {
  name: string;
  location?: SourceLocation;
}

/** Metadatos de diagnóstico de una prueba: conteos de pasos, derivaciones alternativas, etc. */
export interface ProofMetadata {
  createdAt?: string;
  profile?: string;
  exploredStepCount?: number;
  retainedStepCount?: number;
  uniqueFormulaCount?: number;
  alternativeDerivationCount?: number;
  alternativeDerivationSamples?: AlternativeDerivationSample[];
  semanticFallback?: boolean;
}

/** Variante alternativa de un paso de derivación (mismo resultado, diferente regla/justificación). */
export interface AlternativeDerivationVariant {
  justification: string;
  premises: number[];
  source?: ProofStepSource;
}

/** Muestra de derivaciones alternativas detectadas para una fórmula dentro de una prueba. */
export interface AlternativeDerivationSample {
  formula: string;
  primaryStep: number;
  variants: AlternativeDerivationVariant[];
}

/** Prueba formal completa o parcial con su goal, pasos y status. */
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

/** Entrada de traza del algoritmo tableau para depuración y visualización paso a paso. */
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

/** Resultado completo de ejecutar un comando ST: status, prueba, modelo, tabla de verdad y más. */
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

/** Resultado de una operación `truth_table`: filas, tautología/contradicción y sub-fórmulas. */
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

/** Fila de una tabla de verdad: valuación de variables y valor resultante (boolean o Belnap). */
export interface TruthTableRow {
  valuation: Valuation;
  result: boolean | string;
}

// --- Perfil lógico ---

/** Interfaz que implementa cada uno de los 11 perfiles lógicos de ST (clásico, modal, temporal, etc.). */
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

/** Ancla dentro de un documento externo: apunta a un bloque, párrafo o rango específico. */
export interface Anchor {
  path: string;
  fragment?: string; // heading, bloque, rango
  type: 'block' | 'paragraph' | 'heading' | 'range';
}

/** Pasaje textual vinculado desde el Text Layer: fragmento de un documento externo con ancla. */
export interface Passage {
  name: string;
  anchor: Anchor;
  rawText?: string;
  source?: SourceLocation;
}

/** Formalización: vinculación entre un pasaje textual y su representación en lógica formal. */
export interface Formalization {
  name: string;
  passage: string; // nombre del passage
  formula: Formula;
  source?: SourceLocation;
}

/** Aserto del Text Layer: afirmación con fórmula opcional, soporte bibliográfico y confianza. */
export interface Claim {
  name: string;
  formula?: Formula;
  formalization?: string; // nombre de la formalización
  support?: string; // nombre del passage/source
  confidence?: number;
  context?: string;
  source?: SourceLocation;
}

/** Vínculo de soporte entre un aserto y una fuente bibliográfica. */
export interface Support {
  claimName: string;
  sourceName: string;
}

/** Nivel de confianza numérico (0-1) asignado a un aserto del Text Layer. */
export interface Confidence {
  claimName: string;
  value: number;
}

/** Contexto textual adicional asociado a un aserto del Text Layer. */
export interface Context {
  claimName: string;
  text: string;
}

// --- Editor Protocol ---

/** Métodos del protocolo editor de ST (JSON-RPC sobre stdio o socket). */
export type ProtocolMethod =
  | 'parse'
  | 'check'
  | 'run'
  | 'render'
  | 'hover'
  | 'symbols'
  | 'goto_definition'
  | 'completion';

/** Solicitud al servidor de protocolo del editor de ST. */
export interface ProtocolRequest {
  id: number;
  method: ProtocolMethod;
  params: Record<string, unknown>;
}

/** Respuesta del servidor de protocolo del editor de ST. */
export interface ProtocolResponse {
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
  diagnostics?: Diagnostic[];
}

/** Información de un símbolo del workspace para completado y hover en el editor. */
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

/** Información de hover: texto enriquecido y rango de la entidad bajo el cursor. */
export interface HoverInfo {
  content: string;
  range?: SourceLocation;
}

/** Ítem de completado de código sugerido por el servidor de protocolo. */
export interface CompletionItem {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
}

// --- Canales de ejecución ---

/** Salida combinada de la ejecución de un programa ST: stdout, stderr, diagnostics y resultados. */
export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  diagnostics: Diagnostic[];
  results: RunResult[];
  letDescriptions?: Record<string, string>;
}
