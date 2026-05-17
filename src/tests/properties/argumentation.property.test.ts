// ============================================================
// Property: Argumentation — grounded ⊆ preferred ⊆ complete
// ============================================================
//
// ∀ AF de Dung:
//   - grounded extension ⊆ toda preferred extension.
//   - grounded extension ⊆ toda complete extension.
//   - toda preferred extension es una complete extension.
//
// (En Dung: grounded es la mínima complete; preferred = ⊆-maximal
//  complete; ambas extensiones son complete.)

import { describe, it } from 'vitest';
import { fc, tinyAF } from './generators';
import {
  groundedExtension,
  preferredExtensions,
  completeExtensions,
} from '../../reasoning/argumentation';

function isSubsetOf(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

describe('property: argumentation extension lattice', () => {
  it('grounded ⊆ every preferred extension', () => {
    fc.assert(
      fc.property(tinyAF(), (af) => {
        const g = groundedExtension(af);
        const prefs = preferredExtensions(af, { exhaustiveLimit: 8, warnOnLarge: false });
        for (const p of prefs) {
          if (!isSubsetOf(g, p)) {
            throw new Error(
              `grounded ⊄ preferred: g=${[...g].join(',')}, p=${[...p].join(',')}`,
            );
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('every preferred extension is a complete extension', () => {
    fc.assert(
      fc.property(tinyAF(), (af) => {
        const prefs = preferredExtensions(af, { exhaustiveLimit: 8, warnOnLarge: false });
        const comps = completeExtensions(af, { exhaustiveLimit: 8, warnOnLarge: false });
        const compKeys = comps.map((c) => [...c].sort().join('|'));
        for (const p of prefs) {
          const key = [...p].sort().join('|');
          if (!compKeys.includes(key)) {
            throw new Error(
              `preferred ${key} no aparece en complete (${compKeys.join(';')})`,
            );
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
