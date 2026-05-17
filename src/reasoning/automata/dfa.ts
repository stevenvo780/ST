// ============================================================
// ST Automata — DFA
// ============================================================
//
// Operaciones sobre DFAs:
//   · dfaAccepts        — simulación de aceptación.
//   · dfaMinimize       — partición de equivalencia (Hopcroft).
//   · dfaComplement     — invierte aceptación tras totalizar.
//   · dfaProduct        — producto cartesiano con predicado de
//                         aceptación (base de union/intersection).
//   · dfaUnion          — L(a) ∪ L(b).
//   · dfaIntersection   — L(a) ∩ L(b).
// ============================================================

import type { DFA, Symbol } from './types';

/** ¿`M` acepta `input`? Si en algún punto no hay transición definida,
 *  rechaza inmediatamente (DFA visto como función parcial). */
export function dfaAccepts(M: DFA, input: string): boolean {
  let current: string | undefined = M.initial;
  for (const ch of input) {
    if (current === undefined) return false;
    const row = M.transitions.get(current);
    if (!row) return false;
    current = row.get(ch);
    if (current === undefined) return false;
  }
  return current !== undefined && M.accept.has(current);
}

/** Totaliza un DFA agregando un sink-state para las aristas faltantes.
 *  Devuelve un DFA equivalente con `transitions` totales sobre alfabeto. */
export function dfaTotalize(M: DFA, sinkName = '__sink__'): DFA {
  // Detectar si ya es total.
  let needsSink = false;
  for (const s of M.states) {
    const row = M.transitions.get(s);
    for (const a of M.alphabet) {
      if (!row || !row.has(a)) {
        needsSink = true;
        break;
      }
    }
    if (needsSink) break;
  }
  if (!needsSink) return M;

  const states = new Set(M.states);
  let sink = sinkName;
  while (states.has(sink)) sink = sink + '_';
  states.add(sink);

  const transitions = new Map<string, Map<Symbol, string>>();
  for (const s of states) {
    const old = M.transitions.get(s);
    const row = new Map<Symbol, string>();
    for (const a of M.alphabet) {
      const dst = old?.get(a);
      row.set(a, dst ?? sink);
    }
    transitions.set(s, row);
  }

  return {
    states,
    alphabet: new Set(M.alphabet),
    transitions,
    initial: M.initial,
    accept: new Set(M.accept),
  };
}

/** Complemento de `M`: misma estructura, accept = states \ accept. */
export function dfaComplement(M: DFA): DFA {
  const total = dfaTotalize(M);
  const accept = new Set<string>();
  for (const s of total.states) if (!total.accept.has(s)) accept.add(s);
  return {
    states: total.states,
    alphabet: total.alphabet,
    transitions: total.transitions,
    initial: total.initial,
    accept,
  };
}

/** Producto cartesiano con predicado de aceptación arbitrario sobre
 *  (a-state, b-state). Sólo se crean estados alcanzables desde el par
 *  inicial. */
export function dfaProduct(a: DFA, b: DFA, acceptPair: (sa: string, sb: string) => boolean): DFA {
  const ta = dfaTotalize(a);
  const tb = dfaTotalize(b);
  const alphabet = new Set<Symbol>([...ta.alphabet, ...tb.alphabet]);

  const states = new Set<string>();
  const transitions = new Map<string, Map<Symbol, string>>();
  const accept = new Set<string>();

  const encode = (sa: string, sb: string) => `(${sa}|${sb})`;
  const initial = encode(ta.initial, tb.initial);

  const queue: Array<readonly [string, string]> = [[ta.initial, tb.initial]];
  states.add(initial);
  if (acceptPair(ta.initial, tb.initial)) accept.add(initial);

  while (queue.length > 0) {
    const pair = queue.shift();
    if (!pair) break;
    const [sa, sb] = pair;
    const key = encode(sa, sb);
    const row = new Map<Symbol, string>();
    transitions.set(key, row);

    for (const sym of alphabet) {
      const da = ta.transitions.get(sa)?.get(sym);
      const db = tb.transitions.get(sb)?.get(sym);
      if (da === undefined || db === undefined) continue;
      const nextKey = encode(da, db);
      row.set(sym, nextKey);
      if (!states.has(nextKey)) {
        states.add(nextKey);
        if (acceptPair(da, db)) accept.add(nextKey);
        queue.push([da, db]);
      }
    }
  }

  return { states, alphabet, transitions, initial, accept };
}

export function dfaUnion(a: DFA, b: DFA): DFA {
  return dfaProduct(a, b, (sa, sb) => a.accept.has(sa) || b.accept.has(sb));
}

export function dfaIntersection(a: DFA, b: DFA): DFA {
  return dfaProduct(a, b, (sa, sb) => a.accept.has(sa) && b.accept.has(sb));
}

// ── Minimización ─────────────────────────────────────────────
//
// Partition refinement à la Hopcroft (versión clásica simplificada):
//
//   1. Totalizar M.
//   2. Eliminar estados inalcanzables desde el inicial.
//   3. Partición inicial P = {Final, NonFinal}.
//   4. Refinar: para cada (clase C, símbolo a), particionar cada otra
//      clase Y según el predicado "δ(y,a) ∈ C".
//   5. Cuando P no cambia, cada clase = estado del DFA mínimo.

export function dfaMinimize(M: DFA): DFA {
  const total = dfaTotalize(M);

  // Reachable from initial.
  const reachable = new Set<string>([total.initial]);
  const stack = [total.initial];
  while (stack.length > 0) {
    const s = stack.pop();
    if (s === undefined) break;
    const row = total.transitions.get(s);
    if (!row) continue;
    for (const dst of row.values()) {
      if (!reachable.has(dst)) {
        reachable.add(dst);
        stack.push(dst);
      }
    }
  }

  const finals = new Set<string>();
  const nonFinals = new Set<string>();
  for (const s of reachable) {
    if (total.accept.has(s)) finals.add(s);
    else nonFinals.add(s);
  }

  // Lista de bloques (clases). Cada estado tiene un blockId.
  const blocks: Set<string>[] = [];
  const blockOf = new Map<string, number>();
  const pushBlock = (block: Set<string>): number => {
    if (block.size === 0) return -1;
    const id = blocks.length;
    blocks.push(block);
    for (const s of block) blockOf.set(s, id);
    return id;
  };
  pushBlock(finals);
  pushBlock(nonFinals);

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < blocks.length; i++) {
      const B = blocks[i];
      if (!B || B.size < 2) continue;
      // Particionar B agrupando por la firma (δ(s, a) → blockId) para todos los símbolos.
      const signatureMap = new Map<string, Set<string>>();
      for (const s of B) {
        const sig: string[] = [];
        const row = total.transitions.get(s);
        for (const a of total.alphabet) {
          const dst = row?.get(a);
          const bId = dst !== undefined ? (blockOf.get(dst) ?? -1) : -1;
          sig.push(`${a}->${bId}`);
        }
        const key = sig.join('|');
        let bucket = signatureMap.get(key);
        if (!bucket) {
          bucket = new Set<string>();
          signatureMap.set(key, bucket);
        }
        bucket.add(s);
      }
      if (signatureMap.size > 1) {
        // Reemplazar B por el primer subbloque y agregar el resto.
        const iter = signatureMap.values();
        const first = iter.next().value as Set<string>;
        blocks[i] = first;
        for (const s of first) blockOf.set(s, i);
        let next = iter.next();
        while (!next.done) {
          pushBlock(next.value);
          next = iter.next();
        }
        changed = true;
      }
    }
  }

  // Construir DFA minimizado.
  const newStates = new Set<string>();
  const newTransitions = new Map<string, Map<Symbol, string>>();
  const newAccept = new Set<string>();
  const blockName = (id: number) => `q${id}`;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (!b || b.size === 0) continue;
    const name = blockName(i);
    newStates.add(name);
    // Representante para acceptación / aristas: cualquier elemento.
    const rep = b.values().next().value as string;
    if (total.accept.has(rep)) newAccept.add(name);
    const row = new Map<Symbol, string>();
    const oldRow = total.transitions.get(rep);
    for (const a of total.alphabet) {
      const dst = oldRow?.get(a);
      if (dst !== undefined) {
        const bId = blockOf.get(dst);
        if (bId !== undefined) row.set(a, blockName(bId));
      }
    }
    newTransitions.set(name, row);
  }

  const initialBlock = blockOf.get(total.initial);
  if (initialBlock === undefined) {
    throw new Error('dfaMinimize: estado inicial sin bloque (estado bug)');
  }

  // Eliminar el sink state si no es necesario para reconocer L(M):
  // sólo lo quitamos si su bloque no contiene aristas entrantes desde
  // estados accept. (En la práctica lo dejamos: complement lo necesita).
  return {
    states: newStates,
    alphabet: new Set(total.alphabet),
    transitions: newTransitions,
    initial: blockName(initialBlock),
    accept: newAccept,
  };
}
