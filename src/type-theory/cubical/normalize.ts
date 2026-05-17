// ============================================================
// Cubical — Reducción β + reglas computacionales del intervalo
// ============================================================
//
// Reglas extendidas vs HoTT:
//
//   (λi. t) @ r           ↦ t[i := r]                  (β para path)
//   ~0 ↦ 1   ~1 ↦ 0   ~(~i) ↦ i                       (involución)
//   0 ∧ i ↦ 0   1 ∧ i ↦ i                              (min)
//   0 ∨ i ↦ i   1 ∨ i ↦ 1                              (max)
//
// Las β estándar (app sobre lam) se heredan literalmente del fragment
// MLTT embebido.

import type { CubicalTerm } from './types';
import { substituteCubical } from './substitute';
import { normalizeInterval } from './interval';

export function reduceStepCubical(term: CubicalTerm): CubicalTerm {
  switch (term.kind) {
    case 'i0':
    case 'i1':
    case 'iVar':
    case 'var':
    case 'universe':
      return term;
    case 'iNeg':
    case 'iMin':
    case 'iMax': {
      const reduced = normalizeInterval(term);
      // normalizeInterval ya es la forma normal: si difiere estructuralmente
      // del original, devolvemos la nueva forma; si no, intentamos reducir
      // sub-componentes en uno de los sub-términos.
      if (!sameKind(reduced, term)) return reduced;
      if (term.kind === 'iNeg') {
        const a2 = reduceStepCubical(term.arg);
        if (a2 !== term.arg) return { kind: 'iNeg', arg: a2 };
        return term;
      }
      const l2 = reduceStepCubical(term.left);
      if (l2 !== term.left) return { ...term, left: l2 };
      const r2 = reduceStepCubical(term.right);
      if (r2 !== term.right) return { ...term, right: r2 };
      return term;
    }
    case 'pathP': {
      const f2 = reduceStepCubical(term.family);
      if (f2 !== term.family) return { ...term, family: f2 };
      const l2 = reduceStepCubical(term.left);
      if (l2 !== term.left) return { ...term, left: l2 };
      const r2 = reduceStepCubical(term.right);
      if (r2 !== term.right) return { ...term, right: r2 };
      return term;
    }
    case 'pLam': {
      const b2 = reduceStepCubical(term.body);
      if (b2 !== term.body) return { kind: 'pLam', bind: term.bind, body: b2 };
      return term;
    }
    case 'pApp': {
      // β del intervalo: (λi. t) @ r ↦ t[i := r]
      if (term.path.kind === 'pLam') {
        return substituteCubical(term.path.body, term.path.bind, term.arg);
      }
      const p2 = reduceStepCubical(term.path);
      if (p2 !== term.path) return { kind: 'pApp', path: p2, arg: term.arg };
      const a2 = reduceStepCubical(term.arg);
      if (a2 !== term.arg) return { kind: 'pApp', path: term.path, arg: a2 };
      return term;
    }
    case 'glue': {
      const e2 = reduceStepCubical(term.equiv);
      if (e2 !== term.equiv) return { kind: 'glue', equiv: e2, partial: term.partial };
      const p2 = reduceStepCubical(term.partial);
      if (p2 !== term.partial) return { kind: 'glue', equiv: term.equiv, partial: p2 };
      return term;
    }
    case 'pi': {
      const d2 = reduceStepCubical(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const c2 = reduceStepCubical(term.codomain);
      if (c2 !== term.codomain) return { ...term, codomain: c2 };
      return term;
    }
    case 'lam': {
      const d2 = reduceStepCubical(term.domain);
      if (d2 !== term.domain) return { ...term, domain: d2 };
      const b2 = reduceStepCubical(term.body);
      if (b2 !== term.body) return { ...term, body: b2 };
      return term;
    }
    case 'app': {
      if (term.fn.kind === 'lam') {
        return substituteCubical(term.fn.body, term.fn.bind, term.arg);
      }
      const fn2 = reduceStepCubical(term.fn);
      if (fn2 !== term.fn) return { kind: 'app', fn: fn2, arg: term.arg };
      const arg2 = reduceStepCubical(term.arg);
      if (arg2 !== term.arg) return { kind: 'app', fn: term.fn, arg: arg2 };
      return term;
    }
  }
}

function sameKind(a: CubicalTerm, b: CubicalTerm): boolean {
  return a.kind === b.kind;
}

export function normalizeCubical(term: CubicalTerm, maxSteps = 1000): CubicalTerm {
  let current = term;
  for (let i = 0; i < maxSteps; i++) {
    const next = reduceStepCubical(current);
    if (deepEqual(next, current)) return current;
    current = next;
  }
  return current;
}

export function isNormalCubical(term: CubicalTerm): boolean {
  return deepEqual(reduceStepCubical(term), term);
}

function deepEqual(a: CubicalTerm, b: CubicalTerm): boolean {
  if (a === b) return true;
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
      return deepEqual(a.arg, (b as typeof a).arg);
    case 'iMin':
    case 'iMax': {
      const bb = b as typeof a;
      return deepEqual(a.left, bb.left) && deepEqual(a.right, bb.right);
    }
    case 'pathP': {
      const bb = b as typeof a;
      return (
        deepEqual(a.family, bb.family) && deepEqual(a.left, bb.left) && deepEqual(a.right, bb.right)
      );
    }
    case 'pLam': {
      const bb = b as typeof a;
      return a.bind === bb.bind && deepEqual(a.body, bb.body);
    }
    case 'pApp': {
      const bb = b as typeof a;
      return deepEqual(a.path, bb.path) && deepEqual(a.arg, bb.arg);
    }
    case 'glue': {
      const bb = b as typeof a;
      return deepEqual(a.equiv, bb.equiv) && deepEqual(a.partial, bb.partial);
    }
    case 'pi': {
      const bb = b as typeof a;
      return (
        a.bind === bb.bind && deepEqual(a.domain, bb.domain) && deepEqual(a.codomain, bb.codomain)
      );
    }
    case 'lam': {
      const bb = b as typeof a;
      return a.bind === bb.bind && deepEqual(a.domain, bb.domain) && deepEqual(a.body, bb.body);
    }
    case 'app': {
      const bb = b as typeof a;
      return deepEqual(a.fn, bb.fn) && deepEqual(a.arg, bb.arg);
    }
  }
}
