import { describe, expect, it } from 'vitest';

import { ClassicalPropositional, formulaToString } from '../profiles/classical/propositional';
import { Formula, Theory } from '../types';

function atom(name: string): Formula {
  return { kind: 'atom', name };
}

function not(formula: Formula): Formula {
  return { kind: 'not', args: [formula] };
}

function and(left: Formula, right: Formula): Formula {
  return { kind: 'and', args: [left, right] };
}

function implies(left: Formula, right: Formula): Formula {
  return { kind: 'implies', args: [left, right] };
}

function biconditional(left: Formula, right: Formula): Formula {
  return { kind: 'biconditional', args: [left, right] };
}

function makeTheory(premises: Formula[]): { theory: Theory; premiseNames: string[] } {
  const entries = premises.map((premise, index) => [`a${index + 1}`, premise] as const);
  return {
    theory: {
      profile: 'classical.propositional',
      axioms: new Map(entries),
      theorems: new Map(),
      claims: new Map(),
      judgments: [],
    },
    premiseNames: entries.map(([name]) => name),
  };
}

function combinations<T>(items: T[], maxSize: number): T[][] {
  const result: T[][] = [];

  function walk(start: number, current: T[]) {
    if (current.length > 0) result.push([...current]);
    if (current.length === maxSize) return;
    for (let index = start; index < items.length; index++) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);
  return result;
}

function premiseEntails(cp: ClassicalPropositional, premises: Formula[], goal: Formula): boolean {
  const conjunction = premises.reduce<Formula | null>((acc, premise) => {
    if (!acc) return premise;
    return and(acc, premise);
  }, null);

  if (!conjunction) return cp.checkValid(goal).status === 'valid';
  return cp.checkValid(implies(conjunction, goal)).status === 'valid';
}

describe('Classical propositional ND audit', () => {
  const cp = new ClassicalPropositional();

  it('evita fallback semantico en metas conjuntivas y bicondicionales sobre literales', () => {
    const P = atom('P');
    const Q = atom('Q');
    const literalPool = [P, Q, not(P), not(Q)];
    const goalPool = [and(P, Q), and(P, not(Q)), biconditional(P, Q), biconditional(P, not(Q))];

    const semanticFallbacks: string[] = [];
    const failedDerivations: string[] = [];

    for (const premises of combinations(literalPool, 3)) {
      const { theory, premiseNames } = makeTheory(premises);
      const premiseStrings = premises.map((premise) => formulaToString(premise));

      for (const goal of goalPool) {
        const goalString = formulaToString(goal);
        if (premiseStrings.includes(goalString)) continue;
        if (!premiseEntails(cp, premises, goal)) continue;

        const result = cp.derive(goal, premiseNames, theory);
        if (result.status !== 'provable') {
          failedDerivations.push(`${premiseStrings.join(', ')} |- ${goalString}`);
          continue;
        }
        if (result.proof?.method === 'semantic') {
          semanticFallbacks.push(`${premiseStrings.join(', ')} |- ${goalString}`);
        }
      }
    }

    expect(failedDerivations).toEqual([]);
    expect(semanticFallbacks).toEqual([]);
  });

  it('reduce fallbacks en metas que requieren reconstruir antecedentes compuestos', () => {
    const P = atom('P');
    const Q = atom('Q');
    const R = atom('R');
    const premiseSets = [
      [P, Q, implies(and(P, Q), R)],
      [P, not(Q), implies(and(P, not(Q)), R)],
    ];
    const goalPool = [R, and(P, R), implies(P, R), biconditional(P, R)];

    const semanticFallbacks: string[] = [];

    for (const premises of premiseSets) {
      const { theory, premiseNames } = makeTheory(premises);
      const premiseStrings = premises.map((premise) => formulaToString(premise));

      for (const goal of goalPool) {
        if (!premiseEntails(cp, premises, goal)) continue;
        const result = cp.derive(goal, premiseNames, theory);
        expect(result.status).toBe('provable');
        if (result.proof?.method === 'semantic') {
          semanticFallbacks.push(`${premiseStrings.join(', ')} |- ${formulaToString(goal)}`);
        }
      }
    }

    expect(semanticFallbacks).toEqual([]);
  });
});