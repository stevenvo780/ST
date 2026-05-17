// ============================================================
// Intuitionistic Natural Deduction (NJ) — Tipos
// ============================================================
//
// Sistema NJ de Gentzen para lógica intuicionista proposicional.
// Sin tercero excluido, sin doble negación clásica.
//
// Reglas implementadas:
//   - Conjunción:   ∧I, ∧EL, ∧ER
//   - Disyunción:   ∨IL, ∨IR, ∨E (con descarga)
//   - Implicación:  →I (descarga), →E (modus ponens)
//   - Negación:     ¬I (descarga, deriva ⊥), ¬E (deriva ⊥)
//   - Falsedad:     ⊥E (ex falso quodlibet)
//   - Asunción:     hipótesis del contexto
//
// Convención: `¬φ` se entiende como `φ → ⊥`. La regla `notI` es
// `→I` cuando el consecuente es `⊥`; `notE` es `→E` produciendo
// `⊥` desde `φ` y `¬φ`.

/**
 * Fórmula proposicional intuicionista. No incluye `true` explícito
 * (irrelevante; usar `bottom → bottom` si hace falta).
 */
export type IntuitFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'and'; left: IntuitFormula; right: IntuitFormula }
  | { kind: 'or'; left: IntuitFormula; right: IntuitFormula }
  | { kind: 'implies'; left: IntuitFormula; right: IntuitFormula }
  | { kind: 'not'; arg: IntuitFormula }
  | { kind: 'bottom' };

/**
 * Reglas de prueba NJ. Cada nodo del árbol marca la regla aplicada
 * para llegar a su `conclusion` desde sus `premises`.
 */
export type ProofRule =
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
  | 'bottomE';

/**
 * Árbol de prueba NJ. Las hipótesis abiertas viven implícitamente
 * en el contexto del subárbol; `discharged` lista las hipótesis
 * cerradas por la regla aplicada en este nodo (relevante para →I,
 * ¬I y ∨E).
 */
export interface NJProof {
  conclusion: IntuitFormula;
  rule: ProofRule;
  premises: NJProof[];
  discharged?: IntuitFormula[];
}

/**
 * Modelo de Kripke para IPC: preorden de mundos con valuación
 * persistente. La accesibilidad debe ser reflexiva y transitiva;
 * `forcing` es monótona (si w ⊩ p y w ≤ v entonces v ⊩ p).
 */
export interface KripkeIntuitModel {
  worlds: string[];
  /** Aristas explícitas de la accesibilidad (clausura reflexiva-transitiva implícita). */
  accessibility: Array<[string, string]>;
  /** Por mundo, los átomos forzados. */
  forcing: Map<string, Set<string>>;
}
