// ============================================================
// Curry-Howard — β-reducción (estrategia call-by-name / leftmost-outermost)
// ============================================================
//
// Reglas implementadas:
//   (λx:T. M) N           ↦ M[N/x]
//   fst ⟨a, b⟩            ↦ a
//   snd ⟨a, b⟩            ↦ b
//   case (inl v) of L|R   ↦ L[v/leftBind]
//   case (inr v) of L|R   ↦ R[v/rightBind]
//
// `reduceBeta` aplica UN paso. `normalize` itera hasta forma normal
// (con guardia anti-loop para casos patológicos como `(λx. xx)(λx. xx)`).

import type { LambdaTerm } from './types';

export function freeVars(t: LambdaTerm, acc: Set<string> = new Set()): Set<string> {
  switch (t.kind) {
    case 'var':
      acc.add(t.name);
      break;
    case 'app':
      freeVars(t.fn, acc);
      freeVars(t.arg, acc);
      break;
    case 'abs': {
      const inner = freeVars(t.body);
      inner.delete(t.param);
      for (const v of inner) acc.add(v);
      break;
    }
    case 'pair':
      freeVars(t.fst, acc);
      freeVars(t.snd, acc);
      break;
    case 'fst':
      freeVars(t.pair, acc);
      break;
    case 'snd':
      freeVars(t.pair, acc);
      break;
    case 'inl':
      freeVars(t.left, acc);
      break;
    case 'inr':
      freeVars(t.right, acc);
      break;
    case 'case': {
      freeVars(t.scrutinee, acc);
      const lInner = freeVars(t.leftBody);
      lInner.delete(t.leftBind);
      for (const v of lInner) acc.add(v);
      const rInner = freeVars(t.rightBody);
      rInner.delete(t.rightBind);
      for (const v of rInner) acc.add(v);
      break;
    }
    case 'absurd':
      freeVars(t.proofOfFalse, acc);
      break;
  }
  return acc;
}

let freshCounter = 0;
function fresh(base: string, avoid: Set<string>): string {
  let candidate = `${base}#${freshCounter++}`;
  while (avoid.has(candidate)) candidate = `${base}#${freshCounter++}`;
  return candidate;
}

// α-conversion: rebaut el binder si choca con FV del valor sustituido.
function substitute(term: LambdaTerm, name: string, value: LambdaTerm): LambdaTerm {
  switch (term.kind) {
    case 'var':
      return term.name === name ? value : term;
    case 'app':
      return {
        kind: 'app',
        fn: substitute(term.fn, name, value),
        arg: substitute(term.arg, name, value),
      };
    case 'abs': {
      if (term.param === name) return term; // ligado, no sustituir
      const fv = freeVars(value);
      if (fv.has(term.param)) {
        // capture clash → α-rename
        const newName = fresh(term.param, new Set([...fv, ...freeVars(term.body)]));
        const renamedBody = substitute(term.body, term.param, { kind: 'var', name: newName });
        return {
          kind: 'abs',
          param: newName,
          paramType: term.paramType,
          body: substitute(renamedBody, name, value),
        };
      }
      return {
        kind: 'abs',
        param: term.param,
        paramType: term.paramType,
        body: substitute(term.body, name, value),
      };
    }
    case 'pair':
      return {
        kind: 'pair',
        fst: substitute(term.fst, name, value),
        snd: substitute(term.snd, name, value),
      };
    case 'fst':
      return { kind: 'fst', pair: substitute(term.pair, name, value) };
    case 'snd':
      return { kind: 'snd', pair: substitute(term.pair, name, value) };
    case 'inl':
      return { kind: 'inl', left: substitute(term.left, name, value), rightType: term.rightType };
    case 'inr':
      return { kind: 'inr', right: substitute(term.right, name, value), leftType: term.leftType };
    case 'case': {
      const scrutinee = substitute(term.scrutinee, name, value);
      const fv = freeVars(value);
      let { leftBind, rightBind, leftBody, rightBody } = term;
      if (leftBind !== name) {
        if (fv.has(leftBind)) {
          const nb = fresh(leftBind, new Set([...fv, ...freeVars(leftBody)]));
          leftBody = substitute(leftBody, leftBind, { kind: 'var', name: nb });
          leftBind = nb;
        }
        leftBody = substitute(leftBody, name, value);
      }
      if (rightBind !== name) {
        if (fv.has(rightBind)) {
          const nb = fresh(rightBind, new Set([...fv, ...freeVars(rightBody)]));
          rightBody = substitute(rightBody, rightBind, { kind: 'var', name: nb });
          rightBind = nb;
        }
        rightBody = substitute(rightBody, name, value);
      }
      return {
        kind: 'case',
        scrutinee,
        leftBind,
        leftBody,
        rightBind,
        rightBody,
      };
    }
    case 'absurd':
      return {
        kind: 'absurd',
        proofOfFalse: substitute(term.proofOfFalse, name, value),
        resultType: term.resultType,
      };
  }
}

export function substituteTerm(term: LambdaTerm, name: string, value: LambdaTerm): LambdaTerm {
  return substitute(term, name, value);
}

// Un paso de β/proyección/case. Estrategia leftmost-outermost.
// Devuelve el mismo `term` (referencialmente igual) si no había redex.
export function reduceBeta(term: LambdaTerm): LambdaTerm {
  switch (term.kind) {
    case 'var':
      return term;
    case 'app': {
      // β en la cabeza
      if (term.fn.kind === 'abs') {
        return substitute(term.fn.body, term.fn.param, term.arg);
      }
      const fn2 = reduceBeta(term.fn);
      if (fn2 !== term.fn) return { kind: 'app', fn: fn2, arg: term.arg };
      const arg2 = reduceBeta(term.arg);
      if (arg2 !== term.arg) return { kind: 'app', fn: term.fn, arg: arg2 };
      return term;
    }
    case 'abs': {
      const b2 = reduceBeta(term.body);
      if (b2 !== term.body)
        return { kind: 'abs', param: term.param, paramType: term.paramType, body: b2 };
      return term;
    }
    case 'fst': {
      if (term.pair.kind === 'pair') return term.pair.fst;
      const p2 = reduceBeta(term.pair);
      if (p2 !== term.pair) return { kind: 'fst', pair: p2 };
      return term;
    }
    case 'snd': {
      if (term.pair.kind === 'pair') return term.pair.snd;
      const p2 = reduceBeta(term.pair);
      if (p2 !== term.pair) return { kind: 'snd', pair: p2 };
      return term;
    }
    case 'pair': {
      const f2 = reduceBeta(term.fst);
      if (f2 !== term.fst) return { kind: 'pair', fst: f2, snd: term.snd };
      const s2 = reduceBeta(term.snd);
      if (s2 !== term.snd) return { kind: 'pair', fst: term.fst, snd: s2 };
      return term;
    }
    case 'inl': {
      const i2 = reduceBeta(term.left);
      if (i2 !== term.left) return { kind: 'inl', left: i2, rightType: term.rightType };
      return term;
    }
    case 'inr': {
      const i2 = reduceBeta(term.right);
      if (i2 !== term.right) return { kind: 'inr', right: i2, leftType: term.leftType };
      return term;
    }
    case 'case': {
      if (term.scrutinee.kind === 'inl') {
        return substitute(term.leftBody, term.leftBind, term.scrutinee.left);
      }
      if (term.scrutinee.kind === 'inr') {
        return substitute(term.rightBody, term.rightBind, term.scrutinee.right);
      }
      const s2 = reduceBeta(term.scrutinee);
      if (s2 !== term.scrutinee) return { ...term, scrutinee: s2 };
      const l2 = reduceBeta(term.leftBody);
      if (l2 !== term.leftBody) return { ...term, leftBody: l2 };
      const r2 = reduceBeta(term.rightBody);
      if (r2 !== term.rightBody) return { ...term, rightBody: r2 };
      return term;
    }
    case 'absurd': {
      const p2 = reduceBeta(term.proofOfFalse);
      if (p2 !== term.proofOfFalse)
        return { kind: 'absurd', proofOfFalse: p2, resultType: term.resultType };
      return term;
    }
  }
}

export function isNormal(term: LambdaTerm): boolean {
  return reduceBeta(term) === term;
}

export function normalize(term: LambdaTerm, maxSteps = 1000): LambdaTerm {
  let current = term;
  for (let i = 0; i < maxSteps; i++) {
    const next = reduceBeta(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}
