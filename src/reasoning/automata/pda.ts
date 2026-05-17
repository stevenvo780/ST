// ============================================================
// ST Automata — PDA (Pushdown Automaton)
// ============================================================
//
// Aceptación por estado final, con simulación no determinista.
//
// Una configuración es (state, posición de entrada, pila como string).
// Se exploran con BFS pero con memoización de configuraciones vistas
// para evitar bucles ε. Si la búsqueda explota, `maxDepth` corta.
// ============================================================

import type { PDA, PDATransition, Symbol } from './types';
import { EPSILON } from './types';

interface Config {
  state: string;
  pos: number;
  stack: string; // top = último char
}

const configKey = (c: Config): string => `${c.state}|${c.pos}|${c.stack}`;

/** ¿`M` acepta `input`?
 *  `maxSteps` cota el número de configuraciones expandidas. */
export function pdaAccepts(M: PDA, input: string, maxSteps = 100_000): boolean {
  const start: Config = {
    state: M.initial,
    pos: 0,
    stack: M.initialStack,
  };
  const queue: Config[] = [start];
  const seen = new Set<string>([configKey(start)]);
  let steps = 0;

  while (queue.length > 0) {
    if (steps++ > maxSteps) return false;
    const cfg = queue.shift();
    if (!cfg) break;

    // Aceptación por estado final con input consumido.
    if (cfg.pos === input.length && M.accept.has(cfg.state)) return true;

    const top = cfg.stack.length > 0 ? cfg.stack[cfg.stack.length - 1] : undefined;

    for (const t of M.transitions) {
      if (t.state !== cfg.state) continue;
      // Symbol de entrada.
      if (t.read !== EPSILON) {
        if (cfg.pos >= input.length) continue;
        if (input[cfg.pos] !== t.read) continue;
      }
      // Pop.
      if (t.popTop !== EPSILON) {
        if (top === undefined) continue;
        if (top !== t.popTop) continue;
      }

      const newStack = t.popTop !== EPSILON ? cfg.stack.slice(0, -1) : cfg.stack;
      // pushTop: el último elemento queda en la cima → simplemente
      // concatenar la string en orden.
      const pushed = t.pushTop.join('');
      const finalStack = newStack + pushed;
      const newPos = t.read !== EPSILON ? cfg.pos + 1 : cfg.pos;
      const next: Config = {
        state: t.nextState,
        pos: newPos,
        stack: finalStack,
      };
      const key = configKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

// ── Lenguajes estándar libres de contexto ────────────────────

/** PDA que acepta palíndromes pares e impares sobre {a, b} usando un
 *  marcador no determinista (transición ε al "espejo"). */
export function pdaPalindromes(alphabet: ReadonlyArray<Symbol> = ['a', 'b']): PDA {
  const Z = '$';
  // Estados:
  //   q0: empujando la primera mitad.
  //   q1: comparando contra la segunda mitad.
  //   q2: accept.
  const states = new Set<string>(['q0', 'q1', 'q2']);
  const stackAlphabet = new Set<Symbol>([Z, ...alphabet]);
  const alpha = new Set<Symbol>(alphabet);
  const transitions: PDATransition[] = [];

  // q0 → q0, leer x, push x  (apilar)
  for (const x of alphabet) {
    transitions.push({
      state: 'q0',
      read: x,
      popTop: EPSILON,
      nextState: 'q0',
      pushTop: [x],
    });
  }
  // q0 → q1, ε, ε, []  (cambio al modo comparar, palíndrome par)
  transitions.push({
    state: 'q0',
    read: EPSILON,
    popTop: EPSILON,
    nextState: 'q1',
    pushTop: [],
  });
  // q0 → q1, leer x, ε, []  (skip carácter central, palíndrome impar)
  for (const x of alphabet) {
    transitions.push({
      state: 'q0',
      read: x,
      popTop: EPSILON,
      nextState: 'q1',
      pushTop: [],
    });
  }
  // q1 → q1, leer x, pop x, []  (matchear segunda mitad)
  for (const x of alphabet) {
    transitions.push({
      state: 'q1',
      read: x,
      popTop: x,
      nextState: 'q1',
      pushTop: [],
    });
  }
  // q1 → q2, ε, pop Z, [Z]  (stack vuelve a $)
  transitions.push({
    state: 'q1',
    read: EPSILON,
    popTop: Z,
    nextState: 'q2',
    pushTop: [Z],
  });

  return {
    states,
    alphabet: alpha,
    stackAlphabet,
    transitions,
    initial: 'q0',
    initialStack: Z,
    accept: new Set(['q2']),
  };
}

/** PDA que acepta paréntesis balanceados (alfabeto '(' ')'). */
export function pdaBalancedParens(): PDA {
  const Z = '$';
  const states = new Set<string>(['q0', 'q1']);
  const alpha = new Set<Symbol>(['(', ')']);
  const stackAlphabet = new Set<Symbol>([Z, '(']);
  const transitions: PDA['transitions'] = [
    // Abrir paréntesis: push '('.
    { state: 'q0', read: '(', popTop: EPSILON, nextState: 'q0', pushTop: ['('] },
    // Cerrar paréntesis: pop '('.
    { state: 'q0', read: ')', popTop: '(', nextState: 'q0', pushTop: [] },
    // Aceptar al ver $ en la cima (todo balanceado) — sin tocar pila.
    { state: 'q0', read: EPSILON, popTop: Z, nextState: 'q1', pushTop: [Z] },
  ];
  return {
    states,
    alphabet: alpha,
    stackAlphabet,
    transitions,
    initial: 'q0',
    initialStack: Z,
    accept: new Set(['q1']),
  };
}
