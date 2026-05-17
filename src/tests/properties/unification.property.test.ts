// ============================================================
// Property: Unification first-order (TRS) — reflexividad
// ============================================================
//
// ∀ random term t, unify(t, t) tiene éxito y devuelve sub vacía.
// Y para términos arbitrarios, si unify(s, t) = σ, entonces
// σ(s) === σ(t) estructuralmente.

import { describe, it } from 'vitest';
import { fc, trsTerm } from './generators';
import { unify, applySubst, termEquals } from '../../runtime/term-rewriting';

describe('property: TRS unification reflexivity & coherence', () => {
  it('unify(t, t) succeeds with empty substitution', () => {
    fc.assert(
      fc.property(trsTerm(3), (t) => {
        const sub = unify(t, t);
        if (sub === null) {
          throw new Error(`unify(t, t) === null para t=${JSON.stringify(t)}`);
        }
        // No es estrictamente vacío si t tiene vars (la unif puede generar
        // bindings triviales como x→x), pero applySubst debería preservar t.
        if (!termEquals(applySubst(t, sub), t)) {
          throw new Error(
            `unify(t,t) σ tal que σt ≠ t: t=${JSON.stringify(t)}, σ=${JSON.stringify(Array.from(sub.entries()))}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('if unify(s,t) = σ then σ(s) ≡ σ(t)', () => {
    fc.assert(
      fc.property(trsTerm(3), trsTerm(3), (s, t) => {
        const sub = unify(s, t);
        if (sub === null) return true; // skip no-unifiable
        const lhs = applySubst(s, sub);
        const rhs = applySubst(t, sub);
        if (!termEquals(lhs, rhs)) {
          throw new Error(
            `unify(s,t)=σ pero σs≠σt: s=${JSON.stringify(s)}, t=${JSON.stringify(t)}, σs=${JSON.stringify(lhs)}, σt=${JSON.stringify(rhs)}`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
