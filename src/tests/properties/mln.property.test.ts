// ============================================================
// Property: MLN — hard constraints fuerzan -∞ en mundos violadores
// ============================================================
//
// ∀ MLN con peso Infinity en una fórmula F:
//   ∀ world tal que F NO se satisface ⇒ weight(world) === -Infinity.

import { describe, it } from 'vitest';
import { fc } from './generators';
import { weight } from '../../runtime/markov-logic';
import type { MLNTheory, MLNWorld } from '../../runtime/markov-logic';

describe('property: MLN hard constraints', () => {
  it('hard constraint violated ⇒ weight = -∞', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (alicePred, bobPred) => {
        // Hard constraint: ∀x. Friends(x, x) — todos amigos de sí mismos.
        const theory: MLNTheory = {
          formulas: [
            { formula: 'Friends(x, x)', weight: Infinity },
          ],
          constants: { Person: ['Alice', 'Bob'] },
          predicates: [{ name: 'Friends', types: ['Person', 'Person'] }],
        };
        const world: MLNWorld = {
          groundAtoms: {
            'Friends(Alice,Alice)': alicePred,
            'Friends(Bob,Bob)': bobPred,
          },
        };
        const w = weight(theory, world);
        const violated = !alicePred || !bobPred;
        if (violated && Number.isFinite(w)) {
          throw new Error(
            `World viola hard pero weight finita: alicePred=${alicePred}, bobPred=${bobPred}, w=${w}`,
          );
        }
        if (!violated && !Number.isFinite(w) && w === Number.NEGATIVE_INFINITY) {
          throw new Error(
            `World no viola hard pero weight = -∞`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
