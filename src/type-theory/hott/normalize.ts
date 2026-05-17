// ============================================================
// HoTT — β-reducción + reglas computacionales sobre caminos
// ============================================================
//
// Reglas β/ι heredadas de MLTT (app, fst, snd) y extendidas:
//
//   transport(P, refl(x), e)        ↦  e
//   J(motive, base, refl(x))        ↦  base
//   pathSym(refl(x))                ↦  refl(x)
//   pathSym(pathSym(p))             ↦  p              (involutividad)
//   pathConcat(refl(x), p)          ↦  p              (identidad izq)
//   pathConcat(p, refl(y))          ↦  p              (identidad der)
//   ap(f, refl(x))                  ↦  refl(f x)
//
// Univalence (ua) NO reduce computacionalmente: el axioma queda
// como término inerte. Esa es la honestidad estándar pre-cubical.

import type { HoTTTerm } from './types';
import { substituteHoTT } from './substitute';

export function reduceStepHoTT(term: HoTTTerm): HoTTTerm {
  switch (term.kind) {
    case 'var':
    case 'universe':
    case 'nat':
    case 'zero':
    case 'circle':
    case 'baseOfCircle':
    case 'loopOfCircle':
      return term;
    case 'app': {
      if (term.fn.kind === 'lam') {
        return substituteHoTT(term.fn.body, term.fn.bind, term.arg);
      }
      const fn2 = reduceStepHoTT(term.fn);
      if (fn2 !== term.fn) return { kind: 'app', fn: fn2, arg: term.arg };
      const arg2 = reduceStepHoTT(term.arg);
      if (arg2 !== term.arg) return { kind: 'app', fn: term.fn, arg: arg2 };
      return term;
    }
    case 'lam': {
      const d2 = reduceStepHoTT(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const b2 = reduceStepHoTT(term.body);
      if (b2 !== term.body) return { ...term, body: b2 };
      return term;
    }
    case 'pi': {
      const d2 = reduceStepHoTT(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const c2 = reduceStepHoTT(term.codomain);
      if (c2 !== term.codomain) return { ...term, codomain: c2 };
      return term;
    }
    case 'sigma': {
      const f2 = reduceStepHoTT(term.first);
      if (f2 !== term.first) return { ...term, first: f2 };
      const s2 = reduceStepHoTT(term.second);
      if (s2 !== term.second) return { ...term, second: s2 };
      return term;
    }
    case 'pair': {
      const f2 = reduceStepHoTT(term.fst);
      if (f2 !== term.fst) return { ...term, fst: f2 };
      const s2 = reduceStepHoTT(term.snd);
      if (s2 !== term.snd) return { ...term, snd: s2 };
      return term;
    }
    case 'fst': {
      if (term.pair.kind === 'pair') return term.pair.fst;
      const p2 = reduceStepHoTT(term.pair);
      if (p2 !== term.pair) return { kind: 'fst', pair: p2 };
      return term;
    }
    case 'snd': {
      if (term.pair.kind === 'pair') return term.pair.snd;
      const p2 = reduceStepHoTT(term.pair);
      if (p2 !== term.pair) return { kind: 'snd', pair: p2 };
      return term;
    }
    case 'path': {
      const t2 = reduceStepHoTT(term.type);
      if (t2 !== term.type) return { ...term, type: t2 };
      const l2 = reduceStepHoTT(term.left);
      if (l2 !== term.left) return { ...term, left: l2 };
      const r2 = reduceStepHoTT(term.right);
      if (r2 !== term.right) return { ...term, right: r2 };
      return term;
    }
    case 'refl': {
      const t2 = reduceStepHoTT(term.term);
      if (t2 !== term.term) return { kind: 'refl', term: t2 };
      return term;
    }
    case 'succ': {
      const a2 = reduceStepHoTT(term.arg);
      if (a2 !== term.arg) return { kind: 'succ', arg: a2 };
      return term;
    }
    case 'transport': {
      // transport(P, refl(x), e) ↦ e
      if (term.path.kind === 'refl') return term.term;
      const fam2 = reduceStepHoTT(term.family);
      if (fam2 !== term.family) return { ...term, family: fam2 };
      const path2 = reduceStepHoTT(term.path);
      if (path2 !== term.path) return { ...term, path: path2 };
      const t2 = reduceStepHoTT(term.term);
      if (t2 !== term.term) return { ...term, term: t2 };
      return term;
    }
    case 'pathSym': {
      // sym(refl x) ↦ refl x
      if (term.path.kind === 'refl') return term.path;
      // sym(sym p) ↦ p
      if (term.path.kind === 'pathSym') return term.path.path;
      const p2 = reduceStepHoTT(term.path);
      if (p2 !== term.path) return { kind: 'pathSym', path: p2 };
      return term;
    }
    case 'pathConcat': {
      // refl · p ↦ p
      if (term.left.kind === 'refl') return term.right;
      // p · refl ↦ p
      if (term.right.kind === 'refl') return term.left;
      const l2 = reduceStepHoTT(term.left);
      if (l2 !== term.left) return { ...term, left: l2 };
      const r2 = reduceStepHoTT(term.right);
      if (r2 !== term.right) return { ...term, right: r2 };
      return term;
    }
    case 'ap': {
      // ap(f, refl x) ↦ refl(f x)
      if (term.path.kind === 'refl') {
        return { kind: 'refl', term: { kind: 'app', fn: term.fn, arg: term.path.term } };
      }
      const fn2 = reduceStepHoTT(term.fn);
      if (fn2 !== term.fn) return { ...term, fn: fn2 };
      const p2 = reduceStepHoTT(term.path);
      if (p2 !== term.path) return { ...term, path: p2 };
      return term;
    }
    case 'jElim': {
      // J(motive, base, refl x) ↦ base
      if (term.path.kind === 'refl') return term.baseCase;
      const m2 = reduceStepHoTT(term.motive);
      if (m2 !== term.motive) return { ...term, motive: m2 };
      const b2 = reduceStepHoTT(term.baseCase);
      if (b2 !== term.baseCase) return { ...term, baseCase: b2 };
      const p2 = reduceStepHoTT(term.path);
      if (p2 !== term.path) return { ...term, path: p2 };
      return term;
    }
    case 'suspension': {
      const t2 = reduceStepHoTT(term.type);
      if (t2 !== term.type) return { kind: 'suspension', type: t2 };
      return term;
    }
    case 'north': {
      const t2 = reduceStepHoTT(term.type);
      if (t2 !== term.type) return { kind: 'north', type: t2 };
      return term;
    }
    case 'south': {
      const t2 = reduceStepHoTT(term.type);
      if (t2 !== term.type) return { kind: 'south', type: t2 };
      return term;
    }
    case 'meridian': {
      const t2 = reduceStepHoTT(term.type);
      if (t2 !== term.type) return { ...term, type: t2 };
      const p2 = reduceStepHoTT(term.point);
      if (p2 !== term.point) return { ...term, point: p2 };
      return term;
    }
    case 'ua': {
      // axioma — no reduce, pero podemos normalizar la equivalencia interna
      const e2 = reduceStepHoTT(term.equiv);
      if (e2 !== term.equiv) return { kind: 'ua', equiv: e2 };
      return term;
    }
  }
}

export function normalizeHoTT(term: HoTTTerm, maxSteps = 1000): HoTTTerm {
  let current = term;
  for (let i = 0; i < maxSteps; i++) {
    const next = reduceStepHoTT(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}

export function isNormalHoTT(term: HoTTTerm): boolean {
  return reduceStepHoTT(term) === term;
}
