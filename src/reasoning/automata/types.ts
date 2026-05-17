// ============================================================
// ST Automata — Tipos
// ============================================================
//
// Modelado clásico de autómatas finitos y de pila:
//
//   DFA (Deterministic Finite Automaton)
//     · Transición total: state × symbol → state.
//     · Acepta una palabra sii el camino termina en estado final.
//
//   NFA (Nondeterministic Finite Automaton, con ε-transiciones)
//     · Transición: state × (symbol ∪ {ε}) → P(states).
//     · Acepta sii existe un camino que termina en final.
//
//   PDA (Pushdown Automaton) — variante "by final state"
//     · Transición: (state, read, popTop) → (nextState, pushTop[]).
//     · `read` o `popTop` pueden ser ε (sin consumir / sin tope).
//     · pushTop se apila en orden inverso (último → top).
//
// Notas:
//   • Los símbolos son strings de longitud 1 (chars). El alfabeto
//     se mantiene explícito porque define complement(M).
//   • La constante EPSILON ('ε') vive aquí para reutilizarse.
// ============================================================

export const EPSILON = 'ε' as const;

export type Symbol = string;

// ── DFA ───────────────────────────────────────────────────────

export interface DFA {
  readonly states: Set<string>;
  readonly alphabet: Set<Symbol>;
  /** state → symbol → state. La función puede ser parcial: si falta una
   *  arista para (state, symbol), la palabra es rechazada. */
  readonly transitions: Map<string, Map<Symbol, string>>;
  readonly initial: string;
  readonly accept: Set<string>;
}

// ── NFA ───────────────────────────────────────────────────────

export interface NFA {
  readonly states: Set<string>;
  readonly alphabet: Set<Symbol>;
  /** state → symbol (puede ser EPSILON) → P(states). */
  readonly transitions: Map<string, Map<Symbol, Set<string>>>;
  readonly initial: string;
  readonly accept: Set<string>;
  /** Símbolo usado como ε; default `EPSILON` ('ε'). */
  readonly epsilon?: Symbol;
}

// ── Regex ─────────────────────────────────────────────────────

export type Regex =
  | { kind: 'empty' } // ∅
  | { kind: 'epsilon' } // ε
  | { kind: 'char'; c: Symbol }
  | { kind: 'concat'; left: Regex; right: Regex }
  | { kind: 'union'; left: Regex; right: Regex }
  | { kind: 'star'; arg: Regex }
  | { kind: 'plus'; arg: Regex }
  | { kind: 'optional'; arg: Regex };

// ── PDA ───────────────────────────────────────────────────────

export interface PDATransition {
  /** Estado origen. */
  readonly state: string;
  /** Símbolo de entrada a consumir; EPSILON = sin consumir. */
  readonly read: Symbol;
  /** Tope de pila a desapilar; EPSILON = sin pop. */
  readonly popTop: Symbol;
  /** Estado destino. */
  readonly nextState: string;
  /** Símbolos a apilar (el último queda en la cima). [] = no push. */
  readonly pushTop: ReadonlyArray<Symbol>;
}

export interface PDA {
  readonly states: Set<string>;
  readonly alphabet: Set<Symbol>;
  readonly stackAlphabet: Set<Symbol>;
  readonly transitions: ReadonlyArray<PDATransition>;
  readonly initial: string;
  readonly initialStack: Symbol;
  /** Aceptación por estado final. */
  readonly accept: Set<string>;
}
