// ============================================================
// ST μ-calculus — tipos
// ============================================================
// Modal μ-calculus: lógica modal extendida con operadores de
// punto fijo `μ` (least fixed-point) y `ν` (greatest fixed-point).
// Subsume CTL, LTL y PDL: cualquier fórmula CTL puede traducirse
// a μ-cálculo (ver `ctl-translate.ts`).
//
// Sintaxis:
//   φ ::= p | X | ¬φ | φ ∧ φ | φ ∨ φ | □φ | ◇φ | μX. φ | νX. φ
//
// Restricción semántica: las variables ligadas deben aparecer
// bajo un número par de negaciones (positividad / monotonicidad)
// para que los puntos fijos existan por el teorema de Knaster-Tarski.
// ============================================================

/** Variable proposicional ligada por μ/ν. */
export type MuVarName = string;

/** AST del modal μ-calculus. */
export type MuFormula =
  | { kind: 'atom'; name: string }
  | { kind: 'var'; name: MuVarName }
  | { kind: 'not'; arg: MuFormula }
  | { kind: 'and'; left: MuFormula; right: MuFormula }
  | { kind: 'or'; left: MuFormula; right: MuFormula }
  | { kind: 'box'; arg: MuFormula }
  | { kind: 'diamond'; arg: MuFormula }
  | { kind: 'mu'; bind: MuVarName; body: MuFormula }
  | { kind: 'nu'; bind: MuVarName; body: MuFormula };

/**
 * Estructura de Kripke en el formato pedido por la API pública del
 * perfil. `labelling[stateId]` es el conjunto de proposiciones que
 * se cumplen en ese estado.
 *
 * El algoritmo asume estructuras finitas. Estados sin sucesores son
 * "deadlocks": `□φ` se cumple trivialmente, `◇φ` es falso.
 */
export interface KripkeStructure {
  states: string[];
  transitions: Array<[string, string]>;
  labelling: Record<string, Set<string>>;
}

/** Renderiza una fórmula μ-cálculo a notación textual estándar. */
export function muToString(phi: MuFormula): string {
  switch (phi.kind) {
    case 'atom':
      return phi.name;
    case 'var':
      return phi.name;
    case 'not':
      return `¬${muToString(phi.arg)}`;
    case 'and':
      return `(${muToString(phi.left)} ∧ ${muToString(phi.right)})`;
    case 'or':
      return `(${muToString(phi.left)} ∨ ${muToString(phi.right)})`;
    case 'box':
      return `□${muToString(phi.arg)}`;
    case 'diamond':
      return `◇${muToString(phi.arg)}`;
    case 'mu':
      return `μ${phi.bind}. ${muToString(phi.body)}`;
    case 'nu':
      return `ν${phi.bind}. ${muToString(phi.body)}`;
  }
}
