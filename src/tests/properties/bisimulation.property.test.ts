// ============================================================
// Property: Bisimulation — paigeTarjan reflexivo y simétrico
// ============================================================
//
// ∀ LTS aleatorio:
//   - todo estado es bisimilar a sí mismo (areBisimilar(s, s) === true).
//   - bisimulación es simétrica: areBisimilar(s, t) ⇔ areBisimilar(t, s).
//   - particiones suman al número total de estados (cobertura completa).

import { describe, it } from 'vitest';
import { fc, tinyLTS } from './generators';
import { paigeTarjan, areBisimilar } from '../../runtime/bisimulation';

describe('property: bisimulation Paige-Tarjan reflexivity & symmetry', () => {
  it('areBisimilar(s, s) is true ∀ s', () => {
    fc.assert(
      fc.property(tinyLTS(), (lts) => {
        for (const s of lts.states) {
          if (!areBisimilar(lts, s, s)) {
            throw new Error(`areBisimilar(${s}, ${s}) = false`);
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('areBisimilar is symmetric', () => {
    fc.assert(
      fc.property(tinyLTS(), (lts) => {
        for (const s of lts.states) {
          for (const t of lts.states) {
            const ab = areBisimilar(lts, s, t);
            const ba = areBisimilar(lts, t, s);
            if (ab !== ba) {
              throw new Error(`Asimetría: areBisimilar(${s}, ${t})=${ab}, (${t}, ${s})=${ba}`);
            }
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('partition covers all states exactly once', () => {
    fc.assert(
      fc.property(tinyLTS(), (lts) => {
        const r = paigeTarjan(lts);
        const flat = r.blocks.flat();
        if (flat.length !== lts.states.length) {
          throw new Error(`partition size mismatch`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
