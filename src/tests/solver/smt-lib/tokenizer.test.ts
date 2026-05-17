// ============================================================
// SMT-LIB v2 Tests — Tokenizer
// ============================================================

import { describe, it, expect } from 'vitest';
import { tokenize, SmtTokenizerError } from '../../../solver/smt-lib/tokenizer';

describe('SMT-LIB tokenizer', () => {
  it('tokeniza paréntesis y símbolos básicos', () => {
    const tokens = tokenize('(check-sat)');
    expect(tokens.map((t) => t.kind)).toEqual(['lparen', 'symbol', 'rparen']);
    expect(tokens[1].value).toBe('check-sat');
  });

  it('ignora comentarios de línea', () => {
    const tokens = tokenize('; un comentario\n(assert true)');
    expect(tokens.map((t) => t.value)).toEqual(['(', 'assert', 'true', ')']);
  });

  it('reconoce keywords con `:`', () => {
    const tokens = tokenize('(set-option :produce-models true)');
    expect(tokens[2].kind).toBe('keyword');
    expect(tokens[2].value).toBe('produce-models');
  });

  it('reconoce literales hex y binary', () => {
    const tokens = tokenize('#xAB12 #b1010');
    expect(tokens[0].kind).toBe('hex');
    expect(tokens[0].value).toBe('AB12');
    expect(tokens[1].kind).toBe('binary');
    expect(tokens[1].value).toBe('1010');
  });

  it('reconoce numerales y decimales', () => {
    const tokens = tokenize('42 3.14');
    expect(tokens[0].kind).toBe('numeral');
    expect(tokens[0].value).toBe('42');
    expect(tokens[1].kind).toBe('decimal');
    expect(tokens[1].value).toBe('3.14');
  });

  it('parsea strings con escape de comilla doble', () => {
    const tokens = tokenize('"hola ""mundo"" fin"');
    expect(tokens[0].kind).toBe('string');
    expect(tokens[0].value).toBe('hola "mundo" fin');
  });

  it('parsea símbolos pipe-quoted', () => {
    const tokens = tokenize('|símbolo con espacios|');
    expect(tokens[0].kind).toBe('symbol');
    expect(tokens[0].value).toBe('símbolo con espacios');
  });

  it('arroja error en string sin cerrar', () => {
    expect(() => tokenize('"hola')).toThrow(SmtTokenizerError);
  });

  it('arroja error en |...| sin cerrar', () => {
    expect(() => tokenize('|abc')).toThrow(SmtTokenizerError);
  });

  it('mantiene line/col en cada token', () => {
    const tokens = tokenize('(foo\n  bar)');
    expect(tokens[2].line).toBe(2);
    expect(tokens[2].col).toBe(3);
  });
});
