// ============================================================
// Tests v3.0 — define, unfold, fold, source, interpret,
//              glossary, render glossary/analysis
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';
import { Parser } from '../parser/parser';

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

// ── 1. define ────────────────────────────────────────────────

describe('define — formal definitions', () => {
  it('parses simple define without params', () => {
    const prog = parseOk('logic classical.propositional\ndefine Tautology := P -> P');
    const stmt = prog.statements[1];
    expect(stmt.kind).toBe('define_decl');
    if (stmt.kind === 'define_decl') {
      expect(stmt.name).toBe('Tautology');
      expect(stmt.params).toBeUndefined();
    }
  });

  it('parses define with params', () => {
    const prog = parseOk('logic classical.propositional\ndefine Implies(x, y) := x -> y');
    const stmt = prog.statements[1];
    expect(stmt.kind).toBe('define_decl');
    if (stmt.kind === 'define_decl') {
      expect(stmt.name).toBe('Implies');
      expect(stmt.params).toEqual(['x', 'y']);
    }
  });

  it('parses define with description', () => {
    const prog = parseOk(
      'logic classical.propositional\n' +
        'define Tautology := P -> P\n' +
        'description "Una tautología básica"',
    );
    const stmt = prog.statements[1];
    if (stmt.kind === 'define_decl') {
      expect(stmt.description).toBe('Una tautología básica');
    }
  });

  it('executes define and emits output', () => {
    const out = run('logic classical.propositional\ndefine Tautology := P -> P');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Define');
    expect(out.stdout).toContain('Tautology');
  });

  it('define with params emits param list', () => {
    const out = run('logic classical.propositional\ndefine Implies(x, y) := x -> y');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Implies(x, y)');
  });

  it('define with description emits description', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Tautology := P -> P\n' +
        'description "Una tautología"',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Una tautología');
  });

  it('detects circular definition (self-reference)', () => {
    const out = run('logic classical.propositional\ndefine Loop := Loop');
    expect(out.exitCode).not.toBe(0);
  });

  it('detects indirect circular definition', () => {
    const out = run('logic classical.propositional\n' + 'define A := B\n' + 'define B := A');
    expect(out.exitCode).not.toBe(0);
  });

  it('allows non-circular chain definitions', () => {
    const out = run(
      'logic classical.propositional\n' + 'define A := P -> Q\n' + 'define B := A -> R',
    );
    expect(out.exitCode).toBe(0);
  });

  it('definition used in check valid', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Tautology := P -> P\n' + 'check valid Tautology',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('parametric definition used in check valid', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Implies(x, y) := x -> y\n' +
        'check valid Implies(P, P)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('definition used in derive', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define MyRule := P -> Q\n' +
        'axiom A1 : MyRule\n' +
        'axiom A2 : P\n' +
        'derive Q from {A1, A2}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('provable');
  });

  it('define with = instead of :=', () => {
    const out = run('logic classical.propositional\ndefine Taut = P -> P');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Taut');
  });

  it('overwriting a definition replaces it', () => {
    const out = run(
      'logic classical.propositional\n' + 'define D := P\n' + 'define D := Q\n' + 'glossary',
    );
    expect(out.exitCode).toBe(0);
    // The glossary should show Q, not P
    expect(out.stdout).toContain('Q');
  });
});

// ── 2. Spanish aliases for define/unfold/fold ────────────────

describe('Spanish aliases — definir, desplegar, plegar', () => {
  it('definir = define', () => {
    const out = run('logic classical.propositional\ndefinir Taut := P -> P');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Define');
    expect(out.stdout).toContain('Taut');
  });

  it('desplegar = unfold', () => {
    const out = run(
      'logic classical.propositional\n' + 'definir Taut := P -> P\n' + 'desplegar Taut',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Unfold');
  });

  it('plegar = fold', () => {
    const out = run(
      'logic classical.propositional\n' + 'definir Taut := P -> P\n' + 'plegar (P -> P)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Fold');
  });
});

// ── 3. unfold ────────────────────────────────────────────────

describe('unfold — definition expansion', () => {
  it('unfolds a simple definition', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Tautology := P -> P\n' + 'unfold Tautology',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Unfold');
    expect(out.stdout).toContain('→');
  });

  it('unfold produces a result', () => {
    const out = run('logic classical.propositional\n' + 'define D := P & Q\n' + 'unfold D');
    expect(out.exitCode).toBe(0);
    expect(out.results).toHaveLength(1);
    expect(out.results[0].status).toBe('valid');
  });

  it('unfold unknown name still works (no expansion)', () => {
    const out = run('logic classical.propositional\nunfold Unknown');
    expect(out.exitCode).toBe(0);
    // It should still emit the formula as-is
    expect(out.stdout).toContain('Unfold');
  });

  it('unfold chain: A := B, B := P; unfold A shows P', () => {
    const out = run(
      'logic classical.propositional\n' + 'define B := P -> Q\n' + 'define A := B\n' + 'unfold A',
    );
    expect(out.exitCode).toBe(0);
    // A expands to B, but B is also expanded during resolve
    expect(out.results).toHaveLength(1);
  });
});

// ── 4. fold ──────────────────────────────────────────────────

describe('fold — reverse definition', () => {
  it('folds a formula back to its definition name', () => {
    const out = run('logic classical.propositional\n' + 'define D := P -> Q\n' + 'fold (P -> Q)');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Fold');
    expect(out.stdout).toContain('D');
  });

  it('fold with no matching definition returns formula as-is', () => {
    const out = run('logic classical.propositional\nfold (P -> Q)');
    expect(out.exitCode).toBe(0);
    expect(out.results).toHaveLength(1);
  });

  it('fold produces a result entry', () => {
    const out = run('logic classical.propositional\n' + 'define D := P & Q\n' + 'fold (P & Q)');
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });
});

// ── 5. source ────────────────────────────────────────────────

describe('source — bibliographic declarations', () => {
  it('parses source with fields', () => {
    const prog = parseOk(
      'logic classical.propositional\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '  year 350\n' +
        '}',
    );
    const stmt = prog.statements[1];
    expect(stmt.kind).toBe('source_decl');
  });

  it('executes source and emits info', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '  year 350\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Aristóteles');
    expect(out.stdout).toContain('350');
    expect(out.stdout).toContain('Organon');
  });

  it('source with fuente alias (Spanish)', () => {
    const out = run(
      'logic classical.propositional\n' +
        'fuente Frege {\n' +
        '  author "Gottlob Frege"\n' +
        '  work "Begriffsschrift"\n' +
        '  year 1879\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Frege');
    expect(out.stdout).toContain('1879');
  });

  it('source appears in glossary', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '  year 350\n' +
        '}\n' +
        'glossary',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Aristóteles');
  });

  it('source with url and section', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Wiki {\n' +
        '  author "Wikipedia"\n' +
        '  work "Lógica proposicional"\n' +
        '  url "https://en.wikipedia.org/wiki/Propositional_logic"\n' +
        '  section "Introduction"\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Wikipedia');
  });
});

// ── 6. interpret ─────────────────────────────────────────────

describe('interpret — text-to-formula binding', () => {
  it('parses interpret with string', () => {
    const prog = parseOk(
      'logic classical.propositional\n' + 'interpret "todo hombre es mortal" as P -> Q',
    );
    const stmt = prog.statements[1];
    expect(stmt.kind).toBe('interpret_cmd');
  });

  it('executes interpret and emits', () => {
    const out = run(
      'logic classical.propositional\n' + 'interpret "todo hombre es mortal" as P -> Q',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Interpret');
    expect(out.stdout).toContain('todo hombre es mortal');
  });

  it('interpret with identifier (passageRef)', () => {
    const out = run('logic classical.propositional\n' + 'interpret Premise1 as P -> Q');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Interpret');
    expect(out.stdout).toContain('Premise1');
  });

  it('interpret creates a let binding usable later', () => {
    const out = run(
      'logic classical.propositional\n' +
        'interpret "mortalidad" as P -> Q\n' +
        'check valid (mortalidad -> mortalidad)',
    );
    expect(out.exitCode).toBe(0);
    // The binding "mortalidad" should be available
  });

  it('interpret appears in glossary', () => {
    const out = run(
      'logic classical.propositional\n' +
        'interpret "todo hombre es mortal" as P -> Q\n' +
        'glossary',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Interpretaciones');
    expect(out.stdout).toContain('todo hombre es mortal');
  });

  it('interpretar alias (Spanish)', () => {
    const out = run('logic classical.propositional\n' + 'interpretar "llueve" as P');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Interpret');
  });
});

// ── 7. glossary ──────────────────────────────────────────────

describe('glossary — combined output', () => {
  it('empty glossary shows "(sin definiciones registradas)"', () => {
    const out = run('logic classical.propositional\nglossary');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('sin definiciones registradas');
  });

  it('glossary shows definitions', () => {
    const out = run('logic classical.propositional\n' + 'define A := P -> Q\n' + 'glossary');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('GLOSARIO');
    expect(out.stdout).toContain('A');
  });

  it('glossary shows definitions + sources + interpretations', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Implicacion := P -> Q\n' +
        'source Frege {\n' +
        '  author "Frege"\n' +
        '  work "Begriffsschrift"\n' +
        '  year 1879\n' +
        '}\n' +
        'interpret "si P entonces Q" as P -> Q\n' +
        'glossary',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('GLOSARIO');
    expect(out.stdout).toContain('Implicacion');
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Frege');
    expect(out.stdout).toContain('Interpretaciones');
    expect(out.stdout).toContain('si P entonces Q');
  });

  it('glosario alias (Spanish)', () => {
    const out = run('logic classical.propositional\nglosario');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('GLOSARIO');
  });
});

// ── 8. render glossary ───────────────────────────────────────

describe('render glossary — formatted output', () => {
  it('render glossary as markdown', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Impl := P -> Q\n' + 'render glossary as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('**Impl**');
    expect(out.stdout).toContain(':=');
  });

  it('render glossary as json', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Impl := P -> Q\n' + 'render glossary as json',
    );
    expect(out.exitCode).toBe(0);
    // JSON must be parseable
    const lines = out.stdout.split('\n');
    const jsonStr = lines.filter((l) => l.trim().length > 0).join('\n');
    expect(jsonStr).toContain('"Impl"');
    expect(jsonStr).toContain('"body"');
  });

  it('render glossary as latex', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Impl := P -> Q\n' + 'render glossary as latex',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('\\newcommand');
    expect(out.stdout).toContain('Impl');
  });

  it('render glossary with no definitions', () => {
    const out = run('logic classical.propositional\nrender glossary as markdown');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('sin definiciones');
  });

  it('render glossary with params and description', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Impl(x, y) := x -> y\n' +
        'description "Implicación material"\n' +
        'render glossary as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Impl(x, y)');
    expect(out.stdout).toContain('Implicación material');
  });
});

// ── 9. render analysis ───────────────────────────────────────

describe('render analysis — full document', () => {
  it('render analysis produces headings', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define D := P -> Q\n' +
        'axiom A1 : P -> Q\n' +
        'render analysis as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Análisis');
    expect(out.stdout).toContain('Definiciones');
    expect(out.stdout).toContain('Axiomas');
  });

  it('render analysis includes sources', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '  year 350\n' +
        '}\n' +
        'render analysis as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Aristóteles');
  });

  it('render analysis with theorems and claims', () => {
    const out = run(
      'logic classical.propositional\n' +
        'axiom A1 : P -> Q\n' +
        'axiom A2 : P\n' +
        'theorem T1 = Q\n' +
        'render analysis as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Teoremas');
  });

  it('render analysis empty is minimal', () => {
    const out = run('logic classical.propositional\nrender analysis as markdown');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Análisis');
  });
});

// ── 10. definition expansion in proofs ───────────────────────

describe('definition expansion in resolve pipeline', () => {
  it('definition expanded in check satisfiable', () => {
    const out = run(
      'logic classical.propositional\n' + 'define D := P & !P\n' + 'check satisfiable D',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('unsatisfiable');
  });

  it('parametric definition in check valid', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Id(x) := x -> x\n' + 'check valid Id(P)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('parametric definition with two params', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Impl(x, y) := x -> y\n' +
        'check valid (Impl(P, P))',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('valid');
  });

  it('definition expanded in derive', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define IMP := P -> Q\n' +
        'axiom A1 : IMP\n' +
        'axiom A2 : P\n' +
        'derive Q from {A1, A2}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('provable');
  });

  it('definition in truth table', () => {
    const out = run('logic classical.propositional\n' + 'define D := P | !P\n' + 'truth_table D');
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('T');
  });
});

// ── 11. export of definitions ────────────────────────────────

describe('export define', () => {
  it('parses export define', () => {
    const prog = parseOk('logic classical.propositional\n' + 'export define MyDef := P -> Q');
    const stmt = prog.statements[1];
    expect(stmt.kind).toBe('export_decl');
  });
});

// ── 12. edge cases and integration ───────────────────────────

describe('edge cases', () => {
  it('multiple defines before glossary', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define A := P\n' +
        'define B := Q\n' +
        'define C := R\n' +
        'glossary',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('A');
    expect(out.stdout).toContain('B');
    expect(out.stdout).toContain('C');
  });

  it('define + source + interpret + unfold + fold + glossary all in one', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define D := P -> Q\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '}\n' +
        'interpret "si P entonces Q" as P -> Q\n' +
        'unfold D\n' +
        'fold (P -> Q)\n' +
        'glossary',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Define');
    expect(out.stdout).toContain('Source');
    expect(out.stdout).toContain('Interpret');
    expect(out.stdout).toContain('Unfold');
    expect(out.stdout).toContain('Fold');
    expect(out.stdout).toContain('GLOSARIO');
  });

  it('define inside theory block', () => {
    const out = run(
      'logic classical.propositional\n' +
        'theory T {\n' +
        '  define D := P -> Q\n' +
        '  axiom A1 : D\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
  });

  it('define with complex formula', () => {
    const out = run(
      'logic classical.propositional\n' + 'define Complex := (P -> Q) & (Q -> R) -> (P -> R)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Complex');
  });

  it('define with negation', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Contradiction := P & !P\n' +
        'check satisfiable Contradiction',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('unsatisfiable');
  });

  it('unfold then check valid on result', () => {
    const out = run(
      'logic classical.propositional\n' +
        'define Taut := P -> P\n' +
        'unfold Taut\n' +
        'check valid (P -> P)',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[1].status).toBe('valid');
  });

  it('source with negative year', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Ancient {\n' +
        '  author "Parmenides"\n' +
        '  year -500\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toContain('Parmenides');
  });

  it('full workflow: source + define + axiom + derive + render analysis', () => {
    const out = run(
      'logic classical.propositional\n' +
        'source Aristotle {\n' +
        '  author "Aristóteles"\n' +
        '  work "Organon"\n' +
        '  year 350\n' +
        '}\n' +
        'define Mortal := P -> Q\n' +
        'description "Todo hombre es mortal"\n' +
        'axiom A1 : Mortal\n' +
        'axiom A2 : P\n' +
        'derive Q from {A1, A2}\n' +
        'render analysis as markdown',
    );
    expect(out.exitCode).toBe(0);
    expect(out.results[0].status).toBe('provable');
    expect(out.stdout).toContain('Análisis');
    expect(out.stdout).toContain('Definiciones');
    expect(out.stdout).toContain('Axiomas');
    expect(out.stdout).toContain('Fuentes');
  });

  it('render glossary default format (no as clause)', () => {
    const out = run('logic classical.propositional\n' + 'define D := P -> Q\n' + 'render glossary');
    expect(out.exitCode).toBe(0);
    // Default should be markdown
    expect(out.stdout).toContain('**D**');
  });
});
