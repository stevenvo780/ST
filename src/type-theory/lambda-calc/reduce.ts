// ============================================================
// λ-cálculo untyped — β/η reducción y estrategias de normalización
// ============================================================
//
// Estrategias soportadas:
//   - 'normal'        leftmost-outermost; corresponde a normalización
//                      teórica (encuentra forma normal si existe).
//   - 'cbn'           call-by-name: reduce la cabeza, no entra bajo
//                      lambdas (devuelve weak-head-normal form).
//   - 'cbv'           call-by-value (applicative order): argumentos
//                      reducidos a valor antes que la aplicación.
//
// Estrategias de paso simple (betaStep):
//   - 'leftmost-outermost' (default) — normaliza términos como SKK→I.
//   - 'leftmost-innermost'           — reduce dentro de los args primero.

import type { Term } from './types';
import { freeVars, substitute } from './substitution';

export type BetaStrategy = 'leftmost-outermost' | 'leftmost-innermost';
export type NormalStrategy = 'normal' | 'cbn' | 'cbv';

// Devuelve el término reducido en UN paso, o `null` si no hay redex
// aplicable bajo la estrategia.
export function betaStep(t: Term, strategy: BetaStrategy = 'leftmost-outermost'): Term | null {
  return strategy === 'leftmost-outermost' ? stepLO(t) : stepLI(t);
}

// Leftmost-outermost: redex más a la izquierda y más superficial.
function stepLO(t: Term): Term | null {
  switch (t.kind) {
    case 'var':
      return null;
    case 'abs': {
      const b2 = stepLO(t.body);
      return b2 === null ? null : { kind: 'abs', param: t.param, body: b2 };
    }
    case 'app': {
      if (t.fn.kind === 'abs') {
        return substitute(t.fn.body, t.fn.param, t.arg);
      }
      const fn2 = stepLO(t.fn);
      if (fn2 !== null) return { kind: 'app', fn: fn2, arg: t.arg };
      const arg2 = stepLO(t.arg);
      if (arg2 !== null) return { kind: 'app', fn: t.fn, arg: arg2 };
      return null;
    }
  }
}

// Leftmost-innermost: reduce primero los redex dentro de los args.
function stepLI(t: Term): Term | null {
  switch (t.kind) {
    case 'var':
      return null;
    case 'abs': {
      const b2 = stepLI(t.body);
      return b2 === null ? null : { kind: 'abs', param: t.param, body: b2 };
    }
    case 'app': {
      const fn2 = stepLI(t.fn);
      if (fn2 !== null) return { kind: 'app', fn: fn2, arg: t.arg };
      const arg2 = stepLI(t.arg);
      if (arg2 !== null) return { kind: 'app', fn: t.fn, arg: arg2 };
      if (t.fn.kind === 'abs') {
        return substitute(t.fn.body, t.fn.param, t.arg);
      }
      return null;
    }
  }
}

// η-reducción: (λx. f x) → f cuando x ∉ FV(f).
// Sólo un paso; busca en orden leftmost-outermost.
export function etaStep(t: Term): Term | null {
  switch (t.kind) {
    case 'var':
      return null;
    case 'abs': {
      if (
        t.body.kind === 'app' &&
        t.body.arg.kind === 'var' &&
        t.body.arg.name === t.param &&
        !freeVars(t.body.fn).has(t.param)
      ) {
        return t.body.fn;
      }
      const b2 = etaStep(t.body);
      return b2 === null ? null : { kind: 'abs', param: t.param, body: b2 };
    }
    case 'app': {
      const fn2 = etaStep(t.fn);
      if (fn2 !== null) return { kind: 'app', fn: fn2, arg: t.arg };
      const arg2 = etaStep(t.arg);
      return arg2 === null ? null : { kind: 'app', fn: t.fn, arg: arg2 };
    }
  }
}

// ¿No hay redex β bajo la estrategia leftmost-outermost?
export function isNormalForm(t: Term): boolean {
  return stepLO(t) === null;
}

// Weak-head normal form: no hay redex en posición de cabeza.
// (λx. M) es WHNF; una aplicación es WHNF si su cabeza es variable.
export function isWeakHeadNormalForm(t: Term): boolean {
  switch (t.kind) {
    case 'var':
    case 'abs':
      return true;
    case 'app': {
      let head: Term = t;
      while (head.kind === 'app') head = head.fn;
      return head.kind === 'var';
    }
  }
}

export interface NormalizeResult {
  result: Term;
  steps: number;
  terminated: boolean;
}

export interface NormalizeOpts {
  maxSteps?: number;
  strategy?: NormalStrategy;
}

// Itera reducciones hasta forma normal (o WHNF según estrategia).
// `terminated=true` significa que no quedan redex; `false` indica que
// agotó `maxSteps` (típico para términos divergentes como Ω).
export function normalize(t: Term, opts: NormalizeOpts = {}): NormalizeResult {
  const maxSteps = opts.maxSteps ?? 1000;
  const strategy = opts.strategy ?? 'normal';
  let current = t;
  let steps = 0;
  for (; steps < maxSteps; steps += 1) {
    const next = oneStep(current, strategy);
    if (next === null) return { result: current, steps, terminated: true };
    current = next;
  }
  return { result: current, steps, terminated: false };
}

function oneStep(t: Term, strategy: NormalStrategy): Term | null {
  switch (strategy) {
    case 'normal':
      return stepLO(t);
    case 'cbn':
      return stepCBN(t);
    case 'cbv':
      return stepCBV(t);
  }
}

// Call-by-name: sólo reduce el redex en la posición de cabeza, sin
// bajar bajo lambdas. Termina en WHNF.
function stepCBN(t: Term): Term | null {
  if (t.kind === 'app') {
    if (t.fn.kind === 'abs') {
      return substitute(t.fn.body, t.fn.param, t.arg);
    }
    const fn2 = stepCBN(t.fn);
    return fn2 === null ? null : { kind: 'app', fn: fn2, arg: t.arg };
  }
  return null;
}

// Call-by-value (applicative order): reduce función a valor, luego
// arg a valor, luego β. Tampoco entra bajo λ. Termina en WHNF.
function stepCBV(t: Term): Term | null {
  if (t.kind === 'app') {
    const fn2 = stepCBV(t.fn);
    if (fn2 !== null) return { kind: 'app', fn: fn2, arg: t.arg };
    const arg2 = stepCBV(t.arg);
    if (arg2 !== null) return { kind: 'app', fn: t.fn, arg: arg2 };
    if (t.fn.kind === 'abs') {
      return substitute(t.fn.body, t.fn.param, t.arg);
    }
    return null;
  }
  return null;
}
