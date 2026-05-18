// ============================================================
// Hindley-Milner — Sustituciones, unificación, fresh vars
// ============================================================
//
// Sustitución σ : tvar → Type. Aplicar σ a un tipo reemplaza las
// variables libres que aparezcan en su dominio.
//
// composeSubsts(s1, s2) calcula s1 ∘ s2 : primero aplica s2, luego s1.
// El truco habitual es:
//
//    (s1 ∘ s2)(α) = s1 (s2 α)
//
// Implementado como: aplicar s1 a los valores de s2, y añadir las
// entradas de s1 que s2 no tocó.
//
// Unificación es la unificación de primer orden Robinson, con
// occurs-check para impedir tipos infinitos (`α ≡ α → α` falla).

import type { Type, TypeScheme } from './types';
import { schemeFreeVars, typeFreeVars, typeToString } from './types';

/** Sustitución de variables de tipo: mapea nombre de tvar → Type. */
export type Substitution = Map<string, Type>;

/** Crea una sustitución vacía (identidad). */
export const emptySubst = (): Substitution => new Map();

/**
 * Aplica la sustitución `s` al tipo `t`, siguiendo cadenas de tvars.
 * Si `s` está vacía retorna `t` sin copiar.
 */
export function applySubst(t: Type, s: Substitution): Type {
  if (s.size === 0) return t;
  return applySubstChase(t, s, new Set());
}

function applySubstChase(t: Type, s: Substitution, seen: Set<string>): Type {
  switch (t.kind) {
    case 'tvar': {
      const r = s.get(t.name);
      if (r === undefined) return t;
      if (seen.has(t.name)) return t; // guard contra cadenas cíclicas (no deberían ocurrir tras unify)
      const nextSeen = new Set(seen);
      nextSeen.add(t.name);
      return applySubstChase(r, s, nextSeen);
    }
    case 'tconst':
      return t;
    case 'arrow':
      return {
        kind: 'arrow',
        from: applySubstChase(t.from, s, seen),
        to: applySubstChase(t.to, s, seen),
      };
    case 'tapp':
      return {
        kind: 'tapp',
        fn: t.fn,
        args: t.args.map((a) => applySubstChase(a, s, seen)),
      };
  }
}

/**
 * Aplica `s` a un esquema de tipos, evitando sustituir las variables
 * ligadas por el cuantificador ∀.
 */
export function applySubstScheme(sc: TypeScheme, s: Substitution): TypeScheme {
  if (s.size === 0) return sc;
  // No sustituir las variables ligadas por el ∀.
  let restricted: Substitution = s;
  if (sc.forall.length > 0) {
    restricted = new Map(s);
    for (const b of sc.forall) restricted.delete(b);
    if (restricted.size === 0) return sc;
  }
  return { forall: sc.forall, body: applySubst(sc.body, restricted) };
}

/**
 * Composición `s1 ∘ s2`: primero aplica `s2`, luego `s1`.
 * Implementado como: aplicar `s1` a los valores de `s2` y luego añadir
 * las entradas de `s1` que `s2` no tocó.
 */
export function composeSubsts(s1: Substitution, s2: Substitution): Substitution {
  const result: Substitution = new Map();
  for (const [k, v] of s2) result.set(k, applySubst(v, s1));
  for (const [k, v] of s1) {
    if (!result.has(k)) result.set(k, v);
  }
  return result;
}

// ---------- Generación de variables frescas ----------
//
// freshCounter es módulo-global. resetFreshSupply() permite que los
// tests obtengan nombres reproducibles.
let freshCounter = 0;

/** Reinicia el contador global de variables frescas (útil para tests reproducibles). */
export function resetFreshSupply(): void {
  freshCounter = 0;
}

/**
 * Genera una nueva variable de tipo con nombre `prefix0`, `prefix1`, …
 * El contador es global al módulo; usar `resetFreshSupply()` en tests.
 */
export function freshTypeVar(prefix = 't'): Type {
  const name = `${prefix}${freshCounter++}`;
  return { kind: 'tvar', name };
}

// ---------- Occurs check ----------
// α aparece en t como subtérmino? Si sí, unificarlos crearía un
// tipo recursivo (infinito).
/**
 * Comprueba si la variable `name` aparece en `t` como subtérmino.
 * Unificarlos sin este check crearía un tipo recursivo infinito.
 */
export function occursIn(name: string, t: Type): boolean {
  switch (t.kind) {
    case 'tvar':
      return t.name === name;
    case 'tconst':
      return false;
    case 'arrow':
      return occursIn(name, t.from) || occursIn(name, t.to);
    case 'tapp':
      return t.args.some((a) => occursIn(name, a));
  }
}

// ---------- Unificación Robinson ----------
// Resultado: substitución u (mgu) tal que u(t1) ≡ u(t2). En caso
// de fallo devuelve `{ error }` con detalle.
/** Resultado de unificación: sustitución MGU o descriptor de error. */
export type UnifyResult = Substitution | { error: string };

/** Type guard para detectar un resultado de error de unificación. */
export function isUnifyError(r: UnifyResult): r is { error: string } {
  return typeof r === 'object' && r !== null && !(r instanceof Map) && 'error' in r;
}

/**
 * Unificación de primer orden Robinson con occurs-check.
 * @returns La sustitución MGU `u` tal que `u(t1) ≡ u(t2)`, o `{ error }` si no unifica.
 */
export function unify(t1: Type, t2: Type): UnifyResult {
  if (t1.kind === 'tvar') return bindVar(t1.name, t2);
  if (t2.kind === 'tvar') return bindVar(t2.name, t1);

  if (t1.kind === 'tconst' && t2.kind === 'tconst') {
    if (t1.name === t2.name) return emptySubst();
    return { error: `cannot unify ${t1.name} with ${t2.name}` };
  }

  if (t1.kind === 'arrow' && t2.kind === 'arrow') {
    const sFrom = unify(t1.from, t2.from);
    if (isUnifyError(sFrom)) return sFrom;
    const sTo = unify(applySubst(t1.to, sFrom), applySubst(t2.to, sFrom));
    if (isUnifyError(sTo)) return sTo;
    return composeSubsts(sTo, sFrom);
  }

  if (t1.kind === 'tapp' && t2.kind === 'tapp') {
    if (t1.fn !== t2.fn) return { error: `cannot unify ${t1.fn} with ${t2.fn}` };
    if (t1.args.length !== t2.args.length) {
      return {
        error: `arity mismatch on ${t1.fn}: ${t1.args.length} vs ${t2.args.length}`,
      };
    }
    let s: Substitution = emptySubst();
    for (let i = 0; i < t1.args.length; i++) {
      const a1 = applySubst(t1.args[i], s);
      const a2 = applySubst(t2.args[i], s);
      const step = unify(a1, a2);
      if (isUnifyError(step)) return step;
      s = composeSubsts(step, s);
    }
    return s;
  }

  return {
    error: `cannot unify ${describeKind(t1)} with ${describeKind(t2)}`,
  };
}

function describeKind(t: Type): string {
  switch (t.kind) {
    case 'tvar':
      return `tvar ${t.name}`;
    case 'tconst':
      return t.name;
    case 'arrow':
      return 'function type';
    case 'tapp':
      return `${t.fn} type constructor`;
  }
}

function bindVar(name: string, t: Type): UnifyResult {
  if (t.kind === 'tvar' && t.name === name) return emptySubst();
  if (occursIn(name, t)) {
    return { error: `occurs check failed: ${name} occurs in ${typeToString(t)}` };
  }
  const s: Substitution = new Map();
  s.set(name, t);
  return s;
}

// ---------- generalize / instantiate ----------
//
// generalize cierra los tipos libres que no están en el entorno: es
// la regla que convierte un monotipo en un esquema polimórfico. Sólo
// debe llamarse al tipar la RHS de un `let`.
//
// instantiate abre un esquema reemplazando cada cuantificador con una
// variable fresca: es la regla que vuelve a "abrir" un binding cuando
// se usa una variable polimórfica.

/**
 * Generaliza `t` cerrando las variables libres que no están en el entorno.
 * Solo debe llamarse al tipar la RHS de un `let`.
 * @param envFreeVars - Variables libres presentes en el entorno actual.
 */
export function generalize(envFreeVars: Set<string>, t: Type): TypeScheme {
  const tFv = typeFreeVars(t);
  const quantified: string[] = [];
  for (const v of tFv) {
    if (!envFreeVars.has(v)) quantified.push(v);
  }
  // orden estable para que la salida sea reproducible.
  quantified.sort();
  return { forall: quantified, body: t };
}

/**
 * Abre un esquema polimórfico reemplazando cada cuantificador con una
 * variable de tipo fresca. Usada cuando se usa una variable polimórfica.
 */
export function instantiate(sc: TypeScheme): Type {
  if (sc.forall.length === 0) return sc.body;
  const s: Substitution = new Map();
  for (const b of sc.forall) {
    s.set(b, freshTypeVar('t'));
  }
  return applySubst(sc.body, s);
}

// Útil para mostrar/diff: aplica una sustitución a todo un esquema.
export { schemeFreeVars };
