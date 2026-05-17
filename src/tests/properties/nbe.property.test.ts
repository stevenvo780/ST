// ============================================================
// Property: NbE — idempotencia
// ============================================================
//
// ∀ Term t bien-tipado: normalize(normalize(t)) ≡ normalize(t)
// (idempotencia de la normalización por evaluación + reificación).

import { describe, it } from 'vitest';
import { fc } from './generators';
import { normalize, alphaEq, tBase, tArr, v, lam, ap } from '../../type-theory/nbe';
import type { Term as NbETerm, Type as NbEType } from '../../type-theory/nbe';

// Generador de términos NbE bien-tipados pequeños:
// usamos tipo (A → A) → A → A — el tipo de Church numerals.
const TA: NbEType = tBase('A');
const TAA: NbEType = tArr(TA, TA);
const TChurch: NbEType = tArr(TAA, TAA);

// Generamos Church numerals + variantes con η-redex.
function churchNumeral(n: number): NbETerm {
  // λf:A→A. λx:A. f (f (... f x))
  let body: NbETerm = v('x');
  for (let i = 0; i < n; i++) body = ap(v('f'), body);
  return lam('f', TAA, lam('x', TA, body));
}

const churchArb: fc.Arbitrary<NbETerm> = fc
  .integer({ min: 0, max: 5 })
  .map((n) => churchNumeral(n));

// También algunos con η-redex artificial: λf. λx. (λg. f g) x — debería
// normalizar a Church 1.
const etaRedexArb: fc.Arbitrary<NbETerm> = fc.constant(
  lam('f', TAA, lam('x', TA, ap(lam('g', TAA, ap(v('f'), v('g'))), v('x')))),
);

const termArb = fc.oneof(churchArb, etaRedexArb);

describe('property: NbE normalize is idempotent', () => {
  it('normalize(normalize(t)) ≡ normalize(t) α', () => {
    fc.assert(
      fc.property(termArb, (t) => {
        const n1 = normalize(t, TChurch);
        const n2 = normalize(n1, TChurch);
        if (!alphaEq(n1, n2)) {
          throw new Error(
            `NbE no idempotente: t=${JSON.stringify(t)}, n1=${JSON.stringify(n1)}, n2=${JSON.stringify(n2)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
