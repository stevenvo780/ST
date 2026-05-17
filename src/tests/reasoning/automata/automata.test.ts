// ============================================================
// ST Automata — Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  dfaAccepts,
  dfaComplement,
  dfaContainsAB,
  dfaEvenZeros,
  dfaIntersection,
  dfaMinimize,
  dfaUnion,
  epsilonClosure,
  nfaAccepts,
  nfaToDfa,
  parseRegex,
  pdaAccepts,
  pdaBalancedParens,
  pdaPalindromes,
  regexEmail,
  regexMatches,
  regexToNfa,
  type DFA,
  type NFA,
  type Symbol,
} from '../../../reasoning/automata';
import { EPSILON } from '../../../reasoning/automata';

// ── DFA ──────────────────────────────────────────────────────

describe('DFA: dfaEvenZeros', () => {
  const M = dfaEvenZeros();
  it('acepta "" (0 ceros)', () => {
    expect(dfaAccepts(M, '')).toBe(true);
  });
  it('acepta "0011" (dos ceros)', () => {
    expect(dfaAccepts(M, '0011')).toBe(true);
  });
  it('rechaza "0" (un cero)', () => {
    expect(dfaAccepts(M, '0')).toBe(false);
  });
  it('rechaza "10001" (tres ceros)', () => {
    expect(dfaAccepts(M, '10001')).toBe(false);
  });
});

describe('DFA: dfaContainsAB', () => {
  const M = dfaContainsAB();
  it('acepta "cabc"', () => {
    expect(dfaAccepts(M, 'cabc')).toBe(true);
  });
  it('acepta "ab"', () => {
    expect(dfaAccepts(M, 'ab')).toBe(true);
  });
  it('rechaza "ba"', () => {
    expect(dfaAccepts(M, 'ba')).toBe(false);
  });
  it('rechaza ""', () => {
    expect(dfaAccepts(M, '')).toBe(false);
  });
});

describe('DFA: minimización preserva lenguaje', () => {
  // DFA con estados redundantes: clones del aceptante.
  const M: DFA = {
    states: new Set(['s0', 's1', 's2', 's3']),
    alphabet: new Set<Symbol>(['a']),
    transitions: new Map<string, Map<Symbol, string>>([
      ['s0', new Map([['a', 's1']])],
      ['s1', new Map([['a', 's2']])],
      ['s2', new Map([['a', 's3']])],
      ['s3', new Map([['a', 's1']])],
    ]),
    initial: 's0',
    accept: new Set(['s1', 's2', 's3']),
  };
  const min = dfaMinimize(M);

  it('minimizado tiene ≤ estados que el original', () => {
    expect(min.states.size).toBeLessThanOrEqual(M.states.size);
  });

  it('acepta los mismos strings (sample)', () => {
    const samples = ['', 'a', 'aa', 'aaa', 'aaaa', 'aaaaa'];
    for (const s of samples) {
      expect(dfaAccepts(min, s)).toBe(dfaAccepts(M, s));
    }
  });
});

describe('DFA: dfaComplement', () => {
  const M = dfaEvenZeros();
  const compl = dfaComplement(M);
  it('complement acepta sii M rechaza', () => {
    const samples = ['', '0', '1', '00', '01', '10', '11', '000', '0011'];
    for (const s of samples) {
      expect(dfaAccepts(compl, s)).toBe(!dfaAccepts(M, s));
    }
  });
});

describe('DFA: union / intersection', () => {
  // dfaEvenZeros y dfaContainsAB usan alfabetos distintos; los DFAs
  // sólo son comparables cuando coincide el alfabeto. Definimos dos
  // DFAs sobre el mismo alfabeto {a, b}:
  const evenAs: DFA = {
    states: new Set(['even', 'odd']),
    alphabet: new Set<Symbol>(['a', 'b']),
    transitions: new Map<string, Map<Symbol, string>>([
      [
        'even',
        new Map([
          ['a', 'odd'],
          ['b', 'even'],
        ]),
      ],
      [
        'odd',
        new Map([
          ['a', 'even'],
          ['b', 'odd'],
        ]),
      ],
    ]),
    initial: 'even',
    accept: new Set(['even']),
  };
  const containsAA: DFA = {
    states: new Set(['q0', 'q1', 'q2']),
    alphabet: new Set<Symbol>(['a', 'b']),
    transitions: new Map<string, Map<Symbol, string>>([
      [
        'q0',
        new Map([
          ['a', 'q1'],
          ['b', 'q0'],
        ]),
      ],
      [
        'q1',
        new Map([
          ['a', 'q2'],
          ['b', 'q0'],
        ]),
      ],
      [
        'q2',
        new Map([
          ['a', 'q2'],
          ['b', 'q2'],
        ]),
      ],
    ]),
    initial: 'q0',
    accept: new Set(['q2']),
  };
  const U = dfaUnion(evenAs, containsAA);
  const I = dfaIntersection(evenAs, containsAA);

  it('union sigue L(A) ∪ L(B)', () => {
    const samples = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aab', 'aba', 'bba', 'bab'];
    for (const s of samples) {
      const expected = dfaAccepts(evenAs, s) || dfaAccepts(containsAA, s);
      expect(dfaAccepts(U, s)).toBe(expected);
    }
  });

  it('intersection sigue L(A) ∩ L(B)', () => {
    const samples = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aab', 'aba', 'bba', 'bab', 'baab'];
    for (const s of samples) {
      const expected = dfaAccepts(evenAs, s) && dfaAccepts(containsAA, s);
      expect(dfaAccepts(I, s)).toBe(expected);
    }
  });
});

// ── NFA ──────────────────────────────────────────────────────

describe('NFA: epsilonClosure', () => {
  // Triángulo: s0 -ε-> s1 -ε-> s2, sin más aristas.
  const M: NFA = {
    states: new Set(['s0', 's1', 's2']),
    alphabet: new Set<Symbol>(['a']),
    transitions: new Map<string, Map<Symbol, Set<string>>>([
      ['s0', new Map([[EPSILON, new Set(['s1'])]])],
      ['s1', new Map([[EPSILON, new Set(['s2'])]])],
    ]),
    initial: 's0',
    accept: new Set(['s2']),
  };
  it('cierra transitivamente', () => {
    const c = epsilonClosure(M, new Set(['s0']));
    expect(c.has('s0')).toBe(true);
    expect(c.has('s1')).toBe(true);
    expect(c.has('s2')).toBe(true);
  });
});

describe('NFA → DFA (subset construction)', () => {
  // NFA: acepta strings sobre {0,1} cuyo penúltimo carácter es 1.
  const M: NFA = {
    states: new Set(['q0', 'q1', 'q2']),
    alphabet: new Set<Symbol>(['0', '1']),
    transitions: new Map<string, Map<Symbol, Set<string>>>([
      [
        'q0',
        new Map<Symbol, Set<string>>([
          ['0', new Set(['q0'])],
          ['1', new Set(['q0', 'q1'])],
        ]),
      ],
      [
        'q1',
        new Map<Symbol, Set<string>>([
          ['0', new Set(['q2'])],
          ['1', new Set(['q2'])],
        ]),
      ],
    ]),
    initial: 'q0',
    accept: new Set(['q2']),
  };
  const D = nfaToDfa(M);
  const samples = ['', '0', '1', '10', '11', '01', '00', '110', '011', '101', '111'];
  it('NFA y DFA aceptan los mismos strings', () => {
    for (const s of samples) {
      expect(dfaAccepts(D, s)).toBe(nfaAccepts(M, s));
    }
  });
});

// ── Regex (Thompson) ─────────────────────────────────────────

describe('Regex Thompson: a*b', () => {
  const r = parseRegex('a*b');
  it('acepta "b"', () => {
    expect(regexMatches(r, 'b')).toBe(true);
  });
  it('acepta "ab"', () => {
    expect(regexMatches(r, 'ab')).toBe(true);
  });
  it('acepta "aab"', () => {
    expect(regexMatches(r, 'aab')).toBe(true);
  });
  it('rechaza "a"', () => {
    expect(regexMatches(r, 'a')).toBe(false);
  });
  it('rechaza ""', () => {
    expect(regexMatches(r, '')).toBe(false);
  });
});

describe('Regex Thompson: (a|b)*c', () => {
  const r = parseRegex('(a|b)*c');
  it('acepta "c"', () => {
    expect(regexMatches(r, 'c')).toBe(true);
  });
  it('acepta "abc"', () => {
    expect(regexMatches(r, 'abc')).toBe(true);
  });
  it('acepta "ababbac"', () => {
    expect(regexMatches(r, 'ababbac')).toBe(true);
  });
  it('rechaza "abd"', () => {
    expect(regexMatches(r, 'abd')).toBe(false);
  });
  it('rechaza ""', () => {
    expect(regexMatches(r, '')).toBe(false);
  });
});

describe('Regex Thompson: cuantificadores + y ?', () => {
  it('a+ acepta "a", "aa", rechaza ""', () => {
    const r = parseRegex('a+');
    expect(regexMatches(r, 'a')).toBe(true);
    expect(regexMatches(r, 'aa')).toBe(true);
    expect(regexMatches(r, '')).toBe(false);
  });
  it('a?b acepta "b" y "ab", rechaza "aab"', () => {
    const r = parseRegex('a?b');
    expect(regexMatches(r, 'b')).toBe(true);
    expect(regexMatches(r, 'ab')).toBe(true);
    expect(regexMatches(r, 'aab')).toBe(false);
  });
});

describe('Regex Thompson: NFA → DFA → simulate', () => {
  const r = parseRegex('a*(b|c)');
  const nfa = regexToNfa(r);
  const dfa = nfaToDfa(nfa);
  const samples = ['b', 'c', 'ab', 'ac', 'aab', 'aac', '', 'a', 'd', 'abc'];
  it('NFA y subset-construction DFA aceptan lo mismo', () => {
    for (const s of samples) {
      expect(dfaAccepts(dfa, s)).toBe(nfaAccepts(nfa, s));
    }
  });
});

describe('Regex email simplificada', () => {
  const r = regexEmail();
  it('acepta "abc@dom.io"', () => {
    expect(regexMatches(r, 'abc@dom.io')).toBe(true);
  });
  it('rechaza "abcdom.io" (sin @)', () => {
    expect(regexMatches(r, 'abcdom.io')).toBe(false);
  });
  it('rechaza "abc@" (incompleta)', () => {
    expect(regexMatches(r, 'abc@')).toBe(false);
  });
});

// ── PDA ──────────────────────────────────────────────────────

describe('PDA: palíndromes', () => {
  const M = pdaPalindromes(['a', 'b']);
  it('acepta "aba"', () => {
    expect(pdaAccepts(M, 'aba')).toBe(true);
  });
  it('acepta "abba"', () => {
    expect(pdaAccepts(M, 'abba')).toBe(true);
  });
  it('acepta ""', () => {
    expect(pdaAccepts(M, '')).toBe(true);
  });
  it('rechaza "abc" (fuera de alfabeto)', () => {
    expect(pdaAccepts(M, 'abc')).toBe(false);
  });
  it('rechaza "ab"', () => {
    expect(pdaAccepts(M, 'ab')).toBe(false);
  });
});

describe('PDA: paréntesis balanceados', () => {
  const M = pdaBalancedParens();
  it('acepta "(())"', () => {
    expect(pdaAccepts(M, '(())')).toBe(true);
  });
  it('acepta "()()"', () => {
    expect(pdaAccepts(M, '()()')).toBe(true);
  });
  it('acepta ""', () => {
    expect(pdaAccepts(M, '')).toBe(true);
  });
  it('rechaza "(()"', () => {
    expect(pdaAccepts(M, '(()')).toBe(false);
  });
  it('rechaza ")(" ', () => {
    expect(pdaAccepts(M, ')(')).toBe(false);
  });
});
