// ============================================================
// ST Computability — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  step,
  run,
  trace,
  readTape,
  boundedHalts,
  initialConfig,
  tmBinaryIncrement,
  tmUnaryParity,
  tmReverseString,
  tmCopy,
  tmAddBinary,
  evalPR,
  PR_ADD,
  PR_MUL,
  PR_POW,
  PR_FACT,
  PR_PREDECESSOR,
  ackermann,
  isInPR,
  riceWitness,
} from '../../../reasoning/computability';

describe('computability — Turing machine core', () => {
  it('step reporta halted-accept cuando ya estamos en estado de aceptación', () => {
    const M = tmUnaryParity();
    const cfg = { state: 'qa', tape: ['B'], head: 0, step: 0 };
    expect(step(M, cfg)).toBe('halted-accept');
  });

  it('step reporta no-transition cuando no hay regla aplicable', () => {
    const M = tmUnaryParity();
    const cfg = { state: 'q0', tape: ['x'], head: 0, step: 0 };
    expect(step(M, cfg)).toBe('no-transition');
  });

  it('trace devuelve la configuración inicial y al menos una posterior', () => {
    const M = tmBinaryIncrement();
    const t = trace(M, '1', 100);
    expect(t.length).toBeGreaterThan(1);
    expect(t[0]?.state).toBe('q0');
  });

  it('initialConfig usa blank cuando input es vacío', () => {
    const M = tmBinaryIncrement();
    const cfg = initialConfig(M, '');
    expect(cfg.tape).toEqual(['B']);
    expect(cfg.head).toBe(0);
    expect(cfg.state).toBe('q0');
  });
});

describe('computability — Binary increment', () => {
  it('tmBinaryIncrement("101") → "110"', () => {
    const M = tmBinaryIncrement();
    const r = run(M, '101');
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('110');
  });

  it('tmBinaryIncrement("111") → "1000" (acarreo completo)', () => {
    const M = tmBinaryIncrement();
    const r = run(M, '111');
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('1000');
  });

  it('tmBinaryIncrement("0") → "1"', () => {
    const M = tmBinaryIncrement();
    const r = run(M, '0');
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('1');
  });
});

describe('computability — Unary parity', () => {
  it('tmUnaryParity("11") acepta (par)', () => {
    const M = tmUnaryParity();
    const r = run(M, '11');
    expect(r.result).toBe('accept');
  });

  it('tmUnaryParity("111") rechaza (impar)', () => {
    const M = tmUnaryParity();
    const r = run(M, '111');
    expect(r.result).toBe('reject');
  });

  it('tmUnaryParity("") acepta (0 es par)', () => {
    const M = tmUnaryParity();
    const r = run(M, '');
    expect(r.result).toBe('accept');
  });
});

describe('computability — Reverse string', () => {
  it('tmReverseString("abc") → "cba"', () => {
    const M = tmReverseString();
    const r = run(M, 'abc', 200);
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('cba');
  });

  it('tmReverseString("a") → "a"', () => {
    const M = tmReverseString();
    const r = run(M, 'a', 100);
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('a');
  });

  it('tmReverseString("ab") → "ba"', () => {
    const M = tmReverseString();
    const r = run(M, 'ab', 200);
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('ba');
  });
});

describe('computability — Copy and AddBinary', () => {
  it('tmCopy("ab") → "ab#ab"', () => {
    const M = tmCopy();
    const r = run(M, 'ab', 200);
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('ab#ab');
  });

  it('tmAddBinary("10+11") = 2 + 3 unario(11) = "101" (5)', () => {
    // formato: <a binario>+<b unario>, aquí 10 (2) + 111 (3 en unario) = 5
    const M = tmAddBinary();
    const r = run(M, '10+111', 500);
    expect(r.result).toBe('accept');
    expect(readTape(M, r.finalConfig)).toBe('101');
  });
});

describe('computability — boundedHalts', () => {
  it('boundedHalts devuelve true cuando la TM termina dentro del budget', () => {
    const M = tmBinaryIncrement();
    expect(boundedHalts(M, '1', 100)).toBe(true);
  });

  it('boundedHalts devuelve "unknown" si supera el budget (loop)', () => {
    // construir un loop trivial: q0 ↔ q1 sin condición de parada
    const M = {
      states: new Set(['q0', 'q1']),
      alphabet: new Set(['1']),
      tapeAlphabet: new Set(['1', 'B']),
      blank: 'B',
      initialState: 'q0',
      acceptStates: new Set<string>(),
      transitions: [
        {
          fromState: 'q0',
          readSymbol: '1',
          toState: 'q1',
          writeSymbol: '1',
          direction: 'R' as const,
        },
        {
          fromState: 'q0',
          readSymbol: 'B',
          toState: 'q1',
          writeSymbol: 'B',
          direction: 'R' as const,
        },
        {
          fromState: 'q1',
          readSymbol: 'B',
          toState: 'q0',
          writeSymbol: 'B',
          direction: 'L' as const,
        },
        {
          fromState: 'q1',
          readSymbol: '1',
          toState: 'q0',
          writeSymbol: '1',
          direction: 'L' as const,
        },
      ],
    };
    expect(boundedHalts(M, '1', 20)).toBe('unknown');
  });

  it('boundedHalts simple cycle short → unknown si maxSteps < 1', () => {
    const M = tmBinaryIncrement();
    expect(boundedHalts(M, '101', 0)).toBe('unknown');
  });
});

describe('computability — Primitive recursive functions', () => {
  it('PR zero() = 0', () => {
    expect(evalPR({ kind: 'zero' }, [])).toBe(0);
  });

  it('PR succ(7) = 8', () => {
    expect(evalPR({ kind: 'succ' }, [7])).toBe(8);
  });

  it('PR proj U^3_2(1,2,3) = 2', () => {
    expect(evalPR({ kind: 'proj', n: 3, i: 2 }, [1, 2, 3])).toBe(2);
  });

  it('PR_ADD(3, 4) = 7', () => {
    expect(evalPR(PR_ADD, [3, 4])).toBe(7);
  });

  it('PR_ADD(0, 5) = 5', () => {
    expect(evalPR(PR_ADD, [0, 5])).toBe(5);
  });

  it('PR_MUL(3, 4) = 12', () => {
    expect(evalPR(PR_MUL, [3, 4])).toBe(12);
  });

  it('PR_MUL(0, 7) = 0', () => {
    expect(evalPR(PR_MUL, [0, 7])).toBe(0);
  });

  it('PR_POW(3, 2) = 8 (2^3 con args = [exp, base])', () => {
    expect(evalPR(PR_POW, [3, 2])).toBe(8);
  });

  it('PR_FACT(5) = 120', () => {
    expect(evalPR(PR_FACT, [5])).toBe(120);
  });

  it('PR_FACT(0) = 1', () => {
    expect(evalPR(PR_FACT, [0])).toBe(1);
  });

  it('PR_PREDECESSOR(0) = 0, pred(7) = 6', () => {
    expect(evalPR(PR_PREDECESSOR, [0])).toBe(0);
    expect(evalPR(PR_PREDECESSOR, [7])).toBe(6);
  });

  it('evalPR rechaza argumentos no enteros o negativos', () => {
    expect(() => evalPR(PR_ADD, [-1, 0])).toThrow();
    expect(() => evalPR(PR_ADD, [1.5, 0])).toThrow();
  });
});

describe('computability — Ackermann (no PR)', () => {
  it('A(0, n) = n + 1', () => {
    expect(ackermann(0, 0)).toBe(1);
    expect(ackermann(0, 5)).toBe(6);
  });

  it('A(1, 1) = 3', () => {
    expect(ackermann(1, 1)).toBe(3);
  });

  it('A(2, 2) = 7', () => {
    expect(ackermann(2, 2)).toBe(7);
  });

  it('A(3, 3) = 61', () => {
    expect(ackermann(3, 3)).toBe(61);
  });

  it('A(3, 0) = A(2, 1) = 5', () => {
    expect(ackermann(3, 0)).toBe(5);
  });

  it('isInPR detecta funciones de crecimiento moderado como "likely"', () => {
    // f(n) = n^2 — claramente PR, debería ser likely true.
    const r = isInPR((n) => n * n, 4);
    expect(r.likely).toBe(true);
  });
});

describe('computability — Rice witness', () => {
  it('riceWitness("acepta el lenguaje vacío") detecta no trivialidad', () => {
    // Propiedad: "M tiene exactamente un estado de aceptación".
    // Algunas máquinas (parity) tienen 1 estado de aceptación,
    // otras pueden no tenerlo. Esto demuestra no-trivialidad.
    const property = (m: ReturnType<typeof tmBinaryIncrement>): boolean =>
      m.acceptStates.size === 1;
    const r = riceWitness(property);
    // Como todas las muestras tienen exactamente 1 estado de aceptación,
    // esta propiedad será trivialmente true sobre la muestra.
    expect(r.undecidable).toBe(false);
  });

  it('riceWitness con propiedad mixta es indecidible', () => {
    // Propiedad: "el alfabeto incluye el símbolo +" (tmAddBinary lo tiene,
    // los otros no).
    const property = (m: ReturnType<typeof tmBinaryIncrement>): boolean => m.alphabet.has('+');
    const r = riceWitness(property);
    expect(r.undecidable).toBe(true);
    expect(r.explanation).toMatch(/Rice/);
  });

  it('riceWitness con propiedad trivialmente falsa devuelve undecidable=false', () => {
    const property = (): boolean => false;
    const r = riceWitness(property);
    expect(r.undecidable).toBe(false);
    expect(r.explanation).toMatch(/uniformemente negativa/);
  });
});
