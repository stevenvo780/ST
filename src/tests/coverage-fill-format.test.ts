/**
 * Coverage fill — src/runtime/format.ts
 * Targets: formulaToUnicode, formulaToLaTeX, proofToLaTeX
 * Current coverage: ~52% stmts, ~43% branch
 */

import { describe, it, expect } from 'vitest';
import { formulaToUnicode, formulaToLaTeX, proofToLaTeX } from '../runtime/format';
import type { Formula } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const atom = (name: string): Formula => ({ kind: 'atom', name });
const not = (a: Formula): Formula => ({ kind: 'not', args: [a] });
const and = (a: Formula, b: Formula): Formula => ({ kind: 'and', args: [a, b] });
const or = (a: Formula, b: Formula): Formula => ({ kind: 'or', args: [a, b] });
const implies = (a: Formula, b: Formula): Formula => ({ kind: 'implies', args: [a, b] });
const bic = (a: Formula, b: Formula): Formula => ({ kind: 'biconditional', args: [a, b] });
const nand = (a: Formula, b: Formula): Formula => ({ kind: 'nand', args: [a, b] });
const nor = (a: Formula, b: Formula): Formula => ({ kind: 'nor', args: [a, b] });
const xor = (a: Formula, b: Formula): Formula => ({ kind: 'xor', args: [a, b] });
const box = (a: Formula): Formula => ({ kind: 'modal_necessity', args: [a] });
const dia = (a: Formula): Formula => ({ kind: 'modal_possibility', args: [a] });
const forall = (v: string, body: Formula): Formula => ({ kind: 'forall', variable: v, args: [body] });
const exists = (v: string, body: Formula): Formula => ({ kind: 'exists', variable: v, args: [body] });
const pred = (name: string, ...params: string[]): Formula => ({ kind: 'predicate', name, params });
const equals = (a: Formula, b: Formula): Formula => ({ kind: 'equals', args: [a, b] });
const next = (a: Formula): Formula => ({ kind: 'temporal_next', args: [a] });
const until = (a: Formula, b: Formula): Formula => ({ kind: 'temporal_until', args: [a, b] });
const num = (v: number): Formula => ({ kind: 'number', value: v });
const add = (a: Formula, b: Formula): Formula => ({ kind: 'add', args: [a, b] });
const sub = (a: Formula, b: Formula): Formula => ({ kind: 'subtract', args: [a, b] });
const mul = (a: Formula, b: Formula): Formula => ({ kind: 'multiply', args: [a, b] });
const div = (a: Formula, b: Formula): Formula => ({ kind: 'divide', args: [a, b] });
const mod = (a: Formula, b: Formula): Formula => ({ kind: 'modulo', args: [a, b] });
const less = (a: Formula, b: Formula): Formula => ({ kind: 'less', args: [a, b] });
const greater = (a: Formula, b: Formula): Formula => ({ kind: 'greater', args: [a, b] });
const lessEq = (a: Formula, b: Formula): Formula => ({ kind: 'less_eq', args: [a, b] });
const greaterEq = (a: Formula, b: Formula): Formula => ({ kind: 'greater_eq', args: [a, b] });
const fnCall = (name: string, ...args: Formula[]): Formula => ({ kind: 'fn_call', name, args });
const list = (...args: Formula[]): Formula => ({ kind: 'list', args });

// ── formulaToUnicode ─────────────────────────────────────────────────────────

describe('formulaToUnicode', () => {
  it('atom', () => {
    expect(formulaToUnicode(atom('P'))).toBe('P');
  });

  it('atom without name returns ?', () => {
    expect(formulaToUnicode({ kind: 'atom' })).toBe('?');
  });

  it('not atom (no parens)', () => {
    expect(formulaToUnicode(not(atom('P')))).toBe('¬P');
  });

  it('not complex (with parens)', () => {
    expect(formulaToUnicode(not(and(atom('P'), atom('Q'))))).toBe('¬((P ∧ Q))');
  });

  it('not without args', () => {
    expect(formulaToUnicode({ kind: 'not' })).toBe('¬?');
  });

  it('and two atoms', () => {
    expect(formulaToUnicode(and(atom('P'), atom('Q')))).toBe('(P ∧ Q)');
  });

  it('and without args returns fallback', () => {
    expect(formulaToUnicode({ kind: 'and' })).toBe('? ∧ ?');
  });

  it('nested and flattened associatively', () => {
    const nested = and(and(atom('A'), atom('B')), atom('C'));
    expect(formulaToUnicode(nested)).toBe('(A ∧ B ∧ C)');
  });

  it('or two atoms', () => {
    expect(formulaToUnicode(or(atom('P'), atom('Q')))).toBe('(P ∨ Q)');
  });

  it('or without args returns fallback', () => {
    expect(formulaToUnicode({ kind: 'or' })).toBe('? ∨ ?');
  });

  it('nested or flattened', () => {
    const nested = or(or(atom('A'), atom('B')), atom('C'));
    expect(formulaToUnicode(nested)).toBe('(A ∨ B ∨ C)');
  });

  it('implies', () => {
    expect(formulaToUnicode(implies(atom('P'), atom('Q')))).toBe('(P → Q)');
  });

  it('implies without args fallback', () => {
    expect(formulaToUnicode({ kind: 'implies' })).toBe('? → ?');
  });

  it('biconditional', () => {
    expect(formulaToUnicode(bic(atom('P'), atom('Q')))).toBe('(P ↔ Q)');
  });

  it('biconditional without args fallback', () => {
    expect(formulaToUnicode({ kind: 'biconditional' })).toBe('? ↔ ?');
  });

  it('nand', () => {
    expect(formulaToUnicode(nand(atom('P'), atom('Q')))).toBe('(P ↑ Q)');
  });

  it('nand without args fallback', () => {
    expect(formulaToUnicode({ kind: 'nand' })).toBe('? ↑ ?');
  });

  it('nor', () => {
    expect(formulaToUnicode(nor(atom('P'), atom('Q')))).toBe('(P ↓ Q)');
  });

  it('nor without args fallback', () => {
    expect(formulaToUnicode({ kind: 'nor' })).toBe('? ↓ ?');
  });

  it('xor', () => {
    expect(formulaToUnicode(xor(atom('P'), atom('Q')))).toBe('(P ⊕ Q)');
  });

  it('xor without args fallback', () => {
    expect(formulaToUnicode({ kind: 'xor' })).toBe('? ⊕ ?');
  });

  it('nested xor flattened', () => {
    const nested = xor(xor(atom('A'), atom('B')), atom('C'));
    expect(formulaToUnicode(nested)).toBe('(A ⊕ B ⊕ C)');
  });

  it('modal_necessity', () => {
    expect(formulaToUnicode(box(atom('P')))).toBe('□(P)');
  });

  it('modal_necessity without args', () => {
    expect(formulaToUnicode({ kind: 'modal_necessity' })).toBe('□?');
  });

  it('modal_possibility', () => {
    expect(formulaToUnicode(dia(atom('P')))).toBe('◇(P)');
  });

  it('modal_possibility without args', () => {
    expect(formulaToUnicode({ kind: 'modal_possibility' })).toBe('◇?');
  });

  it('forall', () => {
    expect(formulaToUnicode(forall('x', pred('P', 'x')))).toBe('∀x(P(x))');
  });

  it('forall without arg', () => {
    expect(formulaToUnicode({ kind: 'forall', variable: 'x' })).toBe('∀x(?)');
  });

  it('forall without variable', () => {
    expect(formulaToUnicode({ kind: 'forall', args: [atom('P')] })).toBe('∀?(P)');
  });

  it('exists', () => {
    expect(formulaToUnicode(exists('x', pred('P', 'x')))).toBe('∃x(P(x))');
  });

  it('exists without arg', () => {
    expect(formulaToUnicode({ kind: 'exists', variable: 'y' })).toBe('∃y(?)');
  });

  it('predicate with params', () => {
    expect(formulaToUnicode(pred('P', 'a', 'b'))).toBe('P(a, b)');
  });

  it('predicate without name', () => {
    expect(formulaToUnicode({ kind: 'predicate', params: ['x'] })).toBe('?(x)');
  });

  it('equals', () => {
    expect(formulaToUnicode(equals(atom('a'), atom('b')))).toBe('(a = b)');
  });

  it('equals without args fallback', () => {
    expect(formulaToUnicode({ kind: 'equals' })).toBe('? = ?');
  });

  it('temporal_next', () => {
    expect(formulaToUnicode(next(atom('P')))).toBe('X(P)');
  });

  it('temporal_next without arg', () => {
    expect(formulaToUnicode({ kind: 'temporal_next' })).toBe('X?');
  });

  it('temporal_until', () => {
    expect(formulaToUnicode(until(atom('P'), atom('Q')))).toBe('(P U Q)');
  });

  it('temporal_until without args fallback', () => {
    expect(formulaToUnicode({ kind: 'temporal_until' })).toBe('? U ?');
  });

  it('number', () => {
    expect(formulaToUnicode(num(42))).toBe('42');
  });

  it('number without value', () => {
    expect(formulaToUnicode({ kind: 'number' })).toBe('?');
  });

  it('add', () => {
    expect(formulaToUnicode(add(num(1), num(2)))).toBe('(1 + 2)');
  });

  it('add without args fallback', () => {
    expect(formulaToUnicode({ kind: 'add' })).toBe('? + ?');
  });

  it('subtract', () => {
    expect(formulaToUnicode(sub(num(5), num(3)))).toBe('(5 - 3)');
  });

  it('subtract without args fallback', () => {
    expect(formulaToUnicode({ kind: 'subtract' })).toBe('? - ?');
  });

  it('multiply', () => {
    expect(formulaToUnicode(mul(num(2), num(3)))).toBe('(2 × 3)');
  });

  it('multiply without args fallback', () => {
    expect(formulaToUnicode({ kind: 'multiply' })).toBe('? × ?');
  });

  it('divide', () => {
    expect(formulaToUnicode(div(num(6), num(2)))).toBe('(6 ÷ 2)');
  });

  it('divide without args fallback', () => {
    expect(formulaToUnicode({ kind: 'divide' })).toBe('? ÷ ?');
  });

  it('modulo', () => {
    expect(formulaToUnicode(mod(num(7), num(3)))).toBe('(7 % 3)');
  });

  it('modulo without args fallback', () => {
    expect(formulaToUnicode({ kind: 'modulo' })).toBe('? % ?');
  });

  it('less', () => {
    expect(formulaToUnicode(less(num(1), num(2)))).toBe('(1 < 2)');
  });

  it('less without args fallback', () => {
    expect(formulaToUnicode({ kind: 'less' })).toBe('? < ?');
  });

  it('greater', () => {
    expect(formulaToUnicode(greater(num(2), num(1)))).toBe('(2 > 1)');
  });

  it('greater without args fallback', () => {
    expect(formulaToUnicode({ kind: 'greater' })).toBe('? > ?');
  });

  it('less_eq', () => {
    expect(formulaToUnicode(lessEq(num(1), num(2)))).toBe('(1 ≤ 2)');
  });

  it('less_eq without args fallback', () => {
    expect(formulaToUnicode({ kind: 'less_eq' })).toBe('? ≤ ?');
  });

  it('greater_eq', () => {
    expect(formulaToUnicode(greaterEq(num(2), num(1)))).toBe('(2 ≥ 1)');
  });

  it('greater_eq without args fallback', () => {
    expect(formulaToUnicode({ kind: 'greater_eq' })).toBe('? ≥ ?');
  });

  it('fn_call', () => {
    expect(formulaToUnicode(fnCall('f', atom('x'), atom('y')))).toBe('f(x, y)');
  });

  it('fn_call without name', () => {
    expect(formulaToUnicode({ kind: 'fn_call', args: [atom('x')] })).toBe('?(x)');
  });

  it('list', () => {
    expect(formulaToUnicode(list(atom('A'), atom('B')))).toBe('[A, B]');
  });

  it('list empty', () => {
    expect(formulaToUnicode({ kind: 'list' })).toBe('[]');
  });

  it('unknown kind returns ?', () => {
    expect(formulaToUnicode({ kind: 'unknown_xyz' as any })).toBe('?');
  });
});

// ── formulaToLaTeX ────────────────────────────────────────────────────────────

describe('formulaToLaTeX', () => {
  it('atom', () => {
    expect(formulaToLaTeX(atom('P'))).toBe('P');
  });

  it('atom without name', () => {
    expect(formulaToLaTeX({ kind: 'atom' })).toBe('?');
  });

  it('not atom', () => {
    expect(formulaToLaTeX(not(atom('P')))).toBe('\\neg P');
  });

  it('not complex', () => {
    expect(formulaToLaTeX(not(and(atom('P'), atom('Q'))))).toContain('\\neg');
  });

  it('not without args', () => {
    expect(formulaToLaTeX({ kind: 'not' })).toBe('\\neg ?');
  });

  it('and', () => {
    expect(formulaToLaTeX(and(atom('P'), atom('Q')))).toBe('(P \\land Q)');
  });

  it('and without args', () => {
    expect(formulaToLaTeX({ kind: 'and' })).toBe('? \\land ?');
  });

  it('or', () => {
    expect(formulaToLaTeX(or(atom('P'), atom('Q')))).toBe('(P \\lor Q)');
  });

  it('or without args', () => {
    expect(formulaToLaTeX({ kind: 'or' })).toBe('? \\lor ?');
  });

  it('implies', () => {
    expect(formulaToLaTeX(implies(atom('P'), atom('Q')))).toBe('(P \\to Q)');
  });

  it('implies without args', () => {
    expect(formulaToLaTeX({ kind: 'implies' })).toBe('? \\to ?');
  });

  it('biconditional', () => {
    expect(formulaToLaTeX(bic(atom('P'), atom('Q')))).toBe('(P \\leftrightarrow Q)');
  });

  it('biconditional without args', () => {
    expect(formulaToLaTeX({ kind: 'biconditional' })).toBe('? \\leftrightarrow ?');
  });

  it('modal_necessity', () => {
    expect(formulaToLaTeX(box(atom('P')))).toBe('\\Box P');
  });

  it('modal_necessity without arg', () => {
    expect(formulaToLaTeX({ kind: 'modal_necessity' })).toBe('\\Box ?');
  });

  it('modal_possibility', () => {
    expect(formulaToLaTeX(dia(atom('P')))).toBe('\\Diamond P');
  });

  it('modal_possibility without arg', () => {
    expect(formulaToLaTeX({ kind: 'modal_possibility' })).toBe('\\Diamond ?');
  });

  it('forall', () => {
    expect(formulaToLaTeX(forall('x', pred('P', 'x')))).toBe('\\forall x\\,(P(x))');
  });

  it('forall without arg', () => {
    expect(formulaToLaTeX({ kind: 'forall', variable: 'x' })).toBe('\\forall x\\,?');
  });

  it('exists', () => {
    expect(formulaToLaTeX(exists('x', pred('P', 'x')))).toBe('\\exists x\\,(P(x))');
  });

  it('exists without arg', () => {
    expect(formulaToLaTeX({ kind: 'exists', variable: 'y' })).toBe('\\exists y\\,?');
  });

  it('predicate', () => {
    expect(formulaToLaTeX(pred('P', 'a', 'b'))).toBe('P(a, b)');
  });

  it('equals', () => {
    expect(formulaToLaTeX(equals(atom('a'), atom('b')))).toBe('(a = b)');
  });

  it('equals without args', () => {
    expect(formulaToLaTeX({ kind: 'equals' })).toBe('? = ?');
  });

  it('temporal_next', () => {
    expect(formulaToLaTeX(next(atom('P')))).toBe('\\mathsf{X}\\,(P)');
  });

  it('temporal_next without arg', () => {
    expect(formulaToLaTeX({ kind: 'temporal_next' })).toBe('\\mathsf{X}\\,?');
  });

  it('temporal_until', () => {
    expect(formulaToLaTeX(until(atom('P'), atom('Q')))).toBe('(P \\mathbin{\\mathsf{U}} Q)');
  });

  it('temporal_until without args', () => {
    expect(formulaToLaTeX({ kind: 'temporal_until' })).toBe('? \\mathbin{\\mathsf{U}} ?');
  });

  it('number', () => {
    expect(formulaToLaTeX(num(5))).toBe('5');
  });

  it('number without value', () => {
    expect(formulaToLaTeX({ kind: 'number' })).toBe('?');
  });

  it('add', () => {
    expect(formulaToLaTeX(add(num(1), num(2)))).toBe('(1 + 2)');
  });

  it('add without args', () => {
    expect(formulaToLaTeX({ kind: 'add' })).toBe('? + ?');
  });

  it('subtract', () => {
    expect(formulaToLaTeX(sub(num(3), num(1)))).toBe('(3 - 1)');
  });

  it('subtract without args', () => {
    expect(formulaToLaTeX({ kind: 'subtract' })).toBe('? - ?');
  });

  it('multiply', () => {
    expect(formulaToLaTeX(mul(num(2), num(4)))).toBe('(2 \\times 4)');
  });

  it('multiply without args', () => {
    expect(formulaToLaTeX({ kind: 'multiply' })).toBe('? \\times ?');
  });

  it('divide', () => {
    expect(formulaToLaTeX(div(num(6), num(3)))).toBe('\\frac{6}{3}');
  });

  it('divide without args', () => {
    expect(formulaToLaTeX({ kind: 'divide' })).toBe('\\frac{?}{?}');
  });

  it('modulo', () => {
    expect(formulaToLaTeX(mod(num(7), num(3)))).toBe('(7 \\bmod 3)');
  });

  it('modulo without args', () => {
    expect(formulaToLaTeX({ kind: 'modulo' })).toBe('? \\bmod ?');
  });

  it('less', () => {
    expect(formulaToLaTeX(less(num(1), num(2)))).toBe('(1 < 2)');
  });

  it('less without args', () => {
    expect(formulaToLaTeX({ kind: 'less' })).toBe('? < ?');
  });

  it('greater', () => {
    expect(formulaToLaTeX(greater(num(2), num(1)))).toBe('(2 > 1)');
  });

  it('greater without args', () => {
    expect(formulaToLaTeX({ kind: 'greater' })).toBe('? > ?');
  });

  it('less_eq', () => {
    expect(formulaToLaTeX(lessEq(num(1), num(2)))).toBe('(1 \\leq 2)');
  });

  it('less_eq without args', () => {
    expect(formulaToLaTeX({ kind: 'less_eq' })).toBe('? \\leq ?');
  });

  it('unknown kind', () => {
    expect(formulaToLaTeX({ kind: 'unknown_xyz' as any })).toBe('?');
  });

  it('list', () => {
    expect(formulaToLaTeX(list(atom('A'), atom('B')))).toBe('\\left[A, B\\right]');
  });
});

// ── proofToLaTeX ─────────────────────────────────────────────────────────────

describe('proofToLaTeX', () => {
  it('empty proof returns empty string', () => {
    expect(proofToLaTeX({ steps: [] })).toBe('');
  });

  it('proof without steps returns empty string', () => {
    expect(proofToLaTeX({} as any)).toBe('');
  });

  it('axiom step (0 premises) generates AxiomC', () => {
    const proof = {
      steps: [
        { formula: atom('P'), justification: 'Axiom', premises: [] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\AxiomC{$P$}');
    expect(latex).toContain('\\begin{prooftree}');
    expect(latex).toContain('\\end{prooftree}');
  });

  it('unary step (1 premise) generates UnaryInfC', () => {
    const proof = {
      steps: [
        { formula: atom('Q'), justification: 'MP', premises: [0] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\UnaryInfC{$Q$}');
    expect(latex).toContain('\\RightLabel{\\scriptsize MP}');
  });

  it('binary step (2 premises) generates BinaryInfC', () => {
    const proof = {
      steps: [
        { formula: atom('R'), justification: 'Conj', premises: [0, 1] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\BinaryInfC{$R$}');
    expect(latex).toContain('\\RightLabel{\\scriptsize Conj}');
  });

  it('ternary step (3 premises) generates TrinaryInfC', () => {
    const proof = {
      steps: [
        { formula: atom('S'), justification: 'Tri', premises: [0, 1, 2] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\TrinaryInfC{$S$}');
  });

  it('step with 4+ premises falls back to UnaryInfC with comment', () => {
    const proof = {
      steps: [
        { formula: atom('T'), justification: 'Multi', premises: [0, 1, 2, 3] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\UnaryInfC{$T$}');
    expect(latex).toContain('% 4 premises');
  });

  it('multi-step proof', () => {
    const proof = {
      steps: [
        { formula: atom('P'), justification: 'Hyp', premises: [] },
        { formula: implies(atom('P'), atom('Q')), justification: 'Hyp', premises: [] },
        { formula: atom('Q'), justification: 'MP', premises: [0, 1] },
      ],
    };
    const latex = proofToLaTeX(proof as any);
    expect(latex).toContain('\\AxiomC{$P$}');
    expect(latex).toContain('\\BinaryInfC{$Q$}');
  });
});
