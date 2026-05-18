// ============================================================
// Property: Anti-unification — generalización correcta
// ============================================================
//
// ∀ términos t1, t2:
//   lgg(t1, t2)·σL = t1   y   lgg(t1, t2)·σR = t2
//
// Es decir, las sustituciones devueltas reconstruyen los términos
// originales aplicándolas sobre la generalización.

import { describe, it } from 'vitest';
import { fc, auTerm } from './generators';
import { antiUnify, applySubst, termEquals } from '../../runtime/anti-unification';

describe('property: anti-unification reconstruction', () => {
  it('substLeft(lgg) === t1 ∧ substRight(lgg) === t2', () => {
    fc.assert(
      fc.property(auTerm(3), auTerm(3), (t1, t2) => {
        const result = antiUnify(t1, t2);
        const reconstructedL = applySubst(result.generalization, result.substLeft);
        const reconstructedR = applySubst(result.generalization, result.substRight);
        if (!termEquals(reconstructedL, t1)) {
          throw new Error(
            `substLeft(lgg) ≠ t1: lgg=${JSON.stringify(result.generalization)}, reconstructedL=${JSON.stringify(reconstructedL)}, t1=${JSON.stringify(t1)}`,
          );
        }
        if (!termEquals(reconstructedR, t2)) {
          throw new Error(
            `substRight(lgg) ≠ t2: lgg=${JSON.stringify(result.generalization)}, reconstructedR=${JSON.stringify(reconstructedR)}, t2=${JSON.stringify(t2)}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('antiUnify(t, t) is structurally t (no fresh vars introducidas)', () => {
    fc.assert(
      fc.property(auTerm(3), (t) => {
        const result = antiUnify(t, t);
        if (!termEquals(result.generalization, t)) {
          throw new Error(
            `antiUnify(t,t).gen ≠ t: t=${JSON.stringify(t)}, gen=${JSON.stringify(result.generalization)}`,
          );
        }
        if (result.variables.length !== 0) {
          throw new Error(`antiUnify(t,t) introdujo ${result.variables.length} vars frescas`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
