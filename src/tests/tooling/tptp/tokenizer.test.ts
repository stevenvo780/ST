// ============================================================
// TPTP Tests — Tokenizer
// ============================================================

import { describe, it, expect } from 'vitest';
import { tokenize, TptpTokenizerError } from '../../../tooling/tptp/tokenizer';

describe('TPTP tokenizer — léxico básico', () => {
  it('tokeniza paréntesis y corchetes', () => {
    const toks = tokenize('([])');
    expect(toks.map((t) => t.kind)).toEqual(['lparen', 'lbracket', 'rbracket', 'rparen']);
  });

  it('distingue lower_word y upper_word', () => {
    const toks = tokenize('p X foo_bar Bar_baz');
    expect(toks.map((t) => t.kind)).toEqual([
      'lower_word',
      'upper_word',
      'lower_word',
      'upper_word',
    ]);
  });

  it('tokeniza operadores multi-char', () => {
    const toks = tokenize('<=> => <= <~> != = ~ & | ! ?');
    expect(toks.map((t) => t.kind)).toEqual([
      'op_iff',
      'op_implies',
      'op_nimplies',
      'op_xor',
      'op_neq',
      'op_eq',
      'op_not',
      'op_and',
      'op_or',
      'op_forall',
      'op_exists',
    ]);
  });

  it('ignora comentarios de línea %', () => {
    const toks = tokenize('p % comentario\nq');
    expect(toks.map((t) => t.value)).toEqual(['p', 'q']);
  });

  it('ignora comentarios de bloque /* */', () => {
    const toks = tokenize('p /* multi\nlínea */ q');
    expect(toks.map((t) => t.value)).toEqual(['p', 'q']);
  });

  it('lanza error en comentario de bloque sin cerrar', () => {
    expect(() => tokenize('p /* sin fin')).toThrow(TptpTokenizerError);
  });

  it('tokeniza single_quoted', () => {
    const toks = tokenize("include('tptp/SET001.ax')");
    const quoted = toks.find((t) => t.kind === 'single_quoted');
    expect(quoted?.value).toBe('tptp/SET001.ax');
  });

  it('tokeniza integers', () => {
    const toks = tokenize('123 -45 0');
    const integers = toks.filter((t) => t.kind === 'integer');
    expect(integers.map((t) => t.value)).toEqual(['123', '-45', '0']);
  });
});
