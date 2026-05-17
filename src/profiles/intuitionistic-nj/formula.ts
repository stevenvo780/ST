// ============================================================
// Helpers de fórmulas intuicionistas
// ============================================================

import { IntuitFormula } from './types';

/**
 * Clave sintáctica estable para deduplicación / memoización.
 * Determinista y libre de ambigüedades por paréntesis explícitos.
 */
export function formulaKey(f: IntuitFormula): string {
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

export function formulaEquals(a: IntuitFormula, b: IntuitFormula): boolean {
  return formulaKey(a) === formulaKey(b);
}

export function formulaToString(f: IntuitFormula): string {
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

function parens(f: IntuitFormula): string {
  if (f.kind === 'atom' || f.kind === 'bottom') return formulaToString(f);
  return `(${formulaToString(f)})`;
}

/**
 * Recolecta los átomos proposicionales (por nombre) que aparecen en `f`.
 */
export function collectAtoms(f: IntuitFormula, out: Set<string> = new Set()): Set<string> {
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

export const atom = (name: string): IntuitFormula => ({ kind: 'atom', name });
export const bottom = (): IntuitFormula => ({ kind: 'bottom' });
export const not = (arg: IntuitFormula): IntuitFormula => ({ kind: 'not', arg });
export const and = (left: IntuitFormula, right: IntuitFormula): IntuitFormula => ({
  kind: 'and',
  left,
  right,
});
export const or = (left: IntuitFormula, right: IntuitFormula): IntuitFormula => ({
  kind: 'or',
  left,
  right,
});
export const implies = (left: IntuitFormula, right: IntuitFormula): IntuitFormula => ({
  kind: 'implies',
  left,
  right,
});
