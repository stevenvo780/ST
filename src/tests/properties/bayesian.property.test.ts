// ============================================================
// Property: Bayesian — Σ jointProbability sobre todos los mundos ≈ 1
// ============================================================
//
// ∀ red bayesiana válida pequeña (3 vars binarias):
//   Σ_{world} P(world) ≈ 1.

import { describe, it } from 'vitest';
import { fc, tinyBayesNet } from './generators';
import { jointProbability } from '../../reasoning/bayesian';

describe('property: Bayesian joint distribution sums to 1', () => {
  it('Σ P(world) = 1 over all assignments', () => {
    fc.assert(
      fc.property(tinyBayesNet(), (net) => {
        // 3 vars binarias → 8 mundos.
        let total = 0;
        for (const a of ['T', 'F']) {
          for (const b of ['T', 'F']) {
            for (const c of ['T', 'F']) {
              const p = jointProbability(net, { A: a, B: b, C: c });
              total += p;
            }
          }
        }
        if (Math.abs(total - 1) > 1e-9) {
          throw new Error(`Σ P(world) = ${total} ≠ 1`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
