// ============================================================
// Lambda Cube — Sustitución capture-avoiding + β-normalización
// ============================================================
//
// Al ser un Pure Type System, tipos y términos comparten sintaxis.
// La β-reducción ocurre en cualquier sub-término, así que normalize
// también reduce dentro de Π y dentro del dominio de λ.

import type { CubeSystem } from './types';
import { type CubeTerm, alphaEq, freeVars } from './types';

let freshCounter = 0;

function fresh(base: string, avoid: Set<string>): string {
  let candidate = `${base}#${freshCounter++}`;
  while (avoid.has(candidate)) candidate = `${base}#${freshCounter++}`;
  return candidate;
}

/** Sustitución capture-avoiding: term[value/name]. */
export function substitute(term: CubeTerm, name: string, value: CubeTerm): CubeTerm {
  switch (term.kind) {
    case 'var':
      return term.name === name ? value : term;
    case 'sort':
      return term;
    case 'pi':
      return substBinder(term.bind, term.domain, term.codomain, name, value, (b, d, c) => ({
        kind: 'pi',
        bind: b,
        domain: d,
        codomain: c,
      }));
    case 'lam':
      return substBinder(term.bind, term.domain, term.body, name, value, (b, d, c) => ({
        kind: 'lam',
        bind: b,
        domain: d,
        body: c,
      }));
    case 'app':
      return {
        kind: 'app',
        fn: substitute(term.fn, name, value),
        arg: substitute(term.arg, name, value),
      };
  }
}

function substBinder(
  bind: string,
  dom: CubeTerm,
  body: CubeTerm,
  name: string,
  value: CubeTerm,
  build: (b: string, d: CubeTerm, c: CubeTerm) => CubeTerm,
): CubeTerm {
  const newDom = substitute(dom, name, value);
  // Si el binder coincide con `name`, `body` no contiene `name` libre.
  if (bind === name) {
    return build(bind, newDom, body);
  }
  const fv = freeVars(value);
  if (fv.has(bind)) {
    const newBind = fresh(bind, new Set([...fv, ...freeVars(body), name]));
    const renamed = substitute(body, bind, { kind: 'var', name: newBind });
    return build(newBind, newDom, substitute(renamed, name, value));
  }
  return build(bind, newDom, substitute(body, name, value));
}

// ---------- β-reducción ----------

/**
 * Un paso de β-reducción top-down (call-by-name): si el término es
 * `(λ x:A. b) arg`, devuelve `b[arg/x]`. Si no hay redex top-level,
 * intenta reducir en sub-términos.
 */
export function reduceStep(term: CubeTerm): CubeTerm | undefined {
  switch (term.kind) {
    case 'var':
    case 'sort':
      return undefined;
    case 'app': {
      // β-redex top-level
      if (term.fn.kind === 'lam') {
        return substitute(term.fn.body, term.fn.bind, term.arg);
      }
      // Reducir fn primero (call-by-name)
      const fnRed = reduceStep(term.fn);
      if (fnRed) return { kind: 'app', fn: fnRed, arg: term.arg };
      const argRed = reduceStep(term.arg);
      if (argRed) return { kind: 'app', fn: term.fn, arg: argRed };
      return undefined;
    }
    case 'pi': {
      const dom = reduceStep(term.domain);
      if (dom) return { kind: 'pi', bind: term.bind, domain: dom, codomain: term.codomain };
      const cod = reduceStep(term.codomain);
      if (cod) return { kind: 'pi', bind: term.bind, domain: term.domain, codomain: cod };
      return undefined;
    }
    case 'lam': {
      const dom = reduceStep(term.domain);
      if (dom) return { kind: 'lam', bind: term.bind, domain: dom, body: term.body };
      const body = reduceStep(term.body);
      if (body) return { kind: 'lam', bind: term.bind, domain: term.domain, body };
      return undefined;
    }
  }
}

/** Normaliza por reducción a normal-form. `maxSteps` evita loops divergentes. */
export function normalize(term: CubeTerm, _system: CubeSystem, maxSteps = 1000): CubeTerm {
  let current = term;
  for (let i = 0; i < maxSteps; i++) {
    const next = reduceStep(current);
    if (next === undefined) return current;
    current = next;
  }
  return current;
}

/** ¿Dos términos son iguales módulo α y β? */
export function alphaBetaEq(a: CubeTerm, b: CubeTerm, system: CubeSystem): boolean {
  if (alphaEq(a, b)) return true;
  const na = normalize(a, system);
  const nb = normalize(b, system);
  return alphaEq(na, nb);
}

/** ¿El término está en forma normal (no quedan β-redex)? */
export function isNormal(term: CubeTerm): boolean {
  return reduceStep(term) === undefined;
}
