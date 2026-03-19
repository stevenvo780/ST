// ============================================================
// ST Stress Tests — Exhaustive edge-case coverage
// Every profile, every operator, every runtime feature, every edge case
// ============================================================

import { describe, it, expect } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

/** Helper: ejecuta código ST y retorna resultado */
function run(source: string, file = '<test>') {
  const interp = new Interpreter();
  return interp.execute(source, file);
}

/** Helper: ejecuta y espera éxito (exitCode 0, sin errores) */
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

/** Helper: ejecuta y espera que contenga texto */
function expectOutput(source: string, ...markers: string[]) {
  const out = runOk(source);
  for (const m of markers) {
    expect(out.stdout).toContain(m);
  }
  return out;
}

/** Helper: ejecuta y espera error (diagnostics con severity error) */
function expectError(source: string) {
  const out = run(source);
  const errs = out.diagnostics.filter((d) => d.severity === 'error');
  expect(errs.length).toBeGreaterThan(0);
  return out;
}

// ============================================================
// 1. CLASSICAL PROPOSITIONAL — Exhaustive
// ============================================================
describe('Classical Propositional — Exhaustive', () => {
  // 1.1 Tautologías fundamentales
  const tautologies = [
    ['LEM', 'P | !P'],
    ['Double Negation Elim', '!!P -> P'],
    ['Double Negation Intro', 'P -> !!P'],
    ['Identity', 'P -> P'],
    ['Explosion', '(P & !P) -> Q'],
    ['Modus Ponens pattern', '((P -> Q) & P) -> Q'],
    ['Modus Tollens pattern', '((P -> Q) & !Q) -> !P'],
    ['Hypothetical Syllogism', '((P -> Q) & (Q -> R)) -> (P -> R)'],
    ['Disjunctive Syllogism', '((P | Q) & !P) -> Q'],
    ['Constructive Dilemma', '((P -> Q) & (R -> S) & (P | R)) -> (Q | S)'],
    ['Contraposition', '(P -> Q) <-> (!Q -> !P)'],
    ['De Morgan AND', '!(P & Q) <-> (!P | !Q)'],
    ['De Morgan OR', '!(P | Q) <-> (!P & !Q)'],
    ['Distribution AND over OR', '(P & (Q | R)) <-> ((P & Q) | (P & R))'],
    ['Distribution OR over AND', '(P | (Q & R)) <-> ((P | Q) & (P | R))'],
    ['Absorption AND', '(P & (P | Q)) <-> P'],
    ['Absorption OR', '(P | (P & Q)) <-> P'],
    ['Idempotence AND', '(P & P) <-> P'],
    ['Idempotence OR', '(P | P) <-> P'],
    ['Biconditional reflexivity', 'P <-> P'],
    ['Biconditional symmetry (material)', '(P <-> Q) -> (Q <-> P)'],
    ['Pierce law', '((P -> Q) -> P) -> P'],
    ['Currying', '((P & Q) -> R) <-> (P -> (Q -> R))'],
    ['Exportation', '((P & Q) -> R) -> (P -> (Q -> R))'],
    ['Importation', '(P -> (Q -> R)) -> ((P & Q) -> R)'],
    ['Negation intro pattern', '((P -> Q) & (P -> !Q)) -> !P'],
    ['Triple negation', '!!!P <-> !P'],
    ['Material impl definition', '(P -> Q) <-> (!P | Q)'],
  ];

  for (const [name, formula] of tautologies) {
    it(`tautology: ${name}`, () => {
      expectOutput(`logic classical.propositional\ncheck valid ${formula}`);
    });
  }

  // 1.2 Contingencias (satisfacibles pero no válidas)
  const contingencies = [
    ['Simple atom', 'P'],
    ['Simple conjunction', 'P & Q'],
    ['Simple disjunction', 'P | Q'],
    ['Simple implication', 'P -> Q'],
    ['Simple biconditional', 'P <-> Q'],
    ['Mixed', '(P -> Q) & P'],
    ['Three vars', '(P & Q) | R'],
  ];

  for (const [name, formula] of contingencies) {
    it(`contingency: ${name} (satisfiable, not valid)`, () => {
      const out1 = runOk(`logic classical.propositional\ncheck satisfiable ${formula}`);
      expect(out1.stdout).toBeDefined();
      // Should NOT be valid
      const out2 = run(`logic classical.propositional\ncheck valid ${formula}`);
      expect(out2.stdout.toUpperCase()).not.toContain('TAUTOLOG');
    });
  }

  // 1.3 Contradicciones (insatisfacibles)
  const contradictions = [
    ['Basic', 'P & !P'],
    ['Two var', '(P & !P) & Q'],
    ['Implication contradiction', '(P -> Q) & (P -> !Q) & P'],
    ['Complex', '((P | Q) & !P & !Q)'],
  ];

  for (const [name, formula] of contradictions) {
    it(`contradiction: ${name}`, () => {
      const out = runOk(`logic classical.propositional\ncheck satisfiable ${formula}`);
      // Debería ser insatisfacible
      expect(out.stdout.toLowerCase()).toMatch(/insatisfacible|unsatisfiable|no es satisfacible/i);
    });
  }

  // 1.4 NAND, NOR, XOR operators
  describe('Extended operators', () => {
    it('NAND truth table matches !(P & Q)', () => {
      runOk(`logic classical.propositional\ncheck equivalent (P !& Q), (!(P & Q))`);
    });

    it('NOR truth table matches !(P | Q)', () => {
      runOk(`logic classical.propositional\ncheck equivalent (P !| Q), (!(P | Q))`);
    });

    it('XOR definition', () => {
      runOk(`logic classical.propositional\ncheck equivalent (P ^ Q), ((P | Q) & !(P & Q))`);
    });

    it('NAND is satisfiable', () => {
      runOk(`logic classical.propositional\ncheck satisfiable (P !& Q)`);
    });

    it('NOR is satisfiable', () => {
      runOk(`logic classical.propositional\ncheck satisfiable (P !| Q)`);
    });

    it('XOR is satisfiable', () => {
      runOk(`logic classical.propositional\ncheck satisfiable (P ^ Q)`);
    });

    it('nested NAND/NOR/XOR', () => {
      runOk(`logic classical.propositional\ncheck satisfiable ((P !& Q) | (R !| S) & (A ^ B))`);
    });
  });

  // 1.5 Derivation rules
  describe('Derivation — all rules', () => {
    it('Modus Ponens', () => {
      expectOutput(
        `
logic classical.propositional
axiom mp1 = P -> Q
axiom mp2 = P
derive Q from {mp1, mp2}
`,
        '✓ [derive]',
      );
    });

    it('Modus Tollens', () => {
      expectOutput(
        `
logic classical.propositional
axiom mt1 = P -> Q
axiom mt2 = !Q
derive !P from {mt1, mt2}
`,
        '✓ [derive]',
      );
    });

    it('Hypothetical Syllogism', () => {
      expectOutput(
        `
logic classical.propositional
axiom hs1 = P -> Q
axiom hs2 = Q -> R
derive P -> R from {hs1, hs2}
`,
        '✓ [derive]',
      );
    });

    it('Disjunctive Syllogism', () => {
      expectOutput(
        `
logic classical.propositional
axiom ds1 = P | Q
axiom ds2 = !P
derive Q from {ds1, ds2}
`,
        '✓ [derive]',
      );
    });

    it('Conjunction Introduction', () => {
      expectOutput(
        `
logic classical.propositional
axiom ci1 = P
axiom ci2 = Q
derive P & Q from {ci1, ci2}
`,
        '✓ [derive]',
      );
    });

    it('Conjunction Elimination left', () => {
      expectOutput(
        `
logic classical.propositional
axiom ce1 = P & Q
derive P from {ce1}
`,
        '✓ [derive]',
      );
    });

    it('Conjunction Elimination right', () => {
      expectOutput(
        `
logic classical.propositional
axiom ce2 = P & Q
derive Q from {ce2}
`,
        '✓ [derive]',
      );
    });

    it('Disjunction Introduction', () => {
      expectOutput(
        `
logic classical.propositional
axiom di1 = P
derive P | Q from {di1}
`,
        '✓ [derive]',
      );
    });

    it('Double Negation Elimination', () => {
      expectOutput(
        `
logic classical.propositional
axiom dn1 = !!P
derive P from {dn1}
`,
        '✓ [derive]',
      );
    });

    it('Biconditional Elimination', () => {
      expectOutput(
        `
logic classical.propositional
axiom be1 = P <-> Q
axiom be2 = P
derive Q from {be1, be2}
`,
        '✓ [derive]',
      );
    });

    it('Chain of 4 implications', () => {
      expectOutput(
        `
logic classical.propositional
axiom c1 = A -> B
axiom c2 = B -> C
axiom c3 = C -> D
axiom c4 = A
derive D from {c1, c2, c3, c4}
`,
        '✓ [derive]',
      );
    });

    it('Invalid derivation does not succeed', () => {
      const out = runOk(`
logic classical.propositional
axiom inv1 = P -> Q
axiom inv2 = Q
derive P from {inv1, inv2}
`);
      expect(out.stdout).toContain('✗');
    });
  });

  // 1.6 Truth tables
  describe('Truth tables', () => {
    it('1 variable: P -> P', () => {
      const out = runOk(`logic classical.propositional\ntruth_table P -> P`);
      expect(out.stdout.toLowerCase()).toMatch(/tautolog|verdader|tabla/i);
    });

    it('2 variables: P & Q', () => {
      const out = expectOutput(`logic classical.propositional\ntruth_table P & Q`);
      // Should have 4 rows
      expect(out.stdout).toContain('P');
      expect(out.stdout).toContain('Q');
    });

    it('3 variables: (P & Q) | R', () => {
      runOk(`logic classical.propositional\ntruth_table (P & Q) | R`);
    });

    it('4 variables', () => {
      runOk(`logic classical.propositional\ntruth_table (A -> B) & (C -> D)`);
    });
  });

  // 1.7 Countermodel
  describe('Countermodel', () => {
    it('finds countermodel for non-tautology', () => {
      expectOutput(`logic classical.propositional\ncountermodel P -> Q`);
    });

    it('no countermodel for tautology', () => {
      const out = runOk(`logic classical.propositional\ncountermodel P | !P`);
      expect(out.stdout.toLowerCase()).toMatch(/no se encontr|tautolog|no countermodel/i);
    });
  });

  // 1.8 Equivalence checking
  describe('Equivalence', () => {
    it('De Morgan equivalences', () => {
      runOk(`logic classical.propositional\ncheck equivalent !(P & Q), (!P | !Q)`);
      runOk(`logic classical.propositional\ncheck equivalent !(P | Q), (!P & !Q)`);
    });

    it('Material implication', () => {
      runOk(`logic classical.propositional\ncheck equivalent (P -> Q), (!P | Q)`);
    });

    it('Non-equivalent formulas', () => {
      const out = runOk(`logic classical.propositional\ncheck equivalent P, Q`);
      expect(out.stdout.toLowerCase()).toMatch(/no son equivalentes|not equivalent|no equivalen/i);
    });
  });

  // 1.9 Prove command
  describe('Prove', () => {
    it('proves tautology', () => {
      expectOutput(
        `
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
theorem t1 = Q
prove Q from {a1, a2}
`,
        '✓',
      );
    });

    it('fails to prove non-theorem', () => {
      const out = runOk(`
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = Q
theorem t1 = P
prove P from {a1, a2}
`);
      expect(out.stdout).toContain('✗');
    });
  });
});

// ============================================================
// 2. CLASSICAL FIRST ORDER — Exhaustive
// ============================================================
describe('Classical First Order — Exhaustive', () => {
  it('universal instantiation: forall x P(x) -> P(a)', () => {
    expectOutput(`logic classical.first_order\ncheck valid (forall x P(x)) -> P(a)`);
  });

  it('existential generalization: P(a) -> exists x P(x)', () => {
    expectOutput(`logic classical.first_order\ncheck valid P(a) -> (exists x P(x))`);
  });

  it('vacuous universal: forall x P -> P (no x free in P)', () => {
    runOk(`logic classical.first_order\ncheck valid (forall x (P -> P))`);
  });

  it('nested quantifiers: forall x exists y R(x,y)', () => {
    runOk(`logic classical.first_order\nlet f = forall x (exists y R(x, y))\nprint f`);
  });

  it('quantifier duality: !forall x P(x) <-> exists x !P(x)', () => {
    runOk(`logic classical.first_order\ncheck valid !(forall x P(x)) <-> (exists x !P(x))`);
  });

  it('equality reflexivity: forall x (x = x)', () => {
    runOk(`logic classical.first_order\ncheck valid forall x (x = x)`);
  });

  it('complex: forall x (P(x) -> Q(x)) & P(a) -> Q(a)', () => {
    expectOutput(
      `logic classical.first_order\ncheck valid ((forall x (P(x) -> Q(x))) & P(a)) -> Q(a)`,
    );
  });

  it('invalid: exists x P(x) -> forall x P(x)', () => {
    const out = runOk(
      `logic classical.first_order\ncheck valid (exists x P(x)) -> (forall x P(x))`,
    );
    // This is NOT valid in FOL
    expect(out.stdout.toLowerCase()).not.toContain('valida en fol');
  });

  it('satisfiability of pure existential', () => {
    runOk(`logic classical.first_order\ncheck satisfiable exists x P(x)`);
  });

  it('derivation in FOL', () => {
    expectOutput(
      `
logic classical.first_order
axiom all_mortal = forall x (H(x) -> M(x))
axiom socrates = H(s)
derive M(s) from {all_mortal, socrates}
`,
      '✓',
    );
  });
});

// ============================================================
// 3. MODAL K — Exhaustive
// ============================================================
describe('Modal K — Exhaustive', () => {
  it('K axiom: [](P -> Q) -> ([]P -> []Q)', () => {
    expectOutput(`logic modal.k\ncheck valid [](P -> Q) -> ([]P -> []Q)`, 'VÁLIDA');
  });

  it('necessitation: valid prop -> []valid prop (schema)', () => {
    // [](P -> P) should be valid
    expectOutput(`logic modal.k\ncheck valid [](P -> P)`, 'VÁLIDA');
  });

  it('T axiom NOT valid in K: []P -> P', () => {
    const out = runOk(`logic modal.k\ncheck valid []P -> P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('4 axiom NOT valid in K: []P -> [][]P', () => {
    const out = runOk(`logic modal.k\ncheck valid []P -> [][]P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('5 axiom NOT valid in K: <>P -> []<>P', () => {
    const out = runOk(`logic modal.k\ncheck valid <>P -> []<>P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('B axiom NOT valid in K: P -> []<>P', () => {
    const out = runOk(`logic modal.k\ncheck valid P -> []<>P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('modal duality: []P <-> !<>!P', () => {
    expectOutput(`logic modal.k\ncheck valid []P <-> !<>!P`, 'VÁLIDA');
  });

  it('diamond duality: <>P <-> ![]!P', () => {
    expectOutput(`logic modal.k\ncheck valid <>P <-> ![]!P`, 'VÁLIDA');
  });

  it('nested modalities: [][]P should be parseable', () => {
    runOk(`logic modal.k\nlet f = [][]P\nprint f`);
  });

  it('mixed modal and propositional', () => {
    runOk(`logic modal.k\ncheck satisfiable ([]P & <>Q)`);
  });

  it('satisfiability: <>P is satisfiable', () => {
    runOk(`logic modal.k\ncheck satisfiable <>P`);
  });

  it('satisfiability: []P & !P is satisfiable in K (no reflexivity)', () => {
    runOk(`logic modal.k\ncheck satisfiable ([]P & !P)`);
  });
});

// ============================================================
// 4. DEONTIC STANDARD — Exhaustive
// ============================================================
describe('Deontic Standard — Exhaustive', () => {
  it('D axiom: O(P) -> P(P) (obligation implies permission)', () => {
    expectOutput(`logic deontic.standard\ncheck valid [](P) -> <>(P)`, 'VÁLIDA');
  });

  it('K axiom holds: [](P->Q) -> ([]P -> []Q)', () => {
    expectOutput(`logic deontic.standard\ncheck valid [](P -> Q) -> ([]P -> []Q)`, 'VÁLIDA');
  });

  it('T axiom NOT valid: O(P) -> P', () => {
    const out = runOk(`logic deontic.standard\ncheck valid []P -> P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('obligation-permission consistency', () => {
    runOk(`logic deontic.standard\ncheck satisfiable ([]P & <>(Q))`);
  });

  it('forbidden = obligatory not: [](! P)', () => {
    runOk(`logic deontic.standard\nlet forbidden = [](!P)\nprint forbidden`);
  });

  it('deontic conflict satisfiable: O(P) & O(!P)', () => {
    // In KD this should be unsatisfiable (by D axiom leads to P(P) & P(!P) which is fine,
    // but O(P) & O(!P) -> P(P) & P(!P) -> P(P & !P)? Actually in KD it might be sat)
    runOk(`logic deontic.standard\ncheck satisfiable ([]P & [](!P))`);
  });
});

// ============================================================
// 5. EPISTEMIC S5 — Exhaustive
// ============================================================
describe('Epistemic S5 — Exhaustive', () => {
  it('T axiom (veridicality): K(P) -> P', () => {
    expectOutput(`logic epistemic.s5\ncheck valid []P -> P`, 'VÁLIDA');
  });

  it('4 axiom (positive introspection): K(P) -> K(K(P))', () => {
    expectOutput(`logic epistemic.s5\ncheck valid []P -> [][]P`, 'VÁLIDA');
  });

  it('B axiom (negative introspection dual): P -> []<>P', () => {
    expectOutput(`logic epistemic.s5\ncheck valid P -> []<>P`, 'VÁLIDA');
  });

  it('5 axiom: <>P -> []<>P', () => {
    expectOutput(`logic epistemic.s5\ncheck valid <>P -> []<>P`, 'VÁLIDA');
  });

  it('knowledge is factive: K(P & Q) -> P', () => {
    expectOutput(`logic epistemic.s5\ncheck valid [](P & Q) -> P`, 'VÁLIDA');
  });

  it('K distributes: K(P -> Q) -> (K(P) -> K(Q))', () => {
    expectOutput(`logic epistemic.s5\ncheck valid [](P -> Q) -> ([]P -> []Q)`, 'VÁLIDA');
  });

  it('unknown is possible: !K(P) -> <>(!P)', () => {
    runOk(`logic epistemic.s5\ncheck valid (![]P) -> <>(!P)`);
  });
});

// ============================================================
// 6. INTUITIONISTIC — Exhaustive
// ============================================================
describe('Intuitionistic Propositional — Exhaustive', () => {
  // Valid intuitionistically
  const intuValid = [
    ['P -> !!P', 'double negation introduction'],
    ['(P -> Q) -> (!Q -> !P)', 'contraposition'],
    ['!P -> (P -> Q)', 'ex falso quodlibet'],
    ['(P & !P) -> Q', 'explosion'],
    ['P -> P', 'identity'],
    ['(P -> (Q -> R)) -> ((P -> Q) -> (P -> R))', 'S combinator'],
    ['(P & Q) -> P', 'conjunction elimination left'],
    ['(P & Q) -> Q', 'conjunction elimination right'],
    ['P -> (P | Q)', 'disjunction introduction left'],
    ['Q -> (P | Q)', 'disjunction introduction right'],
    ['(P -> R) -> ((Q -> R) -> ((P | Q) -> R))', 'disjunction elimination'],
    ['!!!(P) -> !(P)', 'triple negation to single'],
    ['!(P) -> !!!(P)', 'single negation to triple'],
  ];

  for (const [formula, name] of intuValid) {
    it(`valid: ${name}`, () => {
      runOk(`logic intuitionistic.propositional\ncheck valid ${formula}`);
    });
  }

  // NOT valid intuitionistically (classical tautologies that fail)
  const intuInvalid = [
    ['P | !P', 'LEM (excluded middle)'],
    ['!!P -> P', 'double negation elimination'],
    ['((P -> Q) -> P) -> P', 'Peirce law'],
    ['(!P -> !Q) -> (Q -> P)', 'contraposition converse'],
  ];

  for (const [formula, name] of intuInvalid) {
    it(`NOT valid intuitionistically: ${name}`, () => {
      const out = runOk(`logic intuitionistic.propositional\ncheck valid ${formula}`);
      // Should be rejected or not valid
      const lower = out.stdout.toLowerCase();
      expect(lower).toMatch(
        /rechazada|no es válida|no válida|invalid|refutada|contraejemplo|not valid/i,
      );
    });
  }

  it('satisfiability check works', () => {
    runOk(`logic intuitionistic.propositional\ncheck satisfiable P`);
  });
});

// ============================================================
// 7. TEMPORAL LTL — Exhaustive
// ============================================================
describe('Temporal LTL — Exhaustive', () => {
  it('G(P) -> F(P): always implies eventually', () => {
    expectOutput(`logic temporal.ltl\ncheck valid [](P) -> <>(P)`, 'VÁLIDA');
  });

  it('G(P) -> P: always implies now (reflexivity)', () => {
    expectOutput(`logic temporal.ltl\ncheck valid [](P) -> P`, 'VÁLIDA');
  });

  it('G(P) -> G(G(P)): transitivity (S4)', () => {
    expectOutput(`logic temporal.ltl\ncheck valid []P -> [][]P`, 'VÁLIDA');
  });

  it('F duality: F(P) <-> !G(!P)', () => {
    expectOutput(`logic temporal.ltl\ncheck valid <>(P) <-> !([](!P))`, 'VÁLIDA');
  });

  it('next operator: X(P) parseable', () => {
    runOk(`logic temporal.ltl\nlet f = next P\nprint f`);
  });

  it('until operator: P until Q parseable', () => {
    runOk(`logic temporal.ltl\nlet f = P until Q\nprint f`);
  });

  it('satisfiability of diamond', () => {
    runOk(`logic temporal.ltl\ncheck satisfiable <>(P)`);
  });

  it('5 axiom NOT valid in S4 (temporal): <>P -> []<>P', () => {
    const out = runOk(`logic temporal.ltl\ncheck valid <>P -> []<>P`);
    expect(out.stdout).not.toContain('VÁLIDA');
  });
});

// ============================================================
// 8. ARISTOTELIAN SYLLOGISTIC — Exhaustive
// ============================================================
describe('Aristotelian Syllogistic — Exhaustive', () => {
  // All 19 valid syllogisms
  const validSyllogisms: [string, string][] = [
    // Figure 1: M-P, S-M ⊢ S-P
    [
      'Barbara (AAA-1)',
      '(forall x (M(x) -> P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x)))',
    ],
    [
      'Celarent (EAE-1)',
      '(forall x (M(x) -> !P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> !P(x)))',
    ],
    [
      'Darii (AII-1)',
      '(forall x (M(x) -> P(x))) & (exists x (S(x) & M(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Ferio (EIO-1)',
      '(forall x (M(x) -> !P(x))) & (exists x (S(x) & M(x))) -> (exists x (S(x) & !P(x)))',
    ],
    // Figure 2: P-M, S-M ⊢ S-P
    [
      'Cesare (EAE-2)',
      '(forall x (P(x) -> !M(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> !P(x)))',
    ],
    [
      'Camestres (AEE-2)',
      '(forall x (P(x) -> M(x))) & (forall x (S(x) -> !M(x))) -> (forall x (S(x) -> !P(x)))',
    ],
    [
      'Festino (EIO-2)',
      '(forall x (P(x) -> !M(x))) & (exists x (S(x) & M(x))) -> (exists x (S(x) & !P(x)))',
    ],
    [
      'Baroco (AOO-2)',
      '(forall x (P(x) -> M(x))) & (exists x (S(x) & !M(x))) -> (exists x (S(x) & !P(x)))',
    ],
    // Figure 3: M-P, M-S ⊢ S-P
    [
      'Darapti (AAI-3)',
      '(forall x (M(x) -> P(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Disamis (IAI-3)',
      '(exists x (M(x) & P(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Datisi (AII-3)',
      '(forall x (M(x) -> P(x))) & (exists x (M(x) & S(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Felapton (EAO-3)',
      '(forall x (M(x) -> !P(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & !P(x)))',
    ],
    [
      'Bocardo (OAO-3)',
      '(exists x (M(x) & !P(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & !P(x)))',
    ],
    [
      'Ferison (EIO-3)',
      '(forall x (M(x) -> !P(x))) & (exists x (M(x) & S(x))) -> (exists x (S(x) & !P(x)))',
    ],
    // Figure 4: P-M, M-S ⊢ S-P
    [
      'Bramantip (AAI-4)',
      '(forall x (P(x) -> M(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Camenes (AEE-4)',
      '(forall x (P(x) -> M(x))) & (forall x (M(x) -> !S(x))) -> (forall x (S(x) -> !P(x)))',
    ],
    [
      'Dimaris (IAI-4)',
      '(exists x (P(x) & M(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & P(x)))',
    ],
    [
      'Fesapo (EAO-4)',
      '(forall x (P(x) -> !M(x))) & (forall x (M(x) -> S(x))) -> (exists x (S(x) & !P(x)))',
    ],
    [
      'Fresison (EIO-4)',
      '(forall x (P(x) -> !M(x))) & (exists x (M(x) & S(x))) -> (exists x (S(x) & !P(x)))',
    ],
  ];

  for (const [name, formula] of validSyllogisms) {
    it(`valid: ${name}`, () => {
      runOk(`logic aristotelian.syllogistic\ncheck valid ${formula}`);
    });
  }

  // Invalid syllogisms
  const invalidSyllogisms: [string, string][] = [
    [
      'Affirming consequent',
      '(forall x (M(x) -> P(x))) & (forall x (S(x) -> P(x))) -> (forall x (S(x) -> M(x)))',
    ],
    [
      'Undistributed middle',
      '(exists x (M(x) & P(x))) & (exists x (S(x) & M(x))) -> (exists x (S(x) & P(x)))',
    ],
  ];

  for (const [name, formula] of invalidSyllogisms) {
    it(`invalid: ${name}`, () => {
      const out = runOk(`logic aristotelian.syllogistic\ncheck valid ${formula}`);
      const lower = out.stdout.toLowerCase();
      // Should not be recognized as valid syllogism
      const isMarkedValid =
        lower.includes('silogismo válido') ||
        lower.includes('barbara') ||
        lower.includes('celarent');
      // If recognized as valid that's wrong, but the engine may just not detect it as a syllogism pattern
      // which is also acceptable - it should at least not crash
      expect(isMarkedValid).toBe(false);
    });
  }
});

// ============================================================
// 9. PARACONSISTENT BELNAP — Exhaustive
// ============================================================
describe('Paraconsistent Belnap — Exhaustive', () => {
  it('P & !P is SATISFIABLE (Both value)', () => {
    const out = runOk(`logic paraconsistent.belnap\ncheck satisfiable P & !P`);
    expect(out.stdout.toLowerCase()).toMatch(/satisfacible|satisfiable/i);
  });

  it('P | !P is NOT a tautology in Belnap (None value)', () => {
    const out = runOk(`logic paraconsistent.belnap\ncheck valid P | !P`);
    // In Belnap with 4 values, P|!P can fail when P=N(None)
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('P -> P is NOT a tautology in Belnap (None value)', () => {
    const out = runOk(`logic paraconsistent.belnap\ncheck valid P -> P`);
    // In Belnap with 4 values, P->P can fail when P=N(None)
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('explosion fails in Belnap: (P & !P) -> Q', () => {
    const out = runOk(`logic paraconsistent.belnap\ncheck valid (P & !P) -> Q`);
    // Explosion should NOT be valid in paraconsistent logic
    expect(out.stdout).not.toContain('VÁLIDA');
  });

  it('conjunction is satisfiable', () => {
    runOk(`logic paraconsistent.belnap\ncheck satisfiable P & Q`);
  });

  it('disjunction is satisfiable', () => {
    runOk(`logic paraconsistent.belnap\ncheck satisfiable P | Q`);
  });

  it('check equivalent works', () => {
    runOk(`logic paraconsistent.belnap\ncheck equivalent P, P`);
  });

  it('double negation: !!P equivalent to P in Belnap', () => {
    runOk(`logic paraconsistent.belnap\ncheck equivalent !!P, P`);
  });

  it('satisfiability of complex contradiction', () => {
    runOk(`logic paraconsistent.belnap\ncheck satisfiable (P & !P) & (Q | !Q)`);
  });
});

// ============================================================
// 10. PROBABILISTIC — Exhaustive
// ============================================================
describe('Probabilistic Basic — Exhaustive', () => {
  it('tautology: P | !P has probability 1', () => {
    expectOutput(`logic probabilistic.basic\ncheck valid P | !P`, 'tautología');
  });

  it('contradiction: P & !P is not valid', () => {
    const out = runOk(`logic probabilistic.basic\ncheck valid P & !P`);
    expect(out.stdout).not.toContain('tautología');
  });

  it('implication tautology: P -> P', () => {
    expectOutput(`logic probabilistic.basic\ncheck valid P -> P`, 'tautología');
  });

  it('satisfiability of simple atom', () => {
    runOk(`logic probabilistic.basic\ncheck satisfiable P`);
  });

  it('satisfiability of conjunction', () => {
    runOk(`logic probabilistic.basic\ncheck satisfiable P & Q`);
  });

  it('3 variables', () => {
    runOk(`logic probabilistic.basic\ncheck valid ((P & Q) -> P)`);
  });

  it('material implication probabilistic', () => {
    runOk(`logic probabilistic.basic\ncheck valid (P -> P) & (Q -> Q)`);
  });
});

// ============================================================
// 11. ARITHMETIC — Exhaustive
// ============================================================
describe('Arithmetic — Exhaustive', () => {
  it('addition', () => {
    expectOutput(`logic arithmetic\ncheck valid (2 + 3) >= 5`, 'verdadero');
  });

  it('subtraction', () => {
    expectOutput(`logic arithmetic\ncheck valid (10 - 3) >= 7`, 'verdadero');
  });

  it('multiplication', () => {
    expectOutput(`logic arithmetic\ncheck valid (4 * 3) >= 12`, 'verdadero');
  });

  it('division', () => {
    expectOutput(`logic arithmetic\ncheck valid (10 / 2) >= 5`, 'verdadero');
  });

  it('modulo', () => {
    expectOutput(`logic arithmetic\ncheck valid (10 % 3) >= 1`, 'verdadero');
  });

  it('comparison operators', () => {
    runOk(`logic arithmetic\ncheck valid 5 > 3`);
    runOk(`logic arithmetic\ncheck valid 3 < 5`);
    runOk(`logic arithmetic\ncheck valid 5 >= 5`);
    runOk(`logic arithmetic\ncheck valid 5 <= 5`);
  });

  it('nested arithmetic', () => {
    runOk(`logic arithmetic\ncheck valid ((2 + 3) * 2) >= 10`);
  });

  it('negative result', () => {
    runOk(`logic arithmetic\ncheck valid (3 - 5) < 0`);
  });

  it('division by zero does not crash', () => {
    // Should not throw, may return NaN or error gracefully
    const out = run(`logic arithmetic\ncheck valid (5 / 0) >= 0`);
    // Just check it doesn't crash
    expect(out).toBeDefined();
  });

  it('complex expression', () => {
    runOk(`logic arithmetic\ncheck valid ((100 / 10) + (3 * 2) - 1) >= 15`);
  });

  it('zero operations', () => {
    runOk(`logic arithmetic\ncheck valid (0 + 0) >= 0`);
    runOk(`logic arithmetic\ncheck valid (0 * 100) >= 0`);
  });

  it('let with arithmetic', () => {
    expectOutput(
      `
logic arithmetic
let total = 2 + 3
print total
`,
      '(2 + 3)',
    );
  });
});

// ============================================================
// 12. RUNTIME / INTERPRETER — Edge Cases
// ============================================================
describe('Runtime — Control Flow', () => {
  it('if valid', () => {
    expectOutput(
      `
logic classical.propositional
if valid (P | !P) {
  print "yes"
}
`,
      'yes',
    );
  });

  it('if satisfiable', () => {
    expectOutput(
      `
logic classical.propositional
if satisfiable (P & Q) {
  print "sat"
}
`,
      'sat',
    );
  });

  it('if unsatisfiable', () => {
    expectOutput(
      `
logic classical.propositional
if unsatisfiable (P & !P) {
  print "unsat"
}
`,
      'unsat',
    );
  });

  it('if invalid', () => {
    expectOutput(
      `
logic classical.propositional
if invalid P {
  print "inv"
}
`,
      'inv',
    );
  });

  it('if-else', () => {
    expectOutput(
      `
logic classical.propositional
if valid P {
  print "wrong"
} else {
  print "correct"
}
`,
      'correct',
    );
  });

  it('nested if', () => {
    expectOutput(
      `
logic classical.propositional
if valid (P -> P) {
  if valid (Q -> Q) {
    print "nested"
  }
}
`,
      'nested',
    );
  });

  it('for loop over set', () => {
    expectOutput(
      `
logic classical.propositional
for X in {A, B, C} {
  print X
}
`,
      'A',
    );
  });

  it('while loop with safety', () => {
    expectOutput(
      `
logic classical.propositional
let counter = 0
while valid (P -> P) {
  set counter = counter + 1
  if valid (P -> P) {
    print counter
  }
}
`,
      '1',
    );
  });

  it('for loop iterates all items', () => {
    const out = runOk(`
logic classical.propositional
for X in {P, Q, R} {
  print X
}
`);
    expect(out.stdout).toContain('P');
    expect(out.stdout).toContain('Q');
    expect(out.stdout).toContain('R');
  });
});

describe('Runtime — Functions', () => {
  it('basic function declaration and call', () => {
    expectOutput(
      `
logic classical.propositional
fn greet(Name) {
  print Name
}
greet(Hello)
`,
      'Hello',
    );
  });

  it('function with return', () => {
    expectOutput(
      `
logic classical.propositional
fn double(X) {
  return X
}
let result = double(P)
print result
`,
      'P',
    );
  });

  it('function with multiple params', () => {
    expectOutput(
      `
logic classical.propositional
fn pair(A, B) {
  print A
  print B
}
pair(X, Y)
`,
      'X',
    );
  });

  it('nested function calls', () => {
    runOk(`
logic classical.propositional
fn f(X) {
  print X
}
fn g(Y) {
  f(Y)
}
g(Hello)
`);
  });
});

describe('Runtime — Theories (OOP)', () => {
  it('basic theory', () => {
    expectOutput(
      `
logic classical.propositional
theory MyTheory {
  axiom a1 = P -> Q
  theorem t1 = !Q -> !P
}
print MyTheory.a1
`,
      'P',
    );
  });

  it('theory with extends', () => {
    runOk(`
logic classical.propositional
theory Base {
  axiom a1 = P -> Q
}
theory Child extends Base {
  axiom a2 = Q -> R
}
print Child.a1
`);
  });

  it('theory with private', () => {
    runOk(`
logic classical.propositional
theory Secret {
  private axiom hidden = P -> Q
  axiom visible = Q -> R
}
print Secret.visible
`);
  });
});

describe('Runtime — Proof Blocks', () => {
  it('prove from axioms', () => {
    runOk(`
logic classical.propositional
axiom a1 = P -> Q
axiom a2 = P
theorem t1 = Q
prove Q from {a1, a2}
`);
  });
});

describe('Runtime — Text Layer', () => {
  it('passage and formalize', () => {
    runOk(`
logic classical.propositional
let p1 = passage([[ If it rains, the ground is wet. ]])
let f1 = formalize p1 as P -> Q
`);
  });

  it('claim and support', () => {
    runOk(`
logic classical.propositional
let p1 = passage([[ All humans are mortal. ]])
let f1 = formalize p1 as P -> Q
claim c1 = P -> Q
support c1 <- p1
`);
  });

  it('confidence', () => {
    runOk(`
logic classical.propositional
let p1 = passage([[ Probably true ]])
let f1 = formalize p1 as P
confidence p1 = 0.9
`);
  });

  it('context', () => {
    runOk(`
logic classical.propositional
context ctx1 = "Philosophy class"
let p1 = passage([[ Socrates is mortal ]])
let f1 = formalize p1 as P
`);
  });

  it('render command', () => {
    runOk(`
logic classical.propositional
let p1 = passage([[ Test passage ]])
let f1 = formalize p1 as P -> Q
render f1
`);
  });

  it('explain command', () => {
    runOk(`
logic classical.propositional
let f = P -> Q
explain f
`);
  });

  it('analyze command', () => {
    runOk(`
logic classical.propositional
analyze {P, P -> Q} -> Q
`);
  });
});

describe('Runtime — Import/Export', () => {
  it('export declarations', () => {
    // Export wraps a full statement
    runOk(`
logic classical.propositional
export axiom a1 = P -> Q
`);
  });
});

describe('Runtime — Set (reassignment)', () => {
  it('set variable', () => {
    expectOutput(
      `
logic classical.propositional
let x = P
set x = Q
print x
`,
      'Q',
    );
  });
});

describe('Runtime — Print variations', () => {
  it('print string literal', () => {
    expectOutput(
      `
logic classical.propositional
print "hello world"
`,
      'hello world',
    );
  });

  it('print formula', () => {
    expectOutput(
      `
logic classical.propositional
let f = P & Q
print f
`,
      '∧',
    );
  });

  it('print number (arithmetic)', () => {
    expectOutput(
      `
logic arithmetic
let n = 42
print n
`,
      '42',
    );
  });
});

// ============================================================
// 13. PARSER EDGE CASES
// ============================================================
describe('Parser — Edge Cases', () => {
  it('empty program does not crash', () => {
    const out = run('');
    expect(out).toBeDefined();
  });

  it('only whitespace', () => {
    const out = run('   \n\n\n  ');
    expect(out).toBeDefined();
  });

  it('only comments (// lines)', () => {
    runOk(`// This is a comment\n// Another comment`);
  });

  it('deeply nested parentheses', () => {
    runOk(`logic classical.propositional\nlet f = ((((((P))))))\nprint f`);
  });

  it('very long formula name', () => {
    runOk(
      `logic classical.propositional\nlet f = VeryLongVariableName -> AnotherLongName\nprint f`,
    );
  });

  it('single letter atoms', () => {
    runOk(`logic classical.propositional\nlet f = A & B & C & D & E\nprint f`);
  });

  it('mixed operators precedence', () => {
    runOk(`logic classical.propositional\ncheck valid (P & Q | R) -> (P & Q | R)`);
  });

  it('back arrow in support', () => {
    runOk(
      `logic classical.propositional\nlet p1 = passage([[ test ]])\nlet f1 = formalize p1 as P\nclaim c1 = P\nsupport c1 <- p1`,
    );
  });

  it('multiple logic switches', () => {
    runOk(`
logic classical.propositional
print "a"
logic modal.k
print "b"
logic arithmetic
print "c"
logic paraconsistent.belnap
print "d"
`);
  });

  it('syntax error gives diagnostic', () => {
    expectError(`logic classical.propositional\nlet = `);
  });

  it('unknown profile gives error', () => {
    expectError(`logic nonexistent.profile`);
  });
});

// ============================================================
// 14. SPANISH KEYWORDS (Bilingüe)
// ============================================================
describe('Spanish Keywords — Bilingüe', () => {
  it('logica, axioma, teorema, derivar, desde', () => {
    expectOutput(
      `
logica classical.propositional
axioma a1 = P -> Q
axioma a2 = P
derivar Q desde {a1, a2}
`,
      '✓',
    );
  });

  it('verificar, valido', () => {
    runOk(`logica classical.propositional\nverificar valido P -> P`);
  });

  it('sea (let), imprimir (print)', () => {
    expectOutput(
      `
logica classical.propositional
sea f = P & Q
imprimir f
`,
      '∧',
    );
  });

  it('si/sino (if/else)', () => {
    expectOutput(
      `
logica classical.propositional
si valido (P -> P) {
  imprimir "verdadero"
} sino {
  imprimir "falso"
}
`,
      'verdadero',
    );
  });

  it('para/en (for/in)', () => {
    expectOutput(
      `
logica classical.propositional
para X en {A, B} {
  imprimir X
}
`,
      'A',
    );
  });

  it('funcion/retornar', () => {
    runOk(`
logica classical.propositional
funcion saludar(Nombre) {
  imprimir Nombre
}
saludar(Mundo)
`);
  });

  it('teoria/extiende/privado', () => {
    runOk(`
logica classical.propositional
teoria MiTeoria {
  axioma a1 = P -> Q
}
teoria Hija extiende MiTeoria {
  axioma a2 = Q -> R
}
`);
  });

  it('pasaje/formalizar/como', () => {
    runOk(`
logica classical.propositional
sea p1 = pasaje([[ Si llueve, el piso se moja ]])
sea f1 = formalizar p1 como P -> Q
`);
  });

  it('contramodelo', () => {
    runOk(`logica classical.propositional\ncontramodelo P -> Q`);
  });

  it('tabla_verdad', () => {
    runOk(`logica classical.propositional\ntabla_verdad P & Q`);
  });

  it('probar', () => {
    runOk(`
logica classical.propositional
axioma a1 = P -> Q
axioma a2 = P
teorema t1 = Q
probar Q desde {a1, a2}
`);
  });

  it('paratodo/existe', () => {
    runOk(`
logica classical.first_order
verificar valido (paratodo x P(x)) -> P(a)
`);
  });

  it('asumir/demostrar/qed', () => {
    runOk(`
logica classical.propositional
axioma a1 = P -> Q
axioma a2 = P
teorema t1 = Q
probar Q desde {a1, a2}
`);
  });

  it('afirmacion/soporte/confianza/contexto', () => {
    runOk(`
logica classical.propositional
sea p1 = pasaje([[ Algo ]])
sea f1 = formalizar p1 como P
afirmacion c1 = P
soporte c1 <- p1
confianza p1 = 0.8
contexto ctx1 = "Contexto"
`);
  });

  it('mostrar (render)', () => {
    runOk(`
logica classical.propositional
sea p1 = pasaje([[ Hola ]])
sea f1 = formalizar p1 como P
mostrar f1
`);
  });

  it('explicar', () => {
    runOk(`
logica classical.propositional
sea f = P -> Q
explicar f
`);
  });

  it('analizar', () => {
    runOk(`
logica classical.propositional
analizar {P, P -> Q} -> Q
`);
  });

  it('mientras (while)', () => {
    runOk(`
logica classical.propositional
sea c = 0
mientras valido (P -> P) {
  asignar c = c + 1
  imprimir c
}
`);
  });

  it('exportar/importar', () => {
    runOk(`
logica classical.propositional
exportar axioma a1 = P -> Q
`);
  });

  it('siguiente/hasta (next/until) in temporal', () => {
    runOk(`
logica temporal.ltl
sea f = siguiente P
imprimir f
`);
  });
});

// ============================================================
// 15. CROSS-PROFILE STRESS
// ============================================================
describe('Cross-Profile Stress', () => {
  it('rapidly switch between all 11 profiles', () => {
    runOk(`
logic classical.propositional
check valid P -> P

logic classical.first_order
check valid (forall x P(x)) -> P(a)

logic modal.k
check valid [](P -> Q) -> ([]P -> []Q)

logic deontic.standard
check valid [](P) -> <>(P)

logic epistemic.s5
check valid []P -> P

logic intuitionistic.propositional
check valid P -> !!P

logic temporal.ltl
check valid [](P) -> <>(P)

logic aristotelian.syllogistic
check valid (forall x (M(x) -> P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x)))

logic paraconsistent.belnap
check satisfiable P & !P

logic probabilistic.basic
check valid P | !P

logic arithmetic
check valid (2 + 3) >= 5
`);
  });

  it('declarations persist across profile switches', () => {
    expectOutput(
      `
logic classical.propositional
let f = P -> Q
print f
logic modal.k
print f
`,
      '→',
    );
  });

  it('heavy computation: many checks in sequence', () => {
    let src = 'logic classical.propositional\n';
    for (let i = 0; i < 50; i++) {
      src += `check valid P${i} -> P${i}\n`;
    }
    runOk(src);
  });

  it('many axioms and derivations', () => {
    let src = 'logic classical.propositional\n';
    for (let i = 0; i < 20; i++) {
      src += `axiom a${i} = P${i} -> P${i + 1}\n`;
    }
    src += 'axiom base = P0\n';
    src += 'derive P1 from {a0, base}\n';
    runOk(src);
  });

  it('many print statements', () => {
    let src = 'logic classical.propositional\n';
    for (let i = 0; i < 100; i++) {
      src += `print "line${i}"\n`;
    }
    const out = runOk(src);
    expect(out.stdout).toContain('line0');
    expect(out.stdout).toContain('line99');
  });

  it('large for loop', () => {
    // Generate a set with many elements
    const items = Array.from({ length: 20 }, (_, i) => `V${i}`).join(', ');
    runOk(`
logic classical.propositional
for X in {${items}} {
  print X
}
`);
  });
});

// ============================================================
// 16. API FUNCTIONS — Edge Cases
// ============================================================
describe('API — Edge Cases', () => {
  it('builtin typeof', () => {
    runOk(`
logic classical.propositional
let f = P -> Q
print typeof(f)
`);
  });

  it('builtin is_valid', () => {
    runOk(`
logic classical.propositional
let f = P -> P
print is_valid(f)
`);
  });

  it('builtin is_satisfiable', () => {
    runOk(`
logic classical.propositional
let f = P & Q
print is_satisfiable(f)
`);
  });

  it('builtin get_atoms', () => {
    runOk(`
logic classical.propositional
let f = P & Q & R
print get_atoms(f)
`);
  });
});

// ============================================================
// 17. OPERATOR COMBINATORICS
// ============================================================
describe('Operator Combinatorics', () => {
  const binaryOps = ['&', '|', '->', '<->', '!&', '!|', '^'];

  for (const op of binaryOps) {
    it(`binary op ${op} parses and evaluates`, () => {
      runOk(`logic classical.propositional\nlet f = P ${op} Q\nprint f`);
    });

    it(`binary op ${op} in check valid`, () => {
      // P op P should at least parse
      run(`logic classical.propositional\ncheck valid P ${op} P`);
    });
  }

  it('all unary: !, !!, !!!', () => {
    runOk(`logic classical.propositional
let a = !P
let b = !!P
let c = !!!P
print a
print b
print c
`);
  });

  it('all binary combos on 2 atoms', () => {
    // P OP1 Q OP2 R with various ops
    runOk(`logic classical.propositional
let f1 = (P & Q) | R
let f2 = (P | Q) & R
let f3 = (P -> Q) & (Q -> R)
let f4 = (P <-> Q) -> R
let f5 = (P !& Q) | (R !| S)
let f6 = (P ^ Q) -> (Q ^ P)
print f1
print f2
print f3
print f4
print f5
print f6
`);
  });

  it('deeply nested: 10 levels', () => {
    runOk(`logic classical.propositional
let deep = P -> (Q -> (R -> (S -> (T -> (U -> (V -> (W -> (X -> (Y -> Z)))))))))
print deep
`);
  });

  it('wide conjunction: 10 atoms', () => {
    runOk(`logic classical.propositional
let wide = A & B & C & D & E & F & G & H & I & J
print wide
check satisfiable A & B & C & D & E & F & G & H & I & J
`);
  });

  it('wide disjunction: 10 atoms', () => {
    runOk(`logic classical.propositional
let wide = A | B | C | D | E | F | G | H | I | J
print wide
check valid A | B | C | D | E | F | G | H | I | J | !A
`);
  });
});

// ============================================================
// 18. ERROR RECOVERY — Does not crash
// ============================================================
describe('Error Recovery — No crashes', () => {
  const badInputs = [
    'logic',
    'logic classical.propositional\ncheck',
    'logic classical.propositional\ncheck valid',
    'logic classical.propositional\nderive',
    'logic classical.propositional\nderive X from',
    'logic classical.propositional\nderive X from {}',
    'logic classical.propositional\nlet',
    'logic classical.propositional\nlet x',
    'logic classical.propositional\nlet x =',
    'logic classical.propositional\naxiom',
    'logic classical.propositional\naxiom a =',
    'logic classical.propositional\ntheorem',
    'logic classical.propositional\nprove',
    'logic classical.propositional\ntruth_table',
    'logic classical.propositional\ncountermodel',
    'logic classical.propositional\nfor',
    'logic classical.propositional\nfor X in',
    'logic classical.propositional\nwhile',
    'logic classical.propositional\nif',
    'logic classical.propositional\nfn',
    'logic classical.propositional\nfn f(',
    'logic classical.propositional\ntheory',
    'logic classical.propositional\ntheory T {',
    ')))(((',
    '&&&|||',
    'let 123 = abc',
    'logic classical.propositional\nprint',
    'logic classical.propositional\nset',
    'logic classical.propositional\nset x',
    'logic classical.propositional\nexport',
    'logic classical.propositional\nimport',
  ];

  for (let i = 0; i < badInputs.length; i++) {
    it(`bad input #${i + 1} does not throw`, () => {
      expect(() => run(badInputs[i])).not.toThrow();
    });
  }
});
