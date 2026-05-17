// ============================================================
// Property: Symbolic diff — coincide con derivada numérica
// ============================================================
//
// ∀ Expr e (polinomio random), ∀ x₀ random:
//   evaluate(differentiate(e, "x"), x₀) ≈ (e(x₀+h) - e(x₀-h)) / (2h)
// con h pequeño. Cota laxa para tolerar errores numéricos.

import { describe, it } from 'vitest';
import { fc, symExpr } from './generators';
import { differentiate, evaluate } from '../../runtime/symbolic-diff';
import type { Expr } from '../../runtime/symbolic-diff';

function evalSafe(e: Expr, env: Record<string, number>): number | null {
  try {
    const v = evaluate(e, env);
    if (!Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}

describe('property: symbolic-diff matches numerical derivative', () => {
  it('symbolic diff ≈ central finite difference', () => {
    fc.assert(
      fc.property(
        symExpr(3),
        fc.double({ min: -3, max: 3, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -3, max: 3, noNaN: true, noDefaultInfinity: true }),
        (e, x0, y0) => {
          const env0: Record<string, number> = { x: x0, y: y0 };
          const h = 1e-4;
          const envP: Record<string, number> = { x: x0 + h, y: y0 };
          const envM: Record<string, number> = { x: x0 - h, y: y0 };
          const dE = differentiate(e, 'x');
          const symbolic = evalSafe(dE, env0);
          const numericP = evalSafe(e, envP);
          const numericM = evalSafe(e, envM);
          if (symbolic === null || numericP === null || numericM === null) return true;
          const numeric = (numericP - numericM) / (2 * h);
          if (!Number.isFinite(numeric)) return true;
          // Tolerancia laxa: relativa 1% + abs 1e-3.
          const tol = Math.max(1e-3, 0.01 * Math.abs(numeric));
          if (Math.abs(symbolic - numeric) > tol) {
            throw new Error(
              `dE inconsistente: simbólico=${symbolic}, numérico=${numeric}, expr=${JSON.stringify(e)}, x0=${x0}`,
            );
          }
          return true;
        },
      ),
      { numRuns: 200 },
    );
  });
});
