// ============================================================
// SMT-LIB v2 — Parser (recursive-descent sobre S-expressions)
// ============================================================
//
// Convierte el stream de tokens (tokenizer.ts) en árboles `SmtCommand`,
// `SmtTerm` y `SmtSort`. Estrictamente sintáctico: no valida sorts, aridad
// de funciones ni que las lógicas sean conocidas — se queda con el árbol y
// deja la validación semántica al consumidor (backend, traductor, etc.).
//
// Filosofía: si la entrada está fuera del subset privilegiado (let, forall,
// exists, match, !), igualmente colapsa a `{ kind: 'app', fn, args }` con
// la cabeza preservada como string. Eso garantiza que `parse → emit` no
// pierde información en programas reales.

import type { SmtCommand, SmtSort, SmtSpecConstantType, SmtTerm } from './ast';
import { tokenize, type SmtToken } from './tokenizer';

export class SmtParserError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly col: number,
  ) {
    super(`SMT-LIB parser ${line}:${col}: ${message}`);
    this.name = 'SmtParserError';
  }
}

class TokenStream {
  private pos = 0;
  constructor(private readonly tokens: SmtToken[]) {}

  peek(off = 0): SmtToken | undefined {
    return this.tokens[this.pos + off];
  }

  next(): SmtToken {
    const t = this.tokens[this.pos];
    if (!t) {
      const last = this.tokens[this.tokens.length - 1];
      throw new SmtParserError('fin de input inesperado', last?.line ?? 1, last?.col ?? 1);
    }
    this.pos++;
    return t;
  }

  eof(): boolean {
    return this.pos >= this.tokens.length;
  }

  expect(kind: SmtToken['kind']): SmtToken {
    const t = this.next();
    if (t.kind !== kind) {
      throw new SmtParserError(
        `se esperaba ${kind} y se obtuvo ${t.kind} (${JSON.stringify(t.value)})`,
        t.line,
        t.col,
      );
    }
    return t;
  }

  expectSymbol(name?: string): SmtToken {
    const t = this.next();
    if (t.kind !== 'symbol') {
      throw new SmtParserError(
        `se esperaba símbolo y se obtuvo ${t.kind} (${JSON.stringify(t.value)})`,
        t.line,
        t.col,
      );
    }
    if (name !== undefined && t.value !== name) {
      throw new SmtParserError(`se esperaba símbolo "${name}" y vino "${t.value}"`, t.line, t.col);
    }
    return t;
  }
}

/** Reads a numeral token as an integer (≥ 0). */
function readNumeral(ts: TokenStream): number {
  const t = ts.next();
  if (t.kind !== 'numeral') {
    throw new SmtParserError(`se esperaba numeral, vino ${t.kind}`, t.line, t.col);
  }
  return Number.parseInt(t.value, 10);
}

function readSymbolName(ts: TokenStream): string {
  const t = ts.next();
  if (t.kind !== 'symbol') {
    throw new SmtParserError(`se esperaba símbolo, vino ${t.kind}`, t.line, t.col);
  }
  return t.value;
}

function readAttrValue(ts: TokenStream): string {
  // En set-info / set-option / annotated, los valores pueden ser
  // string, symbol, numeral, decimal, hex, binary, keyword, o una
  // s-expr completa. Para nuestros usos materializamos la s-expr a
  // string canónico (re-emisión simple) o el literal directo.
  const t = ts.peek();
  if (!t) throw new SmtParserError('attr-value faltante', 1, 1);
  if (t.kind === 'string') {
    ts.next();
    return JSON.stringify(t.value);
  }
  if (t.kind === 'lparen') {
    return sexprToString(ts);
  }
  ts.next();
  return t.value;
}

/** Re-serialize an arbitrary s-expression as plain text (lossy for whitespace). */
function sexprToString(ts: TokenStream): string {
  const open = ts.next();
  if (open.kind !== 'lparen') {
    return open.value;
  }
  const parts: string[] = [];
  while (true) {
    const t = ts.peek();
    if (!t) throw new SmtParserError('s-expr sin cerrar', open.line, open.col);
    if (t.kind === 'rparen') {
      ts.next();
      break;
    }
    if (t.kind === 'lparen') {
      parts.push(sexprToString(ts));
    } else {
      ts.next();
      if (t.kind === 'string') parts.push(JSON.stringify(t.value));
      else if (t.kind === 'keyword') parts.push(`:${t.value}`);
      else if (t.kind === 'hex') parts.push(`#x${t.value}`);
      else if (t.kind === 'binary') parts.push(`#b${t.value}`);
      else parts.push(t.value);
    }
  }
  return `(${parts.join(' ')})`;
}

// --------------------------------------------------------------------
// Sort
// --------------------------------------------------------------------
function parseSortInternal(ts: TokenStream): SmtSort {
  const t = ts.peek();
  if (!t) throw new SmtParserError('sort esperado', 1, 1);
  if (t.kind === 'symbol') {
    ts.next();
    return { kind: 'symbol', name: t.value };
  }
  if (t.kind === 'lparen') {
    ts.next();
    // (_ BitVec 32) → indexed identifier; lo emitimos como name "_" args [BitVec, 32]
    // o (Array Int Int) → name "Array" args [Int, Int]
    const head = ts.peek();
    if (!head) throw new SmtParserError('sort con paréntesis vacío', t.line, t.col);
    if (head.kind === 'symbol' && head.value === '_') {
      ts.next(); // consume `_`
      const nameTok = ts.next();
      if (nameTok.kind !== 'symbol') {
        throw new SmtParserError(
          `identificador indexado: se esperaba símbolo y vino ${nameTok.kind}`,
          nameTok.line,
          nameTok.col,
        );
      }
      const indexArgs: SmtSort[] = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('sort indexado sin cerrar', nameTok.line, nameTok.col);
        if (nx.kind === 'rparen') break;
        if (nx.kind === 'numeral') {
          ts.next();
          indexArgs.push({ kind: 'symbol', name: nx.value });
        } else if (nx.kind === 'symbol') {
          ts.next();
          indexArgs.push({ kind: 'symbol', name: nx.value });
        } else {
          throw new SmtParserError(`índice inesperado ${nx.kind} en sort`, nx.line, nx.col);
        }
      }
      ts.expect('rparen');
      return { kind: 'app', name: `_ ${nameTok.value}`, args: indexArgs };
    }
    if (head.kind !== 'symbol') {
      throw new SmtParserError(
        `cabeza de sort debe ser símbolo y vino ${head.kind}`,
        head.line,
        head.col,
      );
    }
    ts.next();
    const args: SmtSort[] = [];
    while (true) {
      const nx = ts.peek();
      if (!nx) throw new SmtParserError('sort sin cerrar', head.line, head.col);
      if (nx.kind === 'rparen') break;
      args.push(parseSortInternal(ts));
    }
    ts.expect('rparen');
    return { kind: 'app', name: head.value, args };
  }
  throw new SmtParserError(`sort inesperado: ${t.kind}`, t.line, t.col);
}

// --------------------------------------------------------------------
// Term
// --------------------------------------------------------------------
const SPEC_CONSTANT_KIND: Partial<Record<SmtToken['kind'], SmtSpecConstantType>> = {
  numeral: 'numeral',
  decimal: 'decimal',
  string: 'string',
  hex: 'hex',
  binary: 'binary',
};

function parseTermInternal(ts: TokenStream): SmtTerm {
  const t = ts.peek();
  if (!t) throw new SmtParserError('término esperado', 1, 1);
  const specType = SPEC_CONSTANT_KIND[t.kind];
  if (specType) {
    ts.next();
    return { kind: 'spec-constant', type: specType, value: t.value };
  }
  if (t.kind === 'symbol') {
    ts.next();
    return { kind: 'symbol', name: t.value };
  }
  if (t.kind === 'keyword') {
    throw new SmtParserError(`keyword :${t.value} no es un término válido`, t.line, t.col);
  }
  if (t.kind === 'lparen') {
    ts.next();
    const head = ts.peek();
    if (!head) throw new SmtParserError('aplicación vacía', t.line, t.col);
    // Casos especiales (let, forall, exists, match, !)
    if (head.kind === 'symbol') {
      switch (head.value) {
        case 'let':
          ts.next();
          return parseLet(ts, t);
        case 'forall':
          ts.next();
          return parseQuantifier(ts, 'forall', t);
        case 'exists':
          ts.next();
          return parseQuantifier(ts, 'exists', t);
        case 'match':
          ts.next();
          return parseMatch(ts, t);
        case '!':
          ts.next();
          return parseAnnotated(ts, t);
        case '_': {
          // identificador indexado en posición de cabeza: (_ name idx ...)
          ts.next();
          const nameTok = ts.next();
          if (nameTok.kind !== 'symbol') {
            throw new SmtParserError(
              `identificador indexado: símbolo esperado y vino ${nameTok.kind}`,
              nameTok.line,
              nameTok.col,
            );
          }
          const idxs: string[] = [];
          while (true) {
            const nx = ts.peek();
            if (!nx) throw new SmtParserError('indexed identifier sin cerrar', t.line, t.col);
            if (nx.kind === 'rparen') break;
            if (nx.kind === 'numeral' || nx.kind === 'symbol') {
              ts.next();
              idxs.push(nx.value);
            } else {
              throw new SmtParserError(`índice inesperado ${nx.kind}`, nx.line, nx.col);
            }
          }
          ts.expect('rparen');
          return {
            kind: 'symbol',
            name: `(_ ${nameTok.value}${idxs.length ? ' ' + idxs.join(' ') : ''})`,
          };
        }
      }
    }
    // aplicación genérica
    let fnName: string;
    if (head.kind === 'lparen') {
      // qualified-identifier `(as foo Sort)` o indexed
      fnName = sexprToString(ts);
    } else {
      ts.next();
      fnName = head.value;
    }
    const args: SmtTerm[] = [];
    while (true) {
      const nx = ts.peek();
      if (!nx) throw new SmtParserError(`aplicación ${fnName} sin cerrar`, t.line, t.col);
      if (nx.kind === 'rparen') break;
      args.push(parseTermInternal(ts));
    }
    ts.expect('rparen');
    return { kind: 'app', fn: fnName, args };
  }
  throw new SmtParserError(`token inesperado en término: ${t.kind}`, t.line, t.col);
}

function parseLet(ts: TokenStream, open: SmtToken): SmtTerm {
  ts.expect('lparen'); // bindings list
  const bindings: Array<{ name: string; value: SmtTerm }> = [];
  while (true) {
    const nx = ts.peek();
    if (!nx) throw new SmtParserError('let sin cerrar bindings', open.line, open.col);
    if (nx.kind === 'rparen') {
      ts.next();
      break;
    }
    ts.expect('lparen');
    const name = readSymbolName(ts);
    const value = parseTermInternal(ts);
    ts.expect('rparen');
    bindings.push({ name, value });
  }
  const body = parseTermInternal(ts);
  ts.expect('rparen'); // close let
  return { kind: 'let', bindings, body };
}

function parseQuantifier(ts: TokenStream, kind: 'forall' | 'exists', open: SmtToken): SmtTerm {
  ts.expect('lparen'); // vars list
  const vars: Array<{ name: string; sort: SmtSort }> = [];
  while (true) {
    const nx = ts.peek();
    if (!nx) throw new SmtParserError(`${kind} sin cerrar vars`, open.line, open.col);
    if (nx.kind === 'rparen') {
      ts.next();
      break;
    }
    ts.expect('lparen');
    const name = readSymbolName(ts);
    const sort = parseSortInternal(ts);
    ts.expect('rparen');
    vars.push({ name, sort });
  }
  const body = parseTermInternal(ts);
  ts.expect('rparen'); // close quantifier
  if (kind === 'forall') return { kind: 'forall', vars, body };
  return { kind: 'exists', vars, body };
}

function parseMatch(ts: TokenStream, open: SmtToken): SmtTerm {
  const scrutinee = parseTermInternal(ts);
  ts.expect('lparen'); // cases list
  const cases: Array<{ pattern: SmtTerm; body: SmtTerm }> = [];
  while (true) {
    const nx = ts.peek();
    if (!nx) throw new SmtParserError('match sin cerrar', open.line, open.col);
    if (nx.kind === 'rparen') {
      ts.next();
      break;
    }
    ts.expect('lparen');
    const pattern = parseTermInternal(ts);
    const body = parseTermInternal(ts);
    ts.expect('rparen');
    cases.push({ pattern, body });
  }
  ts.expect('rparen');
  return { kind: 'match', scrutinee, cases };
}

function parseAnnotated(ts: TokenStream, open: SmtToken): SmtTerm {
  const term = parseTermInternal(ts);
  const attrs: Array<{ key: string; value?: string }> = [];
  while (true) {
    const nx = ts.peek();
    if (!nx) throw new SmtParserError('annotation sin cerrar', open.line, open.col);
    if (nx.kind === 'rparen') {
      ts.next();
      break;
    }
    if (nx.kind !== 'keyword') {
      throw new SmtParserError(
        `attribute key debe empezar con ":" y vino ${nx.kind}`,
        nx.line,
        nx.col,
      );
    }
    ts.next();
    const key = nx.value;
    const follow = ts.peek();
    if (!follow || follow.kind === 'keyword' || follow.kind === 'rparen') {
      attrs.push({ key });
    } else {
      const value = readAttrValue(ts);
      attrs.push({ key, value });
    }
  }
  return { kind: 'annotated', term, attrs };
}

// --------------------------------------------------------------------
// Command
// --------------------------------------------------------------------
function parseCommand(ts: TokenStream): SmtCommand {
  const open = ts.expect('lparen');
  const head = ts.expectSymbol();
  switch (head.value) {
    case 'set-logic': {
      const logic = readSymbolName(ts);
      ts.expect('rparen');
      return { kind: 'set-logic', logic };
    }
    case 'set-option': {
      const keyTok = ts.next();
      if (keyTok.kind !== 'keyword') {
        throw new SmtParserError(`set-option requiere :keyword`, keyTok.line, keyTok.col);
      }
      const value = readAttrValue(ts);
      ts.expect('rparen');
      return { kind: 'set-option', key: keyTok.value, value };
    }
    case 'set-info': {
      const keyTok = ts.next();
      if (keyTok.kind !== 'keyword') {
        throw new SmtParserError(`set-info requiere :keyword`, keyTok.line, keyTok.col);
      }
      const value = readAttrValue(ts);
      ts.expect('rparen');
      return { kind: 'set-info', key: keyTok.value, value };
    }
    case 'declare-sort': {
      const name = readSymbolName(ts);
      const arity = readNumeral(ts);
      ts.expect('rparen');
      return { kind: 'declare-sort', name, arity };
    }
    case 'define-sort': {
      const name = readSymbolName(ts);
      ts.expect('lparen');
      const params: string[] = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('define-sort sin cerrar', open.line, open.col);
        if (nx.kind === 'rparen') {
          ts.next();
          break;
        }
        params.push(readSymbolName(ts));
      }
      const body = parseSortInternal(ts);
      ts.expect('rparen');
      return { kind: 'define-sort', name, params, body };
    }
    case 'declare-fun': {
      const name = readSymbolName(ts);
      ts.expect('lparen');
      const paramSorts: SmtSort[] = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('declare-fun sin cerrar', open.line, open.col);
        if (nx.kind === 'rparen') {
          ts.next();
          break;
        }
        paramSorts.push(parseSortInternal(ts));
      }
      const resultSort = parseSortInternal(ts);
      ts.expect('rparen');
      return { kind: 'declare-fun', name, paramSorts, resultSort };
    }
    case 'define-fun': {
      const name = readSymbolName(ts);
      ts.expect('lparen');
      const params: Array<{ name: string; sort: SmtSort }> = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('define-fun sin cerrar', open.line, open.col);
        if (nx.kind === 'rparen') {
          ts.next();
          break;
        }
        ts.expect('lparen');
        const pname = readSymbolName(ts);
        const psort = parseSortInternal(ts);
        ts.expect('rparen');
        params.push({ name: pname, sort: psort });
      }
      const resultSort = parseSortInternal(ts);
      const body = parseTermInternal(ts);
      ts.expect('rparen');
      return { kind: 'define-fun', name, params, resultSort, body };
    }
    case 'declare-const': {
      const name = readSymbolName(ts);
      const sort = parseSortInternal(ts);
      ts.expect('rparen');
      return { kind: 'declare-const', name, sort };
    }
    case 'assert': {
      const formula = parseTermInternal(ts);
      ts.expect('rparen');
      return { kind: 'assert', formula };
    }
    case 'check-sat': {
      ts.expect('rparen');
      return { kind: 'check-sat' };
    }
    case 'check-sat-assuming': {
      ts.expect('lparen');
      const assumptions: SmtTerm[] = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('check-sat-assuming sin cerrar', open.line, open.col);
        if (nx.kind === 'rparen') {
          ts.next();
          break;
        }
        assumptions.push(parseTermInternal(ts));
      }
      ts.expect('rparen');
      return { kind: 'check-sat-assuming', assumptions };
    }
    case 'get-assertions':
      ts.expect('rparen');
      return { kind: 'get-assertions' };
    case 'get-model':
      ts.expect('rparen');
      return { kind: 'get-model' };
    case 'get-proof':
      ts.expect('rparen');
      return { kind: 'get-proof' };
    case 'get-unsat-core':
      ts.expect('rparen');
      return { kind: 'get-unsat-core' };
    case 'get-value': {
      ts.expect('lparen');
      const terms: SmtTerm[] = [];
      while (true) {
        const nx = ts.peek();
        if (!nx) throw new SmtParserError('get-value sin cerrar', open.line, open.col);
        if (nx.kind === 'rparen') {
          ts.next();
          break;
        }
        terms.push(parseTermInternal(ts));
      }
      ts.expect('rparen');
      return { kind: 'get-value', terms };
    }
    case 'push': {
      const levels = readNumeral(ts);
      ts.expect('rparen');
      return { kind: 'push', levels };
    }
    case 'pop': {
      const levels = readNumeral(ts);
      ts.expect('rparen');
      return { kind: 'pop', levels };
    }
    case 'reset':
      ts.expect('rparen');
      return { kind: 'reset' };
    case 'reset-assertions':
      ts.expect('rparen');
      return { kind: 'reset-assertions' };
    case 'exit':
      ts.expect('rparen');
      return { kind: 'exit' };
    case 'echo': {
      const msgTok = ts.next();
      if (msgTok.kind !== 'string') {
        throw new SmtParserError(`echo requiere string literal`, msgTok.line, msgTok.col);
      }
      ts.expect('rparen');
      return { kind: 'echo', message: msgTok.value };
    }
    default:
      throw new SmtParserError(`comando no reconocido: ${head.value}`, head.line, head.col);
  }
}

/** Parse de un script SMT-LIB completo. */
export function parseSmtLib(input: string): SmtCommand[] {
  const tokens = tokenize(input);
  const ts = new TokenStream(tokens);
  const commands: SmtCommand[] = [];
  while (!ts.eof()) {
    commands.push(parseCommand(ts));
  }
  return commands;
}

/** Parse de un único término. Útil para tests y bridges. */
export function parseTerm(input: string): SmtTerm {
  const tokens = tokenize(input);
  const ts = new TokenStream(tokens);
  const term = parseTermInternal(ts);
  if (!ts.eof()) {
    const t = ts.peek();
    throw new SmtParserError(`tokens sobrantes tras término`, t?.line ?? 1, t?.col ?? 1);
  }
  return term;
}

/** Parse de un único sort. */
export function parseSort(input: string): SmtSort {
  const tokens = tokenize(input);
  const ts = new TokenStream(tokens);
  const sort = parseSortInternal(ts);
  if (!ts.eof()) {
    const t = ts.peek();
    throw new SmtParserError(`tokens sobrantes tras sort`, t?.line ?? 1, t?.col ?? 1);
  }
  return sort;
}
