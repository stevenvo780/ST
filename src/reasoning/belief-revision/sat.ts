// ============================================================
// ST Belief Revision — Mini SAT por enumeración (clásico propositional)
// ============================================================
//
// Para las fórmulas y belief sets manejados por AGM, el número de átomos
// típico es pequeño (< 20). Usamos enumeración 2^n directa: simple, exacto
// y suficiente para tests y uso pedagógico. Para casos grandes el caller
// debería usar el SAT solver de st-lang (CDCL).

import type { PropFormula } from './types';
import { collectAtoms } from './parser';

export type Valuation = Record<string, boolean>;

/** Evalúa una fórmula bajo una valuación clásica. */
export function evalFormula(f: PropFormula, v: Valuation): boolean {
  switch (f.kind) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'atom':
      return v[f.name] ?? false;
    case 'not':
      return !evalFormula(f.arg, v);
    case 'and':
      return evalFormula(f.left, v) && evalFormula(f.right, v);
    case 'or':
      return evalFormula(f.left, v) || evalFormula(f.right, v);
    case 'implies':
      return !evalFormula(f.left, v) || evalFormula(f.right, v);
    case 'iff':
      return evalFormula(f.left, v) === evalFormula(f.right, v);
  }
}

/**
 * Enumera todas las valuaciones sobre `atoms` y aplica `predicate`.
 * Retorna `true` apenas alguna satisface (early exit).
 */
function existsValuation(atoms: string[], predicate: (v: Valuation) => boolean): boolean {
  const n = atoms.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask += 1) {
    const v: Valuation = {};
    for (let i = 0; i < n; i += 1) {
      const atom = atoms[i];
      if (atom !== undefined) {
        v[atom] = ((mask >> i) & 1) === 1;
      }
    }
    if (predicate(v)) return true;
  }
  return false;
}

/**
 * ¿Es satisfactible la conjunción de `formulas`?
 * Conjunto vacío → trivialmente satisfactible.
 */
export function isSatisfiable(formulas: PropFormula[]): boolean {
  if (formulas.length === 0) return true;
  const atoms = new Set<string>();
  for (const f of formulas) collectAtoms(f, atoms);
  const atomList = Array.from(atoms);
  // Caso degenerado: ninguna variable proposicional, evaluar con valuación vacía.
  if (atomList.length === 0) {
    return formulas.every((f) => evalFormula(f, {}));
  }
  return existsValuation(atomList, (v) => formulas.every((f) => evalFormula(f, v)));
}

/**
 * ¿K (conjunción de fórmulas) implica φ?
 * Equivalente a: K ∧ ¬φ es insatisfactible.
 */
export function entailsFormula(K: PropFormula[], phi: PropFormula): boolean {
  const negated: PropFormula = { kind: 'not', arg: phi };
  return !isSatisfiable([...K, negated]);
}

/**
 * ¿Son φ y ψ lógicamente equivalentes? (φ ↔ ψ es tautología)
 */
export function areEquivalent(a: PropFormula, b: PropFormula): boolean {
  const iff: PropFormula = { kind: 'iff', left: a, right: b };
  // Es equivalente sii ¬(a↔b) es insatisfactible.
  return !isSatisfiable([{ kind: 'not', arg: iff }]);
}
