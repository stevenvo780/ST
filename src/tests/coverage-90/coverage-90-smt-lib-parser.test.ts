import { describe, it, expect } from 'vitest';
import { parseSmtLib, parseTerm, parseSort } from '../../solver/smt-lib/parser';

describe('coverage-90 — SMT-LIB parser commands', () => {
  it('parses set-logic command', () => {
    const cmds = parseSmtLib('(set-logic QF_LIA)');
    expect(cmds).toHaveLength(1);
    expect(cmds[0].kind).toBe('set-logic');
  });

  it('parses set-option with keyword and value', () => {
    const cmds = parseSmtLib('(set-option :produce-models true)');
    expect(cmds).toHaveLength(1);
    expect(cmds[0].kind).toBe('set-option');
  });

  it('parses set-info', () => {
    const cmds = parseSmtLib('(set-info :status sat)');
    expect(cmds[0].kind).toBe('set-info');
  });

  it('parses declare-sort with arity', () => {
    const cmds = parseSmtLib('(declare-sort Color 0)');
    expect(cmds[0].kind).toBe('declare-sort');
  });

  it('parses define-sort with params', () => {
    const cmds = parseSmtLib('(define-sort Pair (X Y) (Array X Y))');
    expect(cmds[0].kind).toBe('define-sort');
  });

  it('parses declare-fun with multiple params', () => {
    const cmds = parseSmtLib('(declare-fun f (Int Int) Bool)');
    expect(cmds[0].kind).toBe('declare-fun');
  });

  it('parses define-fun', () => {
    const cmds = parseSmtLib(`
      (define-fun pos ((x Int)) Bool (> x 0))
    `);
    expect(cmds[0].kind).toBe('define-fun');
  });

  it('parses declare-const', () => {
    const cmds = parseSmtLib('(declare-const x Int)');
    expect(cmds[0].kind).toBe('declare-const');
  });

  it('parses assert with binary operator', () => {
    const cmds = parseSmtLib('(assert (= x 1))');
    expect(cmds[0].kind).toBe('assert');
  });

  it('parses check-sat', () => {
    const cmds = parseSmtLib('(check-sat)');
    expect(cmds[0].kind).toBe('check-sat');
  });

  it('parses check-sat-assuming', () => {
    const cmds = parseSmtLib('(check-sat-assuming (a b))');
    expect(cmds[0].kind).toBe('check-sat-assuming');
  });

  it('parses get-model / get-assertions / get-unsat-core / get-proof / exit', () => {
    const cmds = parseSmtLib(`
      (get-model)
      (get-assertions)
      (get-unsat-core)
      (get-proof)
      (exit)
    `);
    expect(cmds.map((c) => c.kind)).toEqual([
      'get-model',
      'get-assertions',
      'get-unsat-core',
      'get-proof',
      'exit',
    ]);
  });

  it('parses push/pop/reset/reset-assertions', () => {
    const cmds = parseSmtLib(`
      (push 1)
      (pop 2)
      (reset)
      (reset-assertions)
    `);
    expect(cmds.map((c) => c.kind)).toEqual(['push', 'pop', 'reset', 'reset-assertions']);
  });

  it('parses get-value', () => {
    const cmds = parseSmtLib('(get-value (x y z))');
    expect(cmds[0].kind).toBe('get-value');
  });

  it('parses echo', () => {
    const cmds = parseSmtLib('(echo "hello world")');
    expect(cmds[0].kind).toBe('echo');
  });

  it('parses a full SAT script', () => {
    const cmds = parseSmtLib(`
      (set-logic QF_LIA)
      (declare-const x Int)
      (declare-const y Int)
      (assert (>= x 0))
      (assert (<= x 10))
      (assert (= (+ x y) 5))
      (check-sat)
      (get-model)
      (exit)
    `);
    expect(cmds.length).toBeGreaterThanOrEqual(7);
  });

  it('parses term with let binding', () => {
    const term = parseTerm('(let ((a 1) (b 2)) (+ a b))');
    expect(term).toBeDefined();
  });

  it('parses term with forall quantifier', () => {
    const term = parseTerm('(forall ((x Int)) (> x 0))');
    expect(term).toBeDefined();
  });

  it('parses term with exists quantifier', () => {
    const term = parseTerm('(exists ((x Int)) (= x 5))');
    expect(term).toBeDefined();
  });

  it('parses term with annotation (!)', () => {
    const term = parseTerm('(! true :named foo)');
    expect(term).toBeDefined();
  });

  it('parses literal numeral, decimal, string, hex, binary', () => {
    expect(parseTerm('42')).toBeDefined();
    expect(parseTerm('3.14')).toBeDefined();
    expect(parseTerm('"hello"')).toBeDefined();
    expect(parseTerm('#x1A')).toBeDefined();
    expect(parseTerm('#b1010')).toBeDefined();
  });

  it('parses sort: Int', () => {
    const s = parseSort('Int');
    expect(s.kind).toBe('symbol');
  });

  it('parses parameterized sort: (Array Int Bool)', () => {
    const s = parseSort('(Array Int Bool)');
    expect(s.kind).toBe('app');
  });

  it('parses indexed sort: (_ BitVec 32)', () => {
    const s = parseSort('(_ BitVec 32)');
    expect(s.kind).toBe('app');
  });

  it('throws on unknown command', () => {
    expect(() => parseSmtLib('(unknown-cmd)')).toThrow();
  });

  it('throws on unclosed s-expression', () => {
    expect(() => parseSmtLib('(assert (= x 1)')).toThrow();
  });

  it('throws on parseTerm with leftover tokens', () => {
    expect(() => parseTerm('a b')).toThrow();
  });

  it('parses nested binary/hex/string in commands', () => {
    const cmds = parseSmtLib(`
      (assert (= bv #b1100))
      (assert (= hx #xFF))
      (assert (= s "abc"))
    `);
    expect(cmds).toHaveLength(3);
  });
});
