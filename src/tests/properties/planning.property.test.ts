// ============================================================
// Property: STRIPS planning — applyAll(plan, S₀) satisface goal
// ============================================================
//
// ∀ instancia STRIPS pequeña donde bfsPlan retorna un plan:
//   aplicar el plan al estado inicial produce un estado que satisface
//   el goal.

import { describe, it } from 'vitest';
import { fc } from './generators';
import { bfsPlan, applyAction, ground, goalSatisfied } from '../../reasoning/planning';
import type { STRIPSProblem, Fact } from '../../reasoning/planning/types';

// Generador de un problema mini estilo blocksworld 1D:
// objetos a..b en posiciones discretas; acción move(?x, ?y).
const problemArb: fc.Arbitrary<STRIPSProblem> = fc
  .tuple(fc.constantFrom('p1', 'p2', 'p3'), fc.constantFrom('p1', 'p2', 'p3'))
  .filter(([s, g]) => s !== g)
  .map(([start, goal]) => ({
    predicates: ['at'],
    objects: { Pos: ['p1', 'p2', 'p3'] },
    actions: [
      {
        name: 'move',
        parameters: ['?from', '?to'],
        preconditions: ['at(?from)'],
        addList: ['at(?to)'],
        delList: ['at(?from)'],
      },
    ],
    initialState: new Set<Fact>([`at(${start})`]),
    goal: new Set<Fact>([`at(${goal})`]),
  }));

describe('property: STRIPS plan is correct', () => {
  it('applyAll(plan, initial) satisfies goal', () => {
    fc.assert(
      fc.property(problemArb, (problem) => {
        const plan = bfsPlan(problem, { maxDepth: 10, maxNodes: 1000 });
        if (plan === null) return true; // skip — no se encontró plan
        let state = new Set<Fact>(problem.initialState);
        for (const step of plan.actions) {
          const g = ground(step.action, step.bindings);
          state = applyAction(state, g);
        }
        if (!goalSatisfied(state, problem.goal)) {
          throw new Error(
            `Plan no satisface goal: plan=${JSON.stringify(plan.actions)}, finalState=${[...state].join(',')}, goal=${[...problem.goal].join(',')}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
