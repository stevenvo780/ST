// ============================================================
// Algebraic effects + free monads — Tipos núcleo
// ============================================================
//
// Modelamos efectos algebraicos como un free monad explícito sobre
// una firma de operaciones discriminadas por `tag`. La forma `Eff<E, A>`
// es un árbol cuyas hojas son `pure` (valores) y cuyos nodos internos
// son `impure` (operación + continuación). Un `handler` interpreta
// una operación concreta y reduce el árbol.
//
// Convenciones:
//   - `Effect<Name, In, Out>` es una *fila* de tipo a nivel de tipos:
//     "este programa puede ejecutar la operación `Name` con input `In`
//      esperando salida `Out`". El campo `output` es phantom.
//   - El runtime sólo consume `tag` e `input`; el `output` vive en la
//     posición de continuación (argumento de la k-función).
//   - Mantenemos `unknown` en el runtime para no falsear unsoundness y
//     usamos los tipos exclusivamente para guiar al consumidor.

/** Firma de un efecto algebraico: nombre, payload, resultado esperado. */
export type Effect<Name extends string, In, Out> = {
  readonly tag: Name;
  readonly input: In;
  /** Phantom: usado sólo a nivel de tipos para inferir la respuesta. */
  readonly output: Out;
};

/** Operación cruda almacenada en un nodo `impure`. */
export interface Operation {
  readonly tag: string;
  readonly input: unknown;
}

/** Computación con efectos `E` y resultado `A`. */
export type Eff<E, A> =
  | { readonly kind: 'pure'; readonly value: A }
  | {
      readonly kind: 'impure';
      readonly effect: Operation;
      readonly continuation: (value: never) => Eff<E, A>;
    };

/**
 * Handler de un efecto concreto. Recibe el input crudo y una
 * continuación que, dado el resultado de la operación, produce el
 * resto del cómputo. Devuelve un cómputo (posiblemente con otros
 * efectos `R`) y resultado final `A`.
 */
export interface Handler<EName extends string, I, O, R, A> {
  readonly effect: EName;
  readonly handle: (input: I, continuation: (value: O) => Eff<R, A>) => Eff<R, A>;
}

/** Monoide para `runWriter`. */
export interface Monoid<W> {
  readonly empty: W;
  readonly combine: (a: W, b: W) => W;
}

/** Resultado de `runException`. */
export type ExceptionResult<E, A> = { kind: 'ok'; value: A } | { kind: 'error'; error: E };
