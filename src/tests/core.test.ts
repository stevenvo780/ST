// ============================================================
// ST Tests — Core (perfiles, motor proposicional)
// ============================================================

import { describe, it, assert, assertEqual, assertIncludes } from './runner';
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
function biconditional(a: Formula, b: Formula): Formula {
  return { kind: 'biconditional', args: [a, b] };
}

export function runCoreTests(): void {
  const cp = new ClassicalPropositional();

  describe('ClassicalPropositional.checkWellFormed', () => {
    it('acepta atomo simple', () => {
      const diags = cp.checkWellFormed(atom('P'));
      assertEqual(diags.length, 0);
    });

    it('acepta negacion', () => {
      const diags = cp.checkWellFormed(not(atom('P')));
      assertEqual(diags.length, 0);
    });

    it('acepta implicacion compleja', () => {
      const f = implies(atom('P'), implies(atom('Q'), atom('R')));
      const diags = cp.checkWellFormed(f);
      assertEqual(diags.length, 0);
    });
  });

  describe('ClassicalPropositional.checkValid', () => {
    it('P -> P es tautologia', () => {
      const f = implies(atom('P'), atom('P'));
      const result = cp.checkValid(f);
      assertEqual(result.status, 'valid');
    });

    it('P -> (Q -> P) es tautologia', () => {
      const f = implies(atom('P'), implies(atom('Q'), atom('P')));
      const result = cp.checkValid(f);
      assertEqual(result.status, 'valid');
    });

    it('(P -> Q) -> (!Q -> !P) es tautologia (contraposicion)', () => {
      const f = implies(
        implies(atom('P'), atom('Q')),
        implies(not(atom('Q')), not(atom('P')))
      );
      const result = cp.checkValid(f);
      assertEqual(result.status, 'valid');
    });

    it('P -> Q no es tautologia', () => {
      const f = implies(atom('P'), atom('Q'));
      const result = cp.checkValid(f);
      assertEqual(result.status, 'invalid');
    });

    it('P | !P es tautologia (tercero excluido)', () => {
      const f = or(atom('P'), not(atom('P')));
      const result = cp.checkValid(f);
      assertEqual(result.status, 'valid');
    });

    it('!(P & !P) es tautologia (no contradiccion)', () => {
      const f = not(and(atom('P'), not(atom('P'))));
      const result = cp.checkValid(f);
      assertEqual(result.status, 'valid');
    });
  });

  describe('ClassicalPropositional.checkSatisfiable', () => {
    it('P es satisfacible', () => {
      const result = cp.checkSatisfiable(atom('P'));
      assertEqual(result.status, 'satisfiable');
    });

    it('P & !P es insatisfacible', () => {
      const f = and(atom('P'), not(atom('P')));
      const result = cp.checkSatisfiable(f);
      assertEqual(result.status, 'unsatisfiable');
    });

    it('P & Q es satisfacible', () => {
      const f = and(atom('P'), atom('Q'));
      const result = cp.checkSatisfiable(f);
      assertEqual(result.status, 'satisfiable');
    });
  });

  describe('ClassicalPropositional.derive', () => {
    it('Modus Ponens: P, P->Q |- Q', () => {
      const theory = makeTheory({
        a1: implies(atom('P'), atom('Q')),
        a2: atom('P'),
      });
      const result = cp.derive(atom('Q'), ['a1', 'a2'], theory);
      assertEqual(result.status, 'provable');
    });

    it('Modus Tollens: !Q, P->Q |- !P', () => {
      const theory = makeTheory({
        a1: implies(atom('P'), atom('Q')),
        a2: not(atom('Q')),
      });
      const result = cp.derive(not(atom('P')), ['a1', 'a2'], theory);
      assertEqual(result.status, 'provable');
    });

    it('Derivacion encadenada: P, P->Q, Q->R |- R', () => {
      const theory = makeTheory({
        a1: atom('P'),
        a2: implies(atom('P'), atom('Q')),
        a3: implies(atom('Q'), atom('R')),
      });
      const result = cp.derive(atom('R'), ['a1', 'a2', 'a3'], theory);
      assertEqual(result.status, 'provable');
    });

    it('No se puede derivar Q solo de P', () => {
      const theory = makeTheory({
        a1: atom('P'),
      });
      const result = cp.derive(atom('Q'), ['a1'], theory);
      assertEqual(result.status, 'refutable');
    });
  });

  describe('ClassicalPropositional.countermodel', () => {
    it('encuentra contramodelo para P -> Q', () => {
      const f = implies(atom('P'), atom('Q'));
      const result = cp.countermodel(f);
      assertEqual(result.status, 'invalid');
      assert(result.model !== undefined, 'Debe tener modelo');
      assert(result.model!.valuation !== undefined, 'Debe tener valuacion');
      assertEqual(result.model!.valuation!['P'], true);
      assertEqual(result.model!.valuation!['Q'], false);
    });

    it('no encuentra contramodelo para tautologia', () => {
      const f = implies(atom('P'), atom('P'));
      const result = cp.countermodel(f);
      assertEqual(result.status, 'valid');
    });
  });

  describe('ClassicalPropositional.truthTable', () => {
    it('genera tabla correcta para P & Q', () => {
      const f = and(atom('P'), atom('Q'));
      const tt = cp.truthTable(f);
      assertEqual(tt.variables.length, 2);
      assertEqual(tt.rows.length, 4);
      assertEqual(tt.isTautology, false);
      assertEqual(tt.isSatisfiable, true);
      // Solo P=T,Q=T da true
      const trueRows = tt.rows.filter(r => r.result);
      assertEqual(trueRows.length, 1);
    });

    it('genera tabla correcta para P | !P', () => {
      const f = or(atom('P'), not(atom('P')));
      const tt = cp.truthTable(f);
      assertEqual(tt.isTautology, true);
      assertEqual(tt.isContradiction, false);
    });
  });

  describe('ClassicalPropositional.checkEquivalent', () => {
    it('P->Q y !P|Q son equivalentes', () => {
      const f1 = implies(atom('P'), atom('Q'));
      const f2 = or(not(atom('P')), atom('Q'));
      const result = cp.checkEquivalent(f1, f2);
      assertEqual(result.status, 'valid');
    });

    it('P&Q y P|Q no son equivalentes', () => {
      const f1 = and(atom('P'), atom('Q'));
      const f2 = or(atom('P'), atom('Q'));
      const result = cp.checkEquivalent(f1, f2);
      assertEqual(result.status, 'invalid');
    });

    it('De Morgan: !(P&Q) y (!P|!Q) son equivalentes', () => {
      const f1 = not(and(atom('P'), atom('Q')));
      const f2 = or(not(atom('P')), not(atom('Q')));
      const result = cp.checkEquivalent(f1, f2);
      assertEqual(result.status, 'valid');
    });
  });

  describe('ClassicalPropositional.explain', () => {
    it('explica formula correctamente', () => {
      const f = implies(atom('P'), atom('Q'));
      const result = cp.explain(f);
      assert(result.output !== undefined, 'Debe tener output');
      assertIncludes(result.output!, 'Variables');
      assertIncludes(result.output!, 'Tautologia: no');
    });
  });

  describe('formulaToString', () => {
    it('serializa atomo', () => {
      assertEqual(formulaToString(atom('P')), 'P');
    });

    it('serializa negacion', () => {
      assertEqual(formulaToString(not(atom('P'))), '!P');
    });

    it('serializa implicacion', () => {
      assertEqual(formulaToString(implies(atom('P'), atom('Q'))), '(P -> Q)');
    });

    it('serializa formula compleja', () => {
      const f = implies(implies(atom('P'), atom('Q')), implies(not(atom('Q')), not(atom('P'))));
      const str = formulaToString(f);
      assertIncludes(str, 'P');
      assertIncludes(str, 'Q');
      assertIncludes(str, '->');
    });
  });
}
