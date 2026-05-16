// ============================================================
// ST Parser — Estado compartido (token cursor + diagnostico)
// ============================================================
//
// Encapsula el estado mutable del parser y todos los helpers
// de bajo nivel (current/peek/advance/match/expect). Los modulos
// de parsing especializados (statements, control-flow, formulas,
// etc.) operan sobre una instancia de ParserState pasada por
// referencia.
//
// Esta capa NO produce nodos AST — solo navega tokens y emite
// diagnosticos. Toda la logica de construccion de nodos vive
// en los modulos hijos.

import { Token, TokenType } from '../lexer/tokens';
import { Diagnostic, SourceLocation } from '../types';

export class ParserState {
  public tokens: Token[] = [];
  public pos: number = 0;
  public file: string;
  public diagnostics: Diagnostic[] = [];
  public contextStack: string[] = [];
  public currentProfile: string = '';
  public knownFunctionNames: Set<string> = new Set([
    'typeof',
    'is_valid',
    'is_satisfiable',
    'get_atoms',
    'atoms_of',
    'len',
    'at',
    'formula_eq',
    'input',
  ]);
  public knownTheoryNames: Set<string> = new Set();

  constructor(file: string = '<stdin>') {
    this.file = file;
  }

  // --- Acceso a tokens ---

  current(): Token {
    if (this.pos >= this.tokens.length) {
      return { type: TokenType.EOF, value: '', line: 0, column: 0 };
    }
    return this.tokens[this.pos];
  }

  previous(): Token {
    if (this.pos === 0) return this.tokens[0];
    return this.tokens[this.pos - 1];
  }

  peek(offset: number): TokenType {
    const idx = this.pos + offset;
    if (idx >= this.tokens.length) return TokenType.EOF;
    return this.tokens[idx].type;
  }

  advance(): Token {
    const tok = this.current();
    this.pos++;
    return tok;
  }

  isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }

  checkType(type: TokenType): boolean {
    return this.current().type === type;
  }

  match(type: TokenType): boolean {
    if (this.checkType(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  expect(type: TokenType): Token {
    if (this.checkType(type)) {
      return this.advance();
    }
    throw new Error(
      this.contextualize(
        `Se esperaba ${type}, encontrado '${this.current().value}' (${this.current().type}) ` +
          `en linea ${this.current().line}, columna ${this.current().column}`,
      ),
    );
  }

  expectOneOf(...types: TokenType[]): Token {
    for (const type of types) {
      if (this.checkType(type)) {
        return this.advance();
      }
    }
    throw new Error(
      this.contextualize(
        `Se esperaba ${types.join(' o ')}, encontrado '${this.current().value}' (${this.current().type}) ` +
          `en linea ${this.current().line}, columna ${this.current().column}`,
      ),
    );
  }

  expectIdent(): string {
    const tok = this.expect(TokenType.IDENTIFIER);
    return tok.value;
  }

  /**
   * Acepta un IDENTIFIER o cualquier keyword como nombre
   * (para soportar nombres como "Logic", "Theory", etc. que colisionan con keywords)
   */
  expectName(): string {
    const tok = this.current();
    if (tok.type === TokenType.IDENTIFIER) {
      this.advance();
      return tok.value;
    }
    if (
      tok.type !== TokenType.NEWLINE &&
      tok.type !== TokenType.EOF &&
      tok.type !== TokenType.LPAREN &&
      tok.type !== TokenType.RPAREN &&
      tok.type !== TokenType.LBRACE &&
      tok.type !== TokenType.RBRACE &&
      tok.type !== TokenType.COLON &&
      tok.type !== TokenType.EQUALS &&
      tok.type !== TokenType.ARROW &&
      tok.type !== TokenType.AND &&
      tok.type !== TokenType.OR &&
      tok.type !== TokenType.NOT &&
      tok.type !== TokenType.DOT &&
      tok.type !== TokenType.COMMA &&
      tok.type !== TokenType.STRING &&
      tok.type !== TokenType.NUMBER
    ) {
      this.advance();
      return tok.value;
    }
    throw new Error(
      this.contextualize(
        `Se esperaba nombre/identificador, encontrado '${tok.value}' (${tok.type}) ` +
          `en linea ${tok.line}, columna ${tok.column}`,
      ),
    );
  }

  // --- Diagnostico y contexto ---

  contextualize(message: string): string {
    if (this.contextStack.length === 0) return message;
    return `${message} mientras se parseaba ${this.contextStack.join(' > ')}`;
  }

  withContext<T>(context: string, fn: () => T): T {
    this.contextStack.push(context);
    try {
      return fn();
    } finally {
      this.contextStack.pop();
    }
  }

  loc(): SourceLocation {
    const tok = this.current();
    return { line: tok.line, column: tok.column, file: this.file };
  }

  skipNewlines(): void {
    while (this.checkType(TokenType.NEWLINE)) {
      this.advance();
    }
  }

  pushDiagnostic(severity: 'error' | 'warning' | 'info', message: string): void {
    this.diagnostics.push({
      severity,
      message,
      file: this.file,
      line: this.current().line,
      column: this.current().column,
    });
  }
}
