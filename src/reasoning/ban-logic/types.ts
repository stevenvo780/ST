// ============================================================
// BAN Logic — Tipos públicos
// ============================================================
//
// Burrows-Abadi-Needham logic (1989): cálculo modal de creencias para
// análisis de protocolos criptográficos de autenticación.
//
// Símbolos (notación estándar BAN):
//
//   P |≡ X      "P believes X"               P cree X
//   P ◁  X      "P sees X"                   P ve X (recibió un mensaje con X)
//   P |~ X      "P once said X"              P dijo X alguna vez
//   P |⇒ X      "P has jurisdiction over X"  P es autoridad sobre X
//   #(X)        "fresh X"                    X es fresco (nonce reciente)
//   P ↔K Q      "K is shared between P, Q"   K es clave compartida
//   |→K P       "K is public key for P"      K es la clave pública de P
//   P ⇌X Q      "X is shared secret"         X es un secreto compartido
//   {X}_K       "X encrypted with K"         X cifrado con K
//   <X>_Y       "X combined with secret Y"   X concatenado con secreto Y
//   H(X)        "hash of X"                  hash de X
//
// Reglas de inferencia clásicas (10): message-meaning (3 variantes:
// shared-key, public-key, shared-secret), nonce-verification,
// jurisdiction, freshness propagation, belief conjunction, seeing rules.

/* ── Términos ── */

/**
 * Un término BAN es un objeto del dominio: principal (agente), clave,
 * nonce, mensaje compuesto, mensaje cifrado, hash o término genérico.
 */
export type BANTerm =
  | { kind: 'principal'; name: string }
  | { kind: 'key'; name: string; shared?: [string, string] }
  | { kind: 'nonce'; name: string }
  | { kind: 'message'; content: BANTerm[] }
  | { kind: 'encrypted'; message: BANTerm; key: BANTerm }
  | { kind: 'hashed'; message: BANTerm }
  | { kind: 'compound'; parts: BANTerm[] }
  | { kind: 'atom'; name: string };

/* ── Fórmulas ── */

/**
 * Una fórmula BAN es una proposición sobre creencias, posesión o
 * propiedades de términos. Es lo que las reglas manipulan.
 *
 * Nota: tratamos `said` y `said-message` por separado porque BAN distingue
 * entre "P dijo una fórmula completa" (raro) y "P dijo un término"
 * (caso usual; lo que aparece en mensajes ciphered).
 */
export type BANFormula =
  | { kind: 'believes'; principal: BANTerm; about: BANFormula }
  | { kind: 'sees'; principal: BANTerm; what: BANTerm }
  | { kind: 'said'; principal: BANTerm; what: BANFormula }
  | { kind: 'said-message'; principal: BANTerm; what: BANTerm }
  | { kind: 'jurisdiction'; principal: BANTerm; over: BANFormula }
  | { kind: 'fresh'; what: BANTerm }
  | { kind: 'sharedKey'; a: BANTerm; b: BANTerm; key: BANTerm }
  | { kind: 'publicKey'; principal: BANTerm; key: BANTerm }
  | { kind: 'sharedSecret'; a: BANTerm; b: BANTerm; secret: BANTerm }
  | { kind: 'controls'; principal: BANTerm; statement: BANFormula }
  | { kind: 'formula-and'; left: BANFormula; right: BANFormula };

/* ── Reglas ── */

export interface BANRule {
  name: string;
  description: string;
}

/* ── Protocolos ── */

export interface ProtocolStep {
  from: string;
  to: string;
  message: BANTerm;
}

export interface Protocol {
  name: string;
  participants: string[];
  initialAssumptions: BANFormula[];
  steps: ProtocolStep[];
  goals: BANFormula[];
}

export interface ProtocolAnalysis {
  satisfied: BANFormula[];
  unsatisfied: BANFormula[];
  trace: BANFormula[];
}
