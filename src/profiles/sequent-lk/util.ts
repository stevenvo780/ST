// ============================================================
// LK — Utilidades sintacticas locales
// ============================================================

import { LKFormula } from './types';

/**
 * Clave canonica de una formula LK. Sirve para comparar igualdad
 * sintactica entre formulas y construir conjuntos/multisets.
 */
export function lkKey(f: LKFormula): string {
  switch (f.kind) {
    case 'atom':
      return `a:${f.name}`;
    case 'not':
      return `n(${lkKey(f.arg)})`;
    case 'and':
      return `&(${lkKey(f.left)},${lkKey(f.right)})`;
    case 'or':
      return `|(${lkKey(f.left)},${lkKey(f.right)})`;
    case 'implies':
      return `>(${lkKey(f.left)},${lkKey(f.right)})`;
  }
}

export function eq(a: LKFormula, b: LKFormula): boolean {
  return lkKey(a) === lkKey(b);
}

/** Devuelve una copia superficial: util para construir premisas sin alias. */
export function cloneSeq<T>(xs: T[]): T[] {
  return xs.slice();
}

export function removeAt<T>(xs: T[], idx: number): T[] {
  const copy = xs.slice();
  copy.splice(idx, 1);
  return copy;
}

/** Quita la primera ocurrencia de una formula identificable por `key`. */
export function removeFirstByKey(xs: LKFormula[], key: string): LKFormula[] {
  const idx = xs.findIndex((f) => lkKey(f) === key);
  if (idx === -1) return xs.slice();
  return removeAt(xs, idx);
}

/** Quita todas las ocurrencias de una formula identificable por `key`. */
export function removeAllByKey(xs: LKFormula[], key: string): LKFormula[] {
  return xs.filter((f) => lkKey(f) !== key);
}

export function containsKey(xs: LKFormula[], key: string): boolean {
  return xs.some((f) => lkKey(f) === key);
}

/** Profundidad de una formula (sub-formulas estrictas). */
export function depth(f: LKFormula): number {
  switch (f.kind) {
    case 'atom':
      return 0;
    case 'not':
      return depth(f.arg) + 1;
    case 'and':
    case 'or':
    case 'implies':
      return Math.max(depth(f.left), depth(f.right)) + 1;
  }
}
