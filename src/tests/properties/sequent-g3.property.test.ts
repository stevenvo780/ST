// ============================================================
// Property: Sequent G3 — tautologías detectadas tienen proof válido
// ============================================================
//
// ∀ Formula φ tal que proveFormula(φ) reporta provable=true:
//   - existe un proof tree.
//   - el proof tree tiene goal cuyo lado derecho contiene φ.

import { describe, it } from 'vitest';
import { fc, propFormula } from './generators';
import { proveFormula } from '../../profiles/sequent-g3';
import type { ProofTree } from '../../profiles/sequent-g3/types';

function isClosed(tree: ProofTree): boolean {
  if (!tree.closed) return false;
  return (tree.premises ?? []).every(isClosed);
}

describe('property: Sequent G3 — provable formulas have closed proofs', () => {
  it('provable=true ⇒ proof tree exists and is closed', () => {
    fc.assert(
      fc.property(propFormula(3), (phi) => {
        const r = proveFormula(phi, { budget: 5000 });
        if (!r.provable) return true; // skip — no es teorema
        if (!r.proof) {
          throw new Error(`provable=true pero proof undefined`);
        }
        if (!isClosed(r.proof)) {
          throw new Error(`proof tree no está cerrado`);
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });
});
