// ============================================================
// HOL — Reglas primitivas de inferencia
// ============================================================
//
// Núcleo deductivo estilo HOL Light. 10 reglas primitivas:
//
//   REFL                 : |- t = t
//   TRANS                : |- a = b, |- b = c  ⇒  |- a = c
//   MK_COMB              : |- f = g, |- x = y  ⇒  |- f x = g y
//   ABS                  : |- s = t            ⇒  |- (λv.s) = (λv.t)
//   BETA                 : |- (λv.t) v = t
//   ASSUME(p)            : p |- p
//   EQ_MP                : |- p ↔ q, |- p     ⇒  |- q
//   DEDUCT_ANTISYM_RULE  : A |- p, B |- q      ⇒  (A\{q}) ∪ (B\{p}) |- p ↔ q
//   INST_TYPE            : sustitución de tipos
//   INST                 : sustitución de términos en variables libres
//
// Las hipótesis son una multiset modelada como array; al unir
// hipótesis deduplicamos por α-equivalencia.

import { HOLTerm, HOLTheorem, HOLType } from './types';
import { TyBool, funTy, isFunType, typeEq, typeToString } from './type-system';
import {
  alphaEq,
  destEq,
  freeVars,
  instTypeInTerm,
  mkAbs,
  mkComb,
  mkEq,
  mkVar,
  occursFree,
  substTerm,
  termToString,
  typeOf,
} from './term';

// Helpers ----------------------------------------------------

function unionHyps(a: HOLTerm[], b: HOLTerm[]): HOLTerm[] {
  const out: HOLTerm[] = [...a];
  for (const h of b) {
    if (!out.some((existing) => alphaEq(existing, h))) {
      out.push(h);
    }
  }
  return out;
}

function removeHyp(hyps: HOLTerm[], target: HOLTerm): HOLTerm[] {
  let removed = false;
  const out: HOLTerm[] = [];
  for (const h of hyps) {
    if (!removed && alphaEq(h, target)) {
      removed = true;
      continue;
    }
    out.push(h);
  }
  return out;
}

function thm(rule: string, hyps: HOLTerm[], concl: HOLTerm, derived?: HOLTheorem[]): HOLTheorem {
  return Object.freeze({ rule, hyps, concl, derived });
}

// REFL : |- t = t ---------------------------------------------

/** Regla REFL: produce el teorema `⊢ t = t` para cualquier término `t`. */
export function refl(t: HOLTerm): HOLTheorem {
  // typeOf valida bien-formación.
  typeOf(t);
  return thm('REFL', [], mkEq(t, t));
}

// TRANS : |- a = b, |- b = c -> |- a = c ----------------------

/**
 * Regla TRANS: dados `⊢ a = b` y `⊢ b = c` produce `⊢ a = c`.
 * @throws Si alguna premisa no es una igualdad o los extremos no encajan.
 */
export function trans(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem {
  const eq1 = destEq(thm1.concl);
  const eq2 = destEq(thm2.concl);
  if (eq1 === null) {
    throw new Error(`TRANS: la primera premisa no es una igualdad: ${termToString(thm1.concl)}`);
  }
  if (eq2 === null) {
    throw new Error(`TRANS: la segunda premisa no es una igualdad: ${termToString(thm2.concl)}`);
  }
  if (!alphaEq(eq1[1], eq2[0])) {
    throw new Error(
      `TRANS: las premisas no encajan: ${termToString(eq1[1])} ≠ ${termToString(eq2[0])}`,
    );
  }
  return thm('TRANS', unionHyps(thm1.hyps, thm2.hyps), mkEq(eq1[0], eq2[1]), [thm1, thm2]);
}

// MK_COMB : |- f = g, |- x = y -> |- f x = g y ----------------

/**
 * Regla MK_COMB: dados `⊢ f = g` y `⊢ x = y` produce `⊢ f x = g y`.
 * @throws Si alguna premisa no es igualdad o `f` no tiene tipo función.
 */
export function mkCombRule(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem {
  const fg = destEq(thm1.concl);
  const xy = destEq(thm2.concl);
  if (fg === null) {
    throw new Error(`MK_COMB: la primera premisa no es igualdad: ${termToString(thm1.concl)}`);
  }
  if (xy === null) {
    throw new Error(`MK_COMB: la segunda premisa no es igualdad: ${termToString(thm2.concl)}`);
  }
  // mkComb validará compatibilidad de tipos; lo hacemos en orden para
  // dar un mensaje claro si fuesen incompatibles.
  const fxType = typeOf(fg[0]);
  if (!isFunType(fxType)) {
    throw new Error(
      `MK_COMB: lado izquierdo no es función: ${termToString(fg[0])} : ${typeToString(fxType)}`,
    );
  }
  const left = mkComb(fg[0], xy[0]);
  const right = mkComb(fg[1], xy[1]);
  return thm('MK_COMB', unionHyps(thm1.hyps, thm2.hyps), mkEq(left, right), [thm1, thm2]);
}

// ABS : |- s = t -> |- (λv.s) = (λv.t) ------------------------

/**
 * Regla ABS: dado `⊢ s = t` produce `⊢ (λv.s) = (λv.t)`.
 * `v` no puede aparecer libre en las hipótesis de `thm1`.
 * @throws Si `v` no es variable, la premisa no es igualdad, o la condición de variable es violada.
 */
export function abs(v: HOLTerm, thm1: HOLTheorem): HOLTheorem {
  if (v.kind !== 'var') {
    throw new Error(`ABS: el binder debe ser una variable, no ${v.kind}`);
  }
  const eq = destEq(thm1.concl);
  if (eq === null) {
    throw new Error(`ABS: la premisa no es una igualdad: ${termToString(thm1.concl)}`);
  }
  // La variable abstraida no puede aparecer libre en las hipótesis.
  for (const h of thm1.hyps) {
    if (occursFree(v.name, v.type, h)) {
      throw new Error(
        `ABS: la variable ${v.name} aparece libre en una hipótesis: ${termToString(h)}`,
      );
    }
  }
  const lhs = mkAbs(v.name, v.type, eq[0]);
  const rhs = mkAbs(v.name, v.type, eq[1]);
  return thm('ABS', thm1.hyps.slice(), mkEq(lhs, rhs), [thm1]);
}

// BETA : |- (λv.t) v = t --------------------------------------
// HOL Light original: BETA solo acepta el término exacto `(λx.t) x`.
// Para usar β a forma `(λx.t) y` se compone con INST.

/**
 * Regla BETA: dado `(λv.t) v` produce `⊢ (λv.t) v = t`.
 * Solo acepta la forma exacta donde el argumento es el propio binder; usar INST para otros.
 * @throws Si `t` no es una aplicación de lambda o el argumento no coincide con el binder.
 */
export function beta(t: HOLTerm): HOLTheorem {
  if (t.kind !== 'comb' || t.fn.kind !== 'abs') {
    throw new Error(`BETA: necesita una aplicación de λ: ${termToString(t)}`);
  }
  const lambda = t.fn;
  const arg = t.arg;
  if (arg.kind !== 'var' || arg.name !== lambda.param || !typeEq(arg.type, lambda.paramType)) {
    throw new Error(
      `BETA: el argumento debe ser exactamente el binder; usa INST para argumentos arbitrarios. ` +
        `Recibido: ${termToString(arg)}`,
    );
  }
  // Resultado: (λv.body) v = body
  return thm('BETA', [], mkEq(t, lambda.body), []);
}

// ASSUME(p) : p |- p ------------------------------------------

/**
 * Regla ASSUME: produce `p ⊢ p` (hipótesis no descargada).
 * @throws Si `p` no tiene tipo `bool`.
 */
export function assume(p: HOLTerm): HOLTheorem {
  const ty = typeOf(p);
  if (!typeEq(ty, TyBool)) {
    throw new Error(`ASSUME: la hipótesis debe ser de tipo bool, tiene tipo ${typeToString(ty)}`);
  }
  return thm('ASSUME', [p], p);
}

// EQ_MP : |- p = q (bool), |- p -> |- q -----------------------

/**
 * Regla EQ_MP: dados `⊢ p = q` y `⊢ p` produce `⊢ q` (modus ponens vía igualdad booleana).
 * @throws Si la primera premisa no es igualdad de bools, o la segunda no es α-igual al LHS.
 */
export function eqMp(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem {
  const eq = destEq(thm1.concl);
  if (eq === null) {
    throw new Error(`EQ_MP: la primera premisa no es igualdad: ${termToString(thm1.concl)}`);
  }
  if (!typeEq(typeOf(eq[0]), TyBool)) {
    throw new Error(`EQ_MP: la igualdad no es entre booleanos: ${termToString(thm1.concl)}`);
  }
  if (!alphaEq(eq[0], thm2.concl)) {
    throw new Error(
      `EQ_MP: la segunda premisa no es α-igual al LHS: ${termToString(thm2.concl)} vs ${termToString(eq[0])}`,
    );
  }
  return thm('EQ_MP', unionHyps(thm1.hyps, thm2.hyps), eq[1], [thm1, thm2]);
}

// DEDUCT_ANTISYM_RULE -----------------------------------------
//   A |- p, B |- q -> (A - {q}) ∪ (B - {p}) |- p ↔ q
//
// Equivalente: deriva la bi-implicación a partir de dos
// teoremas que se "implican" via descarga de hipótesis.

/**
 * Regla DEDUCT_ANTISYM_RULE: dados `A ⊢ p` y `B ⊢ q` produce
 * `(A \ {q}) ∪ (B \ {p}) ⊢ p ↔ q`.
 * @throws Si alguna conclusión no es de tipo `bool`.
 */
export function deductAntisymRule(thm1: HOLTheorem, thm2: HOLTheorem): HOLTheorem {
  if (!typeEq(typeOf(thm1.concl), TyBool)) {
    throw new Error(`DEDUCT_ANTISYM_RULE: thm1 no es bool: ${termToString(thm1.concl)}`);
  }
  if (!typeEq(typeOf(thm2.concl), TyBool)) {
    throw new Error(`DEDUCT_ANTISYM_RULE: thm2 no es bool: ${termToString(thm2.concl)}`);
  }
  const p = thm1.concl;
  const q = thm2.concl;
  const hyps = unionHyps(removeHyp(thm1.hyps, q), removeHyp(thm2.hyps, p));
  return thm('DEDUCT_ANTISYM_RULE', hyps, mkEq(p, q), [thm1, thm2]);
}

// INST_TYPE : sustitución de variables de tipo ----------------

/**
 * Regla INST_TYPE: instancia variables de tipo en `thm1` según `subst`.
 * Deduplica hipótesis que colapsen tras la sustitución.
 */
export function instType(subst: Record<string, HOLType>, thm1: HOLTheorem): HOLTheorem {
  const newHyps = thm1.hyps.map((h) => instTypeInTerm(subst, h));
  const newConcl = instTypeInTerm(subst, thm1.concl);
  // Deduplicamos hipótesis tras la sustitución porque pueden
  // colapsar (e.g. P[α] y P[β] con α↦β).
  const dedup: HOLTerm[] = [];
  for (const h of newHyps) {
    if (!dedup.some((existing) => alphaEq(existing, h))) dedup.push(h);
  }
  return thm('INST_TYPE', dedup, newConcl, [thm1]);
}

// INST : sustitución de variables libres ----------------------

interface InstEntry {
  name: string;
  type: HOLType;
  value: HOLTerm;
}

/**
 * Sustituye variables libres en `thm1` según `subst`. El mapa
 * usa keys `name::typeString` para distinguir variables con
 * mismo nombre y distinto tipo.
 */
export function inst(subst: Record<string, HOLTerm>, thm1: HOLTheorem): HOLTheorem {
  // El usuario provee `Record<string, HOLTerm>`: las keys son
  // los nombres de variables. Inferimos el tipo de la variable
  // a partir del valor (debe coincidir con el de la ocurrencia
  // libre). Si una variable libre tiene mismo nombre pero
  // distintos tipos en distintos lugares, esta API es ambigua;
  // recomendamos pasar `instTyped` (más abajo) en ese caso.
  const entries: InstEntry[] = Object.entries(subst).map(([name, value]) => ({
    name,
    type: typeOf(value),
    value,
  }));
  return instTyped(entries, thm1);
}

/**
 * Variante explícita: cada entrada especifica `{ name, type, value }`.
 * Necesaria si dos variables comparten nombre pero distinto tipo.
 */
export function instTyped(entries: InstEntry[], thm1: HOLTheorem): HOLTheorem {
  // Validación: cada `value` debe tener el tipo declarado.
  for (const e of entries) {
    if (!typeEq(typeOf(e.value), e.type)) {
      throw new Error(
        `INST: tipo del valor no coincide con la variable ${e.name}: ` +
          `${typeToString(typeOf(e.value))} vs ${typeToString(e.type)}`,
      );
    }
  }
  // Sustituimos en paralelo: para evitar interferencia con
  // sustituciones encadenadas, primero renombramos las variables
  // a fresh y luego instanciamos. En la práctica, HOL Light hace
  // una sustitución secuencial usando un mapeo y reescribiendo
  // los binders cuando hace falta para evitar captura. Nuestra
  // `substTerm` ya es capture-free, así que sustituimos en orden,
  // pero con un truco para "paralelismo": renombramos cada var
  // a un nombre intermedio único antes de aplicar los valores.
  const intermediate = entries.map((e, i) => ({
    name: e.name,
    type: e.type,
    intermediateName: `__inst${i}__`,
    value: e.value,
  }));

  let curHyps = thm1.hyps.slice();
  let curConcl = thm1.concl;

  // Fase 1: renombrar var(name, type) → var(intermediateName, type)
  for (const e of intermediate) {
    const intermediateVar = mkVar(e.intermediateName, e.type);
    curHyps = curHyps.map((h) => substTerm(e.name, e.type, intermediateVar, h));
    curConcl = substTerm(e.name, e.type, intermediateVar, curConcl);
  }
  // Fase 2: reemplazar intermediateName → value real.
  for (const e of intermediate) {
    curHyps = curHyps.map((h) => substTerm(e.intermediateName, e.type, e.value, h));
    curConcl = substTerm(e.intermediateName, e.type, e.value, curConcl);
  }

  // Dedup tras sustitución.
  const dedup: HOLTerm[] = [];
  for (const h of curHyps) {
    if (!dedup.some((existing) => alphaEq(existing, h))) dedup.push(h);
  }
  return thm('INST', dedup, curConcl, [thm1]);
}

// Exportaciones nombradas finales -----------------------------

export { mkCombRule as mkComb };

// Reexportamos `freeVars` y `funTy` por ergonomía en tests.
export { freeVars, funTy };
