// ============================================================
// Natural Deduction NK (Gentzen classical) — Tipos
// ============================================================
//
// Sistema NK de Gentzen para lógica proposicional clásica.
// Extiende NJ (intuicionista) con reglas que justifican el
// tercero excluido / doble negación clásica.
//
// Reglas intuicionistas heredadas (idéntico a NJ):
//   - Conjunción:   ∧I, ∧EL, ∧ER
//   - Disyunción:   ∨IL, ∨IR, ∨E (con descarga)
//   - Implicación:  →I (descarga), →E (modus ponens)
//   - Negación:     ¬I (descarga, deriva ⊥), ¬E (deriva ⊥)
//   - Falsedad:     ⊥E (ex falso quodlibet)
//   - Asunción:     hipótesis del contexto
//
// Reglas clásicas añadidas:
//   - doubleNegE:   ¬¬φ ⊢ φ                 (eliminación doble negación)
//   - LEM:          ⊢ φ ∨ ¬φ                (tercero excluido como axioma)
//   - pierce:       ⊢ ((φ→ψ)→φ)→φ           (ley de Peirce como axioma)
//   - rAA:          asume ¬φ, deriva ⊥, concluye φ (reductio ad absurdum)
//
// La regla rAA es la dual clásica de ¬I: en NJ, asumiendo φ y
// derivando ⊥ se concluye ¬φ; en NK, asumiendo ¬φ y derivando
// ⊥ se concluye φ. Con sólo rAA añadida a NJ se obtiene
// completitud para la lógica clásica proposicional.

/**
 * Fórmula proposicional clásica. Misma forma sintáctica que NJ;
 * la diferencia entre ambas lógicas vive en el sistema de reglas.
 */
export type NKFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'and'; left: NKFormula; right: NKFormula }
  | { kind: 'or'; left: NKFormula; right: NKFormula }
  | { kind: 'implies'; left: NKFormula; right: NKFormula }
  | { kind: 'not'; arg: NKFormula }
  | { kind: 'bottom' };

/**
 * Reglas de prueba NK. Las primeras son las de NJ; las últimas
 * cuatro son los "extras" clásicos.
 */
export type NKRule =
  | 'assumption'
  | 'andI'
  | 'andEL'
  | 'andER'
  | 'orIL'
  | 'orIR'
  | 'orE'
  | 'impI'
  | 'impE'
  | 'notI'
  | 'notE'
  | 'bottomE'
  | 'doubleNegE'
  | 'LEM'
  | 'pierce'
  | 'rAA';

/**
 * Árbol de prueba NK. Las hipótesis abiertas viven implícitamente
 * en el contexto del subárbol; `discharged` lista las hipótesis
 * cerradas por la regla aplicada en este nodo (relevante para →I,
 * ¬I, ∨E y rAA).
 */
export interface NKProof {
  conclusion: NKFormula;
  rule: NKRule;
  premises: NKProof[];
  discharged?: NKFormula[];
}

/**
 * Conjunto de reglas que sólo existen en NK (no en NJ).
 * Útil para detectar si una prueba NK es trasladable a NJ.
 */
export const CLASSICAL_ONLY_RULES: ReadonlyArray<NKRule> = ['doubleNegE', 'LEM', 'pierce', 'rAA'];
