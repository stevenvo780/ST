// ============================================================
// TPTP — Barrel
// ============================================================
//
// Parser + emitter para el formato TPTP (Thousands of Problems for
// Theorem Provers), soporte FOF / CNF / TFF light. Incluye un puente
// (`toFolProverFormat`) que convierte un `TptpProblem` al tipo `Formula`
// que entiende `src/fol-prover`.

export type {
  TptpFormula,
  TptpProblem,
  TptpAnnotated,
  TptpTerm,
  TptpLanguage,
  TptpRole,
} from './ast';

export { TPTP_LANGUAGES, TPTP_ROLES } from './ast';

export { TptpTokenizerError, tokenize, type TptpToken, type TptpTokenKind } from './tokenizer';

export { TptpParserError, parseTptp, parseFormula, parseTerm } from './parser';

export { emitTptp, emitFormula, emitTerm } from './emitter';

export {
  toFolProverFormat,
  tptpFormulaToFol,
  annotatedToFol,
  type FolProverBridgeOutput,
} from './bridge';
