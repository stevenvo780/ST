// ============================================================
// ST Automata — NFA + subset construction
// ============================================================
//
//   · epsilonClosure(M, S)   — cierre-ε de un set de estados.
//   · nfaAccepts(M, w)       — simulación BFS sobre el frontier.
//   · nfaToDfa(M)            — subset construction.
// ============================================================

import type { DFA, NFA, Symbol } from './types';
import { EPSILON } from './types';

const epsOf = (M: NFA): Symbol => M.epsilon ?? EPSILON;

/** Cierre-ε: el menor conjunto T ⊇ S cerrado bajo transiciones ε. */
export function epsilonClosure(M: NFA, states: ReadonlySet<string>): Set<string> {
  const eps = epsOf(M);
  const closure = new Set<string>(states);
  const stack: string[] = [...states];
  while (stack.length > 0) {
    const s = stack.pop();
    if (s === undefined) break;
    const row = M.transitions.get(s);
    if (!row) continue;
    const nextSet = row.get(eps);
    if (!nextSet) continue;
    for (const n of nextSet) {
      if (!closure.has(n)) {
        closure.add(n);
        stack.push(n);
      }
    }
  }
  return closure;
}

/** Step de la simulación: a partir de un set de estados, consumir un
 *  símbolo y luego cerrar bajo ε. */
function nfaStep(M: NFA, states: ReadonlySet<string>, sym: Symbol): Set<string> {
  const out = new Set<string>();
  for (const s of states) {
    const row = M.transitions.get(s);
    if (!row) continue;
    const nextSet = row.get(sym);
    if (!nextSet) continue;
    for (const n of nextSet) out.add(n);
  }
  return epsilonClosure(M, out);
}

export function nfaAccepts(M: NFA, input: string): boolean {
  let current = epsilonClosure(M, new Set([M.initial]));
  for (const ch of input) {
    current = nfaStep(M, current, ch);
    if (current.size === 0) return false;
  }
  for (const s of current) if (M.accept.has(s)) return true;
  return false;
}

/** Subset construction: cada estado del DFA = subconjunto cerrado por ε
 *  de estados del NFA. Sólo se generan estados alcanzables. */
export function nfaToDfa(M: NFA): DFA {
  const eps = epsOf(M);

  const encode = (set: ReadonlySet<string>): string => {
    return '{' + [...set].sort().join(',') + '}';
  };

  // Alfabeto del DFA = alfabeto del NFA sin ε.
  const alphabet = new Set<Symbol>();
  for (const a of M.alphabet) if (a !== eps) alphabet.add(a);

  const startSet = epsilonClosure(M, new Set([M.initial]));
  const startKey = encode(startSet);

  const states = new Set<string>([startKey]);
  const transitions = new Map<string, Map<Symbol, string>>();
  const accept = new Set<string>();
  const subsetOf = new Map<string, Set<string>>();
  subsetOf.set(startKey, startSet);
  if ([...startSet].some((s) => M.accept.has(s))) accept.add(startKey);

  const queue: string[] = [startKey];
  while (queue.length > 0) {
    const key = queue.shift();
    if (key === undefined) break;
    const subset = subsetOf.get(key);
    if (!subset) continue;
    const row = new Map<Symbol, string>();
    transitions.set(key, row);
    for (const a of alphabet) {
      const next = nfaStep(M, subset, a);
      if (next.size === 0) continue;
      const nextKey = encode(next);
      row.set(a, nextKey);
      if (!states.has(nextKey)) {
        states.add(nextKey);
        subsetOf.set(nextKey, next);
        if ([...next].some((s) => M.accept.has(s))) accept.add(nextKey);
        queue.push(nextKey);
      }
    }
  }

  return {
    states,
    alphabet,
    transitions,
    initial: startKey,
    accept,
  };
}
