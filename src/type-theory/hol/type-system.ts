// ============================================================
// HOL — Sistema de tipos
// ============================================================
//
// Tipos simples polimórficos: variables de tipo, constantes y
// aplicaciones. La función `fun(A, B)` representa el flecha.

import { HOLType } from './types';

/** Construye una variable de tipo `α`, `β`, etc. */
export const tvar = (name: string): HOLType => ({ kind: 'tvar', name });

/** Constante de tipo: `bool`, `ind`, ... */
export const tconst = (name: string): HOLType => ({ kind: 'tconst', name });

/** Aplicación de constructor de tipo (e.g. `fun`, `prod`). */
export const tapp = (fn: string, args: HOLType[]): HOLType => ({ kind: 'tapp', fn, args });

// Constantes predefinidas ------------------------------------

export const TyBool: HOLType = tconst('bool');
export const TyInd: HOLType = tconst('ind');

/** `A → B` */
export const funTy = (from: HOLType, to: HOLType): HOLType => tapp('fun', [from, to]);

/** Empareja `A → B → ...` de derecha a izquierda. */
export const funTyN = (...types: HOLType[]): HOLType => {
  if (types.length === 0) {
    throw new Error('funTyN: necesita al menos un tipo');
  }
  if (types.length === 1) {
    return types[0];
  }
  let acc: HOLType = types[types.length - 1];
  for (let i = types.length - 2; i >= 0; i--) {
    acc = funTy(types[i], acc);
  }
  return acc;
};

/**
 * Igualdad estructural de tipos. Las variables de tipo se
 * comparan por nombre (no hay α-renaming sobre tipos en HOL).
 */
export function typeEq(a: HOLType, b: HOLType): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'tvar':
      return a.name === (b as { kind: 'tvar'; name: string }).name;
    case 'tconst':
      return a.name === (b as { kind: 'tconst'; name: string }).name;
    case 'tapp': {
      const bb = b as { kind: 'tapp'; fn: string; args: HOLType[] };
      if (a.fn !== bb.fn) return false;
      if (a.args.length !== bb.args.length) return false;
      for (let i = 0; i < a.args.length; i++) {
        if (!typeEq(a.args[i], bb.args[i])) return false;
      }
      return true;
    }
  }
}

/** Devuelve true si `t` es una flecha `A → B`. */
export function isFunType(t: HOLType): t is { kind: 'tapp'; fn: 'fun'; args: HOLType[] } {
  return t.kind === 'tapp' && t.fn === 'fun' && t.args.length === 2;
}

/** Dominio de una flecha. Lanza si el tipo no es flecha. */
export function funDomain(t: HOLType): HOLType {
  if (!isFunType(t)) {
    throw new Error(`funDomain: el tipo no es una función: ${typeToString(t)}`);
  }
  return t.args[0];
}

/** Codominio de una flecha. Lanza si el tipo no es flecha. */
export function funCodomain(t: HOLType): HOLType {
  if (!isFunType(t)) {
    throw new Error(`funCodomain: el tipo no es una función: ${typeToString(t)}`);
  }
  return t.args[1];
}

/** Pretty-printer; útil para mensajes de error y tests. */
export function typeToString(t: HOLType): string {
  switch (t.kind) {
    case 'tvar':
      return t.name;
    case 'tconst':
      return t.name;
    case 'tapp':
      if (t.fn === 'fun' && t.args.length === 2) {
        return `(${typeToString(t.args[0])} → ${typeToString(t.args[1])})`;
      }
      return `${t.fn}(${t.args.map(typeToString).join(', ')})`;
  }
}

/**
 * Sustitución sobre variables de tipo. Aplica `subst` a `t`
 * de manera capture-free (los tipos no tienen binders).
 */
export function substType(subst: Record<string, HOLType>, t: HOLType): HOLType {
  switch (t.kind) {
    case 'tvar':
      return Object.prototype.hasOwnProperty.call(subst, t.name) ? subst[t.name] : t;
    case 'tconst':
      return t;
    case 'tapp':
      return tapp(
        t.fn,
        t.args.map((a) => substType(subst, a)),
      );
  }
}

/** Recolecta los nombres de las variables de tipo libres en `t`. */
export function freeTypeVars(t: HOLType, out: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'tvar':
      out.add(t.name);
      return out;
    case 'tconst':
      return out;
    case 'tapp':
      for (const a of t.args) freeTypeVars(a, out);
      return out;
  }
}
