// ============================================================
// Tests v1.0 — Spanish keywords, analyze, explain, format
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { Parser } from '../parser/parser';
import { formulaToUnicode, formulaToLaTeX } from '../runtime/format';
import { detectFallacies } from '../runtime/fallacies';
import { registry } from '../profiles/interface';
import type { Formula } from '../types';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source);
}

function parseOk(source: string) {
  const parser = new Parser('<test>');
  const program = parser.parse(source);
  expect(parser.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
  return program;
}

// ── 1. Keywords en español ───────────────────────────────────

describe('Spanish keyword aliases', () => {
  it('axioma / teorema parse correctly', () => {
    const prog = parseOk('logic classical.propositional\naxioma A1 : P -> Q');
    expect(prog.statements).toHaveLength(2);
    expect(prog.statements[1].kind).toBe('axiom_decl');
  });

  it('verificar valido = check valid', () => {
    const out = run('logic classical.propositional\nverificar valido (P -> P)');
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('verificar satisfacible = check satisfiable', () => {
    const out = run('logic classical.propositional\nverificar satisfacible P');
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('satisfiable');
  });

  it('derivar ... desde = derive ... from', () => {
    const out = run(
      'logic classical.propositional\n' +
        'axioma A1 : P -> Q\n' +
        'axioma A2 : P\n' +
        'derivar Q desde {A1, A2}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('provable');
  });

  it('probar ... desde = prove ... from', () => {
    const out = run(
      'logic classical.propositional\n' + 'axioma A1 : P -> P\n' + 'probar (P -> P) desde {A1}',
    );
    expect(out.exitCode).toBe(0);
  });

  it('contramodelo works in Spanish', () => {
    const out = run('logic classical.propositional\ncontramodelo P');
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('invalid');
  });

  it('tabla_verdad works in Spanish', () => {
    const out = run('logic classical.propositional\ntabla_verdad (P -> Q)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('T');
  });

  it('explicar = explain', () => {
    const out = run('logic classical.propositional\nexplicar (P -> P)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout.length).toBeGreaterThan(0);
  });

  it('analizar = analyze', () => {
    const out = run('logic classical.propositional\nanalizar {P, P -> Q} -> Q');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('analyze');
  });

  it('paratodo = forall', () => {
    const prog = parseOk('logic classical.first_order\nverificar valido paratodo x (P(x) -> P(x))');
    expect(prog.statements).toHaveLength(2);
  });

  it('existe = exists', () => {
    const prog = parseOk(
      'logic classical.first_order\nverificar valido (existe x P(x) -> existe x P(x))',
    );
    expect(prog.statements).toHaveLength(2);
  });
});

// ── 2. Explain command ───────────────────────────────────────

describe('explain command', () => {
  it('explains a propositional formula', () => {
    const out = run('logic classical.propositional\nexplain (P & !P)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Formula');
  });

  it('explains a modal formula', () => {
    const out = run('logic modal.k\nexplain [](P -> P)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('modal.k');
  });

  it('explains a deontic formula', () => {
    const out = run('logic deontic.standard\nexplain [](P -> <>P)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout.length).toBeGreaterThan(0);
  });

  it('explains an epistemic formula', () => {
    const out = run('logic epistemic.s5\nexplain [](P -> P)');
    expect(out.exitCode).toBe(0);
  });

  it('explain produces a RunResult', () => {
    const out = run('logic classical.propositional\nexplain (P -> P)');
    expect(out.results).toHaveLength(1);
    expect(out.results[0].output).toBeTruthy();
  });
});

// ── 3. Analyze command — fallacy detection ───────────────────

describe('analyze command', () => {
  it('reports valid modus ponens', () => {
    const out = run('logic classical.propositional\nanalyze {P, P -> Q} -> Q');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('VÁLIDA');
  });

  it('reports invalid inference', () => {
    const out = run('logic classical.propositional\nanalyze {P} -> Q');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('NO VÁLIDA');
  });

  it('detects affirming the consequent', () => {
    // (P->Q), Q ⊬ P
    const P: Formula = { kind: 'atom', name: 'P' };
    const Q: Formula = { kind: 'atom', name: 'Q' };
    const impl: Formula = { kind: 'implies', args: [P, Q] };
    const profile = registry.get('classical.propositional')!;
    const fallacies = detectFallacies([impl, Q], P, profile);
    expect(fallacies.length).toBeGreaterThanOrEqual(1);
    expect(fallacies[0].name).toBe('Afirmación del consecuente');
  });

  it('detects denying the antecedent', () => {
    // (P->Q), ¬P ⊬ ¬Q
    const P: Formula = { kind: 'atom', name: 'P' };
    const Q: Formula = { kind: 'atom', name: 'Q' };
    const impl: Formula = { kind: 'implies', args: [P, Q] };
    const notP: Formula = { kind: 'not', args: [P] };
    const notQ: Formula = { kind: 'not', args: [Q] };
    const profile = registry.get('classical.propositional')!;
    const fallacies = detectFallacies([impl, notP], notQ, profile);
    expect(fallacies.length).toBeGreaterThanOrEqual(1);
    expect(fallacies[0].name).toBe('Negación del antecedente');
  });

  it('detects undistributed middle', () => {
    // (P→M), (S→M) ⊬ (S→P)
    const P: Formula = { kind: 'atom', name: 'P' };
    const S: Formula = { kind: 'atom', name: 'S' };
    const M: Formula = { kind: 'atom', name: 'M' };
    const pm: Formula = { kind: 'implies', args: [P, M] };
    const sm: Formula = { kind: 'implies', args: [S, M] };
    const sp: Formula = { kind: 'implies', args: [S, P] };
    const profile = registry.get('classical.propositional')!;
    const fallacies = detectFallacies([pm, sm], sp, profile);
    expect(fallacies.length).toBeGreaterThanOrEqual(1);
    expect(fallacies[0].name).toBe('Medio no distribuido');
  });

  it('returns empty for a valid modus ponens', () => {
    const P: Formula = { kind: 'atom', name: 'P' };
    const Q: Formula = { kind: 'atom', name: 'Q' };
    const impl: Formula = { kind: 'implies', args: [P, Q] };
    const profile = registry.get('classical.propositional')!;
    const fallacies = detectFallacies([impl, P], Q, profile);
    expect(fallacies).toHaveLength(0);
  });

  it('analyze with single premise', () => {
    const out = run('logic classical.propositional\nanalyze {P -> P} -> (P -> P)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('VÁLIDA');
  });
});

// ── 4. formulaToUnicode / formulaToLaTeX ─────────────────────

describe('formulaToUnicode', () => {
  it('converts atom', () => {
    expect(formulaToUnicode({ kind: 'atom', name: 'P' })).toBe('P');
  });

  it('converts negation', () => {
    expect(formulaToUnicode({ kind: 'not', args: [{ kind: 'atom', name: 'P' }] })).toBe('¬P');
  });

  it('converts conjunction', () => {
    const f: Formula = {
      kind: 'and',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(P ∧ Q)');
  });

  it('converts disjunction', () => {
    const f: Formula = {
      kind: 'or',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(P ∨ Q)');
  });

  it('converts implication', () => {
    const f: Formula = {
      kind: 'implies',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(P → Q)');
  });

  it('converts biconditional', () => {
    const f: Formula = {
      kind: 'biconditional',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    expect(formulaToUnicode(f)).toBe('(P ↔ Q)');
  });

  it('converts necessity', () => {
    const f: Formula = { kind: 'modal_necessity', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToUnicode(f)).toBe('□(P)');
  });

  it('converts possibility', () => {
    const f: Formula = { kind: 'modal_possibility', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToUnicode(f)).toBe('◇(P)');
  });

  it('converts forall', () => {
    const f: Formula = { kind: 'forall', variable: 'x', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToUnicode(f)).toBe('∀x(P)');
  });

  it('converts exists', () => {
    const f: Formula = { kind: 'exists', variable: 'x', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToUnicode(f)).toBe('∃x(P)');
  });

  it('converts predicate', () => {
    const f: Formula = { kind: 'predicate', name: 'Loves', params: ['a', 'b'] };
    expect(formulaToUnicode(f)).toBe('Loves(a, b)');
  });
});

describe('formulaToLaTeX', () => {
  it('converts implication', () => {
    const f: Formula = {
      kind: 'implies',
      args: [
        { kind: 'atom', name: 'P' },
        { kind: 'atom', name: 'Q' },
      ],
    };
    expect(formulaToLaTeX(f)).toBe('(P \\to Q)');
  });

  it('converts negation', () => {
    expect(formulaToLaTeX({ kind: 'not', args: [{ kind: 'atom', name: 'P' }] })).toBe('\\neg P');
  });

  it('converts necessity', () => {
    const f: Formula = { kind: 'modal_necessity', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToLaTeX(f)).toBe('\\Box P');
  });
});

// ── 5. Unicode output in interpreter ─────────────────────────

describe('interpreter Unicode output', () => {
  it('proof steps use Unicode symbols', () => {
    const out = run(
      'logic classical.propositional\n' + 'axiom A1 : P -> Q\n' + 'axiom A2 : P\n' + 'prove Q',
    );
    // The proof step output should have Unicode arrow
    if (out.stdout.includes('Prueba:')) {
      expect(out.stdout).toMatch(/[→∧∨¬↔□◇∀∃]/);
    }
  });
});

// ── 6. let FORMULA alias ─────────────────────────────────────

describe('let formula alias', () => {
  it('parses let name = formula', () => {
    const prog = parseOk('logic classical.propositional\nlet phi = (P -> Q)');
    expect(prog.statements).toHaveLength(2);
    expect(prog.statements[1].kind).toBe('let_decl');
  });

  it('let formula registers as axiom and can be derived from', () => {
    const out = run(
      'logic classical.propositional\n' +
        'let h1 = P -> Q\n' +
        'let h2 = P\n' +
        'derive Q from {h1, h2}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toMatch(/valid|provable/);
  });

  it('let formula output shows Unicode', () => {
    const out = run('logic classical.propositional\nlet phi = (P -> Q)');
    expect(out.stdout).toContain('Let phi');
    expect(out.stdout).toContain('→');
  });

  it('let passage still works', () => {
    const out = run('logic classical.propositional\nlet p = passage([[doc.md#h1]])');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Passage p');
  });

  it('let formalize still works', () => {
    const out = run(
      'logic classical.propositional\n' +
        'let p = passage([[doc.md#b1]])\n' +
        'let f = formalize p as (P -> Q)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Formalizacion f');
  });
});

// ── 7. Block comments /* ... */ ──────────────────────────────

describe('block comments', () => {
  it('ignores single-line block comment', () => {
    const out = run(
      'logic classical.propositional\n/* esto es un comentario */\ncheck valid (P -> P)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('ignores multi-line block comment', () => {
    const source = [
      'logic classical.propositional',
      '/* esto es',
      '   un comentario',
      '   de varias líneas */',
      'check valid (P | !P)',
    ].join('\n');
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('reports error on unclosed block comment', () => {
    const parser = new Parser('<test>');
    parser.parse('logic classical.propositional\n/* unclosed comment');
    const errors = parser.diagnostics.filter((d) => d.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Comentario');
  });
});

// ── 8. refute / refutar alias ────────────────────────────────

describe('refute alias', () => {
  it('refute works as countermodel', () => {
    const out = run('logic classical.propositional\nrefute (P & !P)');
    expect(out.exitCode).toBe(0);
  });

  it('refutar works in Spanish', () => {
    const out = run('logica classical.propositional\nrefutar P');
    expect(out.exitCode).toBe(0);
  });
});

// ── 9. FOL equality x = y ───────────────────────────────────

describe('FOL equality', () => {
  it('parses x = y as equals formula', () => {
    const prog = parseOk('logic classical.first_order\naxiom eq1 : x = y');
    expect(prog.statements).toHaveLength(2);
    const axiom = prog.statements[1];
    if (axiom.kind === 'axiom_decl') {
      expect(axiom.formula.kind).toBe('equals');
    }
  });

  it('formulaToUnicode renders equals', () => {
    const f: Formula = {
      kind: 'equals',
      args: [
        { kind: 'atom', name: 'x' },
        { kind: 'atom', name: 'y' },
      ],
    };
    expect(formulaToUnicode(f)).toContain('=');
    expect(formulaToUnicode(f)).toContain('x');
    expect(formulaToUnicode(f)).toContain('y');
  });
});

// ── 10. Render mejorado ──────────────────────────────────────

describe('render command', () => {
  it('render theory shows axioms', () => {
    const out = run('logic classical.propositional\n' + 'axiom a1 : P -> Q\n' + 'render theory');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Render: theory');
    expect(out.stdout).toContain('a1');
  });

  it('render claims shows registered claims', () => {
    const out = run(
      'logic classical.propositional\n' +
        'let p = passage([[doc.md#h1]])\n' +
        'let f = formalize p as (P -> Q)\n' +
        'claim c1 = f\n' +
        'confidence c1 = 0.9\n' +
        'render claims',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Render: claims');
  });
});

// ── 11. Parser error recovery ────────────────────────────────

describe('parser error recovery', () => {
  it('continues after syntax error to parse next statement', () => {
    const parser = new Parser('<test>');
    const prog = parser.parse(
      'logic classical.propositional\n' + 'invalid garbage here\n' + 'check valid (P -> P)',
    );
    // Should have errors but also parsed statements
    const errors = parser.diagnostics.filter((d) => d.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    // Should still have the logic_decl and check_valid
    expect(prog.statements.length).toBeGreaterThanOrEqual(2);
  });
});

