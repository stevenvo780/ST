import { describe, expect, it } from 'vitest';
import { Interpreter } from '../runtime/interpreter';

type ProgramExpectation = {
  source: string;
  markers: string[];
};

const profilePrograms: Record<string, ProgramExpectation> = {
  'classical.propositional': {
    source: `
logic classical.propositional
let regla = P -> Q
let hecho = P
derive Q from {regla, hecho}
if valid (P | !P) {
  print "classical-if"
}
for Item in {P, Q} {
  print Item
}
`,
    markers: ['✓ [derive]', 'classical-if', 'P', 'Q'],
  },
  'classical.first_order': {
    source: `
logic classical.first_order
let witness = P(a)
print witness
check valid (P(a) -> exists x P(x))
`,
    markers: ['P(a)', 'VÁLIDA en FOL'],
  },
  'modal.k': {
    source: `
logic modal.k
let boxRule = [](P -> P)
print boxRule
check valid [](P -> P)
`,
    markers: ['□((P → P))', 'VÁLIDA en modal.k'],
  },
  'paraconsistent.belnap': {
    source: `
logic paraconsistent.belnap
let both = P & !P
print both
check satisfiable (P & !P)
`,
    markers: ['(P ∧ ¬P)', 'satisfacible en Belnap'],
  },
  'deontic.standard': {
    source: `
logic deontic.standard
let duty = [](P)
print duty
check valid ([](P) -> <>(P))
`,
    markers: ['O(P)', 'VÁLIDA en deontic.standard'],
  },
  'epistemic.s5': {
    source: `
logic epistemic.s5
let knowledge = [](P)
print knowledge
check valid ([]P -> P)
`,
    markers: ['K(P)', 'VÁLIDA en epistemic.s5'],
  },
  'aristotelian.syllogistic': {
    source: `
logic aristotelian.syllogistic
print "aristotelian"
check valid ((forall x (M(x) -> P(x))) & (forall x (S(x) -> M(x))) -> (forall x (S(x) -> P(x))))
`,
    markers: ['aristotelian', 'Silogismo VÁLIDO'],
  },
  'intuitionistic.propositional': {
    source: `
logic intuitionistic.propositional
let intro = P -> !!P
print intro
check valid (P -> !!P)
`,
    markers: ['(P → ¬(¬P))', 'VÁLIDA intuicionistamente'],
  },
  'temporal.ltl': {
    source: `
logic temporal.ltl
let always = [](P)
print always
check valid ([](P) -> <>(P))
`,
    markers: ['G(P)', 'VÁLIDA en temporal.ltl'],
  },
  'probabilistic.basic': {
    source: `
logic probabilistic.basic
let phi = (P | !P)
print phi
check valid (P | !P)
`,
    markers: ['(P ∨ ¬P)', 'tautología probabilística'],
  },
  arithmetic: {
    source: `
logic arithmetic
let total = 2 + 3
print total
check valid (2 + 3) >= 5
fn sumar(A, B) {
  print A
  print B
}
sumar(4, 5)
`,
    markers: ['(2 + 3)', 'verdadero', '4', '5'],
  },
};

describe('exhaustive profile matrix', () => {
  for (const [profile, program] of Object.entries(profilePrograms)) {
    it(`runs a programming + logic smoke program for ${profile}`, () => {
      const interpreter = new Interpreter();
      const output = interpreter.execute(program.source, `<${profile}>`);

      expect(output.exitCode).toBe(0);
      expect(output.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
      for (const marker of program.markers) {
        expect(output.stdout).toContain(marker);
      }
    });
  }

  it('switches between multiple logical profiles inside one scripted program', () => {
    const source = `
logic classical.propositional
print "start-classical"
check valid (P -> P)

logic modal.k
print "start-modal"
check valid [](P -> P)

logic arithmetic
print "start-arithmetic"
check valid (6 / 2) >= 3
`;

    const interpreter = new Interpreter();
    const output = interpreter.execute(source, '<mixed-profiles>');

    expect(output.exitCode).toBe(0);
    expect(output.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(output.stdout).toContain('start-classical');
    expect(output.stdout).toContain('start-modal');
    expect(output.stdout).toContain('start-arithmetic');
  });
});
