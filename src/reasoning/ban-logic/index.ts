// ============================================================
// BAN Logic — Barrel export
// ============================================================
//
// Burrows-Abadi-Needham logic para verificación de protocolos
// criptográficos de autenticación.
//
// API pública:
//   - Constructores de términos y fórmulas (`principal`, `key`, ...)
//   - Reglas de inferencia (R1-R10 y variantes)
//   - `saturate(initial)` para cerrar un estado bajo las reglas
//   - `analyzeProtocol(p)` para evaluar goals de un Protocol
//   - Protocolos pre-armados: Needham-Schroeder symmetric / PK / Kerberos

export type {
  BANFormula,
  BANRule,
  BANTerm,
  Protocol,
  ProtocolAnalysis,
  ProtocolStep,
} from './types';

export {
  // Constructores de términos
  atom,
  compound,
  encrypted,
  hashed,
  key,
  message,
  nonce,
  principal,
  // Constructores de fórmulas
  believes,
  controls,
  formulaAnd,
  fresh,
  jurisdiction,
  publicKey,
  said,
  saidMessage,
  sees,
  sharedKey,
  sharedSecret,
  // Equality + printing
  formulaEquals,
  formulaToString,
  hasFormula,
  termEquals,
  termToString,
} from './terms';

export {
  applyBeliefConjunction,
  applyBeliefConjunctionRight,
  applyFreshnessPropagation,
  applyJurisdiction,
  applyMessageMeaningPublic,
  applyMessageMeaningSecret,
  applyMessageMeaningShared,
  applyNonceVerification,
  applySaidConjunction,
  applySeeingEncrypted,
  applySeesCompound,
  RULES_REGISTRY,
} from './rules';

export type { SaturateOptions } from './analyze';
export { analyzeProtocol, idealize, saturate } from './analyze';

export { kerberos, needhamSchroederPublicKey, needhamSchroederSymmetric } from './protocols';
