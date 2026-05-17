// ============================================================
// HoTT — α-equivalencia e igualdad definicional (αβ)
// ============================================================

import type { HoTTTerm } from './types';
import { normalizeHoTT } from './normalize';
import { substituteHoTT } from './substitute';

let alphaCounter = 0;

export function alphaEqHoTT(a: HoTTTerm, b: HoTTTerm): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'var':
      return a.name === (b as typeof a).name;
    case 'universe':
      return a.level === (b as typeof a).level;
    case 'nat':
    case 'zero':
    case 'circle':
    case 'baseOfCircle':
    case 'loopOfCircle':
      return true;
    case 'succ':
      return alphaEqHoTT(a.arg, (b as typeof a).arg);
    case 'app': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.fn, bb.fn) && alphaEqHoTT(a.arg, bb.arg);
    }
    case 'pair': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.fst, bb.fst) && alphaEqHoTT(a.snd, bb.snd);
    }
    case 'fst':
    case 'snd': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.pair, bb.pair);
    }
    case 'path': {
      const bb = b as typeof a;
      return (
        alphaEqHoTT(a.type, bb.type) &&
        alphaEqHoTT(a.left, bb.left) &&
        alphaEqHoTT(a.right, bb.right)
      );
    }
    case 'refl':
      return alphaEqHoTT(a.term, (b as typeof a).term);
    case 'pi':
    case 'sigma': {
      const bb = b as typeof a;
      const aDom = a.kind === 'pi' ? a.domain : a.first;
      const bDom = bb.kind === 'pi' ? bb.domain : bb.first;
      const aCod = a.kind === 'pi' ? a.codomain : a.second;
      const bCod = bb.kind === 'pi' ? bb.codomain : bb.second;
      if (!alphaEqHoTT(aDom, bDom)) return false;
      if (a.bind === bb.bind) return alphaEqHoTT(aCod, bCod);
      const fresh = `__αh${alphaCounter++}`;
      return alphaEqHoTT(
        substituteHoTT(aCod, a.bind, { kind: 'var', name: fresh }),
        substituteHoTT(bCod, bb.bind, { kind: 'var', name: fresh }),
      );
    }
    case 'lam': {
      const bb = b as typeof a;
      if (!alphaEqHoTT(a.domain, bb.domain)) return false;
      if (a.bind === bb.bind) return alphaEqHoTT(a.body, bb.body);
      const fresh = `__αh${alphaCounter++}`;
      return alphaEqHoTT(
        substituteHoTT(a.body, a.bind, { kind: 'var', name: fresh }),
        substituteHoTT(bb.body, bb.bind, { kind: 'var', name: fresh }),
      );
    }
    case 'transport': {
      const bb = b as typeof a;
      return (
        alphaEqHoTT(a.family, bb.family) &&
        alphaEqHoTT(a.path, bb.path) &&
        alphaEqHoTT(a.term, bb.term)
      );
    }
    case 'pathSym':
      return alphaEqHoTT(a.path, (b as typeof a).path);
    case 'pathConcat': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.left, bb.left) && alphaEqHoTT(a.right, bb.right);
    }
    case 'ap': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.fn, bb.fn) && alphaEqHoTT(a.path, bb.path);
    }
    case 'jElim': {
      const bb = b as typeof a;
      return (
        alphaEqHoTT(a.motive, bb.motive) &&
        alphaEqHoTT(a.baseCase, bb.baseCase) &&
        alphaEqHoTT(a.path, bb.path)
      );
    }
    case 'suspension':
    case 'north':
    case 'south':
      return alphaEqHoTT(a.type, (b as typeof a).type);
    case 'meridian': {
      const bb = b as typeof a;
      return alphaEqHoTT(a.type, bb.type) && alphaEqHoTT(a.point, bb.point);
    }
    case 'ua':
      return alphaEqHoTT(a.equiv, (b as typeof a).equiv);
  }
}

export function alphaBetaEqHoTT(a: HoTTTerm, b: HoTTTerm, _ctx?: Map<string, HoTTTerm>): boolean {
  return alphaEqHoTT(normalizeHoTT(a), normalizeHoTT(b));
}
