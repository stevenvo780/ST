// ============================================================
// Effect: Exception<E>
// ============================================================
//
// Una sola operación:
//   - Exception.throw : E → never
//
// La continuación nunca se invoca: tirar aborta el cómputo y
// `runException` devuelve `{ kind: 'error', error }`.

import { perform, pure } from './core';
import type { Eff, Effect, ExceptionResult } from './types';

export const EXCEPTION_THROW = 'Exception.throw' as const;

export type ExceptionThrow<E> = Effect<typeof EXCEPTION_THROW, E, never>;
export type Exception<E> = ExceptionThrow<E>;

/** Lanza una excepción algebraica. La continuación se descarta. */
export function throw_<E>(error: E): Eff<ExceptionThrow<E>, never> {
  return perform<typeof EXCEPTION_THROW, E, never>(EXCEPTION_THROW, error);
}

/**
 * Intérprete componible. Si el cómputo lanza, corta el árbol y emite
 * `{ kind: 'error', error }`. Si finaliza puro, emite `{ kind: 'ok', value }`.
 * Otros efectos se propagan tal cual.
 */
export function handleException<R, E, A>(eff: Eff<unknown, A>): Eff<R, ExceptionResult<E, A>> {
  function go(node: Eff<unknown, A>): Eff<R, ExceptionResult<E, A>> {
    if (node.kind === 'pure') return pure({ kind: 'ok', value: node.value });
    const op = node.effect;
    if (op.tag === EXCEPTION_THROW) {
      return pure({ kind: 'error', error: op.input as E });
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
 * Intérprete terminal: ejecuta el cómputo y captura una eventual
 * excepción. Lanza si encuentra otra operación sin manejar.
 */
export function runException<E, A>(eff: Eff<unknown, A>): ExceptionResult<E, A> {
  const node = eff;
  for (;;) {
    if (node.kind === 'pure') return { kind: 'ok', value: node.value };
    const op = node.effect;
    if (op.tag === EXCEPTION_THROW) {
      return { kind: 'error', error: op.input as E };
    }
    throw new Error(`[runException] efecto no soportado: ${op.tag}`);
  }
}
