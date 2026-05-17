// ============================================================
// Effect: Writer<W>
// ============================================================
//
// Una sola operación:
//   - Writer.tell : W → undefined

import { perform, pure } from './core';
import type { Eff, Effect, Monoid } from './types';

export const WRITER_TELL = 'Writer.tell' as const;

export type WriterTell<W> = Effect<typeof WRITER_TELL, W, undefined>;
export type Writer<W> = WriterTell<W>;

/** Acumula un mensaje en el log. */
export function tell<W>(w: W): Eff<WriterTell<W>, undefined> {
  return perform<typeof WRITER_TELL, W, undefined>(WRITER_TELL, w);
}

/**
 * Intérprete componible. Acumula los `tell` con el monoide y deja
 * otros efectos intactos.
 */
export function handleWriter<R, W, A>(
  eff: Eff<unknown, A>,
  monoid: Monoid<W>,
): Eff<R, { result: A; log: W }> {
  function go(node: Eff<unknown, A>, log: W): Eff<R, { result: A; log: W }> {
    if (node.kind === 'pure') return pure({ result: node.value, log });
    const op = node.effect;
    if (op.tag === WRITER_TELL) {
      const next = monoid.combine(log, op.input as W);
      return go(node.continuation(undefined as never), next);
    }
    return {
      kind: 'impure',
      effect: op,
      continuation: (value: never) => go(node.continuation(value), log),
    };
  }
  return go(eff, monoid.empty);
}

/**
 * Intérprete terminal: ejecuta combinando todos los `tell` con el
 * monoide dado. Devuelve `{ result, log }`. Lanza si encuentra otra
 * operación sin manejar.
 */
export function runWriter<W, A>(eff: Eff<unknown, A>, monoid: Monoid<W>): { result: A; log: W } {
  let log: W = monoid.empty;
  let node = eff;
  for (;;) {
    if (node.kind === 'pure') return { result: node.value, log };
    const op = node.effect;
    if (op.tag === WRITER_TELL) {
      log = monoid.combine(log, op.input as W);
      node = node.continuation(undefined as never);
      continue;
    }
    throw new Error(`[runWriter] efecto no soportado: ${op.tag}`);
  }
}

// ---------- Monoides comunes ----------

/** Monoide concatenación de listas. */
export function listMonoid<W>(): Monoid<W[]> {
  return {
    empty: [],
    combine: (a, b) => [...a, ...b],
  };
}

/** Monoide concatenación de strings. */
export const stringMonoid: Monoid<string> = {
  empty: '',
  combine: (a, b) => a + b,
};

/** Monoide aditivo sobre números. */
export const sumMonoid: Monoid<number> = {
  empty: 0,
  combine: (a, b) => a + b,
};
