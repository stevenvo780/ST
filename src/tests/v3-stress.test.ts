// ============================================================
// Tests v3 Stress — Cross-profile, combinatorial, edge cases
// Validates v3 features (define, unfold, fold, source,
// interpret, glossary, render) across ALL 11 logic profiles
// and under syntactic stress.
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

// ── Helpers ──────────────────────────────────────────────────

function run(source: string) {
  const interp = new Interpreter();
  return interp.execute(source);
}

function runOk(source: string) {
  const out = run(source);
  if (out.exitCode !== 0) {
    const errs = out.diagnostics
      .filter((d) => d.severity === 'error')
      .map((d) => `L${d.line}: ${d.message}`)
      .join('\n');
    throw new Error(`exitCode=${out.exitCode}\n${errs}\nstdout:\n${out.stdout}`);
  }
  return out;
}

// ── All profiles ─────────────────────────────────────────────

const ALL_PROFILES = [
  'classical.propositional',
  'classical.first_order',
  'modal.k',
  'paraconsistent.belnap',
  'deontic.standard',
  'epistemic.s5',
  'aristotelian.syllogistic',
  'intuitionistic.propositional',
  'temporal.ltl',
  'probabilistic.basic',
  'arithmetic',
] as const;

// Profiles that support standard propositional operators (P -> Q)
const PROPOSITIONAL_PROFILES = [
  'classical.propositional',
  'classical.first_order',
  'modal.k',
  'paraconsistent.belnap',
  'deontic.standard',
  'epistemic.s5',
  'intuitionistic.propositional',
  'temporal.ltl',
  'probabilistic.basic',
] as const;

// ============================================================
// 1. define — across ALL profiles
// ============================================================

describe('v3 cross-profile: define + glossary', () => {
  for (const profile of ALL_PROFILES) {
    it(`define + glossary works in ${profile}`, () => {
      const formula = profile === 'arithmetic' ? '2 + 3' : 'P -> Q';
      const out = runOk(`logic ${profile}\ndefine D := ${formula}\nglossary`);
      expect(out.stdout).toContain('Define');
      expect(out.stdout).toContain('GLOSARIO');
      expect(out.stdout).toContain('D');
    });
  }

  for (const profile of ALL_PROFILES) {
    it(`define with description works in ${profile}`, () => {
      const formula = profile === 'arithmetic' ? '2 + 3' : 'P -> Q';
      const out = runOk(
        `logic ${profile}\ndefine D := ${formula}\ndescription "test desc"\nglossary`,
      );
      expect(out.stdout).toContain('test desc');
    });
  }
});

// ============================================================
// 2. define with params — propositional profiles
// ============================================================

describe('v3 cross-profile: parametric define', () => {
  for (const profile of PROPOSITIONAL_PROFILES) {
    it(`parametric define Impl(x,y) := x -> y in ${profile}`, () => {
      const out = runOk(`logic ${profile}\ndefine Impl(x, y) := x -> y\nunfold Impl(P, Q)`);
      expect(out.stdout).toContain('Unfold');
    });
  }
});

// ============================================================
// 3. define expansion in check valid — all profiles that
//    recognize P -> P as valid
// ============================================================

describe('v3 cross-profile: define expansion in check valid', () => {
  // P -> P is valid in classical, modal, deontic, epistemic, intuitionistic, temporal, probabilistic
  const validProfiles = [
    'classical.propositional',
    'classical.first_order',
    'modal.k',
    'deontic.standard',
    'epistemic.s5',
    'intuitionistic.propositional',
    'temporal.ltl',
    'probabilistic.basic',
  ];

  for (const profile of validProfiles) {
    it(`define T := P -> P; check valid T → valid in ${profile}`, () => {
      const out = runOk(`logic ${profile}\ndefine T := P -> P\ncheck valid T`);
      expect(out.results[0].status).toBe('valid');
    });
  }

  // Belnap: P -> P is NOT valid (4-valued logic)
  it('define T := P -> P; check valid T → invalid in paraconsistent.belnap', () => {
    const out = runOk('logic paraconsistent.belnap\ndefine T := P -> P\ncheck valid T');
    expect(out.results[0].status).toBe('invalid');
  });

  // Arithmetic uses different expressions
  it('define Sum := 2 + 3; check valid (Sum > 0) in arithmetic', () => {
    const out = runOk('logic arithmetic\ndefine Sum := 2 + 3\ncheck valid (Sum > 0)');
    expect(out.results[0].status).toBe('valid');
  });
});

// ============================================================
// 4. define expansion in derive — across profiles
// ============================================================

describe('v3 cross-profile: define expansion in derive', () => {
  const deriveProfiles = [
    'classical.propositional',
    'classical.first_order',
    'modal.k',
    'deontic.standard',
    'epistemic.s5',
    'intuitionistic.propositional',
    'temporal.ltl',
    'probabilistic.basic',
  ];

  for (const profile of deriveProfiles) {
    it(`derive with defined axiom in ${profile}`, () => {
      const out = runOk(
        `logic ${profile}\n` +
          'define IMP := P -> Q\n' +
          'axiom A1 : IMP\n' +
          'axiom A2 : P\n' +
          'derive Q from {A1, A2}',
      );
      // Some profiles return 'provable', others 'valid'
      expect(['provable', 'valid']).toContain(out.results[0].status);
    });
  }
});

// ============================================================
// 5. unfold / fold — cross-profile
// ============================================================

describe('v3 cross-profile: unfold + fold', () => {
  for (const profile of PROPOSITIONAL_PROFILES) {
    it(`unfold D then fold back in ${profile}`, () => {
      const out = runOk(`logic ${profile}\ndefine D := P & Q\nunfold D\nfold (P & Q)`);
      expect(out.stdout).toContain('Unfold');
      expect(out.stdout).toContain('Fold');
      // fold should find definition name D
      expect(out.stdout).toMatch(/Fold:.*D/);
    });
  }

  it('unfold works in arithmetic', () => {
    const out = runOk('logic arithmetic\ndefine S := 2 + 3\nunfold S');
    expect(out.stdout).toContain('Unfold');
  });
});

// ============================================================
// 6. source — cross-profile
// ============================================================

describe('v3 cross-profile: source', () => {
  for (const profile of ALL_PROFILES) {
    it(`source declaration works in ${profile}`, () => {
      const out = runOk(
        `logic ${profile}\n` +
          'source Frege {\n' +
          '  author "Gottlob Frege"\n' +
          '  work "Begriffsschrift"\n' +
          '  year 1879\n' +
          '}\n' +
          'glossary',
      );
      expect(out.stdout).toContain('Frege');
      expect(out.stdout).toContain('Fuentes');
    });
  }
});

// ============================================================
// 7. interpret — cross-profile
// ============================================================

describe('v3 cross-profile: interpret', () => {
  for (const profile of PROPOSITIONAL_PROFILES) {
    it(`interpret creates binding in ${profile}`, () => {
      const out = runOk(`logic ${profile}\n` + 'interpret "premise" as P -> Q\n' + 'glossary');
      expect(out.stdout).toContain('Interpret');
      expect(out.stdout).toContain('Interpretaciones');
    });
  }
});

// ============================================================
// 8. render glossary + analysis — cross-profile
// ============================================================

describe('v3 cross-profile: render glossary', () => {
  const formats = ['markdown', 'json', 'latex'] as const;

  for (const format of formats) {
    it(`render glossary as ${format} works with propositional`, () => {
      const out = runOk(
        'logic classical.propositional\n' + 'define D := P -> Q\n' + `render glossary as ${format}`,
      );
      expect(out.exitCode).toBe(0);
      if (format === 'markdown') expect(out.stdout).toContain('**D**');
      if (format === 'json') expect(out.stdout).toContain('"D"');
      if (format === 'latex') expect(out.stdout).toContain('\\newcommand');
    });
  }
});

describe('v3 cross-profile: render analysis', () => {
  for (const profile of PROPOSITIONAL_PROFILES) {
    it(`render analysis in ${profile}`, () => {
      const out = runOk(
        `logic ${profile}\n` +
          'define D := P -> Q\n' +
          'axiom A1 : P -> Q\n' +
          'render analysis as markdown',
      );
      expect(out.stdout).toContain('Análisis');
      expect(out.stdout).toContain('Definiciones');
      expect(out.stdout).toContain('Axiomas');
    });
  }
});

// ============================================================
// 9. Profile-specific operators inside define
// ============================================================

describe('v3 profile-specific operators in define', () => {
  // Modal: box/diamond
  it('modal.k: define with []P (necessity)', () => {
    const out = runOk('logic modal.k\ndefine NecP := []P\nunfold NecP');
    expect(out.stdout).toContain('Unfold');
  });

  it('modal.k: define with <>P (possibility)', () => {
    const out = runOk('logic modal.k\ndefine PosP := <>P\nunfold PosP');
    expect(out.stdout).toContain('Unfold');
  });

  // Deontic: O(...), P(...)
  it('deontic.standard: define with O(P) (obligation)', () => {
    const out = runOk('logic deontic.standard\ndefine Obligatorio := O(P)\nunfold Obligatorio');
    expect(out.stdout).toContain('Unfold');
  });

  // Epistemic: K(...)
  it('epistemic.s5: define with K(P) (knowledge)', () => {
    const out = runOk('logic epistemic.s5\ndefine Sabe := K(P)\nunfold Sabe');
    expect(out.stdout).toContain('Unfold');
  });

  // Epistemic: K(P) -> P is valid in S5
  it('epistemic.s5: define K(P) -> P is valid (veridicality)', () => {
    const out = runOk('logic epistemic.s5\ndefine Veridical := K(P) -> P\ncheck valid Veridical');
    expect(out.results[0].status).toBe('valid');
  });

  // Temporal: X(...), U(...)
  it('temporal.ltl: define with X(P) (next)', () => {
    const out = runOk('logic temporal.ltl\ndefine NextP := X(P)\nunfold NextP');
    expect(out.stdout).toContain('Unfold');
  });

  // FOL: predicates and quantifiers
  it('classical.first_order: define with predicate', () => {
    const out = runOk('logic classical.first_order\ndefine Human := P(x) -> Q(x)\nunfold Human');
    expect(out.stdout).toContain('Unfold');
  });

  it('classical.first_order: define + check valid (forall tautology)', () => {
    const out = runOk(
      'logic classical.first_order\n' + 'define T := forall x (P(x) -> P(x))\n' + 'check valid T',
    );
    expect(out.results[0].status).toBe('valid');
  });

  // Arithmetic: numeric operations
  it('arithmetic: define numeric expression + check valid', () => {
    const out = runOk('logic arithmetic\ndefine Expr := (2 + 3) * 2\ncheck valid (Expr > 5)');
    expect(out.results[0].status).toBe('valid');
  });

  // Paraconsistent: both values
  it('paraconsistent.belnap: define + check satisfiable', () => {
    const out = runOk('logic paraconsistent.belnap\ndefine Conj := P & Q\ncheck satisfiable Conj');
    expect(out.results[0].status).toBe('satisfiable');
  });

  // Intuitionistic: specific behaviors
  it('intuitionistic: define DNE (double negation elimination) is NOT valid', () => {
    const out = runOk(
      'logic intuitionistic.propositional\ndefine DNE := !!P -> P\ncheck valid DNE',
    );
    // DNE is NOT valid in intuitionistic logic
    expect(out.results[0].status).toBe('invalid');
  });

  it('intuitionistic: define (P -> P) IS valid', () => {
    const out = runOk('logic intuitionistic.propositional\ndefine Id := P -> P\ncheck valid Id');
    expect(out.results[0].status).toBe('valid');
  });

  // Aristotelian: syllogistic only supports its own formula types
  it('aristotelian.syllogistic: define + glossary', () => {
    const out = runOk(
      'logic aristotelian.syllogistic\n' +
        'define Regla := P -> Q\n' +
        'description "Una regla"\n' +
        'glossary',
    );
    expect(out.stdout).toContain('GLOSARIO');
    expect(out.stdout).toContain('Regla');
  });

  // Probabilistic
  it('probabilistic.basic: define + check valid', () => {
    const out = runOk('logic probabilistic.basic\ndefine Id := P -> P\ncheck valid Id');
    expect(out.results[0].status).toBe('valid');
  });
});

// ============================================================
// 10. Combination stress: define + source + interpret + all
// ============================================================

describe('v3 full workflow stress — per profile', () => {
  for (const profile of PROPOSITIONAL_PROFILES) {
    it(`full workflow (define+source+interpret+unfold+fold+glossary+render) in ${profile}`, () => {
      const out = runOk(
        `logic ${profile}\n` +
          'source Author {\n' +
          '  author "Test Author"\n' +
          '  work "Test Work"\n' +
          '  year 2025\n' +
          '}\n' +
          'define D := P -> Q\n' +
          'description "Test definition"\n' +
          'interpret "premise" as P -> Q\n' +
          'unfold D\n' +
          'fold (P -> Q)\n' +
          'glossary\n' +
          'render glossary as markdown\n' +
          'render analysis as markdown',
      );
      expect(out.stdout).toContain('Source');
      expect(out.stdout).toContain('Define');
      expect(out.stdout).toContain('Interpret');
      expect(out.stdout).toContain('Unfold');
      expect(out.stdout).toContain('Fold');
      expect(out.stdout).toContain('GLOSARIO');
      expect(out.stdout).toContain('**D**');
      expect(out.stdout).toContain('Análisis');
    });
  }
});

// ============================================================
// 11. Syntactic stress — edge cases, malformed input, limits
// ============================================================

describe('v3 syntactic stress', () => {
  // Many definitions at once
  it('50 chained definitions without error', () => {
    const defs = Array.from(
      { length: 50 },
      (_, i) => `define D${i} := ${i > 0 ? `D${i - 1} -> P${i}` : 'P0'}`,
    ).join('\n');
    const out = runOk(`logic classical.propositional\n${defs}\nglossary`);
    expect(out.stdout).toContain('D49');
    expect(out.stdout).toContain('GLOSARIO');
  });

  // Many sources
  it('20 source declarations without error', () => {
    const sources = Array.from(
      { length: 20 },
      (_, i) => `source S${i} {\n  author "Author${i}"\n  work "Work${i}"\n  year ${1900 + i}\n}`,
    ).join('\n');
    const out = runOk(`logic classical.propositional\n${sources}\nglossary`);
    expect(out.stdout).toContain('S19');
    expect(out.stdout).toContain('Fuentes');
  });

  // Many interpretations
  it('20 interpret commands without error', () => {
    const interps = Array.from({ length: 20 }, (_, i) => `interpret "text${i}" as P${i}`).join(
      '\n',
    );
    const out = runOk(`logic classical.propositional\n${interps}\nglossary`);
    expect(out.stdout).toContain('Interpretaciones');
    expect(out.stdout).toContain('text19');
  });

  // Deeply nested definition body
  it('define with deeply nested formula (10 levels of implication)', () => {
    // P -> (P -> (P -> ... ))
    let formula = 'P';
    for (let i = 0; i < 10; i++) formula = `(${formula} -> P)`;
    const out = runOk(`logic classical.propositional\ndefine Deep := ${formula}`);
    expect(out.stdout).toContain('Define');
    expect(out.stdout).toContain('Deep');
  });

  // Parametric define with many params
  it('define with 5 params', () => {
    const out = runOk(
      'logic classical.propositional\ndefine F(a, b, c, d, e) := a -> b -> c -> d -> e',
    );
    expect(out.stdout).toContain('F(a, b, c, d, e)');
  });

  // Empty source block
  it('source with no fields parses OK', () => {
    const out = runOk('logic classical.propositional\nsource Empty {\n}\nglossary');
    expect(out.stdout).toContain('Fuentes');
  });

  // Source redefinition warning
  it('source redefinition produces warning', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source S1 {\n  author "A"\n}\n' +
        'source S1 {\n  author "B"\n}\n' +
        'glossary',
    );
    // Should succeed but with a warning diagnostic
    const warnings = out.diagnostics.filter((d) => d.severity === 'warning');
    expect(warnings.length).toBeGreaterThan(0);
  });

  // Define overwrite
  it('redefining same name replaces the definition', () => {
    const out = runOk('logic classical.propositional\ndefine D := P\ndefine D := Q\nglossary');
    // Glossary should show Q, not P
    expect(out.stdout).toContain('Q');
  });

  // Circular: direct
  it('circular define (direct) is rejected', () => {
    const out = run('logic classical.propositional\ndefine Loop := Loop');
    expect(out.exitCode).not.toBe(0);
  });

  // Circular: indirect depth 2
  it('circular define (indirect depth 2) is rejected', () => {
    const out = run('logic classical.propositional\ndefine A := B\ndefine B := A');
    expect(out.exitCode).not.toBe(0);
  });

  // Circular: indirect depth 3
  it('circular define (indirect depth 3) is rejected', () => {
    const out = run('logic classical.propositional\ndefine A := B\ndefine B := C\ndefine C := A');
    expect(out.exitCode).not.toBe(0);
  });

  // Unfold on undefined name
  it('unfold on undefined name does not crash', () => {
    const out = runOk('logic classical.propositional\nunfold Unknown');
    expect(out.stdout).toContain('Unfold');
  });

  // Fold on formula matching no definition
  it('fold on non-matching formula returns as-is', () => {
    const out = runOk('logic classical.propositional\nfold (P -> Q)');
    expect(out.results[0].status).toBe('valid');
  });

  // Define inside theory block
  it('define inside theory block works', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'theory T {\n' +
        '  define D := P -> Q\n' +
        '  axiom A1 : D\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
  });

  // Multiple theory blocks with their own defines
  it('separate theory blocks each have own defines', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'theory T1 {\n' +
        '  define D := P\n' +
        '  axiom A1 : D\n' +
        '}\n' +
        'theory T2 {\n' +
        '  define D := Q\n' +
        '  axiom A1 : D\n' +
        '}',
    );
    expect(out.exitCode).toBe(0);
  });

  // Spanish aliases mixed with English
  it('mix of Spanish and English keywords', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'definir D := P -> Q\n' +
        'description "desc"\n' +
        'fuente S {\n' +
        '  author "Autor"\n' +
        '  work "Obra"\n' +
        '}\n' +
        'interpretar "texto" as P\n' +
        'desplegar D\n' +
        'plegar (P -> Q)\n' +
        'glosario',
    );
    expect(out.stdout).toContain('Define');
    expect(out.stdout).toContain('Source');
    expect(out.stdout).toContain('Interpret');
    expect(out.stdout).toContain('Unfold');
    expect(out.stdout).toContain('Fold');
    expect(out.stdout).toContain('GLOSARIO');
  });

  // Long definition name
  it('define with very long name (50 chars)', () => {
    const name = 'A'.repeat(50);
    const out = runOk(`logic classical.propositional\ndefine ${name} := P -> Q`);
    expect(out.stdout).toContain(name);
  });

  // Source with all fields
  it('source with all 6 fields', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source Full {\n' +
        '  author "Author"\n' +
        '  work "Work"\n' +
        '  year 2025\n' +
        '  section "Ch.1"\n' +
        '  edition "2nd"\n' +
        '  url "https://example.com"\n' +
        '}\n' +
        'glossary',
    );
    expect(out.stdout).toContain('Author');
    expect(out.stdout).toContain('Fuentes');
  });

  // Negative year in source
  it('source with negative year', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source Ancient {\n' +
        '  author "Parmenides"\n' +
        '  year -500\n' +
        '}',
    );
    expect(out.stdout).toContain('Parmenides');
  });

  // interpret with passageRef identifier
  it('interpret with identifier ref', () => {
    const out = runOk('logic classical.propositional\ninterpret MyRef as P -> Q');
    expect(out.stdout).toContain('Interpret');
    expect(out.stdout).toContain('MyRef');
  });

  // Glossary with no entries
  it('empty glossary is safe', () => {
    const out = runOk('logic classical.propositional\nglossary');
    expect(out.stdout).toContain('sin definiciones registradas');
  });

  // render glossary with no definitions
  it('render glossary with no definitions emits placeholder', () => {
    const out = runOk('logic classical.propositional\nrender glossary as markdown');
    expect(out.stdout).toContain('sin definiciones');
  });

  // render analysis with empty theory
  it('render analysis with no content is minimal', () => {
    const out = runOk('logic classical.propositional\nrender analysis as markdown');
    expect(out.stdout).toContain('Análisis');
  });

  // Export define
  it('export define works', () => {
    const out = runOk('logic classical.propositional\nexport define D := P -> Q');
    expect(out.stdout).toContain('Define');
  });
});

// ============================================================
// 12. Define interaction with other v2 features
// ============================================================

describe('v3 + v2 feature interactions', () => {
  // define + let binding
  it('define + let coexist', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define D := P -> Q\n' +
        'let x = P & Q\n' +
        'check valid (D | x | !(D | x))',
    );
    expect(out.results[0].status).toBe('valid');
  });

  // define + truth_table
  it('define expansion in truth_table', () => {
    const out = runOk('logic classical.propositional\ndefine D := P | !P\ntruth_table D');
    expect(out.stdout).toContain('T');
  });

  // define + countermodel
  it('define expansion in countermodel', () => {
    const out = runOk('logic classical.propositional\ndefine D := P\ncountermodel D');
    expect(out.results[0].status).toBe('invalid');
  });

  // define + check equivalent
  it('define + check equivalent', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define A := P -> Q\n' +
        'define B := !P | Q\n' +
        'check equivalent A, B',
    );
    expect(out.results[0].status).toBe('valid');
  });

  // define + prove
  it('define + prove', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define IMP := P -> Q\n' +
        'axiom A1 : IMP\n' +
        'axiom A2 : P\n' +
        'prove Q from {A1, A2}',
    );
    expect(out.results[0].status).toBe('provable');
  });

  // define + analyze (analyze works with raw formulas)
  it('define + analyze', () => {
    const out = runOk(
      'logic classical.propositional\n' + 'define IMP := P -> Q\n' + 'analyze {(P -> Q), P} -> Q',
    );
    expect(out.exitCode).toBe(0);
  });

  // define + explain
  it('define + explain', () => {
    const out = runOk('logic classical.propositional\ndefine T := P -> P\nexplain (P -> P)');
    expect(out.exitCode).toBe(0);
  });

  // define + truth_table (v2 feature)
  it('define + check satisfiable', () => {
    const out = runOk('logic classical.propositional\ndefine D := P & Q\ncheck satisfiable D');
    expect(out.results[0].status).toBe('satisfiable');
  });

  // define in if/else block
  it('define before if/else block works', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define T := P -> P\n' +
        'if valid (P | !P) {\n' +
        '  check valid T\n' +
        '}',
    );
    expect(out.results[0].status).toBe('valid');
  });

  // define with check inside if
  it('define + if valid with defined tautology', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define LEM := P | !P\n' +
        'if valid (P | !P) {\n' +
        '  print "LEM holds"\n' +
        '}',
    );
    expect(out.stdout).toContain('LEM holds');
  });

  // source + claim
  it('source + claim integration', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source S {\n' +
        '  author "Author"\n' +
        '  work "Work"\n' +
        '}\n' +
        'let p = passage([[ref#1]])\n' +
        'let phi = formalize p as (P -> Q)\n' +
        'claim C = phi\n' +
        'render analysis as markdown',
    );
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Análisis');
  });

  // define + passage + formalize
  it('define + passage coexistence', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define D := P -> Q\n' +
        'let p1 = passage([[ref#1]])\n' +
        'let phi = formalize p1 as (P -> Q)\n' +
        'glossary',
    );
    expect(out.stdout).toContain('GLOSARIO');
  });
});

// ============================================================
// 13. Heavy stress: many ops, large scripts
// ============================================================

describe('v3 heavy stress', () => {
  it('100 defines + check valid on the last one', () => {
    const defs = Array.from({ length: 100 }, (_, i) => `define D${i} := P${i} -> P${i}`).join('\n');
    const out = runOk(`logic classical.propositional\n${defs}\ncheck valid D99`);
    expect(out.results[0].status).toBe('valid');
  });

  it('50 defines + 50 unfolds', () => {
    const lines: string[] = [];
    for (let i = 0; i < 50; i++) {
      lines.push(`define D${i} := P${i} -> Q${i}`);
    }
    for (let i = 0; i < 50; i++) {
      lines.push(`unfold D${i}`);
    }
    const out = runOk(`logic classical.propositional\n${lines.join('\n')}`);
    expect(out.results).toHaveLength(50);
  });

  it('define chain depth 30 + unfold last', () => {
    const defs: string[] = ['define D0 := P'];
    for (let i = 1; i < 30; i++) {
      defs.push(`define D${i} := D${i - 1} -> Q${i}`);
    }
    defs.push('unfold D29');
    const out = runOk(`logic classical.propositional\n${defs.join('\n')}`);
    expect(out.stdout).toContain('Unfold');
  });

  it('10 sources + 10 defines + 10 interprets + glossary', () => {
    const lines: string[] = [];
    for (let i = 0; i < 10; i++) {
      lines.push(`source S${i} {\n  author "A${i}"\n  work "W${i}"\n  year ${2000 + i}\n}`);
    }
    for (let i = 0; i < 10; i++) {
      lines.push(`define D${i} := P${i} -> Q${i}\ndescription "Desc ${i}"`);
    }
    for (let i = 0; i < 10; i++) {
      lines.push(`interpret "text ${i}" as P${i}`);
    }
    lines.push('glossary');
    const out = runOk(`logic classical.propositional\n${lines.join('\n')}`);
    expect(out.stdout).toContain('GLOSARIO');
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Interpretaciones');
    expect(out.stdout).toContain('D9');
    expect(out.stdout).toContain('S9');
    expect(out.stdout).toContain('text 9');
  });

  it('render analysis with all v3 features combined', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source Frege {\n  author "Frege"\n  work "Begriffsschrift"\n  year 1879\n}\n' +
        'define Impl(x, y) := x -> y\n' +
        'description "Implicación material"\n' +
        'define LEM := P | !P\n' +
        'description "Ley del tercero excluido"\n' +
        'axiom A1 : P -> Q\n' +
        'axiom A2 : P\n' +
        'theorem T1 = Q\n' +
        'interpret "si P entonces Q" as P -> Q\n' +
        'check valid LEM\n' +
        'check valid Impl(P, P)\n' +
        'derive Q from {A1, A2}\n' +
        'glossary\n' +
        'render glossary as json\n' +
        'render analysis as markdown',
    );
    expect(out.stdout).toContain('Análisis');
    expect(out.stdout).toContain('Definiciones');
    expect(out.stdout).toContain('Axiomas');
    expect(out.stdout).toContain('Fuentes');
    expect(out.stdout).toContain('Verificaciones');
    expect(out.results.length).toBeGreaterThanOrEqual(3);
  });

  // Parametric define with all propositional profiles
  it('parametric define Impl(x,y) := x -> y + check valid Impl(A,A) across all propositional profiles', () => {
    const validProfiles = [
      'classical.propositional',
      'classical.first_order',
      'modal.k',
      'deontic.standard',
      'epistemic.s5',
      'intuitionistic.propositional',
      'temporal.ltl',
      'probabilistic.basic',
    ];
    for (const profile of validProfiles) {
      const out = runOk(
        `logic ${profile}\n` + 'define Impl(x, y) := x -> y\n' + 'check valid Impl(A, A)',
      );
      expect(out.results[0].status).toBe('valid');
    }
  });
});

// ============================================================
// 14. Regression guards
// ============================================================

describe('v3 regression guards', () => {
  // Ensure define doesn't break normal axiom/theorem workflow
  it('normal axiom+theorem workflow unaffected by define presence', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define D := P -> Q\n' +
        'axiom A1 : P -> Q\n' +
        'axiom A2 : Q -> R\n' +
        'theorem T1 = P -> R\n' +
        'derive R from {A1, A2, T1}',
    );
    // Should be provable as before
    expect(out.results.length).toBeGreaterThan(0);
  });

  // Ensure source doesn't interfere with text layer
  it('source + passage + claim coexist without errors', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'source S {\n  author "A"\n  work "W"\n}\n' +
        'let p1 = passage([[ref#1]])\n' +
        'let phi = formalize p1 as P\n' +
        'claim C = phi\n' +
        'render analysis as markdown',
    );
    expect(out.exitCode).toBe(0);
  });

  // Ensure glossary after complex theory
  it('glossary after theory with extends', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'theory Base {\n' +
        '  axiom A1 : P -> Q\n' +
        '}\n' +
        'theory Ext extends Base {\n' +
        '  axiom A2 : Q -> R\n' +
        '}\n' +
        'define D := P -> R\n' +
        'glossary',
    );
    expect(out.stdout).toContain('GLOSARIO');
    expect(out.stdout).toContain('D');
  });

  // for loop with define
  it('define before for loop', () => {
    const out = runOk(
      'logic classical.propositional\n' +
        'define T := P -> P\n' +
        'for F in {P, Q, R} {\n' +
        '  check valid (F -> F)\n' +
        '}\n' +
        'check valid T',
    );
    // 3 checks from loop + 1 final check = 4 results
    expect(out.results.length).toBe(4);
    expect(out.results[3].status).toBe('valid');
  });
});
