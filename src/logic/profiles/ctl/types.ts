// ============================================================
// ST CTL — Computation Tree Logic
// ============================================================
// Estructuras de Kripke y AST de fórmulas CTL.
//
// Convenciones:
//  - Operadores de camino "exists" (E) requieren al menos UN camino
//    desde el estado actual que cumpla la propiedad temporal.
//  - Operadores de camino "all" (A) requieren que TODOS los caminos
//    desde el estado actual cumplan la propiedad temporal.
//  - Estados sin sucesores se consideran "deadlock": AX φ es trivialmente
//    verdadero, EX φ es trivialmente falso.
//  - El modelo se asume finito. EG y EU se resuelven con punto fijo.
// ============================================================

/**
 * Estado de una estructura de Kripke.
 *  - `id`     identificador único del estado.
 *  - `labels` proposiciones atómicas que se cumplen en el estado.
 */
export interface KripkeState {
  id: string;
  labels: Set<string>;
}

/**
 * Estructura de Kripke: M = (S, R, L, S0).
 *  - `states`      conjunto de estados con sus etiquetas.
 *  - `transitions` relación R ⊆ S × S codificada como pares [from, to].
 *  - `initial`     subconjunto de estados iniciales (S0).
 */
export interface KripkeStructure {
  states: KripkeState[];
  transitions: Array<[string, string]>;
  initial: string[];
}

/**
 * AST de Computation Tree Logic. Cubre los 8 operadores temporales
 * estándar: EX/AX, EF/AF, EG/AG, EU/AU.
 */
export type CTLFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'true' }
  | { kind: 'false' }
  | { kind: 'not'; arg: CTLFormula }
  | { kind: 'and'; args: CTLFormula[] }
  | { kind: 'or'; args: CTLFormula[] }
  | { kind: 'implies'; left: CTLFormula; right: CTLFormula }
  | { kind: 'EX'; arg: CTLFormula }
  | { kind: 'AX'; arg: CTLFormula }
  | { kind: 'EF'; arg: CTLFormula }
  | { kind: 'AF'; arg: CTLFormula }
  | { kind: 'EG'; arg: CTLFormula }
  | { kind: 'AG'; arg: CTLFormula }
  | { kind: 'EU'; left: CTLFormula; right: CTLFormula }
  | { kind: 'AU'; left: CTLFormula; right: CTLFormula };

/** Renderiza una fórmula CTL a notación textual estándar. */
export function ctlToString(f: CTLFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.name;
    case 'true':
      return '⊤';
    case 'false':
      return '⊥';
    case 'not':
      return `¬${ctlToString(f.arg)}`;
    case 'and':
      return `(${f.args.map(ctlToString).join(' ∧ ')})`;
    case 'or':
      return `(${f.args.map(ctlToString).join(' ∨ ')})`;
    case 'implies':
      return `(${ctlToString(f.left)} → ${ctlToString(f.right)})`;
    case 'EX':
      return `EX ${ctlToString(f.arg)}`;
    case 'AX':
      return `AX ${ctlToString(f.arg)}`;
    case 'EF':
      return `EF ${ctlToString(f.arg)}`;
    case 'AF':
      return `AF ${ctlToString(f.arg)}`;
    case 'EG':
      return `EG ${ctlToString(f.arg)}`;
    case 'AG':
      return `AG ${ctlToString(f.arg)}`;
    case 'EU':
      return `E[${ctlToString(f.left)} U ${ctlToString(f.right)}]`;
    case 'AU':
      return `A[${ctlToString(f.left)} U ${ctlToString(f.right)}]`;
  }
}
