// ============================================================
// Property: Hyperreal — add commutativo
// ============================================================
//
// ∀ x, y Hyperreal:  add(x, y) === add(y, x).

import { describe, it } from 'vitest';
import { fc, hyperrealArb } from './generators';
import { add, mul, eq } from '../../hyperreal';

describe('property: hyperreal arithmetic', () => {
  it('add is commutative', () => {
    fc.assert(
      fc.property(hyperrealArb(), hyperrealArb(), (x, y) => {
        const a = add(x, y);
        const b = add(y, x);
        if (!eq(a, b)) {
          throw new Error(
            `add no conmutativa: x=${JSON.stringify(x)}, y=${JSON.stringify(y)}, a=${JSON.stringify(a)}, b=${JSON.stringify(b)}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('mul is commutative', () => {
    fc.assert(
      fc.property(hyperrealArb(), hyperrealArb(), (x, y) => {
        const a = mul(x, y);
        const b = mul(y, x);
        if (!eq(a, b)) {
          throw new Error(
            `mul no conmutativa: a.s=${a.standard}, b.s=${b.standard}, a.i=${a.infinitesimal}, b.i=${b.infinitesimal}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
