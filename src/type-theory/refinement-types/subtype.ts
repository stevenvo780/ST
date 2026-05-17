// ============================================================
// Refinement types — Subtipado por implicación
// ============================================================
//
// Definición:
//   { x : B | P(x) } <: { y : B | Q(y) }
//     ⟺  B = B'  ∧  ∀x. P(x) ⇒ Q[x/y]
//
// Para tipos arrow se aplica contravarianza en el parámetro y
// covarianza en el resultado, como en sistemas refinados estándar.

import type { RefType, BaseType } from './types';
import { implies, type SolverOpts } from './solver';
import { renameVar } from './predicate';

export interface SubtypeOpts extends SolverOpts {
  /** Predicados adicionales del contexto que pueden asumirse válidos. */
  extraAssumptions?: string[];
}

/**
 * isSubtype — devuelve true si T1 <: T2 bajo las suposiciones del contexto.
 *
 * - Para tipos base iguales: chequea P(x) ⇒ Q(x) renombrando el binding.
 * - Para arrows: contravarianza en `from`, covarianza en `to`.
 */
export function isSubtype(t1: RefType, t2: RefType, opts: SubtypeOpts = {}): boolean {
  return isSubBase(t1.base, t2.base, opts) && isSubRefinement(t1, t2, opts);
}

function isSubBase(b1: BaseType, b2: BaseType, opts: SubtypeOpts): boolean {
  if (typeof b1 === 'string' || typeof b2 === 'string') return b1 === b2;
  // arrow: contravariant en from, covariant en to
  return isSubtype(b2.from, b1.from, opts) && isSubtype(b1.to, b2.to, opts);
}

function isSubRefinement(t1: RefType, t2: RefType, opts: SubtypeOpts): boolean {
  // Renombramos el binding de t2 al de t1 para chequear P(x) ⇒ Q(x).
  const sharedName = t1.binding;
  const p = t1.predicate.trim() === '' ? 'true' : t1.predicate;
  const q = renameVar(t2.predicate.trim() === '' ? 'true' : t2.predicate, t2.binding, sharedName);
  const premises = [p, ...(opts.extraAssumptions ?? [])];
  return implies(premises, q, opts);
}
