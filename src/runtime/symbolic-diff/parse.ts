import type { Expr } from './types';
import { isUnaryFn } from './types';
import { cst, v, add, mul, sub, div, pow, neg, fn } from './constructors';

/**
 * Parser de expresiones algebraicas/trascendentales.
 *
 * Gramática (precedencia ascendente):
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/') factor)*
 *   factor  := unary ('^' factor)?     // ^ right-assoc
 *   unary   := '-' unary | atom
 *   atom    := number | ident '(' expr ')' | ident | '(' expr ')'
 *
 * Soporta funciones: sin, cos, tan, log, exp.
 * Implícito *: NO se soporta (escribir `2*x`, no `2x`).
 */
export function parse(input: string): Expr {
  const parser = new Parser(input);
  const result = parser.parseExpr();
  parser.expectEof();
  return result;
}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'ident'; name: string }
  | { kind: 'punct'; value: '+' | '-' | '*' | '/' | '^' | '(' | ')' }
  | { kind: 'eof' };

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(input: string) {
    this.tokens = tokenize(input);
  }

  private peek(): Token {
    const tok = this.tokens[this.pos];
    return tok ?? { kind: 'eof' };
  }

  private advance(): Token {
    const tok = this.peek();
    if (tok.kind !== 'eof') this.pos++;
    return tok;
  }

  expectEof(): void {
    const tok = this.peek();
    if (tok.kind !== 'eof') {
      throw new Error(`parse: tokens sobrantes en posición ${this.pos} (${JSON.stringify(tok)})`);
    }
  }

  parseExpr(): Expr {
    let left = this.parseTerm();
    while (true) {
      const tok = this.peek();
      if (tok.kind === 'punct' && (tok.value === '+' || tok.value === '-')) {
        this.advance();
        const right = this.parseTerm();
        left = tok.value === '+' ? add(left, right) : sub(left, right);
      } else {
        break;
      }
    }
    return left;
  }

  private parseTerm(): Expr {
    let left = this.parseFactor();
    while (true) {
      const tok = this.peek();
      if (tok.kind === 'punct' && (tok.value === '*' || tok.value === '/')) {
        this.advance();
        const right = this.parseFactor();
        left = tok.value === '*' ? mul(left, right) : div(left, right);
      } else {
        break;
      }
    }
    return left;
  }

  private parseFactor(): Expr {
    const base = this.parseUnary();
    const tok = this.peek();
    if (tok.kind === 'punct' && tok.value === '^') {
      this.advance();
      const exponent = this.parseFactor(); // right-assoc
      return pow(base, exponent);
    }
    return base;
  }

  private parseUnary(): Expr {
    const tok = this.peek();
    if (tok.kind === 'punct' && tok.value === '-') {
      this.advance();
      const arg = this.parseUnary();
      return neg(arg);
    }
    if (tok.kind === 'punct' && tok.value === '+') {
      this.advance();
      return this.parseUnary();
    }
    return this.parseAtom();
  }

  private parseAtom(): Expr {
    const tok = this.advance();
    if (tok.kind === 'num') return cst(tok.value);
    if (tok.kind === 'ident') {
      const next = this.peek();
      if (next.kind === 'punct' && next.value === '(') {
        this.advance(); // consume '('
        const arg = this.parseExpr();
        const close = this.advance();
        if (close.kind !== 'punct' || close.value !== ')') {
          throw new Error(`parse: se esperaba ')' tras argumento de '${tok.name}'`);
        }
        if (!isUnaryFn(tok.name)) {
          throw new Error(`parse: función desconocida '${tok.name}'`);
        }
        return fn(tok.name, arg);
      }
      return v(tok.name);
    }
    if (tok.kind === 'punct' && tok.value === '(') {
      const inner = this.parseExpr();
      const close = this.advance();
      if (close.kind !== 'punct' || close.value !== ')') {
        throw new Error(`parse: se esperaba ')' que cierre paréntesis abierto`);
      }
      return inner;
    }
    throw new Error(`parse: token inesperado ${JSON.stringify(tok)}`);
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === undefined) break;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (
      ch === '+' ||
      ch === '-' ||
      ch === '*' ||
      ch === '/' ||
      ch === '^' ||
      ch === '(' ||
      ch === ')'
    ) {
      tokens.push({ kind: 'punct', value: ch });
      i++;
      continue;
    }
    if (isDigit(ch) || (ch === '.' && i + 1 < input.length && isDigit(input[i + 1] ?? ''))) {
      let j = i;
      let hasDot = false;
      while (j < input.length) {
        const c = input[j];
        if (c === undefined) break;
        if (isDigit(c)) {
          j++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          j++;
        } else {
          break;
        }
      }
      // Notación científica: e[+-]?digits
      if (j < input.length && (input[j] === 'e' || input[j] === 'E')) {
        j++;
        if (j < input.length && (input[j] === '+' || input[j] === '-')) j++;
        while (j < input.length && isDigit(input[j] ?? '')) j++;
      }
      const slice = input.slice(i, j);
      const num = Number(slice);
      if (Number.isNaN(num)) throw new Error(`parse: número inválido '${slice}'`);
      tokens.push({ kind: 'num', value: num });
      i = j;
      continue;
    }
    if (isAlpha(ch) || ch === '_') {
      let j = i;
      while (j < input.length) {
        const c = input[j];
        if (c === undefined) break;
        if (isAlpha(c) || isDigit(c) || c === '_') j++;
        else break;
      }
      tokens.push({ kind: 'ident', name: input.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`parse: carácter inesperado '${ch}' en posición ${i}`);
  }
  return tokens;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}
