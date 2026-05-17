// ============================================================
// Property: Theorem cache — store(f) ⇒ retrieve(f) === stored
// ============================================================
//
// ∀ fórmula f, profile p, prueba opaca:
//   tras cache.store({formula: f, profile: p, proof: ...}),
//   cache.retrieve(f, p) devuelve la misma prueba.

import { describe, it } from 'vitest';
import { fc } from './generators';
import { TheoremCache } from '../../runtime/theorem-cache';

describe('property: TheoremCache store/retrieve round-trip', () => {
  it('store(f, p, proof) ⇒ retrieve(f, p).proof === proof', () => {
    fc.assert(
      fc.property(
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 32 }),
            fc.constantFrom('classical', 'intuit', 'modal'),
            fc.integer({ min: 0, max: 1000000 }),
          )
          .map(([f, p, payload]) => ({ f, p, payload })),
        ({ f, p, payload }) => {
          const cache = new TheoremCache();
          cache.store({
            formula: f,
            normalizedFormula: '',
            profile: p,
            proof: { payload },
            metadata: { provedAt: new Date().toISOString(), ms: 1 },
          });
          const retrieved = cache.retrieve(f, p);
          if (retrieved === undefined) {
            throw new Error(`retrieve devolvió undefined para "${f}" / "${p}"`);
          }
          const proof = retrieved.proof as { payload: number } | undefined;
          if (proof?.payload !== payload) {
            throw new Error(
              `proof no coincide: stored=${payload}, retrieved=${proof?.payload}`,
            );
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
