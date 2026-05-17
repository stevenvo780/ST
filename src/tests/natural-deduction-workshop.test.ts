import { describe, it, expect } from 'vitest';
import { ClassicalPropositional, formulaToString } from '../logic/profiles/classical/propositional';
import { Formula, Theory } from '../types';

function makeTheory(axioms: Record<string, Formula>): Theory {
  return {
    profile: 'classical.propositional',
    axioms: new Map(Object.entries(axioms)),
    theorems: new Map(),
    claims: new Map(),
    judgments: [],
  };
}

function atom(name: string): Formula {
  return { kind: 'atom', name };
}

function not(f: Formula): Formula {
  return { kind: 'not', args: [f] };
}

function and(a: Formula, b: Formula): Formula {
  return { kind: 'and', args: [a, b] };
}

function or(a: Formula, b: Formula): Formula {
  return { kind: 'or', args: [a, b] };
}

function implies(a: Formula, b: Formula): Formula {
  return { kind: 'implies', args: [a, b] };
}

function biconditional(a: Formula, b: Formula): Formula {
  return { kind: 'biconditional', args: [a, b] };
}

type ExpectedRule = {
  formula: string;
  justifications: string[];
  premises: number[];
};

type WorkshopCase = {
  id: string;
  title: string;
  mode: 'derive' | 'prove';
  goal: Formula;
  premises: string[];
  theory: Theory;
  acceptableReasoningTypes?: string[];
  expectedRules: ExpectedRule[];
};

const workshopCases: WorkshopCase[] = [
  {
    id: 'mp',
    title: 'P, P->Q ⊢ Q',
    mode: 'derive',
    goal: atom('Q'),
    premises: ['mp1', 'mp2'],
    theory: makeTheory({
      mp1: implies(atom('P'), atom('Q')),
      mp2: atom('P'),
    }),
    acceptableReasoningTypes: ['Modus Ponens'],
    expectedRules: [{ formula: 'Q', justifications: ['Modus Ponens'], premises: [1, 2] }],
  },
  {
    id: 'prove_chain',
    title: 'P->Q, Q->R, P ⊢ R',
    mode: 'prove',
    goal: atom('R'),
    premises: ['pr1', 'pr2', 'pr3'],
    theory: makeTheory({
      pr1: implies(atom('P'), atom('Q')),
      pr2: implies(atom('Q'), atom('R')),
      pr3: atom('P'),
    }),
    expectedRules: [
      { formula: 'Q', justifications: ['Modus Ponens'], premises: [1, 3] },
      { formula: 'R', justifications: ['Modus Ponens'], premises: [2, 4] },
    ],
  },
  {
    id: 'mt',
    title: '!Q, P->Q ⊢ !P',
    mode: 'derive',
    goal: not(atom('P')),
    premises: ['mt1', 'mt2'],
    theory: makeTheory({
      mt1: not(atom('Q')),
      mt2: implies(atom('P'), atom('Q')),
    }),
    acceptableReasoningTypes: ['Modus Tollens'],
    expectedRules: [{ formula: '!P', justifications: ['Modus Tollens'], premises: [1, 2] }],
  },
  {
    id: 'ci',
    title: 'P, Q ⊢ P & Q',
    mode: 'derive',
    goal: and(atom('P'), atom('Q')),
    premises: ['ci1', 'ci2'],
    theory: makeTheory({ ci1: atom('P'), ci2: atom('Q') }),
    acceptableReasoningTypes: ['Introduccion de conjuncion'],
    expectedRules: [
      {
        formula: '(P & Q)',
        justifications: ['Introduccion de conjuncion'],
        premises: [1, 2],
      },
    ],
  },
  {
    id: 'ce',
    title: 'P & Q ⊢ P',
    mode: 'derive',
    goal: atom('P'),
    premises: ['ce1'],
    theory: makeTheory({ ce1: and(atom('P'), atom('Q')) }),
    acceptableReasoningTypes: ['Eliminacion de conjuncion'],
    expectedRules: [{ formula: 'P', justifications: ['Eliminacion de conjuncion'], premises: [1] }],
  },
  {
    id: 'di',
    title: 'P ⊢ P | Q',
    mode: 'derive',
    goal: or(atom('P'), atom('Q')),
    premises: ['di1'],
    theory: makeTheory({ di1: atom('P') }),
    acceptableReasoningTypes: ['Introduccion de disyuncion'],
    expectedRules: [
      { formula: '(P | Q)', justifications: ['Introduccion de disyuncion'], premises: [1] },
    ],
  },
  {
    id: 'sh',
    title: 'P->Q, Q->R ⊢ P->R',
    mode: 'derive',
    goal: implies(atom('P'), atom('R')),
    premises: ['sh1', 'sh2'],
    theory: makeTheory({
      sh1: implies(atom('P'), atom('Q')),
      sh2: implies(atom('Q'), atom('R')),
    }),
    acceptableReasoningTypes: ['Silogismo hipotetico'],
    expectedRules: [
      { formula: '(P -> R)', justifications: ['Silogismo hipotetico'], premises: [1, 2] },
    ],
  },
  {
    id: 'pv',
    title: 'P->Q, Q->R, P ⊢ R',
    mode: 'derive',
    goal: atom('R'),
    premises: ['pv1', 'pv2', 'pv3'],
    theory: makeTheory({
      pv1: implies(atom('P'), atom('Q')),
      pv2: implies(atom('Q'), atom('R')),
      pv3: atom('P'),
    }),
    acceptableReasoningTypes: ['Modus Ponens'],
    expectedRules: [
      { formula: 'Q', justifications: ['Modus Ponens'], premises: [1, 3] },
      { formula: 'R', justifications: ['Modus Ponens'], premises: [2, 4] },
    ],
  },
  {
    id: 'sd',
    title: 'P | Q, !P ⊢ Q',
    mode: 'derive',
    goal: atom('Q'),
    premises: ['sd1', 'sd2'],
    theory: makeTheory({ sd1: or(atom('P'), atom('Q')), sd2: not(atom('P')) }),
    acceptableReasoningTypes: ['Silogismo disyuntivo'],
    expectedRules: [{ formula: 'Q', justifications: ['Silogismo disyuntivo'], premises: [1, 2] }],
  },
  {
    id: 'ib',
    title: 'P->Q, Q->P ⊢ P<->Q',
    mode: 'derive',
    goal: biconditional(atom('P'), atom('Q')),
    premises: ['ib1', 'ib2'],
    theory: makeTheory({
      ib1: implies(atom('P'), atom('Q')),
      ib2: implies(atom('Q'), atom('P')),
    }),
    acceptableReasoningTypes: ['Introduccion de bicondicional'],
    expectedRules: [
      {
        formula: '(P <-> Q)',
        justifications: ['Introduccion de bicondicional'],
        premises: [1, 2],
      },
    ],
  },
  {
    id: 'eb',
    title: 'P<->Q, P ⊢ Q',
    mode: 'derive',
    goal: atom('Q'),
    premises: ['eb1', 'eb2'],
    theory: makeTheory({
      eb1: biconditional(atom('P'), atom('Q')),
      eb2: atom('P'),
    }),
    acceptableReasoningTypes: ['Eliminacion de bicondicional, Modus Ponens'],
    expectedRules: [
      {
        formula: '(P -> Q)',
        justifications: ['Eliminacion de bicondicional'],
        premises: [1],
      },
      { formula: 'Q', justifications: ['Modus Ponens'], premises: [2, 3] },
    ],
  },
  {
    id: 'dc',
    title: '(P->Q) & (R->S), P | R ⊢ Q | S',
    mode: 'derive',
    goal: or(atom('Q'), atom('S')),
    premises: ['dc1', 'dc2'],
    theory: makeTheory({
      dc1: and(implies(atom('P'), atom('Q')), implies(atom('R'), atom('S'))),
      dc2: or(atom('P'), atom('R')),
    }),
    acceptableReasoningTypes: ['Dilema Constructivo'],
    expectedRules: [
      { formula: '(Q | S)', justifications: ['Dilema Constructivo'], premises: [1, 2] },
    ],
  },
  {
    id: 'dd',
    title: '(P->Q) & (R->S), !Q | !S ⊢ !P | !R',
    mode: 'derive',
    goal: or(not(atom('P')), not(atom('R'))),
    premises: ['dd1', 'dd2'],
    theory: makeTheory({
      dd1: and(implies(atom('P'), atom('Q')), implies(atom('R'), atom('S'))),
      dd2: or(not(atom('Q')), not(atom('S'))),
    }),
    acceptableReasoningTypes: ['Dilema Destructivo'],
    expectedRules: [
      {
        formula: '(!P | !R)',
        justifications: ['Dilema Destructivo'],
        premises: [1, 2],
      },
    ],
  },
  {
    id: 'ds',
    title: 'P | Q, P->R, Q->R ⊢ R',
    mode: 'derive',
    goal: atom('R'),
    premises: ['ds1', 'ds2', 'ds3'],
    theory: makeTheory({
      ds1: or(atom('P'), atom('Q')),
      ds2: implies(atom('P'), atom('R')),
      ds3: implies(atom('Q'), atom('R')),
    }),
    acceptableReasoningTypes: ['Dilema Simple'],
    expectedRules: [
      {
        formula: 'R',
        justifications: ['Dilema Simple'],
        premises: [1, 2, 3],
      },
    ],
  },
  {
    id: 'rs',
    title: 'P | Q, !P | R ⊢ Q | R',
    mode: 'derive',
    goal: or(atom('Q'), atom('R')),
    premises: ['rs1', 'rs2'],
    theory: makeTheory({
      rs1: or(atom('P'), atom('Q')),
      rs2: or(not(atom('P')), atom('R')),
    }),
    acceptableReasoningTypes: ['Resolucion'],
    expectedRules: [{ formula: '(Q | R)', justifications: ['Resolucion'], premises: [1, 2] }],
  },
  {
    id: 'ex',
    title: 'P, !P ⊢ Q',
    mode: 'derive',
    goal: atom('Q'),
    premises: ['ex1', 'ex2'],
    theory: makeTheory({ ex1: atom('P'), ex2: not(atom('P')) }),
    acceptableReasoningTypes: ['Explosion'],
    expectedRules: [{ formula: 'Q', justifications: ['Explosion'], premises: [1, 2] }],
  },
  {
    id: 'dn',
    title: '!!P ⊢ P',
    mode: 'derive',
    goal: atom('P'),
    premises: ['dn1'],
    theory: makeTheory({ dn1: not(not(atom('P'))) }),
    acceptableReasoningTypes: ['Doble negacion'],
    expectedRules: [{ formula: 'P', justifications: ['Doble negacion'], premises: [1] }],
  },
  {
    id: 'idn',
    title: 'P ⊢ !!P',
    mode: 'derive',
    goal: not(not(atom('P'))),
    premises: ['idn1'],
    theory: makeTheory({ idn1: atom('P') }),
    acceptableReasoningTypes: ['Introduccion de doble negacion'],
    expectedRules: [
      {
        formula: '!(!P)',
        justifications: ['Introduccion de doble negacion'],
        premises: [1],
      },
    ],
  },
  {
    id: 'ii',
    title: 'Q ⊢ P -> Q',
    mode: 'derive',
    goal: implies(atom('P'), atom('Q')),
    premises: ['ii1'],
    theory: makeTheory({ ii1: atom('Q') }),
    acceptableReasoningTypes: ['Debilitamiento (B ⊢ A → B)'],
    expectedRules: [
      {
        formula: '(P -> Q)',
        justifications: ['Debilitamiento (B ⊢ A → B)'],
        premises: [1],
      },
    ],
  },
  {
    id: 'cp',
    title: 'P -> Q ⊢ !Q -> !P',
    mode: 'derive',
    goal: implies(not(atom('Q')), not(atom('P'))),
    premises: ['cp1'],
    theory: makeTheory({ cp1: implies(atom('P'), atom('Q')) }),
    acceptableReasoningTypes: ['Contraposicion'],
    expectedRules: [{ formula: '(!Q -> !P)', justifications: ['Contraposicion'], premises: [1] }],
  },
  {
    id: 'ab',
    title: 'P -> Q ⊢ P -> (P & Q)',
    mode: 'derive',
    goal: implies(atom('P'), and(atom('P'), atom('Q'))),
    premises: ['ab1'],
    theory: makeTheory({ ab1: implies(atom('P'), atom('Q')) }),
    acceptableReasoningTypes: ['Absorcion'],
    expectedRules: [{ formula: '(P -> (P & Q))', justifications: ['Absorcion'], premises: [1] }],
  },
  {
    id: 'expt',
    title: '(P & Q) -> R ⊢ P -> (Q -> R)',
    mode: 'derive',
    goal: implies(atom('P'), implies(atom('Q'), atom('R'))),
    premises: ['expt1'],
    theory: makeTheory({ expt1: implies(and(atom('P'), atom('Q')), atom('R')) }),
    acceptableReasoningTypes: ['Exportacion'],
    expectedRules: [{ formula: '(P -> (Q -> R))', justifications: ['Exportacion'], premises: [1] }],
  },
  {
    id: 'impt',
    title: 'P -> (Q -> R) ⊢ (P & Q) -> R',
    mode: 'derive',
    goal: implies(and(atom('P'), atom('Q')), atom('R')),
    premises: ['impt1'],
    theory: makeTheory({ impt1: implies(atom('P'), implies(atom('Q'), atom('R'))) }),
    acceptableReasoningTypes: ['Importacion'],
    expectedRules: [{ formula: '((P & Q) -> R)', justifications: ['Importacion'], premises: [1] }],
  },
  {
    id: 'dm1',
    title: '!(P & Q) ⊢ !P | !Q',
    mode: 'derive',
    goal: or(not(atom('P')), not(atom('Q'))),
    premises: ['dm1'],
    theory: makeTheory({ dm1: not(and(atom('P'), atom('Q'))) }),
    acceptableReasoningTypes: ['De Morgan (AND)'],
    expectedRules: [{ formula: '(!P | !Q)', justifications: ['De Morgan (AND)'], premises: [1] }],
  },
  {
    id: 'dm2',
    title: '!(P | Q) ⊢ !P & !Q',
    mode: 'derive',
    goal: and(not(atom('P')), not(atom('Q'))),
    premises: ['dm2'],
    theory: makeTheory({ dm2: not(or(atom('P'), atom('Q'))) }),
    acceptableReasoningTypes: ['De Morgan (OR)'],
    expectedRules: [{ formula: '(!P & !Q)', justifications: ['De Morgan (OR)'], premises: [1] }],
  },
  {
    id: 'raa',
    title: 'P -> Q, P -> !Q ⊢ !P',
    mode: 'derive',
    goal: not(atom('P')),
    premises: ['raa1', 'raa2'],
    theory: makeTheory({
      raa1: implies(atom('P'), atom('Q')),
      raa2: implies(atom('P'), not(atom('Q'))),
    }),
    acceptableReasoningTypes: ['Reduccion al Absurdo (RAA)'],
    expectedRules: [
      {
        formula: '!P',
        justifications: ['Reduccion al Absurdo (RAA)'],
        premises: [1, 2],
      },
    ],
  },
];

describe('Classical propositional — natural deduction workshop from 01-clasica-proposicional', () => {
  const cp = new ClassicalPropositional();

  for (const workshopCase of workshopCases) {
    it(`${workshopCase.id}: ${workshopCase.title}`, () => {
      const result =
        workshopCase.mode === 'prove'
          ? cp.prove(workshopCase.goal, workshopCase.theory, workshopCase.premises)
          : cp.derive(workshopCase.goal, workshopCase.premises, workshopCase.theory);

      expect(result.status).toBe('provable');
      expect(result.proof?.method).toBe('natural_deduction');
      expect(result.proof?.metadata?.semanticFallback).toBe(false);

      if (workshopCase.acceptableReasoningTypes) {
        expect(workshopCase.acceptableReasoningTypes).toContain(result.reasoningType ?? '');
      }

      const actualRules = (result.proof?.steps ?? [])
        .filter((step) => step.source === 'rule')
        .map((step) => ({
          formula: formulaToString(step.formula),
          justification: step.justification,
          premises: step.premises,
        }));

      expect(actualRules).toHaveLength(workshopCase.expectedRules.length);

      workshopCase.expectedRules.forEach((expectedRule, index) => {
        const actualRule = actualRules[index];
        expect(actualRule?.formula).toBe(expectedRule.formula);
        expect(expectedRule.justifications).toContain(actualRule?.justification ?? '');
        expect(actualRule?.premises).toEqual(expectedRule.premises);
      });
    });
  }
});
