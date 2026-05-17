// ============================================================
// HoTT — Sustitución capture-avoiding
// ============================================================

import type { HoTTTerm } from './types';
import { freeVarsHoTT } from './types';

let freshCounter = 0;

function fresh(base: string, avoid: Set<string>): string {
  let candidate = `${base}#h${freshCounter++}`;
  while (avoid.has(candidate)) candidate = `${base}#h${freshCounter++}`;
  return candidate;
}

export function substituteHoTT(term: HoTTTerm, name: string, value: HoTTTerm): HoTTTerm {
  switch (term.kind) {
    case 'var':
      return term.name === name ? value : term;
    case 'universe':
    case 'nat':
    case 'zero':
    case 'circle':
    case 'baseOfCircle':
    case 'loopOfCircle':
      return term;
    case 'pi':
      return substBinder(term, name, value, term.domain, term.codomain, (bind, dom, cod) => ({
        kind: 'pi',
        bind,
        domain: dom,
        codomain: cod,
      }));
    case 'sigma':
      return substBinder(term, name, value, term.first, term.second, (bind, dom, cod) => ({
        kind: 'sigma',
        bind,
        first: dom,
        second: cod,
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
        fn: substituteHoTT(term.fn, name, value),
        arg: substituteHoTT(term.arg, name, value),
      };
    case 'pair':
      return {
        kind: 'pair',
        fst: substituteHoTT(term.fst, name, value),
        snd: substituteHoTT(term.snd, name, value),
      };
    case 'fst':
      return { kind: 'fst', pair: substituteHoTT(term.pair, name, value) };
    case 'snd':
      return { kind: 'snd', pair: substituteHoTT(term.pair, name, value) };
    case 'path':
      return {
        kind: 'path',
        type: substituteHoTT(term.type, name, value),
        left: substituteHoTT(term.left, name, value),
        right: substituteHoTT(term.right, name, value),
      };
    case 'refl':
      return { kind: 'refl', term: substituteHoTT(term.term, name, value) };
    case 'succ':
      return { kind: 'succ', arg: substituteHoTT(term.arg, name, value) };
    case 'transport':
      return {
        kind: 'transport',
        family: substituteHoTT(term.family, name, value),
        path: substituteHoTT(term.path, name, value),
        term: substituteHoTT(term.term, name, value),
      };
    case 'pathSym':
      return { kind: 'pathSym', path: substituteHoTT(term.path, name, value) };
    case 'pathConcat':
      return {
        kind: 'pathConcat',
        left: substituteHoTT(term.left, name, value),
        right: substituteHoTT(term.right, name, value),
      };
    case 'ap':
      return {
        kind: 'ap',
        fn: substituteHoTT(term.fn, name, value),
        path: substituteHoTT(term.path, name, value),
      };
    case 'jElim':
      return {
        kind: 'jElim',
        motive: substituteHoTT(term.motive, name, value),
        baseCase: substituteHoTT(term.baseCase, name, value),
        path: substituteHoTT(term.path, name, value),
      };
    case 'suspension':
      return { kind: 'suspension', type: substituteHoTT(term.type, name, value) };
    case 'north':
      return { kind: 'north', type: substituteHoTT(term.type, name, value) };
    case 'south':
      return { kind: 'south', type: substituteHoTT(term.type, name, value) };
    case 'meridian':
      return {
        kind: 'meridian',
        type: substituteHoTT(term.type, name, value),
        point: substituteHoTT(term.point, name, value),
      };
    case 'ua':
      return { kind: 'ua', equiv: substituteHoTT(term.equiv, name, value) };
  }
}

function substBinder(
  source: { bind: string },
  name: string,
  value: HoTTTerm,
  dom: HoTTTerm,
  cod: HoTTTerm,
  build: (bind: string, dom: HoTTTerm, cod: HoTTTerm) => HoTTTerm,
): HoTTTerm {
  const newDom = substituteHoTT(dom, name, value);
  if (source.bind === name) {
    return build(source.bind, newDom, cod);
  }
  const fv = freeVarsHoTT(value);
  if (fv.has(source.bind)) {
    const newBind = fresh(source.bind, new Set([...fv, ...freeVarsHoTT(cod), name]));
    const renamedCod = substituteHoTT(cod, source.bind, { kind: 'var', name: newBind });
    return build(newBind, newDom, substituteHoTT(renamedCod, name, value));
  }
  return build(source.bind, newDom, substituteHoTT(cod, name, value));
}
