// ============================================================
// Tactic DSL — entry point
// ============================================================
//
// Pequeño DSL al estilo Lean/Coq para construir pruebas hacia atrás
// (backwards) a partir de un goal. El motor:
//   - mantiene una lista de goals abiertos
//   - cada tactic transforma el goal frontal
//   - los combinators (seq/orElse/repeat_/tryAlt) componen tactics
//
// La meta-prueba se considera completa cuando no quedan goals.
// El estado lleva un `history` que registra invocaciones para que
// el caller pueda renderizar el proof script reproducible.
//
// Nombres: la API original (Coq/Lean) usa `then` para encadenar
// tactics. Por interop con vitest/ESM (un módulo ES con export
// `then` se trata como thenable y bloquea el import), el combinador
// se llama `seq` a nivel de export. Para mantener el lenguaje
// Coq-like, exportamos un namespace `T` con `T.then = seq`.

import { normalizeFormula, parseFormula } from './types';
import type { Goal, ProofState, Tactic } from './types';
import {
  _resetGoalCounter,
  apply,
  assumption,
  caseAnalysis,
  destruct,
  exact,
  induction,
  intro,
  left as leftTactic,
  rewrite,
  rfl,
  right as rightTactic,
  simp,
  split,
  trivial,
  unfold,
} from './tactics';
import { orElse, repeat_, seq, tryAlt } from './combinators';

export type { Formula, Goal, ProofState, Tactic, TacticInvocation } from './types';
export { TacticError, parseFormula, formulaToString, formulaEq, normalizeFormula } from './types';
export type { DefDictionary } from './tactics';

// Tactics
export {
  intro,
  exact,
  assumption,
  apply,
  rewrite,
  rfl,
  trivial,
  split,
  destruct,
  induction,
  caseAnalysis,
  unfold,
  simp,
};
export { leftTactic as left, rightTactic as right };

// Alias `case_` para `caseAnalysis` (case es palabra reservada en JS).
export const case_ = caseAnalysis;

// Combinators (top-level export usa `seq` para evitar la trampa del
// thenable). Para uso Coq-like `T.then(...)` ver export `T` abajo.
export { seq, orElse, repeat_, tryAlt };

// Namespace `T` con todos los tactics y combinators. Aquí sí podemos
// exponer `then` porque la propiedad vive sobre un objeto, no sobre
// el module namespace.
export const T = {
  // tactics
  intro,
  exact,
  assumption,
  apply,
  rewrite,
  rfl,
  trivial,
  split,
  left: leftTactic,
  right: rightTactic,
  destruct,
  induction,
  caseAnalysis,
  case_: caseAnalysis,
  unfold,
  simp,
  // combinators
  seq,
  then: seq, // alias Coq-style
  orElse,
  repeat_,
  tryAlt,
};

let stateCounter = 0;

export function startProof(goal: string, hyps: Record<string, string> = {}): ProofState {
  // sanity: el goal debe parsearse limpio.
  parseFormula(goal);
  stateCounter++;
  const normalizedHyps: Record<string, string> = {};
  for (const [n, t] of Object.entries(hyps)) {
    normalizedHyps[n] = normalizeFormula(t);
  }
  const g: Goal = {
    id: `g${stateCounter}`,
    hyps: normalizedHyps,
    concl: normalizeFormula(goal),
  };
  return {
    goals: [g],
    history: [],
    done: false,
  };
}

export function runTactic(state: ProofState, t: Tactic): ProofState {
  return t(state);
}

export function isProven(state: ProofState): boolean {
  return state.done && state.goals.length === 0;
}

export function summary(state: ProofState): string {
  if (state.done && state.goals.length === 0) {
    const steps = state.history.map((h) => `  - ${h.tactic}(${formatArgs(h.args)})`);
    return `Proof complete.\nHistory (${state.history.length} steps):\n${steps.join('\n')}`;
  }
  const open = state.goals
    .map((g, idx) => {
      const hyps = Object.entries(g.hyps)
        .map(([n, t]) => `  ${n} : ${t}`)
        .join('\n');
      return `Goal ${idx + 1}/${state.goals.length} (${g.id}):\n${hyps}\n  ⊢ ${g.concl}`;
    })
    .join('\n\n');
  return open;
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (a === null || a === undefined) return '';
      if (Array.isArray(a)) {
        const items: unknown[] = a;
        return `[${items.map((x) => formatScalar(x)).join(',')}]`;
      }
      return formatScalar(a);
    })
    .filter((s) => s.length > 0)
    .join(', ');
}

function formatScalar(x: unknown): string {
  if (typeof x === 'string') return x;
  if (typeof x === 'number' || typeof x === 'boolean') return String(x);
  if (x === null || x === undefined) return '';
  // fallback seguro para evitar [object Object]
  try {
    return JSON.stringify(x);
  } catch {
    return '';
  }
}

// Test-only helper para resetear contadores y obtener determinismo.
export function _resetCounters(): void {
  stateCounter = 0;
  _resetGoalCounter();
}
