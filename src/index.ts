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

// Theorem cache (proof reuse persistente)
export { TheoremCache, tryReuseProof } from './runtime/theorem-cache';
export type {
  CachedTheorem,
  CacheOptions as TheoremCacheOptions,
  CacheStats as TheoremCacheStats,
  ReuseResult as TheoremReuseResult,
} from './runtime/theorem-cache';

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

// Proof minification
export {
  minifyProof,
  compactModusPonensChain,
  removeUnusedSubproofs,
} from './runtime/proof-minify';
export type {
  GenericProofNode,
  MinifyOptions,
  MinifyResult,
  MinifyRule,
} from './runtime/proof-minify';

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
export type { ArgumentationFramework } from './argumentation';
// Backward-compat: re-export del tipo `Semantics` de argumentation.
// Declarado localmente (no re-export directo) para permitir el namespace
// homónimo añadido más abajo (declaration merging type + namespace).
import type { Semantics as ArgumentationSemanticsType } from './argumentation';
export type Semantics = ArgumentationSemanticsType;

// FOL prover
export { proveFOL, unify, skolemize, toCNF } from './fol-prover';

// TPTP parser/emitter + bridge a fol-prover
export {
  parseTptp,
  parseFormula as parseTptpFormula,
  emitTptp,
  emitFormula as emitTptpFormula,
  toFolProverFormat as tptpToFolProverFormat,
  tptpFormulaToFol,
  TptpParserError,
  TptpTokenizerError,
} from './tptp';
export type {
  TptpFormula,
  TptpProblem,
  TptpAnnotated,
  TptpTerm,
  TptpLanguage,
  TptpRole,
} from './tptp';

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

// MLTT — Martin-Löf Type Theory (Π/Σ/Id/Nat + universos)
export {
  mVar,
  mUniverse,
  mPi,
  mLam,
  mApp,
  mSigma,
  mPair,
  mFst,
  mSnd,
  mId,
  mRefl,
  mNat,
  mZero,
  mSucc,
  mArrow,
  inferType as mlttInferType,
  checkType as mlttCheckType,
  isInferError as mlttIsInferError,
  normalize as mlttNormalize,
  reduceStep as mlttReduceStep,
  isNormal as mlttIsNormal,
  alphaEq as mlttAlphaEq,
  alphaBetaEq as mlttAlphaBetaEq,
  substitute as mlttSubstitute,
  freeVars as mlttFreeVars,
  occursFree as mlttOccursFree,
  termToString as mlttTermToString,
} from './mltt';
export type {
  MLTTTerm,
  InferContext as MLTTInferContext,
  InferResult as MLTTInferResult,
} from './mltt';

// λ-cálculo untyped puro — β/η, estrategias, combinadores, Church numerals
export {
  v as lcVar,
  lam as lcLam,
  ap as lcAp,
  apN as lcApN,
  alphaEq as lcAlphaEq,
  termToString as lcTermToString,
  freeVars as lcFreeVars,
  substitute as lcSubstitute,
  alphaRename as lcAlphaRename,
  makeFreshSupply as lcMakeFreshSupply,
  betaStep as lcBetaStep,
  etaStep as lcEtaStep,
  normalize as lcNormalize,
  isNormalForm as lcIsNormalForm,
  isWeakHeadNormalForm as lcIsWHNF,
  I as lcI,
  K as lcK,
  S as lcS,
  Y as lcY,
  omega as lcOmega,
  omegaSmall as lcOmegaSmall,
  churchNumeral as lcChurchNumeral,
  decodeChurch as lcDecodeChurch,
  evalChurch as lcEvalChurch,
  churchSucc as lcChurchSucc,
  churchAdd as lcChurchAdd,
  churchMul as lcChurchMul,
} from './lambda-calc';
export type {
  Term as LCTerm,
  BetaStrategy as LCBetaStrategy,
  NormalStrategy as LCNormalStrategy,
  NormalizeOpts as LCNormalizeOpts,
  NormalizeResult as LCNormalizeResult,
} from './lambda-calc';

// profile-bridge — traducciones entre perfiles lógicos
export {
  glivenkoTranslation,
  godelTranslation,
  ltlToCTL,
  ctlToLTL,
  findTranslationPath,
  translateFormula,
  TRANSLATIONS,
} from './profile-bridge';
export type { Profile, GenericFormula, Translation } from './profile-bridge';

// tableau-framework — probador semántico por tableau
export { TableauProver, createPropositionalProver } from './tableau-framework';
export type {
  TableauNode,
  TableauBranch,
  Tableau,
  Rule,
  ClosureCondition,
} from './tableau-framework';

// game-semantics — juegos dialógicos IPC (Lorenzen-Felscher)
export {
  winningStrategy,
  play,
  ipcAtom,
  ipcAnd,
  ipcOr,
  ipcImplies,
  ipcNot,
  ipcBottom,
} from './game-semantics';
export type { IPCFormula, Player, Move, GameState } from './game-semantics';

// coinduction — streams coinductivos y bisimulación
export {
  take as streamTake,
  repeat as streamRepeat,
  iterate as streamIterate,
  map as streamMap,
  zipWith as streamZipWith,
  naturals,
  fibonacci,
  isBisimilar,
} from './coinduction';
export type { Stream, BisimulationProof } from './coinduction';

// higher-order-unify — unificación de orden superior
export {
  isPattern as hoIsPattern,
  isHigherOrderPattern,
  unifyPattern as hoUnifyPattern,
  applyHOSubst,
} from './higher-order-unify';
export type { HOTerm, HOSubst } from './higher-order-unify';

// hindley-milner — Algorithm W (Damas-Milner) con let-polimorfismo
export {
  algorithmW as hmAlgorithmW,
  infer as hmInfer,
  inferScheme as hmInferScheme,
  isInferError as hmIsInferError,
  initialEnv as hmInitialEnv,
  normalizeScheme as hmNormalizeScheme,
  unify as hmUnify,
  isUnifyError as hmIsUnifyError,
  applySubst as hmApplySubst,
  composeSubsts as hmComposeSubsts,
  freshTypeVar as hmFreshTypeVar,
  resetFreshSupply as hmResetFreshSupply,
  generalize as hmGeneralize,
  instantiate as hmInstantiate,
  TypeEnv as HMTypeEnv,
  typeToString as hmTypeToString,
  schemeToString as hmSchemeToString,
} from './hindley-milner';
export type {
  Type as HMType,
  TypeScheme as HMTypeScheme,
  Expr as HMExpr,
  Substitution as HMSubstitution,
  InferResult as HMInferResult,
  InferOutcome as HMInferOutcome,
} from './hindley-milner';

// csp-hoare — Communicating Sequential Processes (Hoare 1978/1985).
// Expuesto como namespace porque sus constructores cortos (`prefix`, `choice`,
// `parallel`, `hide`...) colisionarían con otros módulos en el flat export.
export * as CSPHoare from './csp-hoare';

// ── Namespaces semánticos (aditivo, no breaking) ─────────────────────────────
// Re-organiza los símbolos públicos por dominio sin remover los flat exports.
// Uso: `import { Logic, TypeTheory } from '@stevenvo780/st-lang'`.
//
// Nota: el namespace `Semantics` (valor) convive con `type Semantics` ya
// exportado por argumentation usando `export * as` (re-export wildcard), que
// crea un namespace de valor compatible con la fusión de declaraciones de TS.
export * as Logic from './namespaces/logic';
export * as ProofSystems from './namespaces/proof-systems';
export * as TypeTheory from './namespaces/type-theory';
export * as Solvers from './namespaces/solvers';
export * as Reasoning from './namespaces/reasoning';
export * as Semantics from './namespaces/semantics';
