// ============================================================
// ST Belief Revision — Tipos AGM
// ============================================================
//
// Implementa operadores AGM (Alchourrón-Gärdenfors-Makinson) sobre
// belief sets propositionales. Las creencias se almacenan como cadenas
// (forma sintáctica) pero la lógica subyacente es clásica propositional.

/**
 * Un belief set K: conjunto de fórmulas (cadenas) más una caché opcional
 * de consistencia. La caché es informativa: las operaciones siempre
 * recalculan la consistencia sobre las fórmulas reales.
 */
export interface BeliefSet {
  formulas: Set<string>;
  consistent?: boolean;
}

/**
 * Orden parcial de "entrenchment" (arraigamiento epistémico).
 * Mapea fórmula → nivel; mayor número = creencia más arraigada
 * (más difícil de remover). Fórmulas no presentes en el mapa se
 * consideran al nivel 0 (default, fácilmente removibles).
 */
export type PartialOrder = Map<string, number>;

/**
 * Representación interna de una fórmula proposicional:
 * - {kind: 'atom', name: 'p'}
 * - {kind: 'not', arg}
 * - {kind: 'and'|'or'|'implies'|'iff', left, right}
 * - {kind: 'true'} | {kind: 'false'}
 */
export type PropFormula =
  | { kind: 'true' }
  | { kind: 'false' }
  | { kind: 'atom'; name: string }
  | { kind: 'not'; arg: PropFormula }
  | { kind: 'and'; left: PropFormula; right: PropFormula }
  | { kind: 'or'; left: PropFormula; right: PropFormula }
  | { kind: 'implies'; left: PropFormula; right: PropFormula }
  | { kind: 'iff'; left: PropFormula; right: PropFormula };
