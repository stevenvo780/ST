// ============================================================
// Substructural Logics — Types (Linear + Affine)
// ============================================================
//
// Logicas substructurales (Girard 1987 para Linear Logic, y Affine
// como su variante con weakening) controlan los recursos:
//
//   - Linear:  ni contraction ni weakening. Cada formula del
//              contexto se usa exactamente una vez.
//   - Affine:  weakening permitido (descartar hipotesis), pero NO
//              contraction (no duplicar). Cada formula se usa a lo
//              sumo una vez.
//
// Conectivos del fragmento implementado:
//   ⊗  (tensor)     — conjuncion multiplicativa, recursos juntos
//   ⊸  (lollipop)   — implicacion lineal, consume premisa
//   &  (with)       — conjuncion aditiva, elige uno de dos
//   ⊕  (plus)       — disyuncion aditiva, alguno de los dos
//   1               — unidad multiplicativa de ⊗
//   !  (bang)       — exponencial "of course", habilita contraction
//                     y weakening para el sub-recurso marcado
//   ?  (whynot)     — exponencial dual del bang (presente como
//                     constructor; en el fragmento intuicionista
//                     fragmentario no se utiliza en reglas activas)

/**
 * Formulas del lenguaje lineal/afin. Los atomos son neutrales y se
 * comparan por nombre.
 */
export type LinearFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'one' }
  | { kind: 'tensor'; left: LinearFormula; right: LinearFormula }
  | { kind: 'lollipop'; left: LinearFormula; right: LinearFormula }
  | { kind: 'with'; left: LinearFormula; right: LinearFormula }
  | { kind: 'plus'; left: LinearFormula; right: LinearFormula }
  | { kind: 'bang'; arg: LinearFormula }
  | { kind: 'whynot'; arg: LinearFormula };

/**
 * Reglas del calculo (intuicionistico) de secuentes que usamos.
 *
 * El sistema implementado es un calculo de secuentes ILL (Intuitionistic
 * Linear Logic) restringido a un unico sucedente (Γ ⊢ A). Suficiente
 * para los enunciados pedidos en el bench: A ⊸ A, conmutatividad,
 * weakening solo en afin, contraction solo via bang, etc.
 *
 * Notas:
 *   - `weakening` y `contraction` aparecen como reglas estructurales
 *     explicitas; en linear puro estan deshabilitadas. En afin,
 *     `weakening` esta habilitada (no asi `contraction`). En ambos,
 *     `!` da contraction/weakening "locales" sobre el sub-recurso.
 *   - `oneR` cierra el secuente ⊢ 1; `oneL` permite eliminar 1 a
 *     izquierda.
 */
export type SequentRule =
  | 'axiom'
  | 'cut'
  | 'oneR'
  | 'oneL'
  | 'tensorR'
  | 'tensorL'
  | 'lollipopR'
  | 'lollipopL'
  | 'withR'
  | 'withL1'
  | 'withL2'
  | 'plusR1'
  | 'plusR2'
  | 'plusL'
  | 'bangR'
  | 'bangL'
  | 'derelictionL'
  | 'weakening'
  | 'contraction';

/**
 * Secuente intuicionistico Γ ⊢ Δ. En el fragmento que probamos,
 * `right` es de longitud 1 (un solo sucedente); se permite array
 * para preservar simetria con G3 y futuras extensiones a Linear Logic
 * clasica con multiples sucedentes.
 */
export interface LinearSequent {
  left: LinearFormula[];
  right: LinearFormula[];
}

export interface LinearProof {
  conclusion: LinearSequent;
  rule: SequentRule;
  premises: LinearProof[];
}

/**
 * Modo de prueba que controla las reglas estructurales.
 *
 *   - 'linear': ni contraction ni weakening (excepto via `!`).
 *   - 'affine': weakening si, contraction no (excepto via `!`).
 */
export type SubstructuralMode = 'linear' | 'affine';
