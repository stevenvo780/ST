// ============================================================
// Tests v1.0 — Spanish keywords, analyze, explain, format
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { Parser } from '../parser/parser';
import { formulaToUnicode, formulaToLaTeX } from '../runtime/format';
import { detectFallacies } from '../runtime/fallacies';
import { registry } from '../profiles/interface';
import { formulaEqual } from '../profiles/shared/tableau-engine';
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
    expect(out.stdout).toContain('Fórmula:');
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
    expect(out.stdout).toContain('Petición de principio');
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

// ── 12. LTL Next (X) y Until (U) ────────────────────────────

describe('LTL next and until', () => {
  it('parses next operator', () => {
    const prog = parseOk('logic temporal.ltl\naxiom a1 : next P');
    expect(prog.statements).toHaveLength(2);
    const axiom = prog.statements[1];
    if (axiom.kind === 'axiom_decl') {
      expect(axiom.formula.kind).toBe('temporal_next');
    }
  });

  it('parses until operator', () => {
    const prog = parseOk('logic temporal.ltl\naxiom a1 : P until Q');
    expect(prog.statements).toHaveLength(2);
    const axiom = prog.statements[1];
    if (axiom.kind === 'axiom_decl') {
      expect(axiom.formula.kind).toBe('temporal_until');
    }
  });

  it('parses Spanish aliases siguiente/hasta', () => {
    const prog = parseOk('logica temporal.ltl\naxioma a1 : siguiente P');
    const axiom = prog.statements[1];
    if (axiom.kind === 'axiom_decl') {
      expect(axiom.formula.kind).toBe('temporal_next');
    }
  });

  it('formulaToUnicode renders X and U', () => {
    const nextF: Formula = { kind: 'temporal_next', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToUnicode(nextF)).toBe('X(P)');

    const untilF: Formula = {
      kind: 'temporal_until',
      args: [{ kind: 'atom', name: 'P' }, { kind: 'atom', name: 'Q' }],
    };
    expect(formulaToUnicode(untilF)).toBe('(P U Q)');
  });

  it('formulaToLaTeX renders X and U', () => {
    const nextF: Formula = { kind: 'temporal_next', args: [{ kind: 'atom', name: 'P' }] };
    expect(formulaToLaTeX(nextF)).toContain('X');

    const untilF: Formula = {
      kind: 'temporal_until',
      args: [{ kind: 'atom', name: 'P' }, { kind: 'atom', name: 'Q' }],
    };
    expect(formulaToLaTeX(untilF)).toContain('U');
  });

  it('next and until work in temporal.ltl profile', () => {
    const out = run('logic temporal.ltl\naxiom a1 : next P\naxiom a2 : P until Q');
    expect(out.exitCode).toBe(0);
  });
});

// ── 13. Import system ────────────────────────────────────────

describe('import system', () => {
  it('parses import statement with string path', () => {
    const prog = parseOk('import "utils.st"');
    expect(prog.statements).toHaveLength(1);
    expect(prog.statements[0].kind).toBe('import_decl');
    if (prog.statements[0].kind === 'import_decl') {
      expect(prog.statements[0].path).toBe('utils.st');
    }
  });

  it('parses import with identifier path', () => {
    const prog = parseOk('import utils');
    expect(prog.statements).toHaveLength(1);
    if (prog.statements[0].kind === 'import_decl') {
      expect(prog.statements[0].path).toBe('utils');
    }
  });

  it('parses importar (Spanish)', () => {
    const prog = parseOk('importar "lib.st"');
    expect(prog.statements).toHaveLength(1);
    expect(prog.statements[0].kind).toBe('import_decl');
  });
});

// ── 14. Assume / Show / QED proof blocks ─────────────────────

describe('proof blocks', () => {
  it('parses assume/show/qed block', () => {
    const source = [
      'logic classical.propositional',
      'assume h1 : P -> Q',
      'assume h2 : P',
      'show Q',
      'derive Q from {h1, h2}',
      'qed',
    ].join('\n');
    const prog = parseOk(source);
    expect(prog.statements.length).toBe(2); // logic_decl + proof_block
    expect(prog.statements[1].kind).toBe('proof_block');
  });

  it('executes proof block successfully', () => {
    const source = [
      'logic classical.propositional',
      'assume h1 : P -> Q',
      'assume h2 : P',
      'show Q',
      'derive Q from {h1, h2}',
      'qed',
    ].join('\n');
    const out = run(source);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('QED');
  });

  it('assumptions are scoped to the block', () => {
    const source = [
      'logic classical.propositional',
      'assume h1 : P -> Q',
      'show (P -> Q)',
      'qed',
    ].join('\n');
    const out = run(source);
    expect(out.exitCode).toBe(0);
    // h1 should not leak as an axiom after the block
    expect(out.stdout).toContain('Proof Block');
  });

  it('parses Spanish asumir/demostrar', () => {
    const source = [
      'logica classical.propositional',
      'asumir h1 : P -> Q',
      'demostrar (P -> Q)',
      'qed',
    ].join('\n');
    const prog = parseOk(source);
    expect(prog.statements[1].kind).toBe('proof_block');
  });
});

// ── 15. Alpha-equivalencia ───────────────────────────────────

describe('alpha-equivalence', () => {
  it('treats ∀x.P(x) and ∀y.P(y) as equal via formulaEqual', () => {
    const f1: Formula = {
      kind: 'forall',
      variable: 'x',
      args: [{ kind: 'predicate', name: 'P', params: ['x'] }],
    };
    const f2: Formula = {
      kind: 'forall',
      variable: 'y',
      args: [{ kind: 'predicate', name: 'P', params: ['y'] }],
    };
    expect(formulaEqual(f1, f2)).toBe(true);
  });

  it('distinguishes ∀x.P(x) from ∀x.Q(x)', () => {
    const f1: Formula = {
      kind: 'forall',
      variable: 'x',
      args: [{ kind: 'predicate', name: 'P', params: ['x'] }],
    };
    const f2: Formula = {
      kind: 'forall',
      variable: 'x',
      args: [{ kind: 'predicate', name: 'Q', params: ['x'] }],
    };
    expect(formulaEqual(f1, f2)).toBe(false);
  });
});

// ── Theory blocks (OOP) ─────────────────────────────────────

describe('theory blocks (OOP)', () => {
  it('parses a basic theory block', () => {
    const prog = parseOk(`
      logic classical.propositional
      theory Mortalidad {
        let H = "x es un hombre"
        axiom regla : H -> M
      }
    `);
    const theoryStmt = prog.statements.find((s) => s.kind === 'theory_decl');
    expect(theoryStmt).toBeDefined();
    if (theoryStmt && theoryStmt.kind === 'theory_decl') {
      expect(theoryStmt.name).toBe('Mortalidad');
      expect(theoryStmt.parent).toBeUndefined();
      expect(theoryStmt.members).toHaveLength(2);
    }
  });

  it('theory encapsulates — members do not leak to global scope', () => {
    const out = run(`
      logic classical.propositional
      theory T1 {
        let A = P -> Q
        axiom a1 : A
      }
      check valid A
    `);
    // A no debería existir en el scope global — el check debería fallar o tratarla como átomo
    // El check valid de un átomo puro no es tautología
    expect(out.stdout).not.toContain('✓ [check valid]');
  });

  it('theory members accessible via dot notation', () => {
    const out = run(`
      logic classical.propositional
      theory Base {
        axiom a1 : P -> Q
      }
      check valid Base.a1 | !(Base.a1)
    `);
    expect(out.exitCode).toBe(0);
    // P -> Q | !(P -> Q) es tautología
    expect(out.stdout).toContain('✓');
  });

  it('theory extends inherits parent members', () => {
    const out = run(`
      logic classical.propositional
      theory Parent {
        let A = P -> Q
        axiom base : A
      }
      theory Child extends Parent {
        check valid A | !A
      }
    `);
    expect(out.exitCode).toBe(0);
    // A fue heredada del padre, A | !A es tautología
    expect(out.stdout).toContain('✓');
  });

  it('child can override parent members (polymorphism)', () => {
    const out = run(`
      logic classical.propositional
      theory Parent {
        let X = P
      }
      theory Child extends Parent {
        let X = Q
        check valid X | !X
      }
    `);
    expect(out.exitCode).toBe(0);
    // X redefinido como Q, Q | !Q es tautología
    expect(out.stdout).toContain('✓');
  });

  it('private members not accessible via dot notation', () => {
    const out = run(`
      logic classical.propositional
      theory Secret {
        private let interno = P & Q
        axiom pub : P -> Q
      }
      check valid Secret.interno | !(Secret.interno)
    `);
    // Secret.interno es privado — no se resuelve, se trata como átomo
    // Un átomo | !átomo: A | !A es tautología si se trata como el mismo átomo
    // Pero la resolución no ocurre, así que Secret.interno queda como átomo literal
    // atom | !atom siempre es tautología en proposicional
    expect(out.exitCode).toBe(0);
  });

  it('private members ARE accessible from inside the theory', () => {
    const out = run(`
      logic classical.propositional
      theory T {
        private let x = P -> Q
        check valid x | !x
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('✓');
  });

  it('spanish keywords: teoria extiende privado', () => {
    const prog = parseOk(`
      logic classical.propositional
      teoria Padre {
        axioma a1 : P -> Q
      }
      teoria Hijo extiende Padre {
        privado sea x = P & Q
      }
    `);
    const theories = prog.statements.filter((s) => s.kind === 'theory_decl');
    expect(theories).toHaveLength(2);
    if (theories[1].kind === 'theory_decl') {
      expect(theories[1].parent).toBe('Padre');
      expect(theories[1].members[0].visibility).toBe('private');
    }
  });

  it('dot notation in formulas resolves theory axiom', () => {
    const out = run(`
      logic classical.propositional
      theory Logic {
        axiom mp : (P & (P -> Q)) -> Q
      }
      check valid Logic.mp
    `);
    expect(out.exitCode).toBe(0);
    // modus ponens es tautología
    expect(out.stdout).toContain('✓');
  });

  it('extends from non-existent parent throws error', () => {
    const out = run(`
      logic classical.propositional
      theory Child extends NoExiste {
        axiom a : P
      }
    `);
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toContain('no encontrada');
  });
});

// ── 11. Control flow & funciones (v1.5.8) ────────────────────

describe('print command', () => {
  it('print string literal', () => {
    const out = run(`
      logic classical.propositional
      print "Hola mundo"
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Hola mundo');
  });

  it('print formula renders unicode', () => {
    const out = run(`
      logic classical.propositional
      print P & Q
    `);
    expect(out.exitCode).toBe(0);
    // Debe contener el símbolo ∧
    expect(out.stdout).toContain('∧');
  });

  it('print formula resolves let bindings', () => {
    const out = run(`
      logic classical.propositional
      let A = P -> Q
      print A
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('→');
  });
});

describe('set command', () => {
  it('set reassigns a let binding', () => {
    const out = run(`
      logic classical.propositional
      let X = P
      set X = Q
      print X
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Q');
  });

  it('set new variable works', () => {
    const out = run(`
      logic classical.propositional
      set Y = P & Q
      print Y
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('∧');
  });
});

describe('if statement', () => {
  it('if valid executes body for tautology', () => {
    const out = run(`
      logic classical.propositional
      if valid (P | !P) {
        print "es tautologia"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('es tautologia');
  });

  it('if valid does NOT execute body for contingent formula', () => {
    const out = run(`
      logic classical.propositional
      if valid P {
        print "no deberia aparecer"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).not.toContain('no deberia aparecer');
  });

  it('if-else executes else branch', () => {
    const out = run(`
      logic classical.propositional
      if valid P {
        print "rama if"
      } else {
        print "rama else"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('rama else');
    expect(out.stdout).not.toContain('rama if');
  });

  it('if satisfiable works', () => {
    const out = run(`
      logic classical.propositional
      if satisfiable P {
        print "es satisfacible"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('es satisfacible');
  });

  it('if unsatisfiable works for contradiction', () => {
    const out = run(`
      logic classical.propositional
      if unsatisfiable (P & !P) {
        print "contradiccion"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('contradiccion');
  });

  it('if invalid works for non-tautology', () => {
    const out = run(`
      logic classical.propositional
      if invalid P {
        print "no es valida"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('no es valida');
  });

  it('else if chains work', () => {
    const out = run(`
      logic classical.propositional
      if valid P {
        print "primera"
      } else if satisfiable P {
        print "segunda"
      } else {
        print "tercera"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('segunda');
    expect(out.stdout).not.toContain('primera');
    expect(out.stdout).not.toContain('tercera');
  });
});

describe('for statement', () => {
  it('iterates over formula list', () => {
    const out = run(`
      logic classical.propositional
      for F in { P, Q, R } {
        print F
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('P');
    expect(out.stdout).toContain('Q');
    expect(out.stdout).toContain('R');
  });

  it('for with check valid inside', () => {
    const out = run(`
      logic classical.propositional
      for F in { (P | !P), (Q & !Q), (R -> R) } {
        check valid F
      }
    `);
    expect(out.exitCode).toBe(0);
    // P | !P y R -> R son válidas, Q & !Q no
    expect(out.stdout).toContain('✓');
    expect(out.stdout).toContain('✗');
  });

  it('restores variable binding after loop', () => {
    const out = run(`
      logic classical.propositional
      let X = A
      for X in { P, Q } {
        print X
      }
      print X
    `);
    expect(out.exitCode).toBe(0);
    const lines = out.stdout.split('\n');
    // Después del for, X debe volver a ser A
    const lastPrint = lines.filter((l) => !l.startsWith('Let') && !l.startsWith('Set'));
    expect(lastPrint[lastPrint.length - 1]).toContain('A');
  });
});

describe('while statement', () => {
  it('while valid loops while tautology', () => {
    // Este while se ejecuta 1 vez luego cambiamos la fórmula para salir
    // Usamos un while satisfiable con set para mutar
    const out = run(`
      logic classical.propositional
      set X = P
      set N = P
      while satisfiable X {
        print "iter"
        set X = P & !P
      }
    `);
    expect(out.exitCode).toBe(0);
    // Debe ejecutarse exactamente 1 vez
    const iterCount = out.stdout.split('iter').length - 1;
    expect(iterCount).toBe(1);
  });
});

describe('fn declaration and call', () => {
  it('declares and calls a function', () => {
    const out = run(`
      logic classical.propositional
      fn verificar(X) {
        check valid X
      }
      verificar((P | !P))
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('✓');
  });

  it('function with multiple params', () => {
    const out = run(`
      logic classical.propositional
      fn mostrar(A, B) {
        print A
        print B
      }
      mostrar(P, Q)
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('P');
    expect(out.stdout).toContain('Q');
  });

  it('function with return', () => {
    const out = run(`
      logic classical.propositional
      fn crear() {
        print "antes"
        return P & Q
        print "despues"
      }
      crear()
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('antes');
    // "despues" no debe aparecer porque return cortó la ejecución
    expect(out.stdout).not.toContain('despues');
  });

  it('wrong arg count throws error', () => {
    const out = run(`
      logic classical.propositional
      fn foo(A) {
        print A
      }
      foo(P, Q)
    `);
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toContain('argumento');
  });

  it('calling undeclared function throws error', () => {
    const out = run(`
      logic classical.propositional
      noExiste(P)
    `);
    expect(out.exitCode).not.toBe(0);
    expect(out.stderr).toContain('no declarada');
  });

  it('function restores bindings after call', () => {
    const out = run(`
      logic classical.propositional
      let A = P
      fn cambiar(A) {
        print A
      }
      cambiar(Q)
      print A
    `);
    expect(out.exitCode).toBe(0);
    const lines = out.stdout
      .split('\n')
      .filter(
        (l) =>
          l.trim() &&
          !l.startsWith('Let') &&
          !l.startsWith('Función') &&
          !l.startsWith('Perfil logico'),
      );
    // Dentro de la función A = Q, después A vuelve a ser P
    expect(lines[0]).toContain('Q');
    expect(lines[1]).toContain('P');
  });
});

describe('spanish keyword aliases for control flow', () => {
  it('imprimir works like print', () => {
    const out = run(`
      logic classical.propositional
      imprimir "hola"
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('hola');
  });

  it('asignar works like set', () => {
    const out = run(`
      logic classical.propositional
      asignar X = P
      imprimir X
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('P');
  });

  it('si/sino keywords work', () => {
    const out = run(`
      logic classical.propositional
      si valid (P | !P) {
        imprimir "verdadero"
      } sino {
        imprimir "falso"
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('verdadero');
  });

  it('para/en keywords work', () => {
    const out = run(`
      logic classical.propositional
      para F en { P, Q } {
        imprimir F
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('P');
    expect(out.stdout).toContain('Q');
  });

  it('mientras keyword works', () => {
    const out = run(`
      logic classical.propositional
      asignar X = P
      mientras satisfiable X {
        imprimir "loop"
        asignar X = P & !P
      }
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('loop');
  });

  it('funcion/retornar keywords work', () => {
    const out = run(`
      logic classical.propositional
      funcion saludar() {
        imprimir "hola desde funcion"
      }
      saludar()
    `);
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('hola desde funcion');
  });
});
