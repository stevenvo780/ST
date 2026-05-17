/**
 * ST — Exports públicos
 */

// API programática (uso recomendado para integración)
export {
  evaluate,
  parse,
  check,
  quickEval,
  createInterpreter,
  listProfiles,
  hover,
  symbols,
  gotoDefinition,
  completion,
  render,
  type STEvalResult,
  type STParseResult,
  type STCheckResult,
  type STInterpreter,
  type TheorySummary,
  type STHoverResult,
  type STRenderResult,
} from './api';

// Tipos
export * from './types';

// Lexer
export { Lexer } from './lexer/lexer';
export { TokenType, Token, KEYWORDS } from './lexer/tokens';

// AST
export * from './ast/nodes';

// Parser
export { Parser } from './parser/parser';

// Perfiles
export { LogicProfile, ProfileRegistry, registry } from './profiles/interface';
export { ClassicalPropositional, formulaToString } from './profiles/classical/propositional';
export { ClassicalFirstOrder } from './profiles/classical/first-order';
export { ModalK } from './profiles/modal/k';
export { ParaconsistentBelnap } from './profiles/paraconsistent/belnap';

// SAT Solving (parallelism support)
export { cdcl, cdclAsync } from './profiles/classical/cdcl';
export type { CDCLResult } from './profiles/classical/cdcl';
export { dpll, dpllAsync } from './profiles/classical/dpll';
export { workersAvailable, PARALLEL_THRESHOLD } from './profiles/classical/parallel-sat';

// Formato / Unicode / LaTeX
export { formulaToUnicode, formulaToLaTeX } from './runtime/format';

// Detector de falacias
export { detectFallacies } from './runtime/fallacies';
export type { FallacyInfo } from './runtime/fallacies';

// Text Layer
export {
  TextLayerState,
  createTextLayerState,
  parseAnchorPath,
  registerPassage,
  registerFormalization,
  registerClaim,
  registerSupport,
  registerConfidence,
  registerContext,
  compileClaimsToTheory,
  registerDefinition,
  registerSource,
  registerInterpretation,
} from './text-layer/compiler';

// Text Layer 2.0 — grafo de claims con dependencias e invalidación propagada
export { ClaimGraph, CycleError } from './text-layer/v2';
export type { Claim, ClaimValidation, ClaimSource, ClaimEvaluator } from './text-layer/v2';

// Runtime
export { Interpreter } from './runtime/interpreter';

// Protocol
export { ProtocolHandler } from './protocol/handler';

// REPL
export { REPL } from './repl/repl';

// TypeChecker (validación estática con sugerencias humanas)
export { typeCheck, TypeChecker } from './runtime/typecheck';
export type { TypeError } from './runtime/typecheck';

// AST visitor (nuevo en v4)
export { visit, visitProgram, BaseASTVisitor } from './ast/visitor';
export type { ASTVisitor } from './ast/visitor';

// CDCL v2
export { solveCDCLv2 } from './solver/cdcl-v2';

// Parallel pool
export { evalParallel, shutdownPool } from './runtime/parallel';
export type { ParallelEvalOptions, ParallelEvalResult } from './runtime/parallel';

// Memoization
export { DerivationCache, hashFormula } from './runtime/memo';

// Streaming
export { streamEval } from './runtime/streaming';
export type { StreamEvent } from './runtime/streaming';

// Countermodel minimization
export { minimizeCountermodel } from './runtime/countermodel-min';
export type {
  CountermodelMinOptions,
  CountermodelMinAlgorithm,
  MinimalCountermodel,
} from './runtime/countermodel-min';

// Coq exporter
export { exportToCoq, exportProofToCoq } from './exporters/coq';

// Argumentation (Dung framework)
export {
  computeExtensions,
  isAdmissible,
  isConflictFree,
  defends,
  dotExport,
} from './argumentation';
export type { ArgumentationFramework, Semantics } from './argumentation';

// FOL prover
export { proveFOL, unify, skolemize, toCNF } from './fol-prover';

// Proof exchange
export { canonicalize, hashProof, signProof, verifyProof, generateKeyPair } from './proof-exchange';
export type { ProofPackage } from './proof-exchange';

// Time-travel
export { captureSnapshot, SnapshotStore } from './time-travel';
export type { STSnapshot, SnapshotDiff } from './time-travel';

// Educational
export { generateExercise, checkAnswer, generateLessonPath } from './educational';
export type { Exercise, ExerciseLevel, ExerciseKind } from './educational';

// SMT bridge
export { toSMTLIB, MockSMTBackend, SubprocessSMTBackend, detectAvailableSMT } from './runtime/smt';
export type { SMTBackend } from './runtime/smt';

// Citation Reasoning (δ3)
export { deriveWithCitations, explainProof } from './citation-reasoning';
export type {
  CitedClaim,
  CitationDerivation,
  CitationDerivationResult,
  DerivationStep,
  Evaluator,
} from './citation-reasoning';

// Curry-Howard — correspondencia term ↔ proof
export {
  inferType,
  isInferError,
  reduceBeta,
  normalize,
  isNormal,
  termToProof,
  proofToTerm,
  proofIsConsistent,
  ProofConversionError,
  typeToString as chTypeToString,
  termToString as chTermToString,
  eqType as chEqType,
} from './curry-howard';
export type {
  PropType,
  LambdaTerm,
  ProofTree,
  ProofRule,
  Context as CHContext,
  InferResult,
} from './curry-howard';
