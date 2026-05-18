// ============================================================
// Property: Constructive reals — add(x, y) ≈ approx(x) + approx(y)
// ============================================================
//
// ∀ x, y CReal (de fromInt / fromRational): la aproximación de
// add(x, y) a precisión p coincide con approx(x, p+1) + approx(y, p+1)
// dentro del error nominal 2^{-p}.

import { describe, it } from 'vitest';
import { fc } from './generators';
import {
  fromInt,
  fromRational,
  add,
  sub,
  mul as _mul,
  neg as _neg,
} from '../../reasoning/constructive-reals';

function evalAt(
  r: { approx: (p: number) => { numerator: bigint; denominator: bigint } },
  p: number,
): number {
  const { numerator, denominator } = r.approx(p);
  return Number(numerator) / Number(denominator);
}

const intArb = fc.integer({ min: -50, max: 50 });
const rationalArb = fc
  .tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 1, max: 50 }))
  .map(([n, d]) => fromRational(n, d));

const cRealArb = fc.oneof(
  intArb.map((n) => fromInt(n)),
  rationalArb,
);

describe('property: constructive reals — add commutativity and approximation', () => {
  it('add(x, y) ≈ x + y at precision 30', () => {
    fc.assert(
      fc.property(cRealArb, cRealArb, (x, y) => {
        const sum = add(x, y);
        const sumNum = evalAt(sum, 30);
        const xNum = evalAt(x, 30);
        const yNum = evalAt(y, 30);
        const error = Math.abs(sumNum - (xNum + yNum));
        // Cota laxa: 2^{-25} (ya considerando errores acumulados).
        if (error > Math.pow(2, -25)) {
          throw new Error(`add inexacto: sum=${sumNum}, x+y=${xNum + yNum}, error=${error}`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('add is commutative: add(x, y) ≈ add(y, x)', () => {
    fc.assert(
      fc.property(cRealArb, cRealArb, (x, y) => {
        const a = evalAt(add(x, y), 30);
        const b = evalAt(add(y, x), 30);
        if (Math.abs(a - b) > Math.pow(2, -25)) {
          throw new Error(`add no conmutativa: ${a} ≠ ${b}`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('sub(x, y) ≈ x - y', () => {
    fc.assert(
      fc.property(cRealArb, cRealArb, (x, y) => {
        const diffNum = evalAt(sub(x, y), 30);
        const xNum = evalAt(x, 30);
        const yNum = evalAt(y, 30);
        if (Math.abs(diffNum - (xNum - yNum)) > Math.pow(2, -25)) {
          throw new Error(`sub inexacto`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
