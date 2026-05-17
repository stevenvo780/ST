// ============================================================
// ST Belief Revision — Parser propositional minimalista
// ============================================================
//
// Gramática (precedencia menor a mayor):
//   biconditional : implication ('<->' implication)*
//   implication   : disjunction ('->' implication)?       (asoc. derecha)
//   disjunction   : conjunction ('|' conjunction)*
//   conjunction   : negation    ('&' negation)*
//   negation      : '!' negation | primary
//   primary       : atom | 'true' | 'false' | '(' biconditional ')'
//
// Aliases tolerados:
//   ¬ ~ !            → not
//   ∧ /\ &           → and
//   ∨ \/ |           → or
//   → => ->          → implies
//   ↔ <-> <=>        → iff
//   ⊤ T              → true (cuando aparece como token único o palabra)
//   ⊥ F              → false

import type { PropFormula } from './types';

class ParseError extends Error {}

interface ParserCtx {
  src: string;
  pos: number;
}

function isAtomStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch);
}

function isAtomCont(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function skipWs(ctx: ParserCtx): void {
  while (ctx.pos < ctx.src.length && /\s/.test(ctx.src.charAt(ctx.pos))) {
    ctx.pos += 1;
  }
}

function peek(ctx: ParserCtx, offset = 0): string {
  return ctx.src.charAt(ctx.pos + offset);
}

function consumeIf(ctx: ParserCtx, token: string): boolean {
  skipWs(ctx);
  if (ctx.src.startsWith(token, ctx.pos)) {
    ctx.pos += token.length;
    return true;
  }
  return false;
}

function consumeAny(ctx: ParserCtx, tokens: string[]): string | null {
  skipWs(ctx);
  for (const t of tokens) {
    if (ctx.src.startsWith(t, ctx.pos)) {
      ctx.pos += t.length;
      return t;
    }
  }
  return null;
}

function parsePrimary(ctx: ParserCtx): PropFormula {
  skipWs(ctx);
  if (ctx.pos >= ctx.src.length) {
    throw new ParseError('inesperado fin de expresión');
  }
  const ch = peek(ctx);
  if (ch === '(') {
    ctx.pos += 1;
    const inner = parseBiconditional(ctx);
    skipWs(ctx);
    if (!consumeIf(ctx, ')')) {
      throw new ParseError(`esperaba ')' en posición ${ctx.pos}`);
    }
    return inner;
  }
  // Símbolos unicode true/false
  if (ch === '⊤') {
    ctx.pos += 1;
    return { kind: 'true' };
  }
  if (ch === '⊥') {
    ctx.pos += 1;
    return { kind: 'false' };
  }
  if (isAtomStart(ch)) {
    const start = ctx.pos;
    ctx.pos += 1;
    while (ctx.pos < ctx.src.length && isAtomCont(peek(ctx))) {
      ctx.pos += 1;
    }
    const name = ctx.src.slice(start, ctx.pos);
    if (name === 'true' || name === 'T') return { kind: 'true' };
    if (name === 'false' || name === 'F') return { kind: 'false' };
    return { kind: 'atom', name };
  }
  throw new ParseError(`token inesperado "${ch}" en posición ${ctx.pos}`);
}

function parseNegation(ctx: ParserCtx): PropFormula {
  skipWs(ctx);
  if (consumeAny(ctx, ['¬', '~', '!']) !== null) {
    const inner = parseNegation(ctx);
    return { kind: 'not', arg: inner };
  }
  return parsePrimary(ctx);
}

function parseConjunction(ctx: ParserCtx): PropFormula {
  let left = parseNegation(ctx);
  while (consumeAny(ctx, ['∧', '/\\', '&']) !== null) {
    const right = parseNegation(ctx);
    left = { kind: 'and', left, right };
  }
  return left;
}

function parseDisjunction(ctx: ParserCtx): PropFormula {
  let left = parseConjunction(ctx);
  while (consumeAny(ctx, ['∨', '\\/', '|']) !== null) {
    const right = parseConjunction(ctx);
    left = { kind: 'or', left, right };
  }
  return left;
}

function parseImplication(ctx: ParserCtx): PropFormula {
  const left = parseDisjunction(ctx);
  if (consumeAny(ctx, ['→', '=>', '->']) !== null) {
    const right = parseImplication(ctx); // asociatividad a la derecha
    return { kind: 'implies', left, right };
  }
  return left;
}

function parseBiconditional(ctx: ParserCtx): PropFormula {
  let left = parseImplication(ctx);
  while (consumeAny(ctx, ['↔', '<->', '<=>']) !== null) {
    const right = parseImplication(ctx);
    left = { kind: 'iff', left, right };
  }
  return left;
}

/**
 * Parsea una fórmula propositional a su AST interno.
 * Lanza Error con mensaje legible si el input no es válido.
 */
export function parsePropFormula(input: string): PropFormula {
  const ctx: ParserCtx = { src: input, pos: 0 };
  const formula = parseBiconditional(ctx);
  skipWs(ctx);
  if (ctx.pos < ctx.src.length) {
    throw new ParseError(`tokens sobrantes en posición ${ctx.pos}: "${ctx.src.slice(ctx.pos)}"`);
  }
  return formula;
}

/**
 * Recolecta los nombres de átomos que aparecen en una fórmula.
 */
export function collectAtoms(f: PropFormula, into: Set<string> = new Set()): Set<string> {
  switch (f.kind) {
    case 'true':
    case 'false':
      return into;
    case 'atom':
      into.add(f.name);
      return into;
    case 'not':
      collectAtoms(f.arg, into);
      return into;
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      collectAtoms(f.left, into);
      collectAtoms(f.right, into);
      return into;
  }
}

/**
 * Serializa una fórmula a su forma canónica (con paréntesis explícitos).
 * Útil para hashing y comparaciones estructurales.
 */
export function formulaToString(f: PropFormula): string {
  switch (f.kind) {
    case 'true':
      return 'true';
    case 'false':
      return 'false';
    case 'atom':
      return f.name;
    case 'not':
      return `!${formulaToString(f.arg)}`;
    case 'and':
      return `(${formulaToString(f.left)} & ${formulaToString(f.right)})`;
    case 'or':
      return `(${formulaToString(f.left)} | ${formulaToString(f.right)})`;
    case 'implies':
      return `(${formulaToString(f.left)} -> ${formulaToString(f.right)})`;
    case 'iff':
      return `(${formulaToString(f.left)} <-> ${formulaToString(f.right)})`;
  }
}
