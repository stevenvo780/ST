// ============================================================
// HOL — Conectivas y cuantificadores definidos
// ============================================================
//
// Siguiendo HOL Light, todo se define a partir de la igualdad
// primitiva (`=`) y λ-binding. Cada conectiva es un `const`
// con un tipo polimórfico fijo; las definiciones internas
// (qué λ-término representa) se documentan pero el núcleo no
// las usa directamente — son referencias para constructores
// ergonómicos.
//
// Definiciones canónicas:
//   T            = (λp:bool. p) = (λp:bool. p)
//   ∧ p q        = (λf. f p q) = (λf. f T T)
//   ⇒ p q        = (p ∧ q) = p
//   ∀ (P : α→bool) = P = (λx:α. T)
//   ∃ (P : α→bool) = ∀ q. (∀ x. P x ⇒ q) ⇒ q
//   ∨ p q        = ∀ r. (p ⇒ r) ⇒ (q ⇒ r) ⇒ r
//   ⊥            = ∀ p:bool. p
//   ¬ p          = p ⇒ ⊥

import { HOLTerm, HOLType } from './types';
import { TyBool, funTy, tvar } from './type-system';
import { mkComb, mkConst, typeOf } from './term';

// Constantes -------------------------------------------------

/** Constante `T : bool`. */
export const True: HOLTerm = mkConst('T', TyBool);

/** Constante `⊥ : bool`. */
export const Bottom: HOLTerm = mkConst('F', TyBool);

/** Constante `∧ : bool → bool → bool`. */
export const And: HOLTerm = mkConst('∧', funTy(TyBool, funTy(TyBool, TyBool)));

/** Constante `∨ : bool → bool → bool`. */
export const Or: HOLTerm = mkConst('∨', funTy(TyBool, funTy(TyBool, TyBool)));

/** Constante `¬ : bool → bool`. */
export const Not: HOLTerm = mkConst('¬', funTy(TyBool, TyBool));

/** Constante `⇒ : bool → bool → bool`. */
export const Implies: HOLTerm = mkConst('⇒', funTy(TyBool, funTy(TyBool, TyBool)));

/**
 * Constante `∀ : (α → bool) → bool`. Polimórfica vía la tvar `α`.
 * El consumidor debe usar `mkForall` para instanciar al tipo
 * correcto antes de aplicar.
 */
export const Forall: HOLTerm = mkConst('∀', funTy(funTy(tvar('α'), TyBool), TyBool));

/**
 * Constante `∃ : (α → bool) → bool`. Igual que `∀`, polimórfica.
 */
export const Exists: HOLTerm = mkConst('∃', funTy(funTy(tvar('α'), TyBool), TyBool));

// Constructores ergonómicos ---------------------------------

/** Construye `p ∧ q`. */
export function mkAnd(p: HOLTerm, q: HOLTerm): HOLTerm {
  return mkComb(mkComb(And, p), q);
}

/** Construye `p ∨ q`. */
export function mkOr(p: HOLTerm, q: HOLTerm): HOLTerm {
  return mkComb(mkComb(Or, p), q);
}

/** Construye `¬ p`. */
export function mkNot(p: HOLTerm): HOLTerm {
  return mkComb(Not, p);
}

/** Construye `p ⇒ q`. */
export function mkImplies(p: HOLTerm, q: HOLTerm): HOLTerm {
  return mkComb(mkComb(Implies, p), q);
}

/**
 * Construye `∀x:α. body`. Internamente: `(∀ : (α→bool)→bool) (λx:α. body)`
 * con el `∀` instanciado al tipo correcto.
 */
export function mkForall(param: string, paramType: HOLType, body: HOLTerm): HOLTerm {
  // Instancia el ∀ al tipo del parámetro.
  const forallTy = funTy(funTy(paramType, TyBool), TyBool);
  const forallInst = mkConst('∀', forallTy);
  const lambda: HOLTerm = { kind: 'abs', param, paramType, body };
  return mkComb(forallInst, lambda);
}

/**
 * Construye `∃x:α. body`. Análogo a `mkForall`.
 */
export function mkExists(param: string, paramType: HOLType, body: HOLTerm): HOLTerm {
  const existsTy = funTy(funTy(paramType, TyBool), TyBool);
  const existsInst = mkConst('∃', existsTy);
  const lambda: HOLTerm = { kind: 'abs', param, paramType, body };
  return mkComb(existsInst, lambda);
}

// Helpers para asegurar que un término es bool ---------------

/**
 * Validador: lanza si `t` no tiene tipo `bool`. Útil para checks
 * externos antes de pasarle a `assume` o construir conectivas.
 */
export function assertBool(t: HOLTerm): void {
  const ty = typeOf(t);
  if (ty.kind !== 'tconst' || ty.name !== 'bool') {
    throw new Error(`Se esperaba bool, recibido ${ty.kind === 'tconst' ? ty.name : ty.kind}`);
  }
}
