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
export { LogicProfile, ProfileRegistry, registry } from './logic/profiles/interface';
export { ClassicalPropositional, formulaToString } from './logic/profiles/classical/propositional';
export { ClassicalFirstOrder } from './logic/profiles/classical/first-order';
export { ModalK } from './logic/profiles/modal/k';
export { ParaconsistentBelnap } from './logic/profiles/paraconsistent/belnap';

// SAT Solving (parallelism support)
export { cdcl, cdclAsync } from './logic/profiles/classical/cdcl';
export type { CDCLResult } from './logic/profiles/classical/cdcl';
export { dpll, dpllAsync } from './logic/profiles/classical/dpll';
export { workersAvailable, PARALLEL_THRESHOLD } from './logic/profiles/classical/parallel-sat';

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
} from './semantics/text-layer/compiler';

// Text Layer 2.0 — grafo de claims con dependencias e invalidación propagada
export { ClaimGraph, CycleError } from './semantics/text-layer/v2';
export type {
  Claim,
  ClaimValidation,
  ClaimSource,
  ClaimEvaluator,
} from './semantics/text-layer/v2';

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
} from './proof-systems/proof-minify';
export type {
  GenericProofNode,
  MinifyOptions,
  MinifyResult,
  MinifyRule,
} from './proof-systems/proof-minify';

// Coq exporter
export { exportToCoq, exportProofToCoq } from './tooling/exporters/coq';

// Argumentation (Dung framework)
export {
  computeExtensions,
  isAdmissible,
  isConflictFree,
  defends,
  dotExport,
} from './reasoning/argumentation';
export type { ArgumentationFramework } from './reasoning/argumentation';
// Backward-compat: re-export del tipo `Semantics` de argumentation.
// Declarado localmente (no re-export directo) para permitir el namespace
// homónimo añadido más abajo (declaration merging type + namespace).
import type { Semantics as ArgumentationSemanticsType } from './reasoning/argumentation';
export type Semantics = ArgumentationSemanticsType;

// FOL prover
export { proveFOL, unify, skolemize, toCNF } from './proof-systems/fol-prover';

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
} from './tooling/tptp';
export type {
  TptpFormula,
  TptpProblem,
  TptpAnnotated,
  TptpTerm,
  TptpLanguage,
  TptpRole,
} from './tooling/tptp';

// Proof exchange
export {
  canonicalize,
  hashProof,
  signProof,
  verifyProof,
  generateKeyPair,
} from './proof-systems/proof-exchange';
export type { ProofPackage } from './proof-systems/proof-exchange';

// Time-travel
export { captureSnapshot, SnapshotStore } from './tooling/time-travel';
export type { STSnapshot, SnapshotDiff } from './tooling/time-travel';

// Educational
export { generateExercise, checkAnswer, generateLessonPath } from './tooling/educational';
export type { Exercise, ExerciseLevel, ExerciseKind } from './tooling/educational';

// SMT bridge
export { toSMTLIB, MockSMTBackend, SubprocessSMTBackend, detectAvailableSMT } from './solver/smt';
export type { SMTBackend } from './solver/smt';

// Citation Reasoning (δ3)
export { deriveWithCitations, explainProof } from './reasoning/citation-reasoning';
export type {
  CitedClaim,
  CitationDerivation,
  CitationDerivationResult,
  DerivationStep,
  Evaluator,
} from './reasoning/citation-reasoning';

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
} from './type-theory/curry-howard';
export type {
  PropType,
  LambdaTerm,
  ProofTree,
  ProofRule,
  Context as CHContext,
  InferResult,
} from './type-theory/curry-howard';

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
} from './type-theory/mltt';
export type {
  MLTTTerm,
  InferContext as MLTTInferContext,
  InferResult as MLTTInferResult,
} from './type-theory/mltt';

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
} from './type-theory/lambda-calc';
export type {
  Term as LCTerm,
  BetaStrategy as LCBetaStrategy,
  NormalStrategy as LCNormalStrategy,
  NormalizeOpts as LCNormalizeOpts,
  NormalizeResult as LCNormalizeResult,
} from './type-theory/lambda-calc';

// profile-bridge — traducciones entre perfiles lógicos
export {
  glivenkoTranslation,
  godelTranslation,
  ltlToCTL,
  ctlToLTL,
  findTranslationPath,
  translateFormula,
  TRANSLATIONS,
} from './logic/profile-bridge';
export type { Profile, GenericFormula, Translation } from './logic/profile-bridge';

// tableau-framework — probador semántico por tableau
export { TableauProver, createPropositionalProver } from './proof-systems/tableau-framework';
export type {
  TableauNode,
  TableauBranch,
  Tableau,
  Rule,
  ClosureCondition,
} from './proof-systems/tableau-framework';

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
} from './semantics/game-semantics';
export type { IPCFormula, Player, Move, GameState } from './semantics/game-semantics';

// lemma synthesis — exploración de teoría QuickSpec-style
export {
  enumerateTerms as lsEnumerateTerms,
  synthesizeEqualities,
  pruneConsequences,
  verifyConjectures,
  naturalNumbersSignature,
  booleansSignature,
  listsSignature,
  termToString as lsTermToString,
  freeVars as lsFreeVars,
} from './reasoning/lemma-synthesis';
export type {
  Signature as LSSignature,
  Term as LSTerm,
  Conjecture as LSConjecture,
  SynthesisOptions as LSSynthesisOptions,
  Evaluator as LSEvaluator,
  Prover as LSProver,
  VerifiedConjecture as LSVerifiedConjecture,
} from './reasoning/lemma-synthesis';

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
} from './semantics/coinduction';
export type { Stream, BisimulationProof } from './semantics/coinduction';

// higher-order-unify — unificación de orden superior
export {
  isPattern as hoIsPattern,
  isHigherOrderPattern,
  unifyPattern as hoUnifyPattern,
  applyHOSubst,
} from './proof-systems/higher-order-unify';
export type { HOTerm, HOSubst } from './proof-systems/higher-order-unify';

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
} from './type-theory/hindley-milner';
export type {
  Type as HMType,
  TypeScheme as HMTypeScheme,
  Expr as HMExpr,
  Substitution as HMSubstitution,
  InferResult as HMInferResult,
  InferOutcome as HMInferOutcome,
} from './type-theory/hindley-milner';

// csp-hoare — Communicating Sequential Processes (Hoare 1978/1985).
// Expuesto como namespace porque sus constructores cortos (`prefix`, `choice`,
// `parallel`, `hide`...) colisionarían con otros módulos en el flat export.
export * as CSPHoare from './runtime/csp-hoare';

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

// === Ciclo 3 V4.15 features ===
export * as ProofMining from './reasoning/proof-mining';
export * as STNotebook from './format/stnb';
export * as DLHybrid from './logic/profiles/dl-hybrid';
export * as DLHybridReasoning from './reasoning/dl-hybrid';
export * as LemmaRAG from './reasoning/lemma-rag';
