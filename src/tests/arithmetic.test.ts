// ============================================================
// Tests — Arithmetic profile (logic arithmetic)
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { Parser } from '../parser/parser';
import { formulaToUnicode, formulaToLaTeX } from '../runtime/format';
import { evalNumeric } from '../profiles/arithmetic';
import { registry } from '../profiles/interface';
import type { Formula } from '../types';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source);
}

function parseFormula(source: string): Formula {
  const parser = new Parser('<test>');
  // Wrap in a logic + axiom to get the formula parsed
  const program = parser.parse(`logic arithmetic\naxiom A = ${source}`);
  expect(parser.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  const axiomStmt = program.statements.find((s) => s.kind === 'axiom_decl');
  expect(axiomStmt).toBeDefined();
  return (axiomStmt as unknown as { formula: Formula }).formula;
}

// ── Profile registration ─────────────────────────────────────

describe('arithmetic profile registration', () => {
  it('profile "arithmetic" is registered', () => {
    expect(registry.has('arithmetic')).toBe(true);
  });

  it('profile description is set', () => {
    const profile = registry.get('arithmetic');
    expect(profile).toBeDefined();
    expect(profile!.name).toBe('arithmetic');
  });
});

// ── Lexer / Parser: number literals ──────────────────────────

describe('arithmetic: number literals', () => {
  it('parses integer literal', () => {
    const f = parseFormula('42');
    expect(f.kind).toBe('number');
    expect(f.value).toBe(42);
  });

  it('parses decimal literal', () => {
    const f = parseFormula('3.14');
    expect(f.kind).toBe('number');
    expect(f.value).toBeCloseTo(3.14);
  });

  it('parses zero', () => {
    const f = parseFormula('0');
    expect(f.kind).toBe('number');
    expect(f.value).toBe(0);
  });
});

// ── Lexer / Parser: arithmetic operators ─────────────────────

describe('arithmetic: operators', () => {
  it('parses addition: 2 + 3', () => {
    const f = parseFormula('2 + 3');
    expect(f.kind).toBe('add');
    expect(f.args).toHaveLength(2);
    expect(f.args![0].kind).toBe('number');
    expect(f.args![0].value).toBe(2);
    expect(f.args![1].kind).toBe('number');
    expect(f.args![1].value).toBe(3);
  });

  it('parses subtraction: 10 - 4', () => {
    const f = parseFormula('10 - 4');
    expect(f.kind).toBe('subtract');
    expect(f.args![0].value).toBe(10);
    expect(f.args![1].value).toBe(4);
  });

  it('parses multiplication: 3 * 5', () => {
    const f = parseFormula('3 * 5');
    expect(f.kind).toBe('multiply');
  });

  it('parses division: 10 / 2', () => {
    const f = parseFormula('10 / 2');
    expect(f.kind).toBe('divide');
  });

  it('parses modulo: 10 % 3', () => {
    const f = parseFormula('10 % 3');
    expect(f.kind).toBe('modulo');
  });

  it('parses less than: 1 < 2', () => {
    const f = parseFormula('1 < 2');
    expect(f.kind).toBe('less');
  });

  it('parses greater than: 5 > 3', () => {
    const f = parseFormula('5 > 3');
    expect(f.kind).toBe('greater');
  });

  it('parses less or equal: 1 <= 2', () => {
    const f = parseFormula('1 <= 2');
    expect(f.kind).toBe('less_eq');
  });

  it('parses greater or equal: 5 >= 5', () => {
    const f = parseFormula('5 >= 5');
    expect(f.kind).toBe('greater_eq');
  });
});

// ── Precedence ───────────────────────────────────────────────

describe('arithmetic: operator precedence', () => {
  it('multiplication binds tighter than addition: 2 + 3 * 4', () => {
    const f = parseFormula('2 + 3 * 4');
    // Should be add(2, multiply(3, 4))
    expect(f.kind).toBe('add');
    expect(f.args![0].value).toBe(2);
    expect(f.args![1].kind).toBe('multiply');
    expect(f.args![1].args![0].value).toBe(3);
    expect(f.args![1].args![1].value).toBe(4);
  });

  it('comparison binds looser than addition: 2 + 3 < 10', () => {
    const f = parseFormula('2 + 3 < 10');
    // Should be less(add(2, 3), 10)
    expect(f.kind).toBe('less');
    expect(f.args![0].kind).toBe('add');
    expect(f.args![1].value).toBe(10);
  });

  it('parentheses override precedence: (2 + 3) * 4', () => {
    const f = parseFormula('(2 + 3) * 4');
    expect(f.kind).toBe('multiply');
    expect(f.args![0].kind).toBe('add');
    expect(f.args![1].value).toBe(4);
  });

  it('unary minus: -5', () => {
    const f = parseFormula('-5');
    // Represented as subtract(0, 5)
    expect(f.kind).toBe('subtract');
    expect(f.args![0].kind).toBe('number');
    expect(f.args![0].value).toBe(0);
    expect(f.args![1].kind).toBe('number');
    expect(f.args![1].value).toBe(5);
  });

  it('unary minus with expression: -(3 + 2)', () => {
    const f = parseFormula('-(3 + 2)');
    expect(f.kind).toBe('subtract');
    expect(f.args![0].value).toBe(0);
    expect(f.args![1].kind).toBe('add');
  });
});

// ── evalNumeric ──────────────────────────────────────────────

describe('arithmetic: evalNumeric', () => {
  it('evaluates number literal', () => {
    expect(evalNumeric({ kind: 'number', value: 42 })).toBe(42);
  });

  it('evaluates addition', () => {
    const f: Formula = {
      kind: 'add',
      args: [
        { kind: 'number', value: 2 },
        { kind: 'number', value: 3 },
      ],
    };
    expect(evalNumeric(f)).toBe(5);
  });

  it('evaluates subtraction', () => {
    const f: Formula = {
      kind: 'subtract',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 4 },
      ],
    };
    expect(evalNumeric(f)).toBe(6);
  });

  it('evaluates multiplication', () => {
    const f: Formula = {
      kind: 'multiply',
      args: [
        { kind: 'number', value: 3 },
        { kind: 'number', value: 5 },
      ],
    };
    expect(evalNumeric(f)).toBe(15);
  });

  it('evaluates division', () => {
    const f: Formula = {
      kind: 'divide',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(evalNumeric(f)).toBe(5);
  });

  it('evaluates modulo', () => {
    const f: Formula = {
      kind: 'modulo',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 3 },
      ],
    };
    expect(evalNumeric(f)).toBe(1);
  });

  it('evaluates division by zero as NaN', () => {
    const f: Formula = {
      kind: 'divide',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 0 },
      ],
    };
    expect(evalNumeric(f)).toBeNaN();
  });

  it('evaluates comparison: less', () => {
    const f: Formula = {
      kind: 'less',
      args: [
        { kind: 'number', value: 1 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(evalNumeric(f)).toBe(1); // true
  });

  it('evaluates comparison: greater (false)', () => {
    const f: Formula = {
      kind: 'greater',
      args: [
        { kind: 'number', value: 1 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(evalNumeric(f)).toBe(0); // false
  });

  it('evaluates nested expression: (2 + 3) * 4 = 20', () => {
    const f: Formula = {
      kind: 'multiply',
      args: [
        {
          kind: 'add',
          args: [
            { kind: 'number', value: 2 },
            { kind: 'number', value: 3 },
          ],
        },
        { kind: 'number', value: 4 },
      ],
    };
    expect(evalNumeric(f)).toBe(20);
  });

  it('evaluates with variables', () => {
    const f: Formula = {
      kind: 'add',
      args: [
        { kind: 'atom', name: 'x' },
        { kind: 'number', value: 3 },
      ],
    };
    const vars = new Map([['x', 10]]);
    expect(evalNumeric(f, vars)).toBe(13);
  });

  it('unknown variable returns NaN', () => {
    const f: Formula = {
      kind: 'add',
      args: [
        { kind: 'atom', name: 'x' },
        { kind: 'number', value: 3 },
      ],
    };
    expect(evalNumeric(f)).toBeNaN();
  });
});

// ── Format: Unicode & LaTeX ──────────────────────────────────

describe('arithmetic: formatting', () => {
  it('number literal Unicode', () => {
    expect(formulaToUnicode({ kind: 'number', value: 42 })).toBe('42');
  });

  it('number literal LaTeX', () => {
    expect(formulaToLaTeX({ kind: 'number', value: 3.14 })).toBe('3.14');
  });

  it('addition Unicode', () => {
    const f: Formula = {
      kind: 'add',
      args: [
        { kind: 'number', value: 2 },
        { kind: 'number', value: 3 },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(2 + 3)');
  });

  it('multiplication Unicode uses ×', () => {
    const f: Formula = {
      kind: 'multiply',
      args: [
        { kind: 'number', value: 2 },
        { kind: 'number', value: 3 },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(2 × 3)');
  });

  it('division Unicode uses ÷', () => {
    const f: Formula = {
      kind: 'divide',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(10 ÷ 2)');
  });

  it('less_eq Unicode uses ≤', () => {
    const f: Formula = {
      kind: 'less_eq',
      args: [
        { kind: 'number', value: 1 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(1 ≤ 2)');
  });

  it('greater_eq Unicode uses ≥', () => {
    const f: Formula = {
      kind: 'greater_eq',
      args: [
        { kind: 'number', value: 5 },
        { kind: 'number', value: 5 },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(5 ≥ 5)');
  });

  it('division LaTeX uses \\frac', () => {
    const f: Formula = {
      kind: 'divide',
      args: [
        { kind: 'number', value: 10 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(formulaToLaTeX(f)).toBe('\\frac{10}{2}');
  });

  it('multiplication LaTeX uses \\times', () => {
    const f: Formula = {
      kind: 'multiply',
      args: [
        { kind: 'number', value: 2 },
        { kind: 'number', value: 3 },
      ],
    };
    expect(formulaToLaTeX(f)).toBe('(2 \\times 3)');
  });

  it('less_eq LaTeX uses \\leq', () => {
    const f: Formula = {
      kind: 'less_eq',
      args: [
        { kind: 'number', value: 1 },
        { kind: 'number', value: 2 },
      ],
    };
    expect(formulaToLaTeX(f)).toBe('(1 \\leq 2)');
  });
});

// ── Full interpreter integration ─────────────────────────────

describe('arithmetic: interpreter integration', () => {
  it('logic arithmetic loads successfully', () => {
    const out = run('logic arithmetic');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('arithmetic');
  });

  it('axiom with number literal', () => {
    const out = run(`logic arithmetic\naxiom N = 42`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('42');
  });

  it('axiom with arithmetic expression', () => {
    const out = run(`logic arithmetic\naxiom Expr = 2 + 3 * 4`);
    expect(out.exitCode).toBe(0);
  });

  it('check valid: 3 < 5 is valid (true comparison)', () => {
    const out = run(`logic arithmetic\ncheck valid 3 < 5`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('valid');
  });

  it('check valid: 5 < 3 is invalid (false comparison)', () => {
    const out = run(`logic arithmetic\ncheck valid 5 < 3`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('falso');
  });

  it('check valid: 5 >= 5 is valid', () => {
    const out = run(`logic arithmetic\ncheck valid 5 >= 5`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('valid');
  });

  it('check valid: 5 <= 4 is invalid', () => {
    const out = run(`logic arithmetic\ncheck valid 5 <= 4`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('falso');
  });

  it('check satisfiable: 2 + 2 > 3 is satisfiable', () => {
    const out = run(`logic arithmetic\ncheck satisfiable 2 + 2 > 3`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('satisfiable');
  });

  it('explain: provides numeric result for pure arithmetic', () => {
    const out = run(`logic arithmetic\nexplain 2 + 3`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('5');
  });

  it('explain: comparison result', () => {
    const out = run(`logic arithmetic\nexplain 10 > 5`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('verdadero');
  });

  it('print with arithmetic formula', () => {
    const out = run(`logic arithmetic\nprint 2 + 3`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('(2 + 3)');
  });

  it('let with arithmetic and print', () => {
    const out = run(`logic arithmetic\nlet X = 2 + 3\nprint X`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('(2 + 3)');
  });

  it('set with arithmetic expression', () => {
    const out = run(`logic arithmetic\nlet X = 1\nset X = 2 * 5\nprint X`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('(2 × 5)');
  });

  it('checkWellFormed warns on division by zero literal', () => {
    const out = run(`logic arithmetic\naxiom D = 10 / 0`);
    const warnings = out.diagnostics.filter((d) => d.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.message.includes('División por cero'))).toBe(true);
  });

  it('mixed arithmetic and logic: arithmetic within logical connective', () => {
    // This tests that arithmetic can coexist with logical connectives
    const out = run(`logic arithmetic\naxiom A = (1 < 2) & (3 > 1)`);
    expect(out.exitCode).toBe(0);
  });

  it('countermodel: false arithmetic comparison', () => {
    const out = run(`logic arithmetic\ncountermodel 5 < 3`);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Contramodelo trivial');
  });

  it('countermodel: true arithmetic — no countermodel', () => {
    const out = run(`logic arithmetic\ncountermodel 3 < 5`);
    expect(out.exitCode).toBe(0);
  });
});

// ── Unicode / special operators ──────────────────────────────

describe('arithmetic: unicode operators', () => {
  it('parses ≤ as LTE', () => {
    const f = parseFormula('3 ≤ 5');
    expect(f.kind).toBe('less_eq');
  });

  it('parses ≥ as GTE', () => {
    const f = parseFormula('5 ≥ 3');
    expect(f.kind).toBe('greater_eq');
  });
});

// ── Edge cases ───────────────────────────────────────────────

describe('arithmetic: edge cases', () => {
  it('double negation: --5 is subtract(0, subtract(0, 5))', () => {
    const f = parseFormula('--5');
    expect(f.kind).toBe('subtract');
    expect(f.args![0].value).toBe(0);
    expect(f.args![1].kind).toBe('subtract');
  });

  it('complex expression: (10 - 3) * 2 + 1', () => {
    const f = parseFormula('(10 - 3) * 2 + 1');
    expect(f.kind).toBe('add');
    expect(f.args![0].kind).toBe('multiply');
    expect(f.args![1].value).toBe(1);
  });

  it('arithmetic and logical operators together: (x + y) & P is valid parse', () => {
    const out = run(`logic arithmetic\naxiom T = (1 + 2) & P`);
    expect(out.exitCode).toBe(0);
  });
});
