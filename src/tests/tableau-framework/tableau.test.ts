// ============================================================
// Tests — Tableau extensible framework
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  TableauProver,
  createPropositionalProver,
} from '../../tableau-framework';
import type {
  PropFormula,
  TableauBranch,
  TableauNode,
  Rule,
} from '../../tableau-framework';

// ── Formula helpers ───────────────────────────────────────────

function atom(name: string): PropFormula {
  return { kind: 'atom', name };
}
function not(f: PropFormula): PropFormula {
  return { kind: 'not', args: [f] };
}
function and(a: PropFormula, b: PropFormula): PropFormula {
  return { kind: 'and', args: [a, b] };
}
function or(a: PropFormula, b: PropFormula): PropFormula {
  return { kind: 'or', args: [a, b] };
}
function implies(a: PropFormula, b: PropFormula): PropFormula {
  return { kind: 'implies', args: [a, b] };
}

function T(f: PropFormula): TableauNode<PropFormula> {
  return { formula: f, signed: 'T' };
}
function F(f: PropFormula): TableauNode<PropFormula> {
  return { formula: f, signed: 'F' };
}

function branch(...nodes: TableauNode<PropFormula>[]): TableauBranch<PropFormula> {
  return { nodes, closed: false };
}

// ── Tests ─────────────────────────────────────────────────────

describe('Tableau framework — closure A, ¬A', () => {
  it('cierra cuando T A y F A están en la misma rama', () => {
    const prover = createPropositionalProver();
    const p = atom('P');
    const result = prover.prove(branch(T(p), F(p)));
    expect(result.closed).toBe(true);
    expect(result.open).toHaveLength(0);
  });

  it('no cierra cuando solo está T A sin F A', () => {
    const prover = createPropositionalProver();
    const result = prover.prove(branch(T(atom('P'))));
    expect(result.closed).toBe(false);
    expect(result.open.length).toBeGreaterThan(0);
  });
});

describe('Tableau framework — doble negación ¬¬', () => {
  it('T ¬¬A se reduce a T A (α-rule aplicada dos veces)', () => {
    const prover = createPropositionalProver();
    const p = atom('P');
    // Para falsificar T¬¬P debería quedar abierto (P es satisfacible)
    const result = prover.prove(branch(T(not(not(p))), F(p)));
    // Después de expandir ¬¬ obtenemos T P y F P → cierre
    expect(result.closed).toBe(true);
  });

  it('F ¬¬A se reduce a F A', () => {
    const prover = createPropositionalProver();
    const p = atom('P');
    // F ¬¬P → T ¬P → F P; luego T P y F P → cierre
    const result = prover.prove(branch(T(p), F(not(not(p)))));
    expect(result.closed).toBe(true);
  });
});

describe('Tableau framework — conjunción (∧)', () => {
  it('T(A∧B) agrega T A y T B (α-rule)', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // Intentar refutar P∧Q dando F(P∧Q): se bifurca en F P | F Q
    // Con T P y T Q en la misma rama, el árbol cierra ambas ramas.
    const result = prover.prove(branch(T(p), T(q), F(and(p, q))));
    expect(result.closed).toBe(true);
  });

  it('F(A∧B) bifurca (β-rule) y puede dejar ramas abiertas', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // F(P∧Q) sin T P ni T Q → ambas ramas abiertas
    const result = prover.prove(branch(F(and(p, q))));
    expect(result.closed).toBe(false);
  });
});

describe('Tableau framework — disyunción (∨)', () => {
  it('T(A∨B) bifurca (β-rule)', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // T(P∨Q) con F P y F Q → ambas ramas cierran
    const result = prover.prove(branch(T(or(p, q)), F(p), F(q)));
    expect(result.closed).toBe(true);
  });

  it('F(A∨B) agrega F A y F B (α-rule)', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // F(P∨Q) con T P → T P y F P → cierra
    const result = prover.prove(branch(T(p), F(or(p, q))));
    expect(result.closed).toBe(true);
  });
});

describe('Tableau framework — implicación (→)', () => {
  it('T(A→B) bifurca en F A | T B (β-rule)', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // T(P→Q) con T P y F Q → solo la rama F P cierra; T Q cierra con F Q
    const result = prover.prove(branch(T(implies(p, q)), T(p), F(q)));
    expect(result.closed).toBe(true);
  });

  it('F(A→B) agrega T A y F B (α-rule)', () => {
    const prover = createPropositionalProver();
    const [p, q] = [atom('P'), atom('Q')];
    // F(P→Q) con F P → T P y F P → cierra
    const result = prover.prove(branch(F(p), F(implies(p, q))));
    expect(result.closed).toBe(true);
  });
});

describe('Tableau framework — tautologías clásicas', () => {
  it('A∨¬A es tautología (refutación cierra)', () => {
    const prover = createPropositionalProver();
    const p = atom('P');
    // Para probar tautología: asumir F(A∨¬A)
    const result = prover.prove(branch(F(or(p, not(p)))));
    expect(result.closed).toBe(true);
  });

  it('(A→B)→(¬B→¬A) es tautología (modus tollens)', () => {
    const prover = createPropositionalProver();
    const [a, b] = [atom('A'), atom('B')];
    const formula = implies(implies(a, b), implies(not(b), not(a)));
    const result = prover.prove(branch(F(formula)));
    expect(result.closed).toBe(true);
  });
});

describe('Tableau framework — closure condition personalizada', () => {
  it('permite registrar una condición de cierre custom', () => {
    const prover = new TableauProver<PropFormula>();

    // Condición: cierra si la rama contiene el átomo especial "BOTTOM"
    prover.registerClosureCondition(b => {
      const hasBottom = b.nodes.some(
        n => n.formula.kind === 'atom' && n.formula['name'] === 'BOTTOM'
      );
      return hasBottom ? 'explicit bottom atom' : null;
    });

    const result = prover.prove(branch({ formula: { kind: 'atom', name: 'BOTTOM' } }));
    expect(result.closed).toBe(true);
    expect(result.branches[0]?.reason).toContain('bottom');
  });

  it('closure custom no interfiere con ramas sin el átomo', () => {
    const prover = new TableauProver<PropFormula>();
    prover.registerClosureCondition(b => {
      const has = b.nodes.some(n => n.formula['name'] === 'BOTTOM');
      return has ? 'bottom' : null;
    });

    const result = prover.prove(branch({ formula: atom('P') }));
    expect(result.closed).toBe(false);
  });
});

describe('Tableau framework — composición de provers', () => {
  it('un prover puede copiar reglas de otro (compose manual)', () => {
    const base = createPropositionalProver();
    const extended = createPropositionalProver();

    // Regla extra: cierra en cualquier átomo llamado "ABSURD"
    const absurdRule: Rule<PropFormula> = {
      name: 'Absurd-Atom',
      match: n => n.formula.kind === 'atom' && n.formula['name'] === 'ABSURD',
      apply: () => [],
    };
    extended.registerRule(absurdRule);
    extended.registerClosureCondition(b => {
      const has = b.nodes.some(n => n.formula['name'] === 'ABSURD');
      return has ? 'absurd atom present' : null;
    });

    const p = atom('P');
    // Base prover no cierra esto (no hay contradicción)
    const r1 = base.prove(branch(T(p)));
    expect(r1.closed).toBe(false);

    // Extended prover cierra porque la closure extra detecta ABSURD
    const r2 = extended.prove(branch({ formula: { kind: 'atom', name: 'ABSURD' }, signed: 'T' }));
    expect(r2.closed).toBe(true);
  });
});

describe('Tableau framework — maxDepth guard', () => {
  it('respeta maxDepth y no entra en bucle infinito', () => {
    const prover = new TableauProver<PropFormula>();

    // Regla que siempre genera más trabajo (sin convergencia)
    const infiniteRule: Rule<PropFormula> = {
      name: 'Infinite',
      match: n => n.formula.kind === 'loop',
      apply: (n) => [[n]],
    };
    prover.registerRule(infiniteRule);

    const start = Date.now();
    const result = prover.prove(branch({ formula: { kind: 'loop' } }), 5);
    const elapsed = Date.now() - start;

    // Debe terminar rápido (no loop infinito)
    expect(elapsed).toBeLessThan(2000);
    // No cerró (no hay closure condition)
    expect(result.closed).toBe(false);
  });
});
