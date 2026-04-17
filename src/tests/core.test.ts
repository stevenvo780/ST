// ============================================================
// ST Tests — Core (perfiles, motor proposicional)
// ============================================================

import { describe, it, expect } from 'vitest';
import { ClassicalPropositional, formulaToString } from '../profiles/classical/propositional';
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
    const result = cp.derive(
      { kind: 'biconditional', args: [atom('P'), atom('Q')] },
      ['a1', 'a2'],
      theory,
    );
    expect(result.status).toBe('provable');
  });

  it('No se puede derivar Q solo de P', () => {
    const theory = makeTheory({
      a1: atom('P'),
    });
    const result = cp.derive(atom('Q'), ['a1'], theory);
    expect(result.status).toBe('refutable');
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
    expect(result.proof?.steps.some((step) => step.justification === 'Tercero excluido')).toBe(true);
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
