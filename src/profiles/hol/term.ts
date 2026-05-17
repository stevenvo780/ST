// ============================================================
// HOL — Operaciones sobre términos
// ============================================================
//
// Type inference, α-equivalencia, sustitución capture-free,
// detección de variables libres, etc.

import { HOLTerm, HOLType } from './types';
import {
  TyBool,
  funCodomain,
  funDomain,
  funTy,
  isFunType,
  substType,
  typeEq,
  typeToString,
} from './type-system';

// Constructores ergonómicos ------------------------------------

export const mkVar = (name: string, type: HOLType): HOLTerm => ({ kind: 'var', name, type });

export const mkConst = (name: string, type: HOLType): HOLTerm => ({ kind: 'const', name, type });

export const mkComb = (fn: HOLTerm, arg: HOLTerm): HOLTerm => {
  // Bien-formado: el tipo de `fn` debe ser `T(arg) → ?` y los
  // dominios deben coincidir.
  const fnType = typeOf(fn);
  const argType = typeOf(arg);
  if (!isFunType(fnType)) {
    throw new Error(
      `mkComb: el lado izquierdo no es función: ${termToString(fn)} : ${typeToString(fnType)}`,
    );
  }
  if (!typeEq(funDomain(fnType), argType)) {
    throw new Error(
      `mkComb: tipos incompatibles. esperaba ${typeToString(funDomain(fnType))}, ` +
        `recibido ${typeToString(argType)}`,
    );
  }
  return { kind: 'comb', fn, arg };
};

export const mkAbs = (param: string, paramType: HOLType, body: HOLTerm): HOLTerm => ({
  kind: 'abs',
  param,
  paramType,
  body,
});

// Type inference -----------------------------------------------

/**
 * Calcula el tipo de un término bien formado. Lanza si el
 * término está mal tipado (combinación con dominios disjuntos).
 */
export function typeOf(t: HOLTerm): HOLType {
  switch (t.kind) {
    case 'var':
    case 'const':
      return t.type;
    case 'abs':
      return funTy(t.paramType, typeOf(t.body));
    case 'comb': {
      const fnType = typeOf(t.fn);
      const argType = typeOf(t.arg);
      if (!isFunType(fnType)) {
        throw new Error(
          `typeOf: aplicación sobre no-función: ${termToString(t.fn)} : ${typeToString(fnType)}`,
        );
      }
      if (!typeEq(funDomain(fnType), argType)) {
        throw new Error(
          `typeOf: tipos incompatibles en aplicación: ` +
            `${typeToString(funDomain(fnType))} vs ${typeToString(argType)}`,
        );
      }
      return funCodomain(fnType);
    }
  }
}

// α-equivalencia ----------------------------------------------

/**
 * Igualdad estructural módulo α-renaming. Implementación con
 * dos mapas de profundidad (de Bruijn implícito sobre nombres).
 */
export function alphaEq(a: HOLTerm, b: HOLTerm): boolean {
  return alphaEqAux(a, b, new Map(), new Map(), 0);
}

function alphaEqAux(
  a: HOLTerm,
  b: HOLTerm,
  envA: Map<string, number>,
  envB: Map<string, number>,
  depth: number,
): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'var': {
      const bb = b as { kind: 'var'; name: string; type: HOLType };
      // Misma variable: o ambas ligadas a la misma profundidad,
      // o ambas libres con mismo nombre y mismo tipo.
      const da = envA.get(a.name);
      const db = envB.get(bb.name);
      if (da !== undefined && db !== undefined) {
        return da === db && typeEq(a.type, bb.type);
      }
      if (da === undefined && db === undefined) {
        return a.name === bb.name && typeEq(a.type, bb.type);
      }
      return false;
    }
    case 'const': {
      const bb = b as { kind: 'const'; name: string; type: HOLType };
      return a.name === bb.name && typeEq(a.type, bb.type);
    }
    case 'comb': {
      const bb = b as { kind: 'comb'; fn: HOLTerm; arg: HOLTerm };
      return (
        alphaEqAux(a.fn, bb.fn, envA, envB, depth) && alphaEqAux(a.arg, bb.arg, envA, envB, depth)
      );
    }
    case 'abs': {
      const bb = b as { kind: 'abs'; param: string; paramType: HOLType; body: HOLTerm };
      if (!typeEq(a.paramType, bb.paramType)) return false;
      // Sombreamos en ambos environments con la misma profundidad
      // para que las ocurrencias del binder coincidan.
      const nextA = new Map(envA);
      const nextB = new Map(envB);
      nextA.set(a.param, depth);
      nextB.set(bb.param, depth);
      return alphaEqAux(a.body, bb.body, nextA, nextB, depth + 1);
    }
  }
}

// Variables libres / frescas ----------------------------------

interface VarEntry {
  name: string;
  type: HOLType;
}

/**
 * Devuelve las variables libres de `t` con su tipo. Una variable
 * con mismo nombre pero distinto tipo aparece dos veces.
 */
export function freeVars(t: HOLTerm, out: VarEntry[] = []): VarEntry[] {
  const seen = new Set<string>();
  const collect = (term: HOLTerm, bound: Map<string, HOLType>): void => {
    switch (term.kind) {
      case 'var': {
        const boundType = bound.get(term.name);
        if (boundType !== undefined && typeEq(boundType, term.type)) return;
        const key = `${term.name}::${typeToString(term.type)}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ name: term.name, type: term.type });
        return;
      }
      case 'const':
        return;
      case 'comb':
        collect(term.fn, bound);
        collect(term.arg, bound);
        return;
      case 'abs': {
        const next = new Map(bound);
        next.set(term.param, term.paramType);
        collect(term.body, next);
        return;
      }
    }
  };
  collect(t, new Map());
  return out;
}

/**
 * Devuelve true si `name` aparece libre en `term` con tipo `ty`.
 */
export function occursFree(name: string, ty: HOLType, term: HOLTerm): boolean {
  return freeVars(term).some((v) => v.name === name && typeEq(v.type, ty));
}

/** Genera un nombre fresco respecto a un conjunto de nombres prohibidos. */
export function freshName(base: string, forbidden: Set<string>): string {
  if (!forbidden.has(base)) return base;
  let i = 0;
  while (forbidden.has(`${base}'${i}`)) i++;
  return `${base}'${i}`;
}

// Sustitución capture-free -----------------------------------

/**
 * Sustituye [v := value] en `term`. Renombra binders si haría
 * falta para evitar captura. `v` se identifica por nombre + tipo.
 */
export function substTerm(name: string, ty: HOLType, value: HOLTerm, term: HOLTerm): HOLTerm {
  if (!typeEq(typeOf(value), ty)) {
    throw new Error(
      `substTerm: el valor tiene tipo ${typeToString(typeOf(value))}, esperaba ${typeToString(ty)}`,
    );
  }
  return substTermAux(name, ty, value, term, collectAllVarNames(value));
}

function substTermAux(
  name: string,
  ty: HOLType,
  value: HOLTerm,
  term: HOLTerm,
  valueVars: Set<string>,
): HOLTerm {
  switch (term.kind) {
    case 'var':
      if (term.name === name && typeEq(term.type, ty)) return value;
      return term;
    case 'const':
      return term;
    case 'comb':
      return {
        kind: 'comb',
        fn: substTermAux(name, ty, value, term.fn, valueVars),
        arg: substTermAux(name, ty, value, term.arg, valueVars),
      };
    case 'abs': {
      // Si el binder shadowsa exactamente la variable objetivo,
      // la sustitución es identidad dentro del body.
      if (term.param === name && typeEq(term.paramType, ty)) return term;
      // Captura: el binder coincide con una variable libre de `value`.
      if (valueVars.has(term.param) && occursFree(name, ty, term.body)) {
        const forbidden = new Set<string>([...valueVars, ...collectAllVarNames(term.body), name]);
        const fresh = freshName(term.param, forbidden);
        const renamedBody = renameBoundVar(term.param, term.paramType, fresh, term.body);
        return {
          kind: 'abs',
          param: fresh,
          paramType: term.paramType,
          body: substTermAux(name, ty, value, renamedBody, valueVars),
        };
      }
      return {
        kind: 'abs',
        param: term.param,
        paramType: term.paramType,
        body: substTermAux(name, ty, value, term.body, valueVars),
      };
    }
  }
}

/** Renombra ocurrencias libres de `(from : ty)` por `to` en `term`. */
function renameBoundVar(from: string, ty: HOLType, to: string, term: HOLTerm): HOLTerm {
  switch (term.kind) {
    case 'var':
      if (term.name === from && typeEq(term.type, ty)) {
        return { kind: 'var', name: to, type: term.type };
      }
      return term;
    case 'const':
      return term;
    case 'comb':
      return {
        kind: 'comb',
        fn: renameBoundVar(from, ty, to, term.fn),
        arg: renameBoundVar(from, ty, to, term.arg),
      };
    case 'abs': {
      if (term.param === from && typeEq(term.paramType, ty)) return term;
      return {
        kind: 'abs',
        param: term.param,
        paramType: term.paramType,
        body: renameBoundVar(from, ty, to, term.body),
      };
    }
  }
}

function collectAllVarNames(term: HOLTerm, out: Set<string> = new Set()): Set<string> {
  switch (term.kind) {
    case 'var':
      out.add(term.name);
      return out;
    case 'const':
      return out;
    case 'comb':
      collectAllVarNames(term.fn, out);
      return collectAllVarNames(term.arg, out);
    case 'abs':
      out.add(term.param);
      return collectAllVarNames(term.body, out);
  }
}

// Sustitución de variables de tipo en términos ----------------

export function instTypeInTerm(subst: Record<string, HOLType>, term: HOLTerm): HOLTerm {
  switch (term.kind) {
    case 'var':
      return { kind: 'var', name: term.name, type: substType(subst, term.type) };
    case 'const':
      return { kind: 'const', name: term.name, type: substType(subst, term.type) };
    case 'comb':
      return {
        kind: 'comb',
        fn: instTypeInTerm(subst, term.fn),
        arg: instTypeInTerm(subst, term.arg),
      };
    case 'abs':
      return {
        kind: 'abs',
        param: term.param,
        paramType: substType(subst, term.paramType),
        body: instTypeInTerm(subst, term.body),
      };
  }
}

// Pretty-printing --------------------------------------------

export function termToString(t: HOLTerm): string {
  switch (t.kind) {
    case 'var':
      return t.name;
    case 'const':
      return t.name;
    case 'comb':
      return `(${termToString(t.fn)} ${termToString(t.arg)})`;
    case 'abs':
      return `(λ${t.param}:${typeToString(t.paramType)}. ${termToString(t.body)})`;
  }
}

// Igualdad como aplicación primitiva --------------------------

/**
 * Constructor de igualdad polimórfica `= : α → α → bool`.
 * Devuelve la `const` `=` instanciada al tipo del término.
 */
export function eqConst(ty: HOLType): HOLTerm {
  return mkConst('=', funTy(ty, funTy(ty, TyBool)));
}

/** Construye el término `l = r` (chequea que sus tipos coincidan). */
export function mkEq(l: HOLTerm, r: HOLTerm): HOLTerm {
  const ty = typeOf(l);
  if (!typeEq(ty, typeOf(r))) {
    throw new Error(`mkEq: tipos diferentes — ${typeToString(ty)} vs ${typeToString(typeOf(r))}`);
  }
  return mkComb(mkComb(eqConst(ty), l), r);
}

/** Descompone `l = r` en `[l, r]` o null si no es igualdad. */
export function destEq(t: HOLTerm): [HOLTerm, HOLTerm] | null {
  // Forma: ((= ty) l) r
  if (t.kind !== 'comb') return null;
  if (t.fn.kind !== 'comb') return null;
  const head = t.fn.fn;
  if (head.kind !== 'const' || head.name !== '=') return null;
  return [t.fn.arg, t.arg];
}

/** True si `t` es una igualdad de la forma `l = r`. */
export function isEq(t: HOLTerm): boolean {
  return destEq(t) !== null;
}

/** True si `t` es una bi-implicación bool ↔ bool (sintácticamente `=` sobre bool). */
export function isIff(t: HOLTerm): boolean {
  const parts = destEq(t);
  if (parts === null) return false;
  // El término-igualdad tiene tipo bool si los lados son bool.
  return typeEq(typeOf(parts[0]), TyBool);
}
