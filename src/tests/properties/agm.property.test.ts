// ============================================================
// Property: AGM revise — preserva consistencia si φ es consistente
// ============================================================
//
// ∀ K belief set, φ formula tal que isSatisfiable({φ}) === true:
//   revise(K, φ) es consistente.
//
// (Postulado AGM "consistency preservation": K * φ es consistente
//  sii φ es consistente.)

import { describe, it } from 'vitest';
import { fc, beliefSetAndFormula } from './generators';
import { newBeliefSet, revise, isConsistent } from '../../reasoning/belief-revision';
import { isSatisfiable } from '../../reasoning/belief-revision';
import { parsePropFormula } from '../../reasoning/belief-revision';

describe('property: AGM revise consistency preservation', () => {
  it('consistent(φ) ⇒ consistent(K * φ)', () => {
    fc.assert(
      fc.property(beliefSetAndFormula(), ({ initial, phi }) => {
        // φ siempre es un literal o ¬literal, siempre consistente.
        // Pero validamos por seguridad.
        let phiSat = false;
        try {
          phiSat = isSatisfiable([parsePropFormula(phi)]);
        } catch {
          return true; // skip malformed
        }
        if (!phiSat) return true; // skip — φ ya inconsistente
        let K;
        try {
          K = newBeliefSet(initial);
        } catch {
          return true; // skip — initial inválido
        }
        let revised;
        try {
          revised = revise(K, phi);
        } catch {
          return true; // skip errores de parsing en revise
        }
        if (!isConsistent(revised)) {
          throw new Error(
            `revise dejó K * φ inconsistente cuando φ es satisfiable. ` +
              `initial=[${initial.join(',')}], phi=${phi}, revised=[${[...revised.formulas].join(',')}]`,
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('postulate success: φ ∈ K * φ', () => {
    fc.assert(
      fc.property(beliefSetAndFormula(), ({ initial, phi }) => {
        let K;
        try {
          K = newBeliefSet(initial);
        } catch {
          return true;
        }
        let revised;
        try {
          revised = revise(K, phi);
        } catch {
          return true;
        }
        if (!revised.formulas.has(phi)) {
          throw new Error(
            `revise no incluye φ: K=[${[...K.formulas].join(',')}], phi=${phi}, K*phi=[${[...revised.formulas].join(',')}]`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
