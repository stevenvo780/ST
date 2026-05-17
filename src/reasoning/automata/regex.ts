// ============================================================
// ST Automata — Regex parsing + Thompson construction
// ============================================================
//
// Gramática soportada (precedencia: postfix > concat > '|'):
//
//   expr   := term ( '|' term )*
//   term   := factor*                (concatenación implícita)
//   factor := atom ( '*' | '+' | '?' )*
//   atom   := char | '(' expr ')' | '∅' (vacío) | 'ε'
//
// Caracteres reservados: ( ) | * + ?  → escapar con '\'.
// '∅' y 'ε' son atómicos opcionales (no son obligatorios para parsear).
//
// `regexToNfa` construye un NFA por la construcción de Thompson:
// para cada operador un fragmento con un único initial y un único accept.
// ============================================================

import type { NFA, Regex, Symbol } from './types';
import { EPSILON } from './types';
import { nfaAccepts } from './nfa';

// ── Parser ───────────────────────────────────────────────────

interface Cursor {
  s: string;
  i: number;
}

function peek(c: Cursor): string | undefined {
  return c.i < c.s.length ? c.s[c.i] : undefined;
}

function consume(c: Cursor): string | undefined {
  const ch = peek(c);
  if (ch !== undefined) c.i++;
  return ch;
}

function expect(c: Cursor, ch: string): void {
  const got = consume(c);
  if (got !== ch)
    throw new Error(`parseRegex: esperaba "${ch}" en pos ${c.i - 1}, vi "${got ?? 'EOF'}"`);
}

const POSTFIX = new Set(['*', '+', '?']);
const SPECIAL = new Set(['(', ')', '|', '*', '+', '?', '\\']);

function parseExpr(c: Cursor): Regex {
  let left = parseTerm(c);
  while (peek(c) === '|') {
    consume(c);
    const right = parseTerm(c);
    left = { kind: 'union', left, right };
  }
  return left;
}

function parseTerm(c: Cursor): Regex {
  // term puede ser vacío → ε.
  const atoms: Regex[] = [];
  while (true) {
    const ch = peek(c);
    if (ch === undefined || ch === '|' || ch === ')') break;
    atoms.push(parseFactor(c));
  }
  if (atoms.length === 0) return { kind: 'epsilon' };
  return atoms.reduce((acc, r) => ({ kind: 'concat', left: acc, right: r }));
}

function parseFactor(c: Cursor): Regex {
  let atom = parseAtom(c);
  while (true) {
    const ch = peek(c);
    if (ch === undefined || !POSTFIX.has(ch)) break;
    consume(c);
    if (ch === '*') atom = { kind: 'star', arg: atom };
    else if (ch === '+') atom = { kind: 'plus', arg: atom };
    else if (ch === '?') atom = { kind: 'optional', arg: atom };
  }
  return atom;
}

function parseAtom(c: Cursor): Regex {
  const ch = peek(c);
  if (ch === undefined) throw new Error('parseRegex: EOF inesperado en atom');
  if (ch === '(') {
    consume(c);
    const inner = parseExpr(c);
    expect(c, ')');
    return inner;
  }
  if (ch === '\\') {
    consume(c);
    const esc = consume(c);
    if (esc === undefined) throw new Error('parseRegex: escape colgante');
    return { kind: 'char', c: esc };
  }
  if (ch === '∅') {
    consume(c);
    return { kind: 'empty' };
  }
  if (ch === 'ε') {
    consume(c);
    return { kind: 'epsilon' };
  }
  if (SPECIAL.has(ch)) {
    throw new Error(`parseRegex: caracter "${ch}" reservado en pos ${c.i}`);
  }
  consume(c);
  return { kind: 'char', c: ch };
}

export function parseRegex(s: string): Regex {
  const c: Cursor = { s, i: 0 };
  const r = parseExpr(c);
  if (c.i !== s.length) {
    throw new Error(`parseRegex: tokens restantes en pos ${c.i}: "${s.slice(c.i)}"`);
  }
  return r;
}

// ── Thompson construction ────────────────────────────────────
//
// Cada fragmento tiene exactamente UN estado inicial y UN aceptante.
// Se identifica un estado con un entero único para evitar colisiones.

interface Fragment {
  initial: number;
  accept: number;
  /** state → symbol → set of next states */
  edges: Map<number, Map<Symbol, Set<number>>>;
  /** alphabet (sin ε) acumulado durante el build. */
  alphabet: Set<Symbol>;
}

function emptyFragment(initial: number, accept: number): Fragment {
  return { initial, accept, edges: new Map(), alphabet: new Set() };
}

function addEdge(frag: Fragment, from: number, sym: Symbol, to: number): void {
  let row = frag.edges.get(from);
  if (!row) {
    row = new Map();
    frag.edges.set(from, row);
  }
  let set = row.get(sym);
  if (!set) {
    set = new Set();
    row.set(sym, set);
  }
  set.add(to);
  if (sym !== EPSILON) frag.alphabet.add(sym);
}

function mergeEdges(into: Fragment, other: Fragment): void {
  for (const [from, row] of other.edges) {
    for (const [sym, set] of row) {
      for (const to of set) addEdge(into, from, sym, to);
    }
  }
  for (const a of other.alphabet) into.alphabet.add(a);
}

function buildFragment(r: Regex, fresh: () => number): Fragment {
  if (r.kind === 'epsilon') {
    const init = fresh();
    const acc = fresh();
    const frag = emptyFragment(init, acc);
    addEdge(frag, init, EPSILON, acc);
    return frag;
  }
  if (r.kind === 'empty') {
    // Lenguaje vacío: dos estados sin conexión. No hay camino al accept.
    const init = fresh();
    const acc = fresh();
    return emptyFragment(init, acc);
  }
  if (r.kind === 'char') {
    const init = fresh();
    const acc = fresh();
    const frag = emptyFragment(init, acc);
    addEdge(frag, init, r.c, acc);
    return frag;
  }
  if (r.kind === 'concat') {
    const A = buildFragment(r.left, fresh);
    const B = buildFragment(r.right, fresh);
    const frag = emptyFragment(A.initial, B.accept);
    mergeEdges(frag, A);
    mergeEdges(frag, B);
    addEdge(frag, A.accept, EPSILON, B.initial);
    return frag;
  }
  if (r.kind === 'union') {
    const A = buildFragment(r.left, fresh);
    const B = buildFragment(r.right, fresh);
    const init = fresh();
    const acc = fresh();
    const frag = emptyFragment(init, acc);
    mergeEdges(frag, A);
    mergeEdges(frag, B);
    addEdge(frag, init, EPSILON, A.initial);
    addEdge(frag, init, EPSILON, B.initial);
    addEdge(frag, A.accept, EPSILON, acc);
    addEdge(frag, B.accept, EPSILON, acc);
    return frag;
  }
  if (r.kind === 'star') {
    const A = buildFragment(r.arg, fresh);
    const init = fresh();
    const acc = fresh();
    const frag = emptyFragment(init, acc);
    mergeEdges(frag, A);
    addEdge(frag, init, EPSILON, A.initial);
    addEdge(frag, init, EPSILON, acc);
    addEdge(frag, A.accept, EPSILON, A.initial);
    addEdge(frag, A.accept, EPSILON, acc);
    return frag;
  }
  if (r.kind === 'plus') {
    // a+ = a · a*
    return buildFragment(
      { kind: 'concat', left: r.arg, right: { kind: 'star', arg: r.arg } },
      fresh,
    );
  }
  if (r.kind === 'optional') {
    // a? = a | ε
    return buildFragment({ kind: 'union', left: r.arg, right: { kind: 'epsilon' } }, fresh);
  }
  // Exhaustivo.
  const _exhaustive: never = r;
  return _exhaustive;
}

export function regexToNfa(r: Regex): NFA {
  let counter = 0;
  const fresh = (): number => counter++;
  const frag = buildFragment(r, fresh);

  // Convertir entero → string para encajar con NFA.
  const stateName = (n: number) => `s${n}`;
  const states = new Set<string>();
  const transitions = new Map<string, Map<Symbol, Set<string>>>();

  // Asegurar que todos los estados conocidos estén poblados, incluso los
  // que sólo aparecen como destino.
  const seen = new Set<number>();
  for (const [from, row] of frag.edges) {
    seen.add(from);
    for (const set of row.values()) for (const to of set) seen.add(to);
  }
  seen.add(frag.initial);
  seen.add(frag.accept);

  for (const n of seen) states.add(stateName(n));

  for (const [from, row] of frag.edges) {
    const newRow = new Map<Symbol, Set<string>>();
    for (const [sym, set] of row) {
      const newSet = new Set<string>();
      for (const to of set) newSet.add(stateName(to));
      newRow.set(sym, newSet);
    }
    transitions.set(stateName(from), newRow);
  }

  return {
    states,
    alphabet: frag.alphabet,
    transitions,
    initial: stateName(frag.initial),
    accept: new Set([stateName(frag.accept)]),
    epsilon: EPSILON,
  };
}

/** Atajo: ¿la expresión regular `r` matchea exactamente `s`? */
export function regexMatches(r: Regex, s: string): boolean {
  const nfa = regexToNfa(r);
  return nfaAccepts(nfa, s);
}
