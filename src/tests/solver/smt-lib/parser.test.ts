// ============================================================
// SMT-LIB v2 Tests — Parser
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseSmtLib, parseSort, parseTerm, SmtParserError } from '../../../solver/smt-lib/parser';
import type { SmtCommand } from '../../../solver/smt-lib/ast';

describe('SMT-LIB parser — comandos', () => {
  it('parsea (check-sat) como comando único', () => {
    const cmds = parseSmtLib('(check-sat)');
    expect(cmds).toEqual([{ kind: 'check-sat' }]);
  });

  it('parsea (set-logic QF_LRA)', () => {
    const cmds = parseSmtLib('(set-logic QF_LRA)');
    expect(cmds).toEqual([{ kind: 'set-logic', logic: 'QF_LRA' }]);
  });

  it('parsea (declare-const x Real)', () => {
    const cmds = parseSmtLib('(declare-const x Real)');
    const cmd = cmds[0] as SmtCommand & { kind: 'declare-const' };
    expect(cmd.kind).toBe('declare-const');
    expect(cmd.name).toBe('x');
    expect(cmd.sort).toEqual({ kind: 'symbol', name: 'Real' });
  });

  it('parsea (declare-fun f (Int Int) Bool)', () => {
    const cmds = parseSmtLib('(declare-fun f (Int Int) Bool)');
    const cmd = cmds[0] as SmtCommand & { kind: 'declare-fun' };
    expect(cmd.kind).toBe('declare-fun');
    expect(cmd.name).toBe('f');
    expect(cmd.paramSorts).toHaveLength(2);
    expect(cmd.paramSorts[0]).toEqual({ kind: 'symbol', name: 'Int' });
    expect(cmd.resultSort).toEqual({ kind: 'symbol', name: 'Bool' });
  });

  it('parsea (assert (= x 5))', () => {
    const cmds = parseSmtLib('(assert (= x 5))');
    const cmd = cmds[0] as SmtCommand & { kind: 'assert' };
    expect(cmd.kind).toBe('assert');
    expect(cmd.formula.kind).toBe('app');
  });

  it('parsea (push 2) y (pop 1)', () => {
    const cmds = parseSmtLib('(push 2)(pop 1)');
    expect(cmds).toEqual([
      { kind: 'push', levels: 2 },
      { kind: 'pop', levels: 1 },
    ]);
  });

  it('parsea (declare-sort A 0)', () => {
    const cmds = parseSmtLib('(declare-sort A 0)');
    expect(cmds).toEqual([{ kind: 'declare-sort', name: 'A', arity: 0 }]);
  });

  it('parsea (set-option :produce-models true)', () => {
    const cmds = parseSmtLib('(set-option :produce-models true)');
    const cmd = cmds[0] as SmtCommand & { kind: 'set-option' };
    expect(cmd.kind).toBe('set-option');
    expect(cmd.key).toBe('produce-models');
    expect(cmd.value).toBe('true');
  });

  it('parsea (set-info :status sat)', () => {
    const cmds = parseSmtLib('(set-info :status sat)');
    const cmd = cmds[0] as SmtCommand & { kind: 'set-info' };
    expect(cmd.kind).toBe('set-info');
    expect(cmd.key).toBe('status');
  });

  it('parsea (define-fun double ((x Int)) Int (+ x x))', () => {
    const cmds = parseSmtLib('(define-fun double ((x Int)) Int (+ x x))');
    const cmd = cmds[0] as SmtCommand & { kind: 'define-fun' };
    expect(cmd.kind).toBe('define-fun');
    expect(cmd.name).toBe('double');
    expect(cmd.params).toEqual([{ name: 'x', sort: { kind: 'symbol', name: 'Int' } }]);
    expect(cmd.resultSort).toEqual({ kind: 'symbol', name: 'Int' });
    expect(cmd.body.kind).toBe('app');
  });

  it('parsea (echo "hola")', () => {
    const cmds = parseSmtLib('(echo "hola")');
    expect(cmds).toEqual([{ kind: 'echo', message: 'hola' }]);
  });

  it('parsea (get-value (x y z))', () => {
    const cmds = parseSmtLib('(get-value (x y z))');
    const cmd = cmds[0] as SmtCommand & { kind: 'get-value' };
    expect(cmd.kind).toBe('get-value');
    expect(cmd.terms).toHaveLength(3);
  });

  it('parsea (check-sat-assuming (p (not q)))', () => {
    const cmds = parseSmtLib('(check-sat-assuming (p (not q)))');
    const cmd = cmds[0] as SmtCommand & { kind: 'check-sat-assuming' };
    expect(cmd.kind).toBe('check-sat-assuming');
    expect(cmd.assumptions).toHaveLength(2);
  });

  it('parsea (reset), (reset-assertions), (exit), (get-model), (get-proof), (get-unsat-core), (get-assertions)', () => {
    const cmds = parseSmtLib(
      '(reset)(reset-assertions)(exit)(get-model)(get-proof)(get-unsat-core)(get-assertions)',
    );
    expect(cmds.map((c) => c.kind)).toEqual([
      'reset',
      'reset-assertions',
      'exit',
      'get-model',
      'get-proof',
      'get-unsat-core',
      'get-assertions',
    ]);
  });

  it('arroja error en comando desconocido', () => {
    expect(() => parseSmtLib('(foobar 1)')).toThrow(SmtParserError);
  });
});

describe('SMT-LIB parser — términos', () => {
  it('parsea let: (let ((y 5)) (+ x y))', () => {
    const term = parseTerm('(let ((y 5)) (+ x y))');
    expect(term.kind).toBe('let');
    if (term.kind === 'let') {
      expect(term.bindings).toHaveLength(1);
      expect(term.bindings[0].name).toBe('y');
      expect(term.body.kind).toBe('app');
    }
  });

  it('parsea forall: (forall ((x Int)) (>= x 0))', () => {
    const term = parseTerm('(forall ((x Int)) (>= x 0))');
    expect(term.kind).toBe('forall');
    if (term.kind === 'forall') {
      expect(term.vars).toEqual([{ name: 'x', sort: { kind: 'symbol', name: 'Int' } }]);
      expect(term.body.kind).toBe('app');
    }
  });

  it('parsea exists con múltiples variables', () => {
    const term = parseTerm('(exists ((x Int) (y Real)) (= x y))');
    expect(term.kind).toBe('exists');
    if (term.kind === 'exists') {
      expect(term.vars).toHaveLength(2);
      expect(term.vars[1].sort).toEqual({ kind: 'symbol', name: 'Real' });
    }
  });

  it('parsea identificadores indexados (_ BitVec 32)', () => {
    const sort = parseSort('(_ BitVec 32)');
    expect(sort.kind).toBe('app');
    if (sort.kind === 'app') {
      expect(sort.name).toBe('_ BitVec');
      expect(sort.args).toHaveLength(1);
    }
  });

  it('parsea sorts aplicados (Array Int Int)', () => {
    const sort = parseSort('(Array Int Int)');
    expect(sort).toEqual({
      kind: 'app',
      name: 'Array',
      args: [
        { kind: 'symbol', name: 'Int' },
        { kind: 'symbol', name: 'Int' },
      ],
    });
  });

  it('parsea numerales, decimales, hex y binary como spec-constants', () => {
    expect(parseTerm('42')).toEqual({ kind: 'spec-constant', type: 'numeral', value: '42' });
    expect(parseTerm('3.14')).toEqual({ kind: 'spec-constant', type: 'decimal', value: '3.14' });
    expect(parseTerm('#xFF')).toEqual({ kind: 'spec-constant', type: 'hex', value: 'FF' });
    expect(parseTerm('#b101')).toEqual({ kind: 'spec-constant', type: 'binary', value: '101' });
    expect(parseTerm('"hola"')).toEqual({ kind: 'spec-constant', type: 'string', value: 'hola' });
  });

  it('parsea término anotado (! x :named foo)', () => {
    const term = parseTerm('(! x :named foo)');
    expect(term.kind).toBe('annotated');
    if (term.kind === 'annotated') {
      expect(term.attrs).toEqual([{ key: 'named', value: 'foo' }]);
    }
  });
});
