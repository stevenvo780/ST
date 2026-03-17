// ============================================================
// ST — Exports públicos
// ============================================================

// API programática (uso recomendado para integración)
export {
  evaluate, parse, check, quickEval,
  createInterpreter, listProfiles,
  hover, symbols, gotoDefinition, completion, render,
  type STEvalResult, type STParseResult, type STCheckResult,
  type STInterpreter, type TheorySummary,
  type STHoverResult, type STRenderResult,
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

// Text Layer
export {
  TextLayerState, createTextLayerState,
  parseAnchorPath, registerPassage, registerFormalization,
  registerClaim, registerSupport, registerConfidence,
  registerContext, compileClaimsToTheory
} from './text-layer/compiler';

// Runtime
export { Interpreter } from './runtime/interpreter';

// Protocol
export { ProtocolHandler } from './protocol/handler';

// REPL
export { REPL } from './repl/repl';
