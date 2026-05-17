// ============================================================
// Helpers de fórmulas modales
// ============================================================
//
// La estructura {@link ModalFormula} admite tanto campos
// específicos (`arg`, `left`, `right`) como un `args` n-ario para
// flexibilidad. Aquí se normaliza el acceso: las funciones de
// extracción aceptan ambos formatos y los constructores producen
// la forma canónica con campos específicos (+ `args` espejo).

import { ModalFormula } from './types';

// ------------------------------------------------------------
// Acceso normalizado a subfórmulas
// ------------------------------------------------------------

function unary(f: ModalFormula): ModalFormula {
  if (f.arg) return f.arg;
  if (f.args && f.args[0]) return f.args[0];
  throw new Error(`ModalFormula ${f.kind} sin subfórmula`);
}

function binLeft(f: ModalFormula): ModalFormula {
  if (f.left) return f.left;
  if (f.args && f.args[0]) return f.args[0];
  throw new Error(`ModalFormula ${f.kind} sin lado izquierdo`);
}

function binRight(f: ModalFormula): ModalFormula {
  if (f.right) return f.right;
  if (f.args && f.args[1]) return f.args[1];
  throw new Error(`ModalFormula ${f.kind} sin lado derecho`);
}

// ------------------------------------------------------------
// Constructores ergonómicos
// ------------------------------------------------------------

export const atom = (name: string): ModalFormula => ({ kind: 'atom', name });

export const not = (arg: ModalFormula): ModalFormula => ({ kind: 'not', arg, args: [arg] });

export const and = (left: ModalFormula, right: ModalFormula): ModalFormula => ({
  kind: 'and',
  left,
  right,
  args: [left, right],
});

export const or = (left: ModalFormula, right: ModalFormula): ModalFormula => ({
  kind: 'or',
  left,
  right,
  args: [left, right],
});

export const implies = (left: ModalFormula, right: ModalFormula): ModalFormula => ({
  kind: 'implies',
  left,
  right,
  args: [left, right],
});

export const box = (arg: ModalFormula): ModalFormula => ({ kind: 'box', arg, args: [arg] });

export const diamond = (arg: ModalFormula): ModalFormula => ({
  kind: 'diamond',
  arg,
  args: [arg],
});

// ------------------------------------------------------------
// Clave / igualdad / representación
// ------------------------------------------------------------

/**
 * Clave sintáctica determinista para deduplicación.
 */
export function formulaKey(f: ModalFormula): string {
  switch (f.kind) {
    case 'atom':
      return `A(${f.name ?? '?'})`;
    case 'not':
      return `N(${formulaKey(unary(f))})`;
    case 'box':
      return `B(${formulaKey(unary(f))})`;
    case 'diamond':
      return `D(${formulaKey(unary(f))})`;
    case 'and':
      return `&(${formulaKey(binLeft(f))},${formulaKey(binRight(f))})`;
    case 'or':
      return `|(${formulaKey(binLeft(f))},${formulaKey(binRight(f))})`;
    case 'implies':
      return `>(${formulaKey(binLeft(f))},${formulaKey(binRight(f))})`;
  }
}

export function formulaEquals(a: ModalFormula, b: ModalFormula): boolean {
  return formulaKey(a) === formulaKey(b);
}

export function formulaToString(f: ModalFormula): string {
  switch (f.kind) {
    case 'atom':
      return f.name ?? '?';
    case 'not': {
      const inner = unary(f);
      if (inner.kind === 'atom') return `¬${formulaToString(inner)}`;
      return `¬(${formulaToString(inner)})`;
    }
    case 'box':
      return `□${parens(unary(f))}`;
    case 'diamond':
      return `◇${parens(unary(f))}`;
    case 'and':
      return `(${formulaToString(binLeft(f))} ∧ ${formulaToString(binRight(f))})`;
    case 'or':
      return `(${formulaToString(binLeft(f))} ∨ ${formulaToString(binRight(f))})`;
    case 'implies':
      return `(${formulaToString(binLeft(f))} → ${formulaToString(binRight(f))})`;
  }
}

function parens(f: ModalFormula): string {
  if (f.kind === 'atom') return formulaToString(f);
  if (f.kind === 'box' || f.kind === 'diamond') return formulaToString(f);
  return `(${formulaToString(f)})`;
}

// ------------------------------------------------------------
// Átomos
// ------------------------------------------------------------

export function collectAtoms(f: ModalFormula, out: Set<string> = new Set()): Set<string> {
  switch (f.kind) {
    case 'atom':
      if (f.name) out.add(f.name);
      return out;
    case 'not':
    case 'box':
    case 'diamond':
      return collectAtoms(unary(f), out);
    case 'and':
    case 'or':
    case 'implies':
      collectAtoms(binLeft(f), out);
      return collectAtoms(binRight(f), out);
  }
}

// Acceso público a las extracciones normalizadas (útil para
// el motor de tableau y tests).
export const subUnary = unary;
export const subLeft = binLeft;
export const subRight = binRight;
