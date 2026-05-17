// ============================================================
// Property: Refinement types — subtipado transitivo
// ============================================================
//
// ∀ t1, t2, t3 RefType:
//   isSubtype(t1, t2) ∧ isSubtype(t2, t3) ⇒ isSubtype(t1, t3).
//
// Foco: tipos Int con refinamientos lineales simples.

import { describe, it } from 'vitest';
import { fc, refTypeIntSimple } from './generators';
import { isSubtype } from '../../refinement-types';

describe('property: refinement-types subtype transitivity', () => {
  it('t1 <: t2 ∧ t2 <: t3 ⇒ t1 <: t3', () => {
    fc.assert(
      fc.property(refTypeIntSimple(), refTypeIntSimple(), refTypeIntSimple(), (t1, t2, t3) => {
        const ab = isSubtype(t1, t2);
        const bc = isSubtype(t2, t3);
        if (!ab || !bc) return true;
        const ac = isSubtype(t1, t3);
        if (!ac) {
          throw new Error(
            `transitividad violada: t1=${t1.predicate}, t2=${t2.predicate}, t3=${t3.predicate}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('reflexividad: t <: t para todo t', () => {
    fc.assert(
      fc.property(refTypeIntSimple(), (t) => {
        if (!isSubtype(t, t)) {
          throw new Error(`t <: t falló para predicate="${t.predicate}"`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
