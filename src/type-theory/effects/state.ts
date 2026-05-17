// ============================================================
// Effect: State<S>
// ============================================================
//
// Dos operaciones canónicas:
//   - State.get  : ()  → S      (lee el estado actual)
//   - State.put  : S   → undefined (sobrescribe el estado)
//
// `modify` se deriva como get >>= (s -> put (fn s)).
//
// Dos formas de interpretar:
//   - `runState`        : intérprete terminal. Devuelve {result, state}.
//                         Útil cuando State es el único efecto.
//   - `handleState`     : intérprete componible. Transforma
//                         Eff<State<S> | R, A> en Eff<R, [A, S]>.
//                         Útil para stack de efectos.

import { bind, perform, pure } from './core';
import type { Eff, Effect } from './types';

export const STATE_GET = 'State.get' as const;
export const STATE_PUT = 'State.put' as const;

export type StateGet<S> = Effect<typeof STATE_GET, void, S>;
export type StatePut<S> = Effect<typeof STATE_PUT, S, undefined>;
export type State<S> = StateGet<S> | StatePut<S>;

/** Lee el estado actual. */
export function getState<S>(): Eff<StateGet<S>, S> {
  return perform<typeof STATE_GET, void, S>(STATE_GET, undefined);
}

/** Sobrescribe el estado completo. */
export function putState<S>(s: S): Eff<StatePut<S>, undefined> {
  return perform<typeof STATE_PUT, S, undefined>(STATE_PUT, s);
}

/** Modifica el estado aplicando una función pura. */
export function modify<S>(fn: (s: S) => S): Eff<State<S>, undefined> {
  return bind<State<S>, S, undefined>(getState<S>(), (s) => putState<S>(fn(s)));
}

/**
 * Intérprete componible. Reescribe `State.get`/`State.put` en términos
 * de un acumulador transportado por la continuación, dejando otros
 * efectos intactos en la salida.
 */
export function handleState<R, S, A>(
  eff: Eff<unknown, A>,
  initial: S,
): Eff<R, { result: A; state: S }> {
  // Helper recursivo: dado un estado actual, reescribe el árbol.
  function go(node: Eff<unknown, A>, current: S): Eff<R, { result: A; state: S }> {
    if (node.kind === 'pure') return pure({ result: node.value, state: current });
    const op = node.effect;
    if (op.tag === STATE_GET) {
      return go(node.continuation(current as never), current);
    }
    if (op.tag === STATE_PUT) {
      const next = op.input as S;
      return go(node.continuation(undefined as never), next);
    }
    // Otro efecto: lo dejamos pasar, propagando el estado en la cont.
    return {
      kind: 'impure',
      effect: op,
      continuation: (value: never) => go(node.continuation(value), current),
    };
  }
  return go(eff, initial);
}

/**
 * Intérprete terminal: ejecuta el cómputo asumiendo que sólo tiene
 * efectos State. Devuelve `{ result, state }`. Lanza si encuentra
 * otra operación sin manejar.
 */
export function runState<S, A>(eff: Eff<unknown, A>, initial: S): { result: A; state: S } {
  let current = initial;
  let node = eff;
  for (;;) {
    if (node.kind === 'pure') return { result: node.value, state: current };
    const op = node.effect;
    if (op.tag === STATE_GET) {
      node = node.continuation(current as never);
      continue;
    }
    if (op.tag === STATE_PUT) {
      current = op.input as S;
      node = node.continuation(undefined as never);
      continue;
    }
    throw new Error(`[runState] efecto no soportado: ${op.tag}`);
  }
}
