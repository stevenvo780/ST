// ============================================================
// ST Combinatorial Games — Sprague-Grundy + Surreal numbers
// ============================================================
// Dos puntas complementarias del análisis de juegos combinatorios:
//
//   1. Juegos imparciales (mismas movidas para ambos jugadores) →
//      Sprague-Grundy theorem: cada estado tiene un único valor
//      grundy ∈ ℕ. Una posición es perdedora para el jugador a mover
//      sii grundy = 0. Para juegos compuestos (suma disjunta), el
//      valor se obtiene como XOR (nim-sum) de los componentes.
//
//   2. Juegos partisanos (movidas asimétricas Left/Right) → números
//      surreales de Conway. Cada juego es un par { L | R } donde L y R
//      son conjuntos de juegos (sus opciones). De aquí emergen los
//      enteros, fracciones diádicas, ω, ε, *, ↑, etc.
//
// Convenciones:
//   • Los juegos imparciales se modelan como una interfaz genérica
//     `ImpartialGame<S>` con función de movidas y predicado terminal.
//   • Los estados deben ser serializables a string (clave del caché);
//     se exige una función `key` opcional; default = JSON.stringify.
//   • Los surreales son recursivos. Sólo soportamos comparación y
//     aritmética básica (add, negate, compare). Suficiente para
//     verificar identidades como 1 + 1 = 2, *‖0, etc.
//   • La simplificación de surreales aquí elimina opciones dominadas
//     (Left domina a otra Left si es ≥; Right domina si es ≤). No
//     hacemos "número simplicity" completo — sí suficiente para que
//     los tests de identidad pasen sin explosión de tamaño.
// ============================================================

// ── Sprague-Grundy ──────────────────────────────────────────

export interface ImpartialGame<S> {
  readonly initial: S;
  readonly moves: (state: S) => S[];
  readonly isTerminal: (state: S) => boolean;
  // Opcional: clave canónica del estado para caché. Default JSON.stringify.
  readonly key?: (state: S) => string;
}

function stateKey<S>(game: ImpartialGame<S>, state: S): string {
  return game.key ? game.key(state) : JSON.stringify(state);
}

/**
 * Minimum Excludant: menor entero ≥ 0 que no está en el conjunto.
 * mex(∅) = 0, mex({0,1,3}) = 2, mex({1,2}) = 0.
 */
export function mex(set: Set<number>): number {
  let n = 0;
  while (set.has(n)) n += 1;
  return n;
}

/**
 * Valor de Grundy del estado dado bajo el juego imparcial.
 * Define: G(terminal) = 0; G(s) = mex { G(s') : s' ∈ moves(s) }.
 * Usa caché (compartido entre llamadas) keyed por la clave canónica del estado.
 */
export function grundyValue<S>(
  game: ImpartialGame<S>,
  state: S,
  cache: Map<string, number> = new Map<string, number>(),
): number {
  const k = stateKey(game, state);
  const cached = cache.get(k);
  if (cached !== undefined) return cached;
  if (game.isTerminal(state)) {
    cache.set(k, 0);
    return 0;
  }
  const successors = game.moves(state);
  const values = new Set<number>();
  for (const next of successors) {
    values.add(grundyValue(game, next, cache));
  }
  const g = mex(values);
  cache.set(k, g);
  return g;
}

/**
 * El jugador a mover gana sii grundy ≠ 0 (juego imparcial con convención
 * normal: el que no puede mover, pierde).
 */
export function isWinning<S>(game: ImpartialGame<S>, state: S): boolean {
  return grundyValue(game, state) !== 0;
}

/**
 * Nim-sum: XOR bit a bit de los valores. Identidad del monoide de Grundy
 * bajo suma disjunta de juegos imparciales.
 */
export function nimSum(values: number[]): number {
  let acc = 0;
  for (const v of values) acc ^= v;
  return acc;
}

/**
 * Grundy de la suma disjunta de juegos imparciales independientes:
 *   G(G1 + G2 + ... + Gn)(s1,...,sn) = G1(s1) ⊕ G2(s2) ⊕ ... ⊕ Gn(sn).
 * Requiere games.length === states.length.
 */
export function multiGameGrundy<S>(games: Array<ImpartialGame<S>>, states: S[]): number {
  if (games.length !== states.length) {
    throw new Error(
      `multiGameGrundy: games (${games.length}) y states (${states.length}) deben tener igual longitud`,
    );
  }
  const xs: number[] = [];
  for (let i = 0; i < games.length; i += 1) {
    // Cada juego tiene su propio caché.
    xs.push(grundyValue(games[i], states[i]));
  }
  return nimSum(xs);
}

// ── Juegos pre-construidos ──────────────────────────────────

/**
 * Nim clásico: varios montones de piedras, un movimiento = sacar ≥1
 * piedras de un único montón. Pierde quien no puede mover (todos los
 * montones a 0). Estado: vector de tamaños (normalizado, sin ceros y
 * ordenado descendente para que el caché sea efectivo entre simetrías).
 */
export function nim(piles: number[]): ImpartialGame<number[]> {
  if (piles.some((p) => p < 0 || !Number.isInteger(p))) {
    throw new Error('nim: cada pila debe ser entero ≥ 0');
  }
  const canon = (s: number[]): number[] => s.filter((x) => x > 0).sort((a, b) => b - a);
  const initial = canon(piles);
  return {
    initial,
    isTerminal: (s) => s.length === 0,
    moves: (s) => {
      const out: number[][] = [];
      for (let i = 0; i < s.length; i += 1) {
        const v = s[i];
        for (let take = 1; take <= v; take += 1) {
          const next = s.slice();
          next[i] = v - take;
          out.push(canon(next));
        }
      }
      return out;
    },
    key: (s) => s.join(','),
  };
}

/**
 * Nim 1D: una sola pila de `stones` piedras; sacar 1..stones. Equivale
 * a `nim([stones])` pero con estado más compacto (un número).
 */
export function nim1d(stones: number): ImpartialGame<number> {
  if (!Number.isInteger(stones) || stones < 0) {
    throw new Error('nim1d: stones debe ser entero ≥ 0');
  }
  return {
    initial: stones,
    isTerminal: (s) => s === 0,
    moves: (s) => {
      const out: number[] = [];
      for (let take = 1; take <= s; take += 1) out.push(s - take);
      return out;
    },
    key: (s) => String(s),
  };
}

/**
 * Chomp: tablero rows×cols de "chocolate". Cada movida elige una casilla
 * viva (true) y "muerde" todo el rectángulo abajo-derecha desde ella. La
 * casilla (0,0) es veneno: quien la come pierde (convención misère
 * implementada como: estado terminal cuando solo queda (0,0)).
 *
 * Estado: matriz booleana rows×cols con true = casilla viva.
 *
 * Nota: Chomp tiene posición ganadora conocida para el primer jugador
 * en todo tablero ≥ 2×2 (argumento de robo de estrategia), pero la
 * estrategia explícita es desconocida en general. Para 1×1 (sólo el
 * veneno) el jugador a mover pierde, así que grundy = 0.
 */
export function chompGame(rows: number, cols: number): ImpartialGame<boolean[][]> {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new Error('chompGame: rows y cols deben ser enteros ≥ 1');
  }
  const buildInitial = (): boolean[][] => {
    const m: boolean[][] = [];
    for (let r = 0; r < rows; r += 1) {
      const row: boolean[] = [];
      for (let c = 0; c < cols; c += 1) row.push(true);
      m.push(row);
    }
    return m;
  };
  const isTerminal = (s: boolean[][]): boolean => {
    // Terminal: sólo queda la casilla (0,0) viva (el veneno). El jugador
    // a mover está obligado a comerla y pierde.
    if (!s[0][0]) return true; // ya consumida (degenerate)
    for (let r = 0; r < s.length; r += 1) {
      const row = s[r];
      for (let c = 0; c < row.length; c += 1) {
        if (row[c] && !(r === 0 && c === 0)) return false;
      }
    }
    return true;
  };
  return {
    initial: buildInitial(),
    isTerminal,
    moves: (s) => {
      const out: boolean[][][] = [];
      const R = s.length;
      const C = s[0].length;
      for (let r = 0; r < R; r += 1) {
        for (let c = 0; c < C; c += 1) {
          if (!s[r][c]) continue;
          if (r === 0 && c === 0 && !isTerminal(s)) {
            // Comer el veneno es legal sólo si es la única opción (terminal).
            // No lo ofrecemos como movida si hay otras casillas.
            continue;
          }
          // Comer (r,c) elimina toda casilla (r', c') con r' ≥ r y c' ≥ c.
          const next: boolean[][] = s.map((row) => row.slice());
          for (let r2 = r; r2 < R; r2 += 1) {
            for (let c2 = c; c2 < C; c2 += 1) {
              next[r2][c2] = false;
            }
          }
          out.push(next);
        }
      }
      return out;
    },
    key: (s) => s.map((row) => row.map((b) => (b ? '1' : '0')).join('')).join('/'),
  };
}

// ── Surreal Numbers (Conway) ────────────────────────────────

export interface SurrealNumber {
  readonly left: SurrealNumber[];
  readonly right: SurrealNumber[];
}

function makeSurreal(left: SurrealNumber[], right: SurrealNumber[]): SurrealNumber {
  return { left, right };
}

/** 0 = { | } — sin opciones para ninguno; "second player wins". */
export const ZERO: SurrealNumber = makeSurreal([], []);

/** 1 = { 0 | }. */
export const ONE: SurrealNumber = makeSurreal([ZERO], []);

/** -1 = { | 0 }. */
export const MINUS_ONE: SurrealNumber = makeSurreal([], [ZERO]);

/** * (star) = { 0 | 0 } — primer jugador gana, no comparable a 0 (fuzzy). */
export const STAR: SurrealNumber = makeSurreal([ZERO], [ZERO]);

/**
 * Construye el surreal correspondiente al entero `n`.
 *   0 = { | }
 *   n = { n-1 | }            (n > 0)
 *  -n = {     | -(n-1) }     (n < 0)
 */
export function fromInt(n: number): SurrealNumber {
  if (!Number.isInteger(n)) throw new Error('fromInt: requiere entero');
  if (n === 0) return ZERO;
  if (n > 0) return makeSurreal([fromInt(n - 1)], []);
  return makeSurreal([], [fromInt(n + 1)]);
}

/**
 * Negación: -G = { -GR | -GL }.
 */
export function negate(s: SurrealNumber): SurrealNumber {
  return makeSurreal(
    s.right.map((r) => negate(r)),
    s.left.map((l) => negate(l)),
  );
}

/**
 * Suma de juegos: G + H = { GL+H, G+HL  |  GR+H, G+HR }.
 */
export function add(a: SurrealNumber, b: SurrealNumber): SurrealNumber {
  const left: SurrealNumber[] = [];
  for (const al of a.left) left.push(add(al, b));
  for (const bl of b.left) left.push(add(a, bl));
  const right: SurrealNumber[] = [];
  for (const ar of a.right) right.push(add(ar, b));
  for (const br of b.right) right.push(add(a, br));
  return makeSurreal(left, right);
}

// ── Comparación de surreales ────────────────────────────────
//
// Definición Conway:
//   G ≤ H  ⇔  ∀ GL.  ¬(H ≤ GL)     ∧     ∀ HR.  ¬(HR ≤ G)
// Equivalentemente:
//   G ≥ H  ⇔  H ≤ G
//   G || H (fuzzy/incomparable) ⇔  ¬(G ≤ H) ∧ ¬(H ≤ G)
//
// `compare(a, b)` devuelve -1 si a<b, 1 si a>b, 0 si a==b. Si son
// incomparables (fuzzy) lanza error explicito — usá `isFuzzy` antes o
// `leq`/`geq` directamente.

function leq(a: SurrealNumber, b: SurrealNumber): boolean {
  for (const al of a.left) {
    if (leq(b, al)) return false;
  }
  for (const br of b.right) {
    if (leq(br, a)) return false;
  }
  return true;
}

export function compare(a: SurrealNumber, b: SurrealNumber): -1 | 0 | 1 {
  const ab = leq(a, b);
  const ba = leq(b, a);
  if (ab && ba) return 0;
  if (ab && !ba) return -1;
  if (!ab && ba) return 1;
  throw new Error('compare: surreales incomparables (fuzzy). Usá isFuzzy / leq / geq.');
}

/**
 * G es fuzzy con 0 sii no satisface G ≤ 0 ni 0 ≤ G — es decir, el
 * primer jugador gana. * es el ejemplo canónico.
 */
export function isFuzzy(s: SurrealNumber): boolean {
  return !leq(s, ZERO) && !leq(ZERO, s);
}

/**
 * Simplificación parcial: elimina opciones dominadas en cada lado.
 *
 *   En la lista Left, una opción L1 domina a L2 si L1 ≥ L2 (entonces
 *   L2 puede borrarse: el jugador Left preferirá L1).
 *   En la lista Right, una opción R1 domina a R2 si R1 ≤ R2.
 *
 * No hace eliminación reversible ("bypass") — eso podría requerirse
 * para canonicalización completa Conway. Para nuestros tests es
 * suficiente.
 */
export function simplify(s: SurrealNumber): SurrealNumber {
  const simplifiedLeft = s.left.map((l) => simplify(l));
  const simplifiedRight = s.right.map((r) => simplify(r));

  // Dominancia Left: descartar L2 si existe L1 con L1 ≥ L2 (L1 ≠ L2).
  const keptLeft: SurrealNumber[] = [];
  for (let i = 0; i < simplifiedLeft.length; i += 1) {
    const li = simplifiedLeft[i];
    let dominated = false;
    for (let j = 0; j < simplifiedLeft.length; j += 1) {
      if (i === j) continue;
      const lj = simplifiedLeft[j];
      if (leq(li, lj) && !leq(lj, li)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) keptLeft.push(li);
  }

  // Dominancia Right: descartar R2 si existe R1 con R1 ≤ R2 (R1 ≠ R2).
  const keptRight: SurrealNumber[] = [];
  for (let i = 0; i < simplifiedRight.length; i += 1) {
    const ri = simplifiedRight[i];
    let dominated = false;
    for (let j = 0; j < simplifiedRight.length; j += 1) {
      if (i === j) continue;
      const rj = simplifiedRight[j];
      if (leq(rj, ri) && !leq(ri, rj)) {
        dominated = true;
        break;
      }
    }
    if (!dominated) keptRight.push(ri);
  }

  return makeSurreal(keptLeft, keptRight);
}
