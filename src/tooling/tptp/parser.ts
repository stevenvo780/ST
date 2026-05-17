// ============================================================
// TPTP — Parser
// ============================================================
//
// Parser para FOF / CNF / TFF light. Gramática simplificada:
//
//   tptp_input := annotated_formula | include
//   annotated_formula := language '(' name ',' role ',' formula ')' '.'
//   include := 'include' '(' single_quoted ')' '.'
//   formula := iff_expr
//   iff_expr := imp_expr (('<=>' | '<~>') imp_expr)?
//   imp_expr := or_expr (('=>' | '<=') imp_expr)?
//   or_expr := and_expr ('|' and_expr)*
//   and_expr := unary_expr ('&' unary_expr)*
//   unary_expr := '~' unary_expr | quantified | atom_or_paren
//   quantified := ('!' | '?') '[' var (',' var)* ']' ':' unary_expr
//   atom_or_paren := '(' formula ')' | atom | term_eq
//   atom := lower_word ('(' term (',' term)* ')')?
//   term_eq := term ('=' | '!=') term
//   term := variable | lower_word ('(' term (',' term)* ')')?
//
// TFF light: aceptamos type annotations en argumentos (`![X : $i] : ...`)
// pero las descartamos para construir la fórmula FOL.

import {
  TptpAnnotated,
  TptpFormula,
  TptpLanguage,
  TptpProblem,
  TptpRole,
  TptpTerm,
  TPTP_LANGUAGES,
  TPTP_ROLES,
} from './ast';
import { TptpToken, TptpTokenKind, tokenize } from './tokenizer';

export class TptpParserError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly col: number,
  ) {
    super(`TPTP parser ${line}:${col}: ${message}`);
    this.name = 'TptpParserError';
  }
}

class Cursor {
  private idx = 0;
  constructor(private readonly tokens: TptpToken[]) {}

  peek(offset = 0): TptpToken | undefined {
    return this.tokens[this.idx + offset];
  }

  next(): TptpToken {
    const t = this.tokens[this.idx];
    if (!t) {
      throw new TptpParserError('fin inesperado de entrada', 0, 0);
    }
    this.idx++;
    return t;
  }

  done(): boolean {
    return this.idx >= this.tokens.length;
  }

  expect(kind: TptpTokenKind): TptpToken {
    const t = this.peek();
    if (!t) {
      throw new TptpParserError(`se esperaba ${kind} pero llegó EOF`, 0, 0);
    }
    if (t.kind !== kind) {
      throw new TptpParserError(
        `se esperaba ${kind} pero llegó ${t.kind} (${JSON.stringify(t.value)})`,
        t.line,
        t.col,
      );
    }
    return this.next();
  }

  matchKind(kind: TptpTokenKind): boolean {
    return this.peek()?.kind === kind;
  }

  consumeKind(kind: TptpTokenKind): TptpToken | undefined {
    if (this.matchKind(kind)) return this.next();
    return undefined;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function isVariable(name: string): boolean {
  const ch = name[0] ?? '';
  return /[A-Z_]/.test(ch);
}

// ── Parser de problema completo ─────────────────────────────────────────

export function parseTptp(input: string): TptpProblem {
  const tokens = tokenize(input);
  const cur = new Cursor(tokens);
  const annotated: TptpAnnotated[] = [];
  const includes: string[] = [];

  while (!cur.done()) {
    const t = cur.peek();
    if (!t) break;
    if (t.kind !== 'lower_word') {
      throw new TptpParserError(
        `se esperaba 'fof'/'cnf'/'tff'/'thf'/'include' pero llegó ${t.kind}`,
        t.line,
        t.col,
      );
    }
    if (t.value === 'include') {
      includes.push(parseInclude(cur));
      continue;
    }
    if (TPTP_LANGUAGES.has(t.value as TptpLanguage)) {
      annotated.push(parseAnnotated(cur));
      continue;
    }
    throw new TptpParserError(
      `palabra de cabecera desconocida: ${JSON.stringify(t.value)}`,
      t.line,
      t.col,
    );
  }

  return { annotated, includes };
}

function parseInclude(cur: Cursor): string {
  const head = cur.expect('lower_word');
  if (head.value !== 'include') {
    throw new TptpParserError(`esperaba 'include' pero llegó ${head.value}`, head.line, head.col);
  }
  cur.expect('lparen');
  const file = cur.expect('single_quoted');
  // include opcionalmente acepta una lista de "selectors" tras coma
  // include('file.ax', [a, b]). — la consumimos pero la descartamos.
  if (cur.consumeKind('comma')) {
    skipBalanced(cur);
  }
  cur.expect('rparen');
  cur.expect('dot');
  return file.value;
}

function skipBalanced(cur: Cursor): void {
  // Consume tokens hasta un comma/rparen a nivel 0
  let depth = 0;
  while (!cur.done()) {
    const t = cur.peek();
    if (!t) break;
    if ((t.kind === 'rparen' || t.kind === 'rbracket') && depth === 0) return;
    if (t.kind === 'comma' && depth === 0) return;
    if (t.kind === 'lparen' || t.kind === 'lbracket') depth++;
    if (t.kind === 'rparen' || t.kind === 'rbracket') depth--;
    cur.next();
  }
}

function parseAnnotated(cur: Cursor): TptpAnnotated {
  const langTok = cur.expect('lower_word');
  const language = langTok.value as TptpLanguage;
  if (!TPTP_LANGUAGES.has(language)) {
    throw new TptpParserError(
      `lenguaje no reconocido: ${langTok.value}`,
      langTok.line,
      langTok.col,
    );
  }
  cur.expect('lparen');
  const nameTok = cur.next();
  let name: string;
  if (nameTok.kind === 'lower_word' || nameTok.kind === 'integer') {
    name = nameTok.value;
  } else if (nameTok.kind === 'single_quoted') {
    name = nameTok.value;
  } else {
    throw new TptpParserError(`nombre inválido (${nameTok.kind})`, nameTok.line, nameTok.col);
  }
  cur.expect('comma');
  const roleTok = cur.expect('lower_word');
  const role = roleTok.value as TptpRole;
  if (!TPTP_ROLES.has(role)) {
    throw new TptpParserError(`role desconocido: ${roleTok.value}`, roleTok.line, roleTok.col);
  }
  cur.expect('comma');
  const formula = parseFormulaFromCursor(cur, language);
  // anotaciones opcionales: (..., source, useful_info)
  if (cur.consumeKind('comma')) {
    skipBalanced(cur);
    while (cur.consumeKind('comma')) {
      skipBalanced(cur);
    }
  }
  cur.expect('rparen');
  cur.expect('dot');
  return { language, name, role, formula };
}

// ── Parser de fórmula ───────────────────────────────────────────────────

export function parseFormula(input: string, lang: TptpLanguage): TptpFormula {
  const tokens = tokenize(input);
  const cur = new Cursor(tokens);
  const f = parseFormulaFromCursor(cur, lang);
  if (!cur.done()) {
    const t = cur.peek();
    if (t) {
      throw new TptpParserError(`tokens sobrantes tras fórmula (${t.kind})`, t.line, t.col);
    }
  }
  return f;
}

function parseFormulaFromCursor(cur: Cursor, lang: TptpLanguage): TptpFormula {
  if (lang === 'cnf') return parseCnfClause(cur);
  return parseIff(cur);
}

// CNF: lista de literales separados por `|`. Variables implícitamente
// cuantificadas universal. Los literales son atom o ~atom o eq/neq.
function parseCnfClause(cur: Cursor): TptpFormula {
  // CNF puede venir envuelto en paréntesis opcionales
  const parenOpen = cur.consumeKind('lparen');
  const literals: TptpFormula[] = [parseCnfLiteral(cur)];
  while (cur.consumeKind('op_or')) {
    literals.push(parseCnfLiteral(cur));
  }
  if (parenOpen) cur.expect('rparen');
  if (literals.length === 1) return literals[0];
  return { kind: 'or', args: literals };
}

function parseCnfLiteral(cur: Cursor): TptpFormula {
  if (cur.consumeKind('op_not')) {
    const inner = parseCnfAtom(cur);
    return { kind: 'not', arg: inner };
  }
  return parseCnfAtom(cur);
}

function parseCnfAtom(cur: Cursor): TptpFormula {
  // un atom puede ser una eq/neq entre términos o un atom predicativo
  return parseAtomOrEquality(cur);
}

// FOF: iff a nivel más alto.
function parseIff(cur: Cursor): TptpFormula {
  const left = parseImplies(cur);
  const op = cur.peek();
  if (op && (op.kind === 'op_iff' || op.kind === 'op_xor')) {
    cur.next();
    const right = parseImplies(cur);
    if (op.kind === 'op_iff') return { kind: 'iff', left, right };
    return { kind: 'xor', left, right };
  }
  return left;
}

function parseImplies(cur: Cursor): TptpFormula {
  const left = parseOr(cur);
  const op = cur.peek();
  if (op && op.kind === 'op_implies') {
    cur.next();
    const right = parseImplies(cur);
    return { kind: 'implies', left, right };
  }
  if (op && op.kind === 'op_nimplies') {
    // a <= b  ≡  b => a
    cur.next();
    const right = parseImplies(cur);
    return { kind: 'implies', left: right, right: left };
  }
  return left;
}

function parseOr(cur: Cursor): TptpFormula {
  const first = parseAnd(cur);
  if (!cur.matchKind('op_or')) return first;
  const args: TptpFormula[] = [first];
  while (cur.consumeKind('op_or')) {
    args.push(parseAnd(cur));
  }
  return { kind: 'or', args };
}

function parseAnd(cur: Cursor): TptpFormula {
  const first = parseUnary(cur);
  if (!cur.matchKind('op_and')) return first;
  const args: TptpFormula[] = [first];
  while (cur.consumeKind('op_and')) {
    args.push(parseUnary(cur));
  }
  return { kind: 'and', args };
}

function parseUnary(cur: Cursor): TptpFormula {
  if (cur.consumeKind('op_not')) {
    const arg = parseUnary(cur);
    return { kind: 'not', arg };
  }
  if (cur.matchKind('op_forall') || cur.matchKind('op_exists')) {
    return parseQuantified(cur);
  }
  return parsePrimary(cur);
}

function parseQuantified(cur: Cursor): TptpFormula {
  const qTok = cur.next();
  const kind: 'forall' | 'exists' = qTok.kind === 'op_forall' ? 'forall' : 'exists';
  cur.expect('lbracket');
  const vars: string[] = [parseVariableDecl(cur)];
  while (cur.consumeKind('comma')) {
    vars.push(parseVariableDecl(cur));
  }
  cur.expect('rbracket');
  cur.expect('colon');
  const body = parseUnary(cur);
  return { kind, vars, body };
}

function parseVariableDecl(cur: Cursor): string {
  const t = cur.expect('upper_word');
  // TFF light: variable opcionalmente seguida de `:` type — descartamos el type
  if (cur.consumeKind('colon')) {
    parseTypeExpr(cur);
  }
  return t.value;
}

function parseTypeExpr(cur: Cursor): void {
  // type puede ser $i, $o, lower_word, o un constructor; consumimos hasta
  // un comma/rbracket a nivel 0.
  let depth = 0;
  while (!cur.done()) {
    const t = cur.peek();
    if (!t) return;
    if (depth === 0 && (t.kind === 'comma' || t.kind === 'rbracket')) return;
    if (t.kind === 'lparen' || t.kind === 'lbracket') depth++;
    if (t.kind === 'rparen' || t.kind === 'rbracket') {
      if (depth === 0) return;
      depth--;
    }
    cur.next();
  }
}

function parsePrimary(cur: Cursor): TptpFormula {
  const t = cur.peek();
  if (!t) {
    throw new TptpParserError('fin inesperado en primary', 0, 0);
  }

  // Constantes lógicas $true / $false (en TPTP se escriben así, pero
  // nuestro lexer no las captura como token especial — vienen como '$'
  // + lower_word. Para mantenerlo simple aceptamos también los símbolos
  // `true` y `false` como atómicos sin args)
  if (t.kind === 'lower_word' && (t.value === '$true' || t.value === 'true')) {
    cur.next();
    return { kind: 'true' };
  }
  if (t.kind === 'lower_word' && (t.value === '$false' || t.value === 'false')) {
    cur.next();
    return { kind: 'false' };
  }

  if (t.kind === 'lparen') {
    cur.next();
    const inner = parseIff(cur);
    cur.expect('rparen');
    return inner;
  }

  return parseAtomOrEquality(cur);
}

// Maneja: <term> = <term> | <term> != <term> | <predicate>(args) | <prop>
function parseAtomOrEquality(cur: Cursor): TptpFormula {
  const startToken = cur.peek();
  if (!startToken) {
    throw new TptpParserError('fin inesperado en atom', 0, 0);
  }

  // Si el primer token es variable o un término, podría ser una eq/neq
  // o (rara vez) un atom-no-predicativo. Probamos parsear un término
  // y vemos si sigue `=` o `!=`.
  if (startToken.kind === 'upper_word') {
    const left = parseTerm(cur);
    return finishEquality(cur, left);
  }

  if (startToken.kind === 'lower_word') {
    // Podría ser predicado p(...), constante c, o término con `=`.
    // Lo más simple: parsear como término y mirar el siguiente token.
    // Si el siguiente es `=` o `!=`, es equality.
    // Si NO hay siguiente operador de igualdad, lo tratamos como
    // predicado/atom proposicional.
    const left = parseTerm(cur);
    if (cur.matchKind('op_eq') || cur.matchKind('op_neq')) {
      return finishEquality(cur, left);
    }
    // Convertir el término a atom (asumimos lower_word con args = predicado)
    return termToAtom(left, startToken.line, startToken.col);
  }

  throw new TptpParserError(
    `token inesperado en atom: ${startToken.kind} (${JSON.stringify(startToken.value)})`,
    startToken.line,
    startToken.col,
  );
}

function termToAtom(t: TptpTerm, line: number, col: number): TptpFormula {
  if (t.kind === 'var') {
    throw new TptpParserError(`variable no puede ser atom proposicional: ${t.name}`, line, col);
  }
  if (t.kind === 'const') {
    return { kind: 'atom', predicate: t.name, args: [] };
  }
  return { kind: 'atom', predicate: t.name, args: t.args };
}

function finishEquality(cur: Cursor, left: TptpTerm): TptpFormula {
  if (cur.consumeKind('op_eq')) {
    const right = parseTerm(cur);
    return { kind: 'eq', left, right };
  }
  if (cur.consumeKind('op_neq')) {
    const right = parseTerm(cur);
    return { kind: 'neq', left, right };
  }
  // El término solo (sin =/!=) ya fue manejado en parseAtomOrEquality si
  // venía de lower_word. Si llegamos aquí desde upper_word sin operador,
  // es un error.
  const t = cur.peek();
  throw new TptpParserError(`se esperaba '=' o '!=' tras término`, t?.line ?? 0, t?.col ?? 0);
}

// ── Parser de término ───────────────────────────────────────────────────

export function parseTerm(cur: Cursor | string): TptpTerm {
  const c = typeof cur === 'string' ? new Cursor(tokenize(cur)) : cur;
  return parseTermInternal(c);
}

function parseTermInternal(cur: Cursor): TptpTerm {
  const t = cur.peek();
  if (!t) {
    throw new TptpParserError('fin inesperado en término', 0, 0);
  }

  if (t.kind === 'upper_word') {
    cur.next();
    return { kind: 'var', name: t.value };
  }

  if (t.kind === 'lower_word' || t.kind === 'integer' || t.kind === 'single_quoted') {
    cur.next();
    const name = t.value;
    // Opcionalmente: argumentos
    if (cur.consumeKind('lparen')) {
      const args: TptpTerm[] = [parseTermInternal(cur)];
      while (cur.consumeKind('comma')) {
        args.push(parseTermInternal(cur));
      }
      cur.expect('rparen');
      return { kind: 'func', name, args };
    }
    // Decisión de var/const: integer y single_quoted siempre const.
    // lower_word sin args y empieza con mayúscula → imposible (lexer
    // lo habría clasificado como upper_word). Es const.
    if (isVariable(name)) {
      return { kind: 'var', name };
    }
    return { kind: 'const', name };
  }

  throw new TptpParserError(`token inesperado en término: ${t.kind}`, t.line, t.col);
}
