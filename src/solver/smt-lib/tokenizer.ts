// ============================================================
// SMT-LIB v2 — Tokenizer
// ============================================================
//
// Genera una secuencia plana de tokens a partir de un script SMT-LIB v2.
// Soporta:
//   - paréntesis `(` `)`
//   - comentarios de línea `; ...`
//   - símbolos simples (`x`, `+`, `<=`, `+foo!`)
//   - símbolos pipe-quoted `|x con espacios|`
//   - keywords `:keyword`
//   - numerales `123`
//   - decimales `1.5`
//   - hex `#xAB12`
//   - binary `#b1010`
//   - strings `"..."` con escape de comilla `""`
//
// El tokenizer no decide semántica: distingue numerales y decimales, pero
// `+ 1 2` queda como tres tokens-symbol y dos numerales — el parser decide.

export type SmtTokenKind =
  | 'lparen'
  | 'rparen'
  | 'symbol'
  | 'keyword'
  | 'numeral'
  | 'decimal'
  | 'hex'
  | 'binary'
  | 'string';

export interface SmtToken {
  kind: SmtTokenKind;
  value: string;
  /** Línea 1-based donde inicia el token. */
  line: number;
  /** Columna 1-based donde inicia el token. */
  col: number;
}

export class SmtTokenizerError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly col: number,
  ) {
    super(`SMT-LIB tokenizer ${line}:${col}: ${message}`);
    this.name = 'SmtTokenizerError';
  }
}

// SMT-LIB v2.6 §3.1: simple symbol = (letra | dígito | uno de los siguientes
// caracteres especiales) salvo que un símbolo no puede empezar por dígito.
// Caracteres permitidos extra: ~ ! @ $ % ^ & * _ - + = < > . ? /
const SIMPLE_SYMBOL_START = /[A-Za-z~!@$%^&*_\-+=<>.?/]/;
const SIMPLE_SYMBOL_REST = /[A-Za-z0-9~!@$%^&*_\-+=<>.?/]/;

export function tokenize(input: string): SmtToken[] {
  const tokens: SmtToken[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const len = input.length;

  const advance = (n = 1): void => {
    for (let k = 0; k < n; k++) {
      const ch = input[i];
      if (ch === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < len) {
    const ch = input[i] ?? '';
    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }
    // comentario de línea
    if (ch === ';') {
      while (i < len && input[i] !== '\n') advance();
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen', value: '(', line, col });
      advance();
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', value: ')', line, col });
      advance();
      continue;
    }
    // pipe-quoted symbol
    if (ch === '|') {
      const startLine = line;
      const startCol = col;
      advance(); // consume `|`
      let buf = '';
      while (i < len && input[i] !== '|') {
        if (input[i] === '\\') {
          throw new SmtTokenizerError('backslash no permitido dentro de | ... |', line, col);
        }
        buf += input[i];
        advance();
      }
      if (i >= len) {
        throw new SmtTokenizerError('símbolo |...| sin cerrar', startLine, startCol);
      }
      advance(); // consume closing `|`
      tokens.push({ kind: 'symbol', value: buf, line: startLine, col: startCol });
      continue;
    }
    // keyword `:foo`
    if (ch === ':') {
      const startLine = line;
      const startCol = col;
      advance();
      let buf = '';
      while (i < len) {
        const c = input[i] ?? '';
        if (SIMPLE_SYMBOL_REST.test(c)) {
          buf += c;
          advance();
        } else {
          break;
        }
      }
      if (buf.length === 0) {
        throw new SmtTokenizerError('keyword `:` sin nombre', startLine, startCol);
      }
      tokens.push({ kind: 'keyword', value: buf, line: startLine, col: startCol });
      continue;
    }
    // string literal "..."  (SMT-LIB v2.6 doblamos comilla para escape)
    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      advance();
      let buf = '';
      let closed = false;
      while (i < len) {
        const c = input[i] ?? '';
        if (c === '"') {
          // posible escape "" o cierre
          if (input[i + 1] === '"') {
            buf += '"';
            advance(2);
          } else {
            advance();
            tokens.push({ kind: 'string', value: buf, line: startLine, col: startCol });
            closed = true;
            break;
          }
        } else {
          buf += c;
          advance();
        }
      }
      if (!closed) {
        throw new SmtTokenizerError('string sin cerrar', startLine, startCol);
      }
      continue;
    }
    // #xHEX / #bBIN
    if (ch === '#') {
      const startLine = line;
      const startCol = col;
      const next = input[i + 1];
      if (next === 'x') {
        advance(2);
        let buf = '';
        while (i < len && /[0-9A-Fa-f]/.test(input[i] ?? '')) {
          buf += input[i];
          advance();
        }
        if (buf.length === 0) {
          throw new SmtTokenizerError('hex sin dígitos', startLine, startCol);
        }
        tokens.push({ kind: 'hex', value: buf, line: startLine, col: startCol });
        continue;
      }
      if (next === 'b') {
        advance(2);
        let buf = '';
        while (i < len && /[01]/.test(input[i] ?? '')) {
          buf += input[i];
          advance();
        }
        if (buf.length === 0) {
          throw new SmtTokenizerError('binary sin dígitos', startLine, startCol);
        }
        tokens.push({ kind: 'binary', value: buf, line: startLine, col: startCol });
        continue;
      }
      throw new SmtTokenizerError(`literal con # inválido: #${next ?? ''}`, startLine, startCol);
    }
    // numeral / decimal
    if (ch >= '0' && ch <= '9') {
      const startLine = line;
      const startCol = col;
      let buf = '';
      while (i < len && /[0-9]/.test(input[i] ?? '')) {
        buf += input[i];
        advance();
      }
      if (input[i] === '.') {
        buf += '.';
        advance();
        while (i < len && /[0-9]/.test(input[i] ?? '')) {
          buf += input[i];
          advance();
        }
        tokens.push({ kind: 'decimal', value: buf, line: startLine, col: startCol });
      } else {
        tokens.push({ kind: 'numeral', value: buf, line: startLine, col: startCol });
      }
      continue;
    }
    // símbolo simple
    if (SIMPLE_SYMBOL_START.test(ch)) {
      const startLine = line;
      const startCol = col;
      let buf = '';
      while (i < len) {
        const c = input[i] ?? '';
        if (SIMPLE_SYMBOL_REST.test(c)) {
          buf += c;
          advance();
        } else {
          break;
        }
      }
      tokens.push({ kind: 'symbol', value: buf, line: startLine, col: startCol });
      continue;
    }
    throw new SmtTokenizerError(`carácter inesperado: ${JSON.stringify(ch)}`, line, col);
  }
  return tokens;
}
