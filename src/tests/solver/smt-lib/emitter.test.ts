// ============================================================
// SMT-LIB v2 Tests — Emitter y round-trip
// ============================================================

import { describe, it, expect } from 'vitest';
import { emitCommand, emitSmtLib, emitSort, emitTerm, quoteSymbol } from '../../../solver/smt-lib/emitter';
import { parseSmtLib, parseSort } from '../../../solver/smt-lib/parser';

describe('SMT-LIB emitter', () => {
  it('emite (check-sat) y (exit)', () => {
    expect(emitCommand({ kind: 'check-sat' })).toBe('(check-sat)');
    expect(emitCommand({ kind: 'exit' })).toBe('(exit)');
  });

  it('emite declare-fun con varios sorts', () => {
    const out = emitCommand({
      kind: 'declare-fun',
      name: 'f',
      paramSorts: [
        { kind: 'symbol', name: 'Int' },
        { kind: 'symbol', name: 'Int' },
      ],
      resultSort: { kind: 'symbol', name: 'Bool' },
    });
    expect(out).toBe('(declare-fun f (Int Int) Bool)');
  });

  it('emite define-fun con cuerpo', () => {
    const out = emitCommand({
      kind: 'define-fun',
      name: 'sq',
      params: [{ name: 'x', sort: { kind: 'symbol', name: 'Int' } }],
      resultSort: { kind: 'symbol', name: 'Int' },
      body: {
        kind: 'app',
        fn: '*',
        args: [
          { kind: 'symbol', name: 'x' },
          { kind: 'symbol', name: 'x' },
        ],
      },
    });
    expect(out).toBe('(define-fun sq ((x Int)) Int (* x x))');
  });

  it('emite (push N) y (pop N)', () => {
    expect(emitCommand({ kind: 'push', levels: 3 })).toBe('(push 3)');
    expect(emitCommand({ kind: 'pop', levels: 1 })).toBe('(pop 1)');
  });

  it('emite hex y binary preservando prefijos', () => {
    expect(emitTerm({ kind: 'spec-constant', type: 'hex', value: 'AB' })).toBe('#xAB');
    expect(emitTerm({ kind: 'spec-constant', type: 'binary', value: '101' })).toBe('#b101');
  });

  it('cita símbolos con caracteres especiales con | ... |', () => {
    expect(quoteSymbol('hola mundo')).toBe('|hola mundo|');
    expect(quoteSymbol('x')).toBe('x');
    expect(quoteSymbol('')).toBe('||');
  });

  it('emite sorts indexados (_ BitVec 32)', () => {
    const sort = parseSort('(_ BitVec 32)');
    expect(emitSort(sort)).toBe('(_ BitVec 32)');
  });

  it('emite sorts aplicados (Array Int Int)', () => {
    const sort = parseSort('(Array Int Int)');
    expect(emitSort(sort)).toBe('(Array Int Int)');
  });

  it('emite strings escapando comilla doble', () => {
    expect(emitTerm({ kind: 'spec-constant', type: 'string', value: 'hi "bob"' })).toBe(
      '"hi ""bob"""',
    );
  });
});

describe('SMT-LIB round-trip', () => {
  function roundTrip(src: string): string {
    const cmds = parseSmtLib(src);
    return emitSmtLib(cmds);
  }

  it('round-trip: programa QF_LIA mínimo', () => {
    const src = [
      '(set-logic QF_LIA)',
      '(declare-const x Int)',
      '(declare-const y Int)',
      '(assert (= (+ x y) 10))',
      '(assert (> x 0))',
      '(check-sat)',
      '(get-model)',
      '(exit)',
    ].join('\n');
    const out1 = roundTrip(src);
    const out2 = roundTrip(out1);
    expect(out2).toBe(out1);
  });

  it('round-trip: idempotente sobre forall + let', () => {
    const src = '(assert (forall ((x Int)) (let ((y (* x 2))) (>= y 0))))';
    const out1 = roundTrip(src);
    const out2 = roundTrip(out1);
    expect(out2).toBe(out1);
  });

  it('round-trip: programa QF_LRA con 10 comandos', () => {
    const src = [
      '(set-logic QF_LRA)',
      '(set-option :produce-models true)',
      '(declare-const a Real)',
      '(declare-const b Real)',
      '(declare-const c Real)',
      '(assert (> a 0.0))',
      '(assert (< b 1.0))',
      '(assert (= c (+ a b)))',
      '(push 1)',
      '(check-sat)',
    ].join('\n');
    const cmds = parseSmtLib(src);
    expect(cmds).toHaveLength(10);
    const out1 = emitSmtLib(cmds);
    const cmds2 = parseSmtLib(out1);
    const out2 = emitSmtLib(cmds2);
    expect(out2).toBe(out1);
  });

  it('round-trip: programa con bit-vectors', () => {
    const src = [
      '(set-logic QF_BV)',
      '(declare-const x (_ BitVec 8))',
      '(assert (= x #xFF))',
      '(check-sat)',
    ].join('\n');
    const cmds = parseSmtLib(src);
    const out1 = emitSmtLib(cmds);
    const out2 = emitSmtLib(parseSmtLib(out1));
    expect(out2).toBe(out1);
  });

  it('round-trip: ignora comentarios y whitespace variable', () => {
    const src = `
      ; inicio del programa
      (set-logic   QF_UF)
      (declare-sort   A   0)
      (declare-fun  f  (A)  A)
      (assert (= (f (f (f x))) x))   ; un ciclo de orden 3
      (check-sat)
    `;
    const out1 = emitSmtLib(parseSmtLib(src));
    const out2 = emitSmtLib(parseSmtLib(out1));
    expect(out2).toBe(out1);
    expect(out1).toContain('(declare-sort A 0)');
    expect(out1).not.toContain(';');
  });

  it('round-trip: símbolos pipe-quoted preservados', () => {
    const src = '(declare-const |x con espacios| Real)';
    const out1 = emitSmtLib(parseSmtLib(src));
    expect(out1).toBe('(declare-const |x con espacios| Real)');
    const out2 = emitSmtLib(parseSmtLib(out1));
    expect(out2).toBe(out1);
  });

  it('round-trip: set-info y set-option con valores', () => {
    const src = '(set-info :status sat)(set-option :produce-models true)';
    const out1 = emitSmtLib(parseSmtLib(src));
    expect(out1).toContain('(set-info :status sat)');
    expect(out1).toContain('(set-option :produce-models true)');
  });
});
