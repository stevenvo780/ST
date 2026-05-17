// ============================================================
// Cubical — Sustitución capture-avoiding
// ============================================================
//
// Las variables de término y las variables de intervalo viven en
// el mismo espacio sintáctico (ambas son nombres). Sustituimos
// uniformemente; el sustituidor decide por la posición sintáctica
// (var vs iVar) si reemplaza o no.

import type { CubicalTerm } from './types';
import { freeVarsCubical } from './types';

let freshCounter = 0;

function fresh(base: string, avoid: Set<string>): string {
  let candidate = `${base}#c${freshCounter++}`;
  while (avoid.has(candidate)) candidate = `${base}#c${freshCounter++}`;
  return candidate;
}

export function substituteCubical(
  term: CubicalTerm,
  name: string,
  value: CubicalTerm,
): CubicalTerm {
  switch (term.kind) {
    case 'i0':
    case 'i1':
    case 'universe':
      return term;
    case 'var':
      return term.name === name ? value : term;
    case 'iVar':
      return term.name === name ? value : term;
    case 'iMin':
      return {
        kind: 'iMin',
        left: substituteCubical(term.left, name, value),
        right: substituteCubical(term.right, name, value),
      };
    case 'iMax':
      return {
        kind: 'iMax',
        left: substituteCubical(term.left, name, value),
        right: substituteCubical(term.right, name, value),
      };
    case 'iNeg':
      return { kind: 'iNeg', arg: substituteCubical(term.arg, name, value) };
    case 'pathP':
      return {
        kind: 'pathP',
        family: substituteCubical(term.family, name, value),
        left: substituteCubical(term.left, name, value),
        right: substituteCubical(term.right, name, value),
      };
    case 'pLam': {
      if (term.bind === name) return term;
      const fv = freeVarsCubical(value);
      if (fv.has(term.bind)) {
        const newBind = fresh(term.bind, new Set([...fv, ...freeVarsCubical(term.body), name]));
        const renamed = substituteCubical(term.body, term.bind, { kind: 'iVar', name: newBind });
        return { kind: 'pLam', bind: newBind, body: substituteCubical(renamed, name, value) };
      }
      return { kind: 'pLam', bind: term.bind, body: substituteCubical(term.body, name, value) };
    }
    case 'pApp':
      return {
        kind: 'pApp',
        path: substituteCubical(term.path, name, value),
        arg: substituteCubical(term.arg, name, value),
      };
    case 'glue':
      return {
        kind: 'glue',
        equiv: substituteCubical(term.equiv, name, value),
        partial: substituteCubical(term.partial, name, value),
      };
    case 'pi':
      return substBinder(term, name, value, term.domain, term.codomain, (bind, dom, cod) => ({
        kind: 'pi',
        bind,
        domain: dom,
        codomain: cod,
      }));
    case 'lam':
      return substBinder(term, name, value, term.domain, term.body, (bind, dom, body) => ({
        kind: 'lam',
        bind,
        domain: dom,
        body,
      }));
    case 'app':
      return {
        kind: 'app',
        fn: substituteCubical(term.fn, name, value),
        arg: substituteCubical(term.arg, name, value),
      };
  }
}

function substBinder(
  source: { bind: string },
  name: string,
  value: CubicalTerm,
  dom: CubicalTerm,
  cod: CubicalTerm,
  build: (bind: string, dom: CubicalTerm, cod: CubicalTerm) => CubicalTerm,
): CubicalTerm {
  const newDom = substituteCubical(dom, name, value);
  if (source.bind === name) {
    return build(source.bind, newDom, cod);
  }
  const fv = freeVarsCubical(value);
  if (fv.has(source.bind)) {
    const newBind = fresh(source.bind, new Set([...fv, ...freeVarsCubical(cod), name]));
    const renamedCod = substituteCubical(cod, source.bind, { kind: 'var', name: newBind });
    return build(newBind, newDom, substituteCubical(renamedCod, name, value));
  }
  return build(source.bind, newDom, substituteCubical(cod, name, value));
}
