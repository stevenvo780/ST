// ============================================================
// Property: Coinduction — take(s, n) tiene n elementos
// ============================================================
//
// ∀ Stream s, n ∈ [0, 50]: take(s, n).length === n.
// También: isBisimilar(s, s) === true para profundidad razonable.

import { describe, it } from 'vitest';
import { fc } from './generators';
import {
  take,
  isBisimilar,
  iterate,
  repeat,
  naturals,
  fibonacci,
} from '../../semantics/coinduction';
import type { Stream } from '../../semantics/coinduction';

const streamArb: fc.Arbitrary<Stream<number>> = fc.oneof(
  fc.integer({ min: -100, max: 100 }).map((x) => repeat(x)),
  fc
    .tuple(fc.integer({ min: -100, max: 100 }), fc.integer({ min: -5, max: 5 }))
    .map(([seed, step]) => iterate((x) => x + step, seed)),
  fc.constant(naturals),
  fc.constant(fibonacci),
);

describe('property: coinduction streams', () => {
  it('take(s, n).length === n', () => {
    fc.assert(
      fc.property(streamArb, fc.integer({ min: 0, max: 50 }), (s, n) => {
        const arr = take(s, n);
        if (arr.length !== n) {
          throw new Error(`take(s, ${n}).length === ${arr.length}`);
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it('isBisimilar(s, s) is true', () => {
    fc.assert(
      fc.property(streamArb, (s) => {
        if (!isBisimilar(s, s, 20)) {
          throw new Error(`isBisimilar(s, s) === false`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
