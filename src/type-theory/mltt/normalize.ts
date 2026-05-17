// ============================================================
// MLTT — β-reducción + reducciones ι (proyecciones, recursión Nat trivial)
// ============================================================
//
// Reglas:
//   β:    (λ (x : A). M) N        ↦  M[N/x]
//   π1:   fst ⟨a, b⟩               ↦  a
//   π2:   snd ⟨a, b⟩               ↦  b
//
// La normalización es congruente: reduce dentro de Π/Σ/λ/Id/refl/succ
// para alcanzar formas normales completas (necesario para igualdad
// definicional de tipos).

import type { MLTTTerm } from './types';
import { substitute } from './substitute';

/** Aplica un único paso de reducción (leftmost-outermost) si hay redex. */
export function reduceStep(term: MLTTTerm): MLTTTerm {
  switch (term.kind) {
    case 'var':
    case 'universe':
    case 'nat':
    case 'zero':
      return term;
    case 'app': {
      if (term.fn.kind === 'lam') {
        return substitute(term.fn.body, term.fn.bind, term.arg);
      }
      const fn2 = reduceStep(term.fn);
      if (fn2 !== term.fn) return { kind: 'app', fn: fn2, arg: term.arg };
      const arg2 = reduceStep(term.arg);
      if (arg2 !== term.arg) return { kind: 'app', fn: term.fn, arg: arg2 };
      return term;
    }
    case 'lam': {
      const d2 = reduceStep(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const b2 = reduceStep(term.body);
      if (b2 !== term.body) return { ...term, body: b2 };
      return term;
    }
    case 'pi': {
      const d2 = reduceStep(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const c2 = reduceStep(term.codomain);
      if (c2 !== term.codomain) return { ...term, codomain: c2 };
      return term;
    }
    case 'sigma': {
      const f2 = reduceStep(term.first);
      if (f2 !== term.first) return { ...term, first: f2 };
      const s2 = reduceStep(term.second);
      if (s2 !== term.second) return { ...term, second: s2 };
      return term;
    }
    case 'pair': {
      const f2 = reduceStep(term.fst);
      if (f2 !== term.fst) return { ...term, fst: f2 };
      const s2 = reduceStep(term.snd);
      if (s2 !== term.snd) return { ...term, snd: s2 };
      return term;
    }
    case 'fst': {
      if (term.pair.kind === 'pair') return term.pair.fst;
      const p2 = reduceStep(term.pair);
      if (p2 !== term.pair) return { kind: 'fst', pair: p2 };
      return term;
    }
    case 'snd': {
      if (term.pair.kind === 'pair') return term.pair.snd;
      const p2 = reduceStep(term.pair);
      if (p2 !== term.pair) return { kind: 'snd', pair: p2 };
      return term;
    }
    case 'identity': {
      const t2 = reduceStep(term.type);
      if (t2 !== term.type) return { ...term, type: t2 };
      const l2 = reduceStep(term.left);
      if (l2 !== term.left) return { ...term, left: l2 };
      const r2 = reduceStep(term.right);
      if (r2 !== term.right) return { ...term, right: r2 };
      return term;
    }
    case 'refl': {
      const t2 = reduceStep(term.term);
      if (t2 !== term.term) return { kind: 'refl', term: t2 };
      return term;
    }
    case 'succ': {
      const a2 = reduceStep(term.arg);
      if (a2 !== term.arg) return { kind: 'succ', arg: a2 };
      return term;
    }
  }
}

/** Normaliza hasta forma normal (o agota `maxSteps`). */
export function normalize(term: MLTTTerm, maxSteps = 1000): MLTTTerm {
  let current = term;
  for (let i = 0; i < maxSteps; i++) {
    const next = reduceStep(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}

export function isNormal(term: MLTTTerm): boolean {
  return reduceStep(term) === term;
}
