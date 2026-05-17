// ============================================================
// Algebraic effects — Constructores y combinadores del free monad
// ============================================================

import type { Eff, Effect, Handler } from './types';

/** Inyecta un valor puro en la mónada. */
export function pure<A>(value: A): Eff<never, A> {
  return { kind: 'pure', value };
}

/**
 * Construye una computación que ejecuta una operación `tag` con `input`
 * y entrega su resultado al consumidor. La continuación es la identidad:
 * "haz la operación y devuelve su salida".
 */
export function perform<EName extends string, I, O>(
  tag: EName,
  input: I,
): Eff<Effect<EName, I, O>, O> {
  return {
    kind: 'impure',
    effect: { tag, input },
    // El runtime garantiza que `value` es `O`; lo elevamos a través del tipo.
    continuation: (value: never) => pure<O>(value as unknown as O) as Eff<Effect<EName, I, O>, O>,
  };
}

/** Bind monádico (>>= en notación de Haskell). */
export function bind<E, A, B>(eff: Eff<E, A>, fn: (a: A) => Eff<E, B>): Eff<E, B> {
  if (eff.kind === 'pure') return fn(eff.value);
  // Componemos la continuación con `fn` para extender el árbol.
  const k = eff.continuation;
  return {
    kind: 'impure',
    effect: eff.effect,
    continuation: (value: never) => bind(k(value), fn),
  };
}

/** Alias funtorial: aplica una función pura al resultado. */
export function map<E, A, B>(eff: Eff<E, A>, fn: (a: A) => B): Eff<E, B> {
  return bind(eff, (a) => pure(fn(a)));
}

/** Secuencia una lista de computaciones y colecta sus resultados. */
export function sequence<E, A>(effs: ReadonlyArray<Eff<E, A>>): Eff<E, A[]> {
  return effs.reduce<Eff<E, A[]>>(
    (acc, cur) => bind(acc, (xs) => bind(cur, (x) => pure([...xs, x]))),
    pure<A[]>([]),
  );
}

/**
 * Interpreta un efecto concreto. Recorre el árbol: las hojas `pure`
 * pasan tal cual; los nodos `impure` cuyo `tag` coincida con el
 * handler son delegados a `handle`; el resto se propaga.
 */
export function handle<E1, E2, A>(
  eff: Eff<E1, A>,
  handler: Handler<string, unknown, unknown, E2, A>,
): Eff<E2, A> {
  if (eff.kind === 'pure') return pure(eff.value);
  if (eff.effect.tag === handler.effect) {
    return handler.handle(eff.effect.input, (value) =>
      handle(eff.continuation(value as never), handler),
    );
  }
  // Efecto distinto: reconstruimos el nodo dejando intacta su operación,
  // pero envolvemos recursivamente la continuación para que siga viendo
  // este handler aguas abajo.
  return {
    kind: 'impure',
    effect: eff.effect,
    continuation: (value: never) => handle(eff.continuation(value), handler),
  };
}

/**
 * Extrae el valor de una computación 100% pura. Lanza si quedan efectos
 * sin interpretar — útil tras componer todos los handlers.
 */
export function run<A>(eff: Eff<never, A>): A {
  if (eff.kind === 'pure') return eff.value;
  throw new Error(`[effects] efecto sin manejar: ${eff.effect.tag}`);
}
