// ============================================================
// λ-cálculo untyped — Variables libres, α-renombrado, sustitución
// capture-avoiding
// ============================================================

import type { Term } from './types';

// Free variables del término.
export function freeVars(t: Term): Set<string> {
  const acc = new Set<string>();
  collectFree(t, acc);
  return acc;
}

function collectFree(t: Term, acc: Set<string>): void {
  switch (t.kind) {
    case 'var':
      acc.add(t.name);
      return;
    case 'app':
      collectFree(t.fn, acc);
      collectFree(t.arg, acc);
      return;
    case 'abs': {
      const inner = new Set<string>();
      collectFree(t.body, inner);
      inner.delete(t.param);
      for (const x of inner) acc.add(x);
      return;
    }
  }
}

// Conjunto de todos los nombres mencionados (libres o ligados).
function allNames(t: Term, acc: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'var':
      acc.add(t.name);
      return acc;
    case 'app':
      allNames(t.fn, acc);
      allNames(t.arg, acc);
      return acc;
    case 'abs':
      acc.add(t.param);
      allNames(t.body, acc);
      return acc;
  }
}

// Generador de nombres frescos. Mantiene un contador local para
// reproducibilidad — el patrón es `<base>#<n>`.
export function makeFreshSupply(seed = 0): () => string {
  let n = seed;
  return () => `_x${n++}`;
}

function freshName(base: string, avoid: Set<string>): string {
  // Quita un sufijo `#N` previo para no acumular hashes.
  const stripped = base.replace(/#\d+$/, '');
  let i = 0;
  let candidate = `${stripped}#${i}`;
  while (avoid.has(candidate)) {
    i += 1;
    candidate = `${stripped}#${i}`;
  }
  return candidate;
}

// α-renombra todos los binders del término usando `freshSupply`. Útil
// para canonicalizar términos sin ambigüedad de nombres.
export function alphaRename(t: Term, freshSupply: () => string): Term {
  return rename(t, new Map(), freshSupply);
}

function rename(t: Term, env: Map<string, string>, supply: () => string): Term {
  switch (t.kind) {
    case 'var':
      return { kind: 'var', name: env.get(t.name) ?? t.name };
    case 'app':
      return { kind: 'app', fn: rename(t.fn, env, supply), arg: rename(t.arg, env, supply) };
    case 'abs': {
      const fresh = supply();
      const newEnv = new Map(env);
      newEnv.set(t.param, fresh);
      return { kind: 'abs', param: fresh, body: rename(t.body, newEnv, supply) };
    }
  }
}

// Sustitución capture-avoiding: t[varName := replacement].
// Cuando un binder choca con FV(replacement), α-renombra el binder a
// un nombre fresco antes de descender — evita captura silenciosa.
export function substitute(t: Term, varName: string, replacement: Term): Term {
  const fvRep = freeVars(replacement);
  return subst(t, varName, replacement, fvRep);
}

function subst(t: Term, name: string, value: Term, fvValue: Set<string>): Term {
  switch (t.kind) {
    case 'var':
      return t.name === name ? value : t;
    case 'app':
      return {
        kind: 'app',
        fn: subst(t.fn, name, value, fvValue),
        arg: subst(t.arg, name, value, fvValue),
      };
    case 'abs': {
      if (t.param === name) return t; // ligado: la sustitución se detiene
      if (!fvValue.has(t.param)) {
        return { kind: 'abs', param: t.param, body: subst(t.body, name, value, fvValue) };
      }
      // Captura inminente: renombra el binder.
      const avoid = new Set<string>([...fvValue, ...allNames(t.body)]);
      avoid.add(name);
      const fresh = freshName(t.param, avoid);
      const renamedBody = subst(t.body, t.param, { kind: 'var', name: fresh }, new Set([fresh]));
      return { kind: 'abs', param: fresh, body: subst(renamedBody, name, value, fvValue) };
    }
  }
}
