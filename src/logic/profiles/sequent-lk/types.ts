// ============================================================
// LK Sequent Calculus — Types (Gentzen 1934)
// ============================================================
//
// Calculo de secuentes clasico LK de Gentzen. A diferencia de G3,
// LK incluye explicitamente las reglas estructurales (weakening,
// contraccion, intercambio) y la regla de corte (cut). El
// Hauptsatz (teorema fundamental) afirma que toda derivacion en
// LK puede transformarse en una derivacion sin cortes.
//
// Convencion: secuentes multisuccedentes Γ ⊢ Δ con `left` y
// `right` como listas (multisets con orden preservado). Las
// formulas se modelan localmente en `LKFormula` para que el
// perfil pueda evolucionar sin atar el calculo a la representacion
// global de `Formula`.

/** Sintaxis proposicional minima del perfil LK. */
export type LKFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'not'; arg: LKFormula }
  | { kind: 'and'; left: LKFormula; right: LKFormula }
  | { kind: 'or'; left: LKFormula; right: LKFormula }
  | { kind: 'implies'; left: LKFormula; right: LKFormula };

/**
 * Reglas del calculo LK clasico (proposicional).
 *
 *   axiom   : A ⊢ A
 *   cut     : Γ ⊢ Δ, A   y   A, Σ ⊢ Π   ⟹   Γ, Σ ⊢ Δ, Π
 *   weakL   : Γ ⊢ Δ                       ⟹   A, Γ ⊢ Δ
 *   weakR   : Γ ⊢ Δ                       ⟹   Γ ⊢ Δ, A
 *   contrL  : A, A, Γ ⊢ Δ                ⟹   A, Γ ⊢ Δ
 *   contrR  : Γ ⊢ Δ, A, A                ⟹   Γ ⊢ Δ, A
 *   exL     : permuta una formula a la izquierda
 *   exR     : permuta una formula a la derecha
 *   notL    : Γ ⊢ Δ, A                   ⟹   ¬A, Γ ⊢ Δ
 *   notR    : A, Γ ⊢ Δ                   ⟹   Γ ⊢ Δ, ¬A
 *   andL    : A, B, Γ ⊢ Δ                ⟹   A∧B, Γ ⊢ Δ
 *   andR    : Γ ⊢ Δ, A   y   Γ ⊢ Δ, B    ⟹   Γ ⊢ Δ, A∧B
 *   orL     : A, Γ ⊢ Δ   y   B, Γ ⊢ Δ    ⟹   A∨B, Γ ⊢ Δ
 *   orR     : Γ ⊢ Δ, A, B                ⟹   Γ ⊢ Δ, A∨B
 *   impL    : Γ ⊢ Δ, A   y   B, Γ ⊢ Δ    ⟹   A→B, Γ ⊢ Δ
 *   impR    : A, Γ ⊢ Δ, B                ⟹   Γ ⊢ Δ, A→B
 */
export type LKRule =
  | 'axiom'
  | 'cut'
  | 'weakL'
  | 'weakR'
  | 'contrL'
  | 'contrR'
  | 'exL'
  | 'exR'
  | 'notL'
  | 'notR'
  | 'andL'
  | 'andR'
  | 'orL'
  | 'orR'
  | 'impL'
  | 'impR';

export interface LKSequent {
  left: LKFormula[];
  right: LKFormula[];
}

export interface LKProof {
  goal: LKSequent;
  rule: LKRule;
  premises: LKProof[];
  /** Formula que se corta (presente solo cuando `rule === 'cut'`). */
  cutFormula?: LKFormula;
  /** Formula principal a la que se aplica la regla (axioma / logicas). */
  principalFormula?: LKFormula;
}
