// ============================================================
// Helpers de fórmulas clásicas (NK)
// ============================================================
//
// Estructuralmente idéntico al de NJ; la diferencia con la
// lógica intuicionista no está en la sintaxis sino en las reglas
// admisibles.

import { NKFormula } from './types';

/**
 * Clave sintáctica estable para deduplicación / memoización.
 */
export function formulaKey(f: NKFormula): string {
  switch (f.kind) {
    case 'atom':
      return `A(${f.name})`;
    case 'bottom':
      return '⊥';
    case 'not':
      return `N(${formulaKey(f.arg)})`;
    case 'and':
      return `&(${formulaKey(f.left)},${formulaKey(f.right)})`;
    case 'or':
      return `|(${formulaKey(f.left)},${formulaKey(f.right)})`;
    case 'implies':
      return `>(${formulaKey(f.left)},${formulaKey(f.right)})`;
  }
}

/** Igualdad sintáctica entre dos fórmulas NK por comparación de claves. */
export function formulaEquals(a: NKFormula, b: NKFormula): boolean {
  return formulaKey(a) === formulaKey(b);
}

/** Renderiza una fórmula NK en notación textual (¬, ∧, ∨, →, ⊥). */
export function formulaToString(f: NKFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.name;
    case 'bottom':
      return '⊥';
    case 'not':
      return `¬${parens(f.arg)}`;
    case 'and':
      return `(${formulaToString(f.left)} ∧ ${formulaToString(f.right)})`;
    case 'or':
      return `(${formulaToString(f.left)} ∨ ${formulaToString(f.right)})`;
    case 'implies':
      return `(${formulaToString(f.left)} → ${formulaToString(f.right)})`;
  }
}

function parens(f: NKFormula): string {
  if (f.kind === 'atom' || f.kind === 'bottom') return formulaToString(f);
  return `(${formulaToString(f)})`;
}

/**
 * Recolecta los átomos proposicionales que aparecen en `f`.
 */
export function collectAtoms(f: NKFormula, out: Set<string> = new Set()): Set<string> {
  switch (f.kind) {
    case 'atom':
      out.add(f.name);
      return out;
    case 'bottom':
      return out;
    case 'not':
      return collectAtoms(f.arg, out);
    case 'and':
    case 'or':
    case 'implies':
      collectAtoms(f.left, out);
      return collectAtoms(f.right, out);
  }
}

// Constructores ergonómicos -----------------------------------

/** Átomo proposicional clásico. */
export const atom = (name: string): NKFormula => ({ kind: 'atom', name });
/** Constante de falsedad ⊥. */
export const bottom = (): NKFormula => ({ kind: 'bottom' });
/** Negación: ¬φ. */
export const not = (arg: NKFormula): NKFormula => ({ kind: 'not', arg });
/** Conjunción: left ∧ right. */
export const and = (left: NKFormula, right: NKFormula): NKFormula => ({
  kind: 'and',
  left,
  right,
});
/** Disyunción: left ∨ right. */
export const or = (left: NKFormula, right: NKFormula): NKFormula => ({
  kind: 'or',
  left,
  right,
});
/** Implicación: left → right. */
export const implies = (left: NKFormula, right: NKFormula): NKFormula => ({
  kind: 'implies',
  left,
  right,
});
