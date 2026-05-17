// ============================================================
// TPTP — Tokenizer
// ============================================================

export type TptpTokenKind =
  | 'lparen'
  | 'rparen'
  | 'lbracket'
  | 'rbracket'
  | 'comma'
  | 'dot'
  | 'colon'
  | 'lower_word' // p, fof, axiom, modus_ponens
  | 'upper_word' // X, Y, Variable123
  | 'single_quoted' // 'tptp/SET001.ax'
  | 'distinct_object' // "string"
  | 'integer'
  | 'op_not' // ~
  | 'op_and' // &
  | 'op_or' // |
  | 'op_implies' // =>
  | 'op_iff' // <=>
  | 'op_xor' // <~>
  | 'op_nimplies' // <=
  | 'op_forall' // !
  | 'op_exists' // ?
  | 'op_eq' // =
  | 'op_neq'; // !=

export interface TptpToken {
  kind: TptpTokenKind;
  value: string;
  line: number;
  col: number;
}

export class TptpTokenizerError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly col: number,
  ) {
    super(`TPTP tokenizer ${line}:${col}: ${message}`);
    this.name = 'TptpTokenizerError';
  }
}

const LOWER_START = /[a-z]/;
const UPPER_START = /[A-Z_]/;
const WORD_REST = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

export function tokenize(input: string): TptpToken[] {
  const tokens: TptpToken[] = [];
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

  const peek = (offset = 0): string => input[i + offset] ?? '';

  while (i < len) {
    const ch = peek();

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    // line comment: % ...
    if (ch === '%') {
      while (i < len && peek() !== '\n') advance();
      continue;
    }

    // block comment: /* ... */
    if (ch === '/' && peek(1) === '*') {
      const startLine = line;
      const startCol = col;
      advance(2);
      let closed = false;
      while (i < len) {
        if (peek() === '*' && peek(1) === '/') {
          advance(2);
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) {
        throw new TptpTokenizerError('comentario de bloque sin cerrar', startLine, startCol);
      }
      continue;
    }

    const tLine = line;
    const tCol = col;

    if (ch === '(') {
      tokens.push({ kind: 'lparen', value: '(', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', value: ')', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '[') {
      tokens.push({ kind: 'lbracket', value: '[', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === ']') {
      tokens.push({ kind: 'rbracket', value: ']', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma', value: ',', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '.') {
      tokens.push({ kind: 'dot', value: '.', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === ':') {
      tokens.push({ kind: 'colon', value: ':', line: tLine, col: tCol });
      advance();
      continue;
    }

    // operadores multi-char (orden importa: probar largos primero)
    if (ch === '<' && peek(1) === '=' && peek(2) === '>') {
      tokens.push({ kind: 'op_iff', value: '<=>', line: tLine, col: tCol });
      advance(3);
      continue;
    }
    if (ch === '<' && peek(1) === '~' && peek(2) === '>') {
      tokens.push({ kind: 'op_xor', value: '<~>', line: tLine, col: tCol });
      advance(3);
      continue;
    }
    if (ch === '=' && peek(1) === '>') {
      tokens.push({ kind: 'op_implies', value: '=>', line: tLine, col: tCol });
      advance(2);
      continue;
    }
    if (ch === '<' && peek(1) === '=') {
      tokens.push({ kind: 'op_nimplies', value: '<=', line: tLine, col: tCol });
      advance(2);
      continue;
    }
    if (ch === '!' && peek(1) === '=') {
      tokens.push({ kind: 'op_neq', value: '!=', line: tLine, col: tCol });
      advance(2);
      continue;
    }
    if (ch === '~') {
      tokens.push({ kind: 'op_not', value: '~', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '&') {
      tokens.push({ kind: 'op_and', value: '&', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '|') {
      tokens.push({ kind: 'op_or', value: '|', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '!') {
      tokens.push({ kind: 'op_forall', value: '!', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '?') {
      tokens.push({ kind: 'op_exists', value: '?', line: tLine, col: tCol });
      advance();
      continue;
    }
    if (ch === '=') {
      tokens.push({ kind: 'op_eq', value: '=', line: tLine, col: tCol });
      advance();
      continue;
    }

    // single-quoted: 'tptp/SET001.ax'
    if (ch === "'") {
      advance();
      let value = '';
      while (i < len && peek() !== "'") {
        if (peek() === '\\' && i + 1 < len) {
          value += peek() + peek(1);
          advance(2);
        } else {
          value += peek();
          advance();
        }
      }
      if (i >= len) {
        throw new TptpTokenizerError('comilla simple sin cerrar', tLine, tCol);
      }
      advance(); // consume closing '
      tokens.push({ kind: 'single_quoted', value, line: tLine, col: tCol });
      continue;
    }

    // distinct object: "string"
    if (ch === '"') {
      advance();
      let value = '';
      while (i < len && peek() !== '"') {
        if (peek() === '\\' && i + 1 < len) {
          value += peek() + peek(1);
          advance(2);
        } else {
          value += peek();
          advance();
        }
      }
      if (i >= len) {
        throw new TptpTokenizerError('string sin cerrar', tLine, tCol);
      }
      advance();
      tokens.push({ kind: 'distinct_object', value, line: tLine, col: tCol });
      continue;
    }

    // lower_word: empieza minúscula
    if (LOWER_START.test(ch)) {
      let value = '';
      while (i < len && WORD_REST.test(peek())) {
        value += peek();
        advance();
      }
      tokens.push({ kind: 'lower_word', value, line: tLine, col: tCol });
      continue;
    }

    // defined / system word: $word o $$word (TPTP: $true, $false, $i, $o, ...)
    if (ch === '$') {
      let value = '$';
      advance();
      if (peek() === '$') {
        value += '$';
        advance();
      }
      while (i < len && WORD_REST.test(peek())) {
        value += peek();
        advance();
      }
      tokens.push({ kind: 'lower_word', value, line: tLine, col: tCol });
      continue;
    }

    // upper_word / variable: empieza mayúscula o `_`
    if (UPPER_START.test(ch)) {
      let value = '';
      while (i < len && WORD_REST.test(peek())) {
        value += peek();
        advance();
      }
      tokens.push({ kind: 'upper_word', value, line: tLine, col: tCol });
      continue;
    }

    // integer (TPTP también permite signo, lo cubrimos como prefijo del lexer
    // si el contexto lo requiere; aquí solo dígitos)
    if (DIGIT.test(ch) || (ch === '-' && DIGIT.test(peek(1)))) {
      let value = '';
      if (ch === '-') {
        value += '-';
        advance();
      }
      while (i < len && DIGIT.test(peek())) {
        value += peek();
        advance();
      }
      tokens.push({ kind: 'integer', value, line: tLine, col: tCol });
      continue;
    }

    throw new TptpTokenizerError(`caracter inesperado: ${JSON.stringify(ch)}`, tLine, tCol);
  }

  return tokens;
}
