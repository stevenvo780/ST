// ============================================================
// Property: CSP AC-3 — dominios reducidos son subset del input
// ============================================================
//
// ∀ instancia CSP binaria: AC-3 produce dominios donde
//   reducedDomains[v] ⊆ originalDomains[v]   ∀ v.

import { describe, it } from 'vitest';
import { fc } from './generators';
import { ac3 } from '../../solver/csp';
import type { CSP } from '../../solver/csp';

type V = string;
type D = number;

const cspArb: fc.Arbitrary<CSP<V, D>> = fc.integer({ min: 2, max: 4 }).chain((n) => {
  const vars = Array.from({ length: n }, (_, i) => `x${i}`);
  return fc
    .array(
      fc
        .tuple(
          fc.integer({ min: 0, max: n - 1 }),
          fc.integer({ min: 0, max: n - 1 }),
          fc.constantFrom('ne', 'lt'),
        )
        .filter(([a, b]) => a !== b),
      { minLength: 0, maxLength: 4 },
    )
    .map((triples) => {
      const domains = new Map<V, D[]>();
      for (const v of vars) domains.set(v, [1, 2, 3, 4]);
      const constraints = triples.map(([i, j, kind]) => {
        const ci: V = vars[i];
        const cj: V = vars[j];
        if (kind === 'ne') {
          return {
            vars: [ci, cj],
            predicate: (vals: D[]) => vals[0] !== vals[1],
          };
        }
        return {
          vars: [ci, cj],
          predicate: (vals: D[]) => vals[0] < vals[1],
        };
      });
      return { variables: vars, domains, constraints };
    });
});

describe('property: CSP AC-3 reduces domains monotonically', () => {
  it('reducedDomains[v] ⊆ originalDomains[v]', () => {
    fc.assert(
      fc.property(cspArb, (csp) => {
        const { reducedDomains } = ac3(csp);
        for (const v of csp.variables) {
          const orig = new Set(csp.domains.get(v));
          const reduced = reducedDomains.get(v) ?? [];
          for (const x of reduced) {
            if (!orig.has(x)) {
              throw new Error(`AC-3 introdujo valor nuevo ${x} en ${v}`);
            }
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
