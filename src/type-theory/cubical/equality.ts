// ============================================================
// Cubical — α-equivalencia e igualdad definicional (αβ)
// ============================================================

import type { CubicalTerm } from './types';
import { normalizeCubical } from './normalize';
import { substituteCubical } from './substitute';

let alphaCounter = 0;

export function alphaEqCubical(a: CubicalTerm, b: CubicalTerm): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'i0':
    case 'i1':
      return true;
    case 'universe':
      return a.level === (b as typeof a).level;
    case 'var':
    case 'iVar':
      return a.name === (b as typeof a).name;
    case 'iNeg':
      return alphaEqCubical(a.arg, (b as typeof a).arg);
    case 'iMin':
    case 'iMax': {
      const bb = b as typeof a;
      return alphaEqCubical(a.left, bb.left) && alphaEqCubical(a.right, bb.right);
    }
    case 'pathP': {
      const bb = b as typeof a;
      return (
        alphaEqCubical(a.family, bb.family) &&
        alphaEqCubical(a.left, bb.left) &&
        alphaEqCubical(a.right, bb.right)
      );
    }
    case 'pLam': {
      const bb = b as typeof a;
      if (a.bind === bb.bind) return alphaEqCubical(a.body, bb.body);
      const fresh = `__αc${alphaCounter++}`;
      return alphaEqCubical(
        substituteCubical(a.body, a.bind, { kind: 'iVar', name: fresh }),
        substituteCubical(bb.body, bb.bind, { kind: 'iVar', name: fresh }),
      );
    }
    case 'pApp': {
      const bb = b as typeof a;
      return alphaEqCubical(a.path, bb.path) && alphaEqCubical(a.arg, bb.arg);
    }
    case 'glue': {
      const bb = b as typeof a;
      return alphaEqCubical(a.equiv, bb.equiv) && alphaEqCubical(a.partial, bb.partial);
    }
    case 'pi': {
      const bb = b as typeof a;
      if (!alphaEqCubical(a.domain, bb.domain)) return false;
      if (a.bind === bb.bind) return alphaEqCubical(a.codomain, bb.codomain);
      const fresh = `__αc${alphaCounter++}`;
      return alphaEqCubical(
        substituteCubical(a.codomain, a.bind, { kind: 'var', name: fresh }),
        substituteCubical(bb.codomain, bb.bind, { kind: 'var', name: fresh }),
      );
    }
    case 'lam': {
      const bb = b as typeof a;
      if (!alphaEqCubical(a.domain, bb.domain)) return false;
      if (a.bind === bb.bind) return alphaEqCubical(a.body, bb.body);
      const fresh = `__αc${alphaCounter++}`;
      return alphaEqCubical(
        substituteCubical(a.body, a.bind, { kind: 'var', name: fresh }),
        substituteCubical(bb.body, bb.bind, { kind: 'var', name: fresh }),
      );
    }
    case 'app': {
      const bb = b as typeof a;
      return alphaEqCubical(a.fn, bb.fn) && alphaEqCubical(a.arg, bb.arg);
    }
  }
}

export function alphaBetaEqCubical(a: CubicalTerm, b: CubicalTerm): boolean {
  return alphaEqCubical(normalizeCubical(a), normalizeCubical(b));
}
