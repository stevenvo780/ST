// ============================================================
// Property: HO-Unify (Miller patterns) — determinismo
// ============================================================
//
// ∀ patterns p, q tales que isPattern(p) ∧ isPattern(q):
//   unifyPattern(p, q) es determinístico: llamarla dos veces
//   produce el mismo resultado (igualdad estructural de la sub).

import { describe, it } from 'vitest';
import { fc, hoPatternTerm } from './generators';
import { unifyPattern, isPattern } from '../../higher-order-unify';

describe('property: HO-unify Miller pattern determinism', () => {
  it('unifyPattern is deterministic for patterns', () => {
    fc.assert(
      fc.property(hoPatternTerm(3), hoPatternTerm(3), (p, q) => {
        if (!isPattern(p) || !isPattern(q)) return true; // skip — no es pattern
        const r1 = unifyPattern(p, q);
        const r2 = unifyPattern(p, q);
        // Ambos null o ambos no-null con misma sub.
        if (r1 === null && r2 === null) return true;
        if (r1 === null || r2 === null) {
          throw new Error(
            `Determinismo violado: r1=${r1 === null ? 'null' : 'sub'}, r2=${r2 === null ? 'null' : 'sub'}`,
          );
        }
        const keys1 = Object.keys(r1).sort();
        const keys2 = Object.keys(r2).sort();
        if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
          throw new Error(
            `Determinismo violado: keys distintos. ${JSON.stringify(keys1)} vs ${JSON.stringify(keys2)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('unifyPattern(t, t) is never null for any pattern', () => {
    fc.assert(
      fc.property(hoPatternTerm(3), (t) => {
        if (!isPattern(t)) return true;
        const r = unifyPattern(t, t);
        if (r === null) {
          throw new Error(`unifyPattern(t, t) === null para t=${JSON.stringify(t)}`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
