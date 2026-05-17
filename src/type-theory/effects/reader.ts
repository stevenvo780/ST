// ============================================================
// Effect: Reader<R>
// ============================================================
//
// Una sola operación:
//   - Reader.ask : () → R

import { bind, perform, pure } from './core';
import type { Eff, Effect } from './types';

export const READER_ASK = 'Reader.ask' as const;

export type ReaderAsk<R> = Effect<typeof READER_ASK, void, R>;
export type Reader<R> = ReaderAsk<R>;

/** Lee el ambiente del Reader. */
export function ask<R>(): Eff<ReaderAsk<R>, R> {
  return perform<typeof READER_ASK, void, R>(READER_ASK, undefined);
}

/** Lee el ambiente y aplica una proyección. */
export function asks<R, A>(fn: (r: R) => A): Eff<ReaderAsk<R>, A> {
  return bind<ReaderAsk<R>, R, A>(ask<R>(), (r) => pure(fn(r)));
}

/**
 * Intérprete componible. Reescribe `Reader.ask` proyectando el `env`
 * fijo y deja otros efectos intactos.
 */
export function handleReader<R, A, Env>(eff: Eff<unknown, A>, env: Env): Eff<R, A> {
  function go(node: Eff<unknown, A>): Eff<R, A> {
    if (node.kind === 'pure') return pure(node.value);
    const op = node.effect;
    if (op.tag === READER_ASK) {
      return go(node.continuation(env as never));
    }
    return {
      kind: 'impure',
      effect: op,
      continuation: (value: never) => go(node.continuation(value)),
    };
  }
  return go(eff);
}

/**
 * Intérprete terminal: ejecuta el cómputo con un ambiente fijo.
 * Cualquier `Reader.ask` recibe el mismo `env`. Lanza si encuentra
 * otra operación sin manejar.
 */
export function runReader<R, A>(eff: Eff<unknown, A>, env: R): A {
  let node = eff;
  for (;;) {
    if (node.kind === 'pure') return node.value;
    const op = node.effect;
    if (op.tag === READER_ASK) {
      node = node.continuation(env as never);
      continue;
    }
    throw new Error(`[runReader] efecto no soportado: ${op.tag}`);
  }
}
