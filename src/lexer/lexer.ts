/**
 * ST Lexer — Tokenizador
 */

import { Token, TokenType, KEYWORDS, getKeywordsForProfile } from './tokens';
import { Diagnostic } from '../types';

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private file: string;
  private activeKeywords: Record<string, TokenType>;
  public diagnostics: Diagnostic[] = [];

  constructor(source: string, file: string = '<stdin>', profile?: string) {
    this.source = source;
    this.file = file;
    this.activeKeywords = profile !== undefined ? getKeywordsForProfile(profile) : KEYWORDS;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      // Comentarios
      if (ch === '/' && this.peek(1) === '/') {
        this.readLineComment();
        continue;
      }

      // Comentarios de bloque /* ... */
      if (ch === '/' && this.peek(1) === '*') {
        this.readBlockComment();
        continue;
      }

      // Newlines
      if (ch === '\n') {
        this.addToken(TokenType.NEWLINE, '\n');
        this.pos++;
        this.line++;
        this.column = 1;
        continue;
      }

      // Strings
      if (ch === '"') {
        this.readString();
        continue;
      }

      // Números
      if (this.isDigit(ch)) {
        this.readNumber();
        continue;
      }

      // Identificadores / Keywords
      if (this.isAlpha(ch) || ch === '_') {
        this.readIdentifier();
        continue;
      }

      // Operadores y delimitadores
      switch (ch) {
        case '(':
          this.addToken(TokenType.LPAREN, '(');
          this.advance();
          break;
        case ')':
          this.addToken(TokenType.RPAREN, ')');
          this.advance();
          break;
        case '{':
          this.addToken(TokenType.LBRACE, '{');
          this.advance();
          break;
        case '}':
          this.addToken(TokenType.RBRACE, '}');
          this.advance();
          break;
        case '[':
          if (this.peek(1) === '[') {
            // Leer todo el contenido de [[ ... ]] como un solo token STRING
            this.advance(); // skip first [
            this.advance(); // skip second [
            let anchorContent = '';
            while (this.pos < this.source.length) {
              if (this.source[this.pos] === ']' && this.peek(1) === ']') {
                break;
              }
              anchorContent += this.source[this.pos];
              this.advance();
            }
            this.addToken(TokenType.LBRACKET_DOUBLE, '[[');
            this.tokens.push({
              type: TokenType.STRING,
              value: anchorContent,
              line: this.line,
              column: this.column,
            });
            if (this.pos < this.source.length && this.source[this.pos] === ']') {
              this.advance(); // skip first ]
              this.advance(); // skip second ]
            }
            this.addToken(TokenType.RBRACKET_DOUBLE, ']]');
          } else if (this.peek(1) === ']') {
            this.addToken(TokenType.BOX, '[]');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.LBRACKET, '[');
            this.advance();
          }
          break;
        case ']':
          if (this.peek(1) === ']') {
            this.addToken(TokenType.RBRACKET_DOUBLE, ']]');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.RBRACKET, ']');
            this.advance();
          }
          break;
        case ',':
          this.addToken(TokenType.COMMA, ',');
          this.advance();
          break;
        case '#':
          this.addToken(TokenType.HASH, '#');
          this.advance();
          break;
        case '.':
          this.addToken(TokenType.DOT, '.');
          this.advance();
          break;
        case '+':
          this.addToken(TokenType.PLUS, '+');
          this.advance();
          break;
        case '*':
          this.addToken(TokenType.STAR, '*');
          this.advance();
          break;
        case '/':
          this.addToken(TokenType.SLASH, '/');
          this.advance();
          break;
        case '%':
          this.addToken(TokenType.PERCENT, '%');
          this.advance();
          break;
        case '&':
          this.addToken(TokenType.AND, '&');
          this.advance();
          break;
        case '|':
          this.addToken(TokenType.OR, '|');
          this.advance();
          break;
        case '^':
          this.addToken(TokenType.XOR, '^');
          this.advance();
          break;
        case '\u2295': // ⊕
          this.addToken(TokenType.XOR, '\u2295');
          this.advance();
          break;
        case '\u2191': // ↑
          this.addToken(TokenType.NAND, '\u2191');
          this.advance();
          break;
        case '\u2193': // ↓
          this.addToken(TokenType.NOR, '\u2193');
          this.advance();
          break;
        case '!':
          if (this.peek(1) === '&') {
            this.addToken(TokenType.NAND, '!&');
            this.advance();
            this.advance();
          } else if (this.peek(1) === '|') {
            this.addToken(TokenType.NOR, '!|');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.NOT, '!');
            this.advance();
          }
          break;
        case '=':
          this.addToken(TokenType.EQUALS, '=');
          this.advance();
          break;
        case '\u2264': // ≤
          this.addToken(TokenType.LTE, '\u2264');
          this.advance();
          break;
        case '\u2265': // ≥
          this.addToken(TokenType.GTE, '\u2265');
          this.advance();
          break;
        case ':':
          this.addToken(TokenType.COLON, ':');
          this.advance();
          break;
        case '-':
          if (this.peek(1) === '>') {
            this.addToken(TokenType.ARROW, '->');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.MINUS, '-');
            this.advance();
          }
          break;
        case '<':
          if (this.peek(1) === '-' && this.peek(2) === '>') {
            this.addToken(TokenType.BICONDITIONAL, '<->');
            this.advance();
            this.advance();
            this.advance();
          } else if (this.peek(1) === '-') {
            this.addToken(TokenType.BACK_ARROW, '<-');
            this.advance();
            this.advance();
          } else if (this.peek(1) === '>') {
            this.addToken(TokenType.DIAMOND, '<>');
            this.advance();
            this.advance();
          } else if (this.peek(1) === '=') {
            this.addToken(TokenType.LTE, '<=');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.LT, '<');
            this.advance();
          }
          break;
        case '>':
          if (this.peek(1) === '=') {
            this.addToken(TokenType.GTE, '>=');
            this.advance();
            this.advance();
          } else {
            this.addToken(TokenType.GT, '>');
            this.advance();
          }
          break;
        default:
          this.diagnostics.push({
            severity: 'error',
            message: `Caracter inesperado: '${ch}' (code: ${ch.charCodeAt(0)})`,
            file: this.file,
            line: this.line,
            column: this.column,
          });
          this.advance();
      }
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column,
    });
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private peek(offset: number = 0): string {
    const idx = this.pos + offset;
    if (idx >= this.source.length) return '\0';
    return this.source[idx];
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
  }

  private isAlphaNum(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  private readLineComment(): void {
    this.pos += 2; // skip //
    this.column += 2;
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance();
    }
    // no emitimos token de comentario, lo descartamos
  }

  private readBlockComment(): void {
    const startLine = this.line;
    const startCol = this.column;
    this.pos += 2; // skip /*
    this.column += 2;
    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '*' && this.peek(1) === '/') {
        this.pos += 2;
        this.column += 2;
        return;
      }
      if (this.source[this.pos] === '\n') {
        this.pos++;
        this.line++;
        this.column = 1;
      } else {
        this.advance();
      }
    }
    // Si llegamos aquí, el comentario no fue cerrado
    this.diagnostics.push({
      severity: 'error',
      message: 'Comentario de bloque no cerrado (falta */)',
      file: this.file,
      line: startLine,
      column: startCol,
    });
  }

  private readString(): void {
    const startCol = this.column;
    this.advance(); // skip opening "
    let value = '';
    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance();
        if (this.pos < this.source.length) {
          const escaped = this.source[this.pos];
          switch (escaped) {
            case 'n':
              value += '\n';
              break;
            case 't':
              value += '\t';
              break;
            case '\\':
              value += '\\';
              break;
            case '"':
              value += '"';
              break;
            default:
              value += escaped;
          }
          this.advance();
        }
      } else {
        if (this.source[this.pos] === '\n') {
          this.line++;
          this.column = 0;
        }
        value += this.source[this.pos];
        this.advance();
      }
    }
    if (this.pos >= this.source.length) {
      this.diagnostics.push({
        severity: 'error',
        message: 'String no terminado',
        file: this.file,
        line: this.line,
        column: startCol,
      });
    } else {
      this.advance(); // skip closing "
    }
    this.tokens.push({
      type: TokenType.STRING,
      value,
      line: this.line,
      column: startCol,
    });
  }

  private readNumber(): void {
    const startCol = this.column;
    let value = '';
    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      value += this.source[this.pos];
      this.advance();
    }
    if (this.pos < this.source.length && this.source[this.pos] === '.') {
      value += '.';
      this.advance();
      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        value += this.source[this.pos];
        this.advance();
      }
    }
    this.tokens.push({
      type: TokenType.NUMBER,
      value,
      line: this.line,
      column: startCol,
    });
  }

  private readIdentifier(): void {
    const startCol = this.column;
    let value = '';
    while (this.pos < this.source.length && this.isAlphaNum(this.source[this.pos])) {
      value += this.source[this.pos];
      this.advance();
    }
    const lower = value.toLowerCase();
    const kwType = this.activeKeywords[lower];
    if (kwType) {
      this.tokens.push({
        type: kwType,
        value: lower,
        line: this.line,
        column: startCol,
      });
    } else {
      this.tokens.push({
        type: TokenType.IDENTIFIER,
        value,
        line: this.line,
        column: startCol,
      });
    }
  }
}
