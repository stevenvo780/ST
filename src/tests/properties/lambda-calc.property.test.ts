// ============================================================
// Property: λ-calc — no captura de variables libres en sub
// ============================================================
//
// ∀ Term t (cuerpo), Term r (replacement), var x:
//   freeVars(substitute(t, x, r)) ⊆ freeVars(r) ∪ (freeVars(t) \ {x})
// — la sustitución capture-avoiding no introduce variables libres
// que no provengan ni de t (sin x) ni de r.

import { describe, it } from 'vitest';
import { fc, lamTerm } from './generators';
import { freeVars, substitute } from '../../type-theory/lambda-calc/substitution';

describe('property: λ-calc substitution avoids variable capture', () => {
  it('FV(t[x:=r]) ⊆ FV(r) ∪ (FV(t) \\ {x})', () => {
    fc.assert(
      fc.property(lamTerm(3), fc.constantFrom('x', 'y', 'z'), lamTerm(2), (t, x, r) => {
        const subst = substitute(t, x, r);
        const fvSubst = freeVars(subst);
        const fvT = freeVars(t);
        const fvR = freeVars(r);
        const allowed = new Set<string>(fvR);
        for (const n of fvT) if (n !== x) allowed.add(n);
        for (const name of fvSubst) {
          if (!allowed.has(name)) {
            throw new Error(
              `Captura detectada: substitute introdujo libre "${name}" fuera de FV(r) ∪ (FV(t)\\{${x}}). ` +
                `t=${JSON.stringify(t)}, r=${JSON.stringify(r)}, subst=${JSON.stringify(subst)}`,
            );
          }
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
