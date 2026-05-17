// ============================================================
// G3 Sequent Calculus — Types
// ============================================================
//
// Calculo de secuentes G3 (Gentzen reformulado por Kleene) para
// logica proposicional clasica. Sus reglas son invertibles, las
// premisas son sub-formulas de la conclusion y el sistema admite
// eliminacion del corte (cut elimination), por lo que la busqueda
// hacia atras es completa y terminante.
//
// Convencion: un secuente Γ ⊢ Δ se representa con `left` y `right`
// como multisets (arrays con duplicados permitidos). El orden no
// importa logicamente pero se preserva para reproducibilidad.

import { Formula } from '../../types';

/**
 * Reglas del calculo G3 (proposicional clasico).
 *
 * - `axiom`        : Γ, A ⊢ A, Δ   (A atomico)
 * - `andL` / `andR`: descomposicion de ∧ a izquierda / derecha
 * - `orL`  / `orR` : descomposicion de ∨
 * - `impL` / `impR`: descomposicion de →
 * - `notL` / `notR`: descomposicion de ¬
 * - `falseL`       : Γ, ⊥ ⊢ Δ es axioma
 * - `trueR`        : Γ ⊢ ⊤, Δ es axioma
 */
export type SequentRule =
  | 'axiom'
  | 'falseL'
  | 'trueR'
  | 'andL'
  | 'andR'
  | 'orL'
  | 'orR'
  | 'impL'
  | 'impR'
  | 'notL'
  | 'notR';

export interface Sequent {
  left: Formula[];
  right: Formula[];
}

export interface ProofTree {
  goal: Sequent;
  rule?: SequentRule;
  /** Formula principal a la que se aplica la regla. */
  principalFormula?: Formula;
  premises: ProofTree[];
  closed: boolean;
}

export interface ProveResult {
  provable: boolean;
  proof?: ProofTree;
}
