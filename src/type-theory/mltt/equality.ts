// ============================================================
// MLTT — α-equivalencia y igualdad definicional (αβ-equality)
// ============================================================
//
// Igualdad definicional ≡ normalizamos ambos lados (β + ι) y
// comparamos módulo α-renombrado de binders.

import type { MLTTTerm } from './types';
import { normalize } from './normalize';
import { substitute } from './substitute';

/** α-equivalencia estructural sobre términos (no normaliza). */
export function alphaEq(a: MLTTTerm, b: MLTTTerm): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'var':
      return a.name === (b as typeof a).name;
    case 'universe':
      return a.level === (b as typeof a).level;
    case 'nat':
    case 'zero':
      return true;
    case 'succ':
      return alphaEq(a.arg, (b as typeof a).arg);
    case 'app': {
      const bb = b as typeof a;
      return alphaEq(a.fn, bb.fn) && alphaEq(a.arg, bb.arg);
    }
    case 'pair': {
      const bb = b as typeof a;
      return alphaEq(a.fst, bb.fst) && alphaEq(a.snd, bb.snd);
    }
    case 'fst':
    case 'snd': {
      const bb = b as typeof a;
      return alphaEq(a.pair, bb.pair);
    }
    case 'identity': {
      const bb = b as typeof a;
      return alphaEq(a.type, bb.type) && alphaEq(a.left, bb.left) && alphaEq(a.right, bb.right);
    }
    case 'refl':
      return alphaEq(a.term, (b as typeof a).term);
    case 'pi':
    case 'sigma': {
      const bb = b as typeof a;
      const aDom = a.kind === 'pi' ? a.domain : a.first;
      const bDom = bb.kind === 'pi' ? bb.domain : bb.first;
      const aCod = a.kind === 'pi' ? a.codomain : a.second;
      const bCod = bb.kind === 'pi' ? bb.codomain : bb.second;
      if (!alphaEq(aDom, bDom)) return false;
      if (a.bind === bb.bind) return alphaEq(aCod, bCod);
      const fresh = `__α${alphaCounter++}`;
      return alphaEq(
        substitute(aCod, a.bind, { kind: 'var', name: fresh }),
        substitute(bCod, bb.bind, { kind: 'var', name: fresh }),
      );
    }
    case 'lam': {
      const bb = b as typeof a;
      if (!alphaEq(a.domain, bb.domain)) return false;
      if (a.bind === bb.bind) return alphaEq(a.body, bb.body);
      const fresh = `__α${alphaCounter++}`;
      return alphaEq(
        substitute(a.body, a.bind, { kind: 'var', name: fresh }),
        substitute(bb.body, bb.bind, { kind: 'var', name: fresh }),
      );
    }
  }
}

let alphaCounter = 0;

/**
 * Igualdad αβ (definicional): normaliza ambos y luego compara α.
 * `ctx` reservado para implementaciones futuras (η, definitional unfolding).
 */
export function alphaBetaEq(a: MLTTTerm, b: MLTTTerm, _ctx?: Map<string, MLTTTerm>): boolean {
  return alphaEq(normalize(a), normalize(b));
}
