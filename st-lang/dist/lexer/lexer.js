"use strict";
// ============================================================
// ST Lexer — Tokenizador
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const tokens_1 = require("./tokens");
class Lexer {
    source;
    tokens = [];
    pos = 0;
    line = 1;
    column = 1;
    file;
    diagnostics = [];
    constructor(source, file = '<stdin>') {
        this.source = source;
        this.file = file;
    }
    tokenize() {
        this.tokens = [];
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        while (this.pos < this.source.length) {
            this.skipWhitespace();
            if (this.pos >= this.source.length)
                break;
            const ch = this.source[this.pos];
            // Comentarios
            if (ch === '/' && this.peek(1) === '/') {
                this.readLineComment();
                continue;
            }
            // Newlines
            if (ch === '\n') {
                this.addToken(tokens_1.TokenType.NEWLINE, '\n');
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
                    this.addToken(tokens_1.TokenType.LPAREN, '(');
                    this.advance();
                    break;
                case ')':
                    this.addToken(tokens_1.TokenType.RPAREN, ')');
                    this.advance();
                    break;
                case '{':
                    this.addToken(tokens_1.TokenType.LBRACE, '{');
                    this.advance();
                    break;
                case '}':
                    this.addToken(tokens_1.TokenType.RBRACE, '}');
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
                        this.addToken(tokens_1.TokenType.LBRACKET_DOUBLE, '[[');
                        this.tokens.push({
                            type: tokens_1.TokenType.STRING,
                            value: anchorContent,
                            line: this.line,
                            column: this.column,
                        });
                        if (this.pos < this.source.length && this.source[this.pos] === ']') {
                            this.advance(); // skip first ]
                            this.advance(); // skip second ]
                        }
                        this.addToken(tokens_1.TokenType.RBRACKET_DOUBLE, ']]');
                    }
                    else {
                        this.addToken(tokens_1.TokenType.LBRACKET, '[');
                        this.advance();
                    }
                    break;
                case ']':
                    if (this.peek(1) === ']') {
                        this.addToken(tokens_1.TokenType.RBRACKET_DOUBLE, ']]');
                        this.advance();
                        this.advance();
                    }
                    else {
                        this.addToken(tokens_1.TokenType.RBRACKET, ']');
                        this.advance();
                    }
                    break;
                case ',':
                    this.addToken(tokens_1.TokenType.COMMA, ',');
                    this.advance();
                    break;
                case '#':
                    this.addToken(tokens_1.TokenType.HASH, '#');
                    this.advance();
                    break;
                case '.':
                    this.addToken(tokens_1.TokenType.DOT, '.');
                    this.advance();
                    break;
                case '&':
                    this.addToken(tokens_1.TokenType.AND, '&');
                    this.advance();
                    break;
                case '|':
                    this.addToken(tokens_1.TokenType.OR, '|');
                    this.advance();
                    break;
                case '!':
                    this.addToken(tokens_1.TokenType.NOT, '!');
                    this.advance();
                    break;
                case '=':
                    this.addToken(tokens_1.TokenType.EQUALS, '=');
                    this.advance();
                    break;
                case ':':
                    this.addToken(tokens_1.TokenType.COLON, ':');
                    this.advance();
                    break;
                case '-':
                    if (this.peek(1) === '>') {
                        this.addToken(tokens_1.TokenType.ARROW, '->');
                        this.advance();
                        this.advance();
                    }
                    else {
                        this.diagnostics.push({
                            severity: 'error',
                            message: `Caracter inesperado: '${ch}'`,
                            file: this.file,
                            line: this.line,
                            column: this.column,
                        });
                        this.advance();
                    }
                    break;
                case '<':
                    if (this.peek(1) === '-' && this.peek(2) === '>') {
                        this.addToken(tokens_1.TokenType.BICONDITIONAL, '<->');
                        this.advance();
                        this.advance();
                        this.advance();
                    }
                    else if (this.peek(1) === '-') {
                        this.addToken(tokens_1.TokenType.BACK_ARROW, '<-');
                        this.advance();
                        this.advance();
                    }
                    else {
                        this.diagnostics.push({
                            severity: 'error',
                            message: `Caracter inesperado: '${ch}'`,
                            file: this.file,
                            line: this.line,
                            column: this.column,
                        });
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
        this.addToken(tokens_1.TokenType.EOF, '');
        return this.tokens;
    }
    addToken(type, value) {
        this.tokens.push({
            type,
            value,
            line: this.line,
            column: this.column,
        });
    }
    advance() {
        this.pos++;
        this.column++;
    }
    peek(offset = 0) {
        const idx = this.pos + offset;
        if (idx >= this.source.length)
            return '\0';
        return this.source[idx];
    }
    skipWhitespace() {
        while (this.pos < this.source.length) {
            const ch = this.source[this.pos];
            if (ch === ' ' || ch === '\t' || ch === '\r') {
                this.advance();
            }
            else {
                break;
            }
        }
    }
    isDigit(ch) {
        return ch >= '0' && ch <= '9';
    }
    isAlpha(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }
    isAlphaNum(ch) {
        return this.isAlpha(ch) || this.isDigit(ch);
    }
    readLineComment() {
        const startCol = this.column;
        let value = '';
        this.pos += 2; // skip //
        this.column += 2;
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
            value += this.source[this.pos];
            this.advance();
        }
        // no emitimos token de comentario, lo descartamos
    }
    readString() {
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
                        default: value += escaped;
                    }
                    this.advance();
                }
            }
            else {
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
        }
        else {
            this.advance(); // skip closing "
        }
        this.tokens.push({
            type: tokens_1.TokenType.STRING,
            value,
            line: this.line,
            column: startCol,
        });
    }
    readNumber() {
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
            type: tokens_1.TokenType.NUMBER,
            value,
            line: this.line,
            column: startCol,
        });
    }
    readIdentifier() {
        const startCol = this.column;
        let value = '';
        while (this.pos < this.source.length && this.isAlphaNum(this.source[this.pos])) {
            value += this.source[this.pos];
            this.advance();
        }
        const lower = value.toLowerCase();
        const kwType = tokens_1.KEYWORDS[lower];
        if (kwType) {
            this.tokens.push({
                type: kwType,
                value: lower,
                line: this.line,
                column: startCol,
            });
        }
        else {
            this.tokens.push({
                type: tokens_1.TokenType.IDENTIFIER,
                value,
                line: this.line,
                column: startCol,
            });
        }
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map