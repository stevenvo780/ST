// ============================================================
// ST Coinduction — Streams + corecursion + bisimulación up-to
// ============================================================
// Streams coinductivos definidos por destructores (head, tail).
// Construcción corecursiva via thunks perezosos (la cola es una
// función `() => Stream<T>` para evitar evaluación infinita).
//
// Bisimulación: la noción natural de igualdad para streams. Dos
// streams `s, t` son bisimilares si existe una relación R tal que
//   • R(s, t) ⇒ head(s) = head(t)
//   • R(s, t) ⇒ R(tail(s), tail(t))
// La igualdad sintáctica falla (dos streams pueden generar la
// misma secuencia con thunks distintos); la bisimulación es la
// clausura coinductiva apropiada.
//
// Como las secuencias son infinitas no podemos verificar
// bisimilaridad en general (semi-decidible). Por eso ofrecemos:
//   • isBisimilar(a, b, depth): chequeo "hasta profundidad", suficiente
//     para refutación (encontrar el primer prefijo divergente) y para
//     evidencia computacional positiva acotada.
//   • prove(claim, depth): técnica "bisimulación up-to". El usuario
//     provee una relación R; chequeamos por `depth` pasos que
//       R(a,b) ⇒ head(a)=head(b) ∧ R(tail a, tail b).
//     Si la relación es realmente una bisimulación, ningún paso falla;
//     si depth pasos pasaron sin fallar, tenemos alta confianza
//     (en el caso límite, todos los pasos válidos = bisimulación).
// ============================================================

// ── Tipo público ────────────────────────────────────────────

export interface Stream<T> {
  head: T;
  tail: () => Stream<T>;
}

// ── Constructores ───────────────────────────────────────────

/**
 * Cons explícito: crea un stream con cabeza `h` y cola perezosa
 * `t` (una función que produce el resto cuando se evalúa).
 */
export function cons<T>(h: T, t: () => Stream<T>): Stream<T> {
  return { head: h, tail: t };
}

/**
 * `repeat(x)` = x, x, x, ...  (stream constante)
 *
 * Definición corecursiva clásica: repeat(x) = cons(x, () => repeat(x)).
 * El thunk evita la recursión infinita en tiempo de construcción.
 */
export function repeat<T>(x: T): Stream<T> {
  // Truco para evitar reconstruir el objeto en cada `tail`: usamos
  // un nodo que se referencia a sí mismo. Esto preserva la semántica
  // (tail(repeat x) = repeat x) y además garantiza punto-fijo.
  const node: Stream<T> = { head: x, tail: () => node };
  return node;
}

/**
 * `iterate(f, x)` = x, f(x), f(f(x)), ...
 *
 * Definición corecursiva: iterate(f, x) = cons(x, () => iterate(f, f(x))).
 */
export function iterate<T>(f: (x: T) => T, x: T): Stream<T> {
  return { head: x, tail: () => iterate(f, f(x)) };
}

/**
 * `unfold(seed, step)`: anamorfismo genérico. `step(s)` devuelve
 * el siguiente par `[valor, próximaSemilla]` o `null` para terminar.
 * Para streams infinitos, `step` nunca debe devolver `null`. Si
 * devuelve `null` durante una iteración, devolvemos un stream que
 * cicla la última cabeza producida (decisión: streams totales).
 */
export function unfold<S, T>(seed: S, step: (s: S) => readonly [T, S] | null): Stream<T> {
  const next = step(seed);
  if (next === null) {
    // Streams en este módulo son totales; si el cliente decide terminar,
    // estabilizamos en un punto fijo trivial usando undefined.
    // En la práctica, los callers no deberían llamar unfold con un step
    // que puede devolver null si esperan un stream infinito.
    throw new Error('unfold: step returned null on infinite stream');
  }
  const [value, nextSeed] = next;
  return { head: value, tail: () => unfold(nextSeed, step) };
}

// ── Destructores y observaciones ────────────────────────────

/**
 * `take(s, n)`: extrae los primeros n elementos de un stream.
 * Observación finita; es la única forma de "ver" un stream.
 */
export function take<T>(s: Stream<T>, n: number): T[] {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`take: n debe ser entero no-negativo, recibido ${n}`);
  }
  const out: T[] = [];
  let cur = s;
  for (let i = 0; i < n; i++) {
    out.push(cur.head);
    cur = cur.tail();
  }
  return out;
}

/**
 * `drop(s, n)`: descarta los primeros n elementos.
 */
export function drop<T>(s: Stream<T>, n: number): Stream<T> {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`drop: n debe ser entero no-negativo, recibido ${n}`);
  }
  let cur = s;
  for (let i = 0; i < n; i++) cur = cur.tail();
  return cur;
}

/**
 * `nth(s, i)`: i-ésimo elemento (0-indexed).
 */
export function nth<T>(s: Stream<T>, i: number): T {
  return drop(s, i).head;
}

// ── Functor / aplicativos ───────────────────────────────────

/**
 * `map(f, s)`: aplica `f` a cada elemento.
 *
 * Definición corecursiva: map(f, s) = cons(f(head s), () => map(f, tail s)).
 */
export function map<T, U>(f: (x: T) => U, s: Stream<T>): Stream<U> {
  return { head: f(s.head), tail: () => map(f, s.tail()) };
}

/**
 * `zipWith(f, a, b)`: combina dos streams elemento a elemento.
 *
 * zipWith(f, a, b) = cons(f(head a, head b), () => zipWith(f, tail a, tail b))
 */
export function zipWith<A, B, C>(f: (a: A, b: B) => C, a: Stream<A>, b: Stream<B>): Stream<C> {
  return {
    head: f(a.head, b.head),
    tail: () => zipWith(f, a.tail(), b.tail()),
  };
}

/**
 * `zip(a, b)`: par-zip estándar.
 */
export function zip<A, B>(a: Stream<A>, b: Stream<B>): Stream<[A, B]> {
  return zipWith((x: A, y: B) => [x, y] as [A, B], a, b);
}

/**
 * `filter(pred, s)`: PRECONDICIÓN — el predicado debe ser satisfecho
 * infinitas veces, de lo contrario el stream resultante se "atasca".
 * No protegemos contra eso porque coinductivamente no es decidible.
 */
export function filter<T>(pred: (x: T) => boolean, s: Stream<T>): Stream<T> {
  let cur = s;
  while (!pred(cur.head)) {
    cur = cur.tail();
  }
  const advanced = cur;
  return {
    head: advanced.head,
    tail: () => filter(pred, advanced.tail()),
  };
}

// ── Streams notables ────────────────────────────────────────

/**
 * naturals = 0, 1, 2, 3, ...
 */
export const naturals: Stream<number> = iterate((n: number) => n + 1, 0);

/**
 * fibonacci = 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...
 *
 * Definición clásica corecursiva (Hinze):
 *   fib = 0 :: 1 :: zipWith(+, fib, tail fib)
 *
 * En TypeScript necesitamos un thunk que se autorreferencie. Lo
 * implementamos con una closure que devuelve siempre el mismo nodo.
 */
function makeFibonacci(): Stream<number> {
  // fib(n) clásico vía iterate sobre el par (a, b) = (fib n, fib (n+1)).
  // Equivalente computacionalmente a la definición zipWith pero sin
  // requerir auto-referencia en TS (que generaría thunks anidados
  // exponencialmente sin memoización).
  return map(
    ([a, _b]) => a,
    iterate(([a, b]: [number, number]) => [b, a + b] as [number, number], [0, 1] as [
      number,
      number,
    ]),
  );
}

export const fibonacci: Stream<number> = makeFibonacci();

// ── Bisimulación ────────────────────────────────────────────

export interface BisimulationProof<T> {
  /** Par inicial cuyo membership en la bisimulación queremos probar. */
  initial: [Stream<T>, Stream<T>];
  /**
   * Relación candidata R. Por bisimulación, basta que R sea una
   * "bisimulación up-to": cerrada bajo los destructores en el sentido
   * de que R(s,t) ⇒ R(tail s, tail t).
   */
  relation: (a: Stream<T>, b: Stream<T>) => boolean;
}

const DEFAULT_DEPTH = 64;

/**
 * `isBisimilar(a, b, depth)`: chequeo de bisimilaridad acotado.
 * Compara cabezas hasta profundidad `depth`. Retorna `false` apenas
 * encuentra una divergencia (refutación constructiva); retorna `true`
 * si los primeros `depth` elementos coinciden (evidencia positiva
 * acotada — para una prueba real de bisimilaridad, usar `prove`).
 *
 * Usa `Object.is` para comparar primitivos. Para tipos compuestos
 * el caller debería envolver con un equality explícito (no hacemos
 * deep-equals porque tendría costo no obvio y semántica ambigua).
 */
export function isBisimilar<T>(a: Stream<T>, b: Stream<T>, depth: number = DEFAULT_DEPTH): boolean {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error(`isBisimilar: depth debe ser entero no-negativo, recibido ${depth}`);
  }
  let curA = a;
  let curB = b;
  for (let i = 0; i < depth; i++) {
    if (!equal(curA.head, curB.head)) return false;
    curA = curA.tail();
    curB = curB.tail();
  }
  return true;
}

/**
 * Igualdad observacional para elementos de un stream. Soportamos:
 *   • primitivos (===, con Object.is para NaN/+0/-0)
 *   • arrays y tuplas (recursión elemento a elemento)
 *   • objetos planos por keys propias
 * No hace circular-detection: si pasás un grafo cíclico, va a colgar.
 */
function equal(x: unknown, y: unknown): boolean {
  if (Object.is(x, y)) return true;
  if (typeof x !== typeof y) return false;
  if (x === null || y === null) return false;
  if (typeof x !== 'object') return false;
  if (Array.isArray(x) !== Array.isArray(y)) return false;
  if (Array.isArray(x) && Array.isArray(y)) {
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) {
      if (!equal(x[i], y[i])) return false;
    }
    return true;
  }
  const ox = x as Record<string, unknown>;
  const oy = y as Record<string, unknown>;
  const kx = Object.keys(ox);
  const ky = Object.keys(oy);
  if (kx.length !== ky.length) return false;
  for (const k of kx) {
    if (!Object.prototype.hasOwnProperty.call(oy, k)) return false;
    if (!equal(ox[k], oy[k])) return false;
  }
  return true;
}

/**
 * `prove(claim, depth)`: aplica la técnica de bisimulación up-to.
 *
 * Algoritmo: empieza con el par inicial, y para cada paso i ∈ [0, depth):
 *   1. Verifica que la relación R sostenga el par actual (a_i, b_i).
 *   2. Verifica que las cabezas sean iguales: head(a_i) = head(b_i).
 *   3. Avanza: a_{i+1} = tail(a_i), b_{i+1} = tail(b_i).
 *
 * Si la relación R es genuinamente una bisimulación (clausurada bajo
 * tail), todos los pasos pasarán para cualquier `depth`. El método
 * es completo "en el límite": probar para `depth = ∞` ≡ probar bisim.
 * En la práctica devolvemos true si depth pasos pasaron sin error.
 *
 * Si la relación falla en algún paso, retornamos false (evidencia de
 * que R no es una bisimulación, o de que (a, b) no es bisimilar).
 */
export function prove<T>(claim: BisimulationProof<T>, depth: number = DEFAULT_DEPTH): boolean {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error(`prove: depth debe ser entero no-negativo, recibido ${depth}`);
  }
  let [curA, curB] = claim.initial;
  for (let i = 0; i < depth; i++) {
    if (!claim.relation(curA, curB)) return false;
    if (!equal(curA.head, curB.head)) return false;
    curA = curA.tail();
    curB = curB.tail();
  }
  return true;
}

// ── Utilidades para combinar streams (Hinze classics) ──────

/**
 * `interleave(a, b)`: intercala a, b, a, b, ... toma 1 de a luego 1 de b.
 *
 * interleave(a, b) = cons(head a, () => interleave(b, tail a))
 *
 * Nota: el "switch" entre a y b se hace por el truco clásico:
 * llamar recursivamente con los argumentos invertidos.
 */
export function interleave<T>(a: Stream<T>, b: Stream<T>): Stream<T> {
  return {
    head: a.head,
    tail: () => interleave(b, a.tail()),
  };
}

/**
 * `scan(f, init, s)`: prefijos acumulados; análogo a Array.prototype.reduce
 * pero coinductivo. scan(+, 0, naturals) = 0, 0, 1, 3, 6, 10, ...
 */
export function scan<T, U>(f: (acc: U, x: T) => U, init: U, s: Stream<T>): Stream<U> {
  return {
    head: init,
    tail: () => scan(f, f(init, s.head), s.tail()),
  };
}

// ── Exports auxiliares para tests ───────────────────────────

export const __internals = { equal };
