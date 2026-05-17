// ============================================================
// Property: TRS normalize — punto fijo
// ============================================================
//
// ∀ term t, rules R: normalize(t, R) es punto fijo —
// rewriteStep(normalize(t,R), R) === null (no más reducible).

import { describe, it } from 'vitest';
import { fc, trsTerm } from './generators';
import { normalize, rewriteStep } from '../../runtime/term-rewriting';
import { f, v, c } from '../../runtime/term-rewriting';

// Reglas TRS pequeñas, simples y terminantes:
//   f(x) → g(x)         — renombrado
//   h(c, x) → x         — proyección (elimina la c)
//   g(A) → B            — reducción ground
const RULES = [
  { lhs: f('f', v('x')), rhs: f('g', v('x')) },
  { lhs: f('h', c('A'), v('x')), rhs: v('x') },
  { lhs: f('g', c('A')), rhs: c('B') },
];

describe('property: TRS normalize is a fixed point', () => {
  it('rewriteStep(normalize(t, R), R) === null', () => {
    fc.assert(
      fc.property(trsTerm(3), (t) => {
        const normal = normalize(t, RULES, 2000);
        const step = rewriteStep(normal, RULES);
        if (step !== null) {
          throw new Error(
            `normalize no punto fijo: t=${JSON.stringify(t)}, normal=${JSON.stringify(normal)}, step=${JSON.stringify(step)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
