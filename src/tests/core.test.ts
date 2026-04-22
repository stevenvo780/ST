// ============================================================
// ST Tests — Core (perfiles, motor proposicional)
// ============================================================

import { describe, it, expect } from 'vitest';
import { ClassicalPropositional, formulaToString } from '../profiles/classical/propositional';
import { Interpreter } from '../runtime/interpreter';
import { Formula, Theory } from '../types';

function makeTheory(axioms: Record<string, Formula>): Theory {
  const t: Theory = {
    profile: 'classical.propositional',
    axioms: new Map(Object.entries(axioms)),
    theorems: new Map(),
    claims: new Map(),
    judgments: [],
  };
  return t;
}

// Helpers para crear fórmulas
function atom(name: string): Formula {
  return { kind: 'atom', name };
}
function falsum(): Formula {
  return { kind: 'false' };
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

describe('ClassicalPropositional.checkWellFormed', () => {
  const cp = new ClassicalPropositional();

  it('acepta atomo simple', () => {
    const diags = cp.checkWellFormed(atom('P'));
    expect(diags.length).toBe(0);
  });

  it('acepta negacion', () => {
    const diags = cp.checkWellFormed(not(atom('P')));
    expect(diags.length).toBe(0);
  });

  it('acepta implicacion compleja', () => {
    const f = implies(atom('P'), implies(atom('Q'), atom('R')));
    const diags = cp.checkWellFormed(f);
    expect(diags.length).toBe(0);
  });
});

describe('ClassicalPropositional.checkValid', () => {
  const cp = new ClassicalPropositional();

  it('P -> P es tautologia', () => {
    const f = implies(atom('P'), atom('P'));
    const result = cp.checkValid(f);
    expect(result.status).toBe('valid');
  });

  it('P -> (Q -> P) es tautologia', () => {
    const f = implies(atom('P'), implies(atom('Q'), atom('P')));
    const result = cp.checkValid(f);
    expect(result.status).toBe('valid');
  });

  it('(P -> Q) -> (!Q -> !P) es tautologia (contraposicion)', () => {
    const f = implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P'))));
    const result = cp.checkValid(f);
    expect(result.status).toBe('valid');
  });

  it('P -> Q no es tautologia', () => {
    const f = implies(atom('P'), atom('Q'));
    const result = cp.checkValid(f);
    expect(result.status).toBe('invalid');
  });

  it('P | !P es tautologia (tercero excluido)', () => {
    const f = or(atom('P'), not(atom('P')));
    const result = cp.checkValid(f);
    expect(result.status).toBe('valid');
  });

  it('!(P & !P) es tautologia (no contradiccion)', () => {
    const f = not(and(atom('P'), not(atom('P'))));
    const result = cp.checkValid(f);
    expect(result.status).toBe('valid');
  });
});

describe('ClassicalPropositional.checkSatisfiable', () => {
  const cp = new ClassicalPropositional();

  it('P es satisfacible', () => {
    const result = cp.checkSatisfiable(atom('P'));
    expect(result.status).toBe('satisfiable');
  });

  it('P & !P es insatisfacible', () => {
    const f = and(atom('P'), not(atom('P')));
    const result = cp.checkSatisfiable(f);
    expect(result.status).toBe('unsatisfiable');
  });

  it('P & Q es satisfacible', () => {
    const f = and(atom('P'), atom('Q'));
    const result = cp.checkSatisfiable(f);
    expect(result.status).toBe('satisfiable');
  });
});

describe('ClassicalPropositional.derive', () => {
  const cp = new ClassicalPropositional();

  it('Modus Ponens: P, P->Q |- Q', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), atom('Q')),
      a2: atom('P'),
    });
    const result = cp.derive(atom('Q'), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
  });

  it('Modus Tollens: !Q, P->Q |- !P', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), atom('Q')),
      a2: not(atom('Q')),
    });
    const result = cp.derive(not(atom('P')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
  });

  it('Contradiccion explícita: P, !P |- false', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: not(atom('P')),
    });
    const result = cp.derive(falsum(), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.steps.some((step) => step.justification === 'Contradiccion')).toBe(true);
  });

  it('Explosion desde false: false |- Q', () => {
    const theory = makeTheory({
      a1: falsum(),
    });
    const result = cp.derive(atom('Q'), ['a1'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.steps.some((step) => step.justification === 'Explosion')).toBe(true);
    expect(result.reasoningSchema).toBe('⊥ ⊢ ψ');
  });

  it('Modus Tollens con consecuente negado: Q, P->!Q |- !P', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), not(atom('Q'))),
      a2: atom('Q'),
    });
    const result = cp.derive(not(atom('P')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).not.toBe('semantic');
    expect(result.proof?.steps.some((step) => step.justification === 'Modus Tollens')).toBe(true);
  });

  it('Introduccion de negacion: P->(Q & !Q) |- !P', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), and(atom('Q'), not(atom('Q')))),
    });
    const result = cp.derive(not(atom('P')), ['a1'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'Introduccion de negacion'),
    ).toBe(true);
    expect(result.reasoningSchema).toBe('[φ] ⊢ ⊥, por lo tanto ¬φ');
  });

  it('RAA generica: !P->false |- P', () => {
    const theory = makeTheory({
      a1: implies(not(atom('P')), falsum()),
    });
    const result = cp.derive(atom('P'), ['a1'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'RAA (Reduccion al Absurdo)'),
    ).toBe(true);
    expect(result.reasoningSchema).toBe('[¬φ] ⊢ ⊥, por lo tanto φ');
  });

  it('Derivacion encadenada: P, P->Q, Q->R |- R', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: implies(atom('P'), atom('Q')),
      a3: implies(atom('Q'), atom('R')),
    });
    const result = cp.derive(atom('R'), ['a1', 'a2', 'a3'], theory);
    expect(result.status).toBe('provable');
  });

  it('Silogismo hipotetico: P->Q, Q->R |- P->R', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), atom('Q')),
      a2: implies(atom('Q'), atom('R')),
    });
    const result = cp.derive(implies(atom('P'), atom('R')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
  });

  it('Silogismo disyuntivo: P|Q, !P |- Q', () => {
    const theory = makeTheory({
      a1: or(atom('P'), atom('Q')),
      a2: not(atom('P')),
    });
    const result = cp.derive(atom('Q'), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
  });

  it('Introduccion de bicondicional: P->Q, Q->P |- P<->Q', () => {
    const theory = makeTheory({
      a1: implies(atom('P'), atom('Q')),
      a2: implies(atom('Q'), atom('P')),
    });
    const result = cp.derive(biconditional(atom('P'), atom('Q')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
  });

  it('meta conjuntiva compleja: P, Q |- ((P -> Q) & P) sin fallback semantico', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: atom('Q'),
    });
    const result = cp.derive(and(implies(atom('P'), atom('Q')), atom('P')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'Introduccion de conjuncion'),
    ).toBe(true);
  });

  it('meta bicondicional desde hechos: P, Q |- P<->Q sin fallback semantico', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: atom('Q'),
    });
    const result = cp.derive(biconditional(atom('P'), atom('Q')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'Introduccion de bicondicional'),
    ).toBe(true);
  });

  it('meta bicondicional mixta: P, !Q |- P<->!Q sin fallback semantico', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: not(atom('Q')),
    });
    const result = cp.derive(biconditional(atom('P'), not(atom('Q'))), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'Introduccion de bicondicional'),
    ).toBe(true);
  });

  it('backchaining con antecedente conjuntivo: P, Q, (P&Q)->R |- R', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: atom('Q'),
      a3: implies(and(atom('P'), atom('Q')), atom('R')),
    });
    const result = cp.derive(atom('R'), ['a1', 'a2', 'a3'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.steps.some((step) => step.justification === 'Modus Ponens')).toBe(true);
  });

  it('backchaining + meta conjuntiva: P, Q, (P&Q)->R |- P&R', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: atom('Q'),
      a3: implies(and(atom('P'), atom('Q')), atom('R')),
    });
    const result = cp.derive(and(atom('P'), atom('R')), ['a1', 'a2', 'a3'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(
      result.proof?.steps.some((step) => step.justification === 'Introduccion de conjuncion'),
    ).toBe(true);
  });

  it('adjunta metadatos de exploracion y alternativas derivacionales', () => {
    const theory = makeTheory({
      a1: atom('P'),
      a2: atom('Q'),
    });
    const result = cp.derive(biconditional(atom('P'), atom('Q')), ['a1', 'a2'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.metadata?.exploredStepCount).toBeGreaterThanOrEqual(
      result.proof?.steps.length ?? 0,
    );
    expect(result.proof?.metadata?.retainedStepCount).toBe(result.proof?.steps.length);
    expect(result.proof?.metadata?.uniqueFormulaCount).toBeGreaterThan(0);
    expect(result.proof?.metadata?.alternativeDerivationCount).toBeGreaterThanOrEqual(0);
  });

  it('prueba por casos + modus tollens deriva !W sin fallback semantico', () => {
    const theory = makeTheory({
      p1: or(not(atom('T')), not(atom('R'))),
      p2: implies(not(atom('R')), atom('S')),
      p3: implies(not(atom('T')), atom('S')),
      p4: implies(atom('W'), not(atom('S'))),
    });
    const result = cp.derive(not(atom('W')), ['p1', 'p2', 'p3', 'p4'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.reasoningType).toBe('Dilema Simple, Modus Tollens');
    expect(result.proof?.metadata?.semanticFallback).toBe(false);
    expect(result.proof?.steps.every((step) => step.source !== 'semantic')).toBe(true);
    expect(
      result.proof?.steps
        .filter((step) => step.source === 'rule')
        .map((step) => ({
          formula: formulaToString(step.formula),
          justification: step.justification,
          premises: step.premises,
        })),
    ).toEqual([
      {
        formula: 'S',
        justification: 'Dilema Simple',
        premises: [1, 3, 2],
      },
      {
        formula: '!W',
        justification: 'Modus Tollens',
        premises: [5, 4],
      },
    ]);
  });

  it('evita fallback semantico en cadena exportacion + prueba condicional + modus tollens', () => {
    const theory = makeTheory({
      p1: implies(atom('P'), not(implies(atom('Q'), atom('R')))),
      p2: implies(and(atom('S'), atom('Q')), atom('R')),
      p3: atom('S'),
    });
    const result = cp.derive(not(atom('P')), ['p1', 'p2', 'p3'], theory);

    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.metadata?.semanticFallback).toBe(false);
    expect(result.proof?.steps.every((step) => step.source !== 'semantic')).toBe(true);
    expect(result.proof?.steps.some((step) => step.justification === 'Modus Tollens')).toBe(true);
    expect(
      result.proof?.steps.some(
        (step) =>
          step.justification === 'Prueba Condicional (Teorema de Deduccion)' &&
          formulaToString(step.formula) === '(Q -> R)',
      ),
    ).toBe(true);
  });

  it('reproduce el script del usuario sin caer a verificacion semantica', () => {
    const interp = new Interpreter();
    const out = interp.execute(
      `
        logic classical.propositional

        let p1 = P -> !(Q -> R)
        let p2 = (S & Q) -> R
        let p3 = S

        let c = !P

        derive c from {p1,p2,p3}
      `,
      '<test>',
    );

    expect(out.exitCode).toBe(0);
    expect(out.stdout).not.toContain('verificación semántica');
    expect(out.stdout).not.toContain('Verificacion semantica');
    expect(out.results[0]?.status).toBe('provable');
    expect(out.results[0]?.proof?.method).toBe('natural_deduction');
    expect(out.results[0]?.proof?.metadata?.semanticFallback).toBe(false);
    expect(out.results[0]?.proof?.steps.every((step) => step.source !== 'semantic')).toBe(true);
  });

  it('deriva !S cuando el silogismo disyuntivo usa el complemento positivo de !Q', () => {
    const theory = makeTheory({
      p1: not(or(not(atom('P')), not(atom('Q')))),
      p2: implies(atom('R'), not(atom('S'))),
      p3: or(atom('R'), not(atom('Q'))),
    });

    const result = cp.derive(not(atom('S')), ['p1', 'p2', 'p3'], theory);

    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.metadata?.semanticFallback).toBe(false);
    expect(result.proof?.steps.every((step) => step.source !== 'semantic')).toBe(true);
    expect(result.proof?.steps.some((step) => step.justification === 'Silogismo disyuntivo')).toBe(
      true,
    );
    expect(result.proof?.steps.some((step) => step.justification === 'Modus Ponens')).toBe(true);
  });

  it('No se puede derivar Q solo de P', () => {
    const theory = makeTheory({
      a1: atom('P'),
    });
    const result = cp.derive(atom('Q'), ['a1'], theory);
    // P no implica Q: el motor puede reportar 'refutable' (contramodelo encontrado)
    // o 'unknown' (no se pudo derivar ni construir contramodelo). Ambos son
    // comportamientos correctos y semánticamente honestos.
    expect(['refutable', 'unknown']).toContain(result.status);
  });

  it('usa conmutatividad explicita cuando la meta lo requiere', () => {
    const theory = makeTheory({
      a1: and(atom('P'), atom('Q')),
    });
    const result = cp.derive(and(atom('Q'), atom('P')), ['a1'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.steps.some((step) => step.justification === 'Conmutatividad')).toBe(true);
  });

  it('usa absorcion explicita cuando la meta lo requiere', () => {
    const theory = makeTheory({
      a1: or(atom('P'), and(atom('P'), atom('Q'))),
    });
    const result = cp.derive(atom('P'), ['a1'], theory);
    expect(result.status).toBe('provable');
    expect(result.proof?.steps.some((step) => step.justification === 'Absorcion')).toBe(true);
  });
});

describe('ClassicalPropositional.countermodel', () => {
  const cp = new ClassicalPropositional();

  it('encuentra contramodelo para P -> Q', () => {
    const f = implies(atom('P'), atom('Q'));
    const result = cp.countermodel(f);
    expect(result.status).toBe('invalid');
    expect(result.model).toBeDefined();
    expect(result.model!.valuation).toBeDefined();
    expect(result.model!.valuation!['P']).toBe(true);
    expect(result.model!.valuation!['Q']).toBe(false);
  });

  it('no encuentra contramodelo para tautologia', () => {
    const f = implies(atom('P'), atom('P'));
    const result = cp.countermodel(f);
    expect(result.status).toBe('valid');
  });
});

describe('ClassicalPropositional.truthTable', () => {
  const cp = new ClassicalPropositional();

  it('genera tabla correcta para P & Q', () => {
    const f = and(atom('P'), atom('Q'));
    const tt = cp.truthTable(f);
    expect(tt.variables.length).toBe(2);
    expect(tt.rows.length).toBe(4);
    expect(tt.isTautology).toBe(false);
    expect(tt.isSatisfiable).toBe(true);
    // Solo P=T,Q=T da true
    const trueRows = tt.rows.filter((r) => r.result);
    expect(trueRows.length).toBe(1);
  });

  it('genera tabla correcta para P | !P', () => {
    const f = or(atom('P'), not(atom('P')));
    const tt = cp.truthTable(f);
    expect(tt.isTautology).toBe(true);
    expect(tt.isContradiction).toBe(false);
  });
});

describe('ClassicalPropositional.checkEquivalent', () => {
  const cp = new ClassicalPropositional();

  it('P->Q y !P|Q son equivalentes', () => {
    const f1 = implies(atom('P'), atom('Q'));
    const f2 = or(not(atom('P')), atom('Q'));
    const result = cp.checkEquivalent(f1, f2);
    expect(result.status).toBe('valid');
  });

  it('P&Q y P|Q no son equivalentes', () => {
    const f1 = and(atom('P'), atom('Q'));
    const f2 = or(atom('P'), atom('Q'));
    const result = cp.checkEquivalent(f1, f2);
    expect(result.status).toBe('invalid');
  });

  it('De Morgan: !(P&Q) y (!P|!Q) son equivalentes', () => {
    const f1 = not(and(atom('P'), atom('Q')));
    const f2 = or(not(atom('P')), not(atom('Q')));
    const result = cp.checkEquivalent(f1, f2);
    expect(result.status).toBe('valid');
  });
});

describe('ClassicalPropositional.explain', () => {
  const cp = new ClassicalPropositional();

  it('explica formula correctamente', () => {
    const f = implies(atom('P'), atom('Q'));
    const result = cp.explain(f);
    expect(result.output).toBeDefined();
    expect(result.output).toContain('Átomos');
    expect(result.output).toContain('satisfacible');
  });

  it('rechaza formulas no proposicionales con diagnostico util', () => {
    const f: Formula = { kind: 'modal_necessity', args: [atom('P')] };
    const result = cp.explain(f);
    expect(result.status).toBe('error');
    expect(result.diagnostics[0]?.message).toContain('no proposicionales');
  });
});

describe('ClassicalPropositional.prove', () => {
  const cp = new ClassicalPropositional();

  it('adjunta subpruebas en pruebas condicionales recursivas', () => {
    const result = cp.prove(implies(atom('P'), implies(atom('Q'), atom('P'))), makeTheory({}));
    expect(result.status).toBe('provable');
    expect(result.proof?.method).toBe('natural_deduction');
    expect(result.proof?.subproofs?.length).toBeGreaterThan(0);
    expect(result.proof?.steps.at(-1)?.subproofs?.length).toBeGreaterThan(0);
  });

  it('puede demostrar tercero excluido con regla derivada explicita', () => {
    const result = cp.prove(or(atom('P'), not(atom('P'))), makeTheory({}));
    expect(result.status).toBe('provable');
    expect(result.proof?.steps.some((step) => step.justification === 'Tercero excluido')).toBe(
      true,
    );
  });
});

describe('formulaToString', () => {
  it('serializa atomo', () => {
    expect(formulaToString(atom('P'))).toBe('P');
  });

  it('serializa negacion', () => {
    expect(formulaToString(not(atom('P')))).toBe('!P');
  });

  it('serializa implicacion', () => {
    expect(formulaToString(implies(atom('P'), atom('Q')))).toBe('(P -> Q)');
  });

  it('serializa formula compleja', () => {
    const f = implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P'))));
    const str = formulaToString(f);
    expect(str).toContain('P');
    expect(str).toContain('Q');
    expect(str).toContain('->');
  });
});
