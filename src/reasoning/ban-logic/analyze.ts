// ============================================================
// BAN Logic — Saturación de estado + análisis de protocolos
// ============================================================
//
// `saturate(state)` aplica las reglas R1-R10 en forward-chaining
// hasta punto fijo (o cota de iteraciones). Devuelve la lista de
// fórmulas inferidas en orden de derivación (trace).
//
// `analyzeProtocol(p)` toma un Protocol con assumptions, steps y goals;
// idealiza los mensajes (cada step produce `P ◁ msg` para el receptor),
// satura, y reporta cuáles goals quedaron satisfechos.

import {
  applyBeliefConjunction,
  applyBeliefConjunctionRight,
  applyFreshnessPropagation,
  applyJurisdiction,
  applyMessageMeaningPublic,
  applyMessageMeaningSecret,
  applyMessageMeaningShared,
  applyNonceVerification,
  applySaidConjunction,
  applySeeingEncrypted,
  applySeesCompound,
} from './rules';
import { formulaEquals, hasFormula, principal, sees } from './terms';
import type { BANFormula, Protocol, ProtocolAnalysis } from './types';

export interface SaturateOptions {
  /** Máximo de iteraciones del punto fijo. Default: 200. */
  maxIterations?: number;
  /** Máximo de fórmulas nuevas a derivar. Default: 1024. */
  maxDerivations?: number;
}

interface RuleWithName {
  name: string;
  apply: (state: ReadonlyArray<BANFormula>, focus: BANFormula) => BANFormula | null;
}

const STATE_RULES: RuleWithName[] = [
  { name: 'message-meaning-shared', apply: applyMessageMeaningShared },
  { name: 'message-meaning-public', apply: applyMessageMeaningPublic },
  { name: 'message-meaning-secret', apply: applyMessageMeaningSecret },
  { name: 'nonce-verification', apply: applyNonceVerification },
  { name: 'jurisdiction', apply: applyJurisdiction },
  { name: 'seeing-encrypted', apply: applySeeingEncrypted },
  { name: 'sees-compound', apply: applySeesCompound },
  { name: 'freshness-propagation', apply: applyFreshnessPropagation },
];

const FOCUS_ONLY_RULES: { name: string; apply: (f: BANFormula) => BANFormula | null }[] = [
  { name: 'belief-conj-left', apply: applyBeliefConjunction },
  { name: 'belief-conj-right', apply: applyBeliefConjunctionRight },
  { name: 'said-conj', apply: applySaidConjunction },
];

/**
 * Aplica las reglas BAN al estado hasta punto fijo. Devuelve el estado
 * saturado y la lista de derivaciones nuevas (no incluye las iniciales).
 */
export function saturate(
  initial: ReadonlyArray<BANFormula>,
  opts?: SaturateOptions,
): { state: BANFormula[]; trace: BANFormula[] } {
  const maxIter = opts?.maxIterations ?? 200;
  const maxDeriv = opts?.maxDerivations ?? 1024;

  const state: BANFormula[] = [];
  const trace: BANFormula[] = [];

  const tryAdd = (f: BANFormula): boolean => {
    if (state.some((g) => formulaEquals(g, f))) return false;
    state.push(f);
    return true;
  };

  for (const f of initial) tryAdd(f);

  let iter = 0;
  let changed = true;
  while (changed && iter < maxIter && trace.length < maxDeriv) {
    changed = false;
    iter++;
    // Snapshot del estado para iterar de forma estable.
    const snapshot = state.slice();
    for (const focus of snapshot) {
      // Reglas state+focus.
      for (const rule of STATE_RULES) {
        const out = rule.apply(snapshot, focus);
        if (out && tryAdd(out)) {
          trace.push(out);
          changed = true;
          if (trace.length >= maxDeriv) return { state, trace };
        }
      }
      // Reglas focus-only.
      for (const rule of FOCUS_ONLY_RULES) {
        const out = rule.apply(focus);
        if (out && tryAdd(out)) {
          trace.push(out);
          changed = true;
          if (trace.length >= maxDeriv) return { state, trace };
        }
      }
    }
  }
  return { state, trace };
}

/**
 * Idealización mínima: cada step `from → to: msg` produce la
 * fórmula `to ◁ msg`. Asumimos que el receptor literalmente ve el
 * mensaje que se le envía.
 *
 * (BAN tradicional pide idealización manual para descartar texto
 * inseguro como nombres en claro; aquí preservamos todos los
 * subtérminos, que es la lectura conservadora.)
 */
export function idealize(p: Protocol): BANFormula[] {
  return p.steps.map((s) => sees(principal(s.to), s.message));
}

/**
 * Analiza un protocolo: parte de las assumptions + idealización,
 * satura, y verifica goals.
 */
export function analyzeProtocol(p: Protocol, opts?: SaturateOptions): ProtocolAnalysis {
  const idealized = idealize(p);
  const initial = [...p.initialAssumptions, ...idealized];
  const { state, trace } = saturate(initial, opts);

  const satisfied: BANFormula[] = [];
  const unsatisfied: BANFormula[] = [];
  for (const g of p.goals) {
    if (hasFormula(state, g)) satisfied.push(g);
    else unsatisfied.push(g);
  }
  return { satisfied, unsatisfied, trace };
}
