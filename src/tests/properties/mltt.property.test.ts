// ============================================================
// Property: MLTT — normalize preserva tipo en términos bien-tipados
// ============================================================
//
// ∀ MLTTTerm t bien-tipado: inferType(normalize(t)) =β inferType(t).

import { describe, it } from 'vitest';
import { fc, mlttSimpleTerm } from './generators';
import { inferType, isInferError } from '../../type-theory/mltt';
import { normalize as mlttNormalize } from '../../type-theory/mltt/normalize';
import { alphaBetaEq } from '../../type-theory/mltt/equality';

describe('property: MLTT normalize preserves type', () => {
  it('inferType(normalize(t)) ≡ inferType(t) for well-typed terms', () => {
    fc.assert(
      fc.property(mlttSimpleTerm(), (t) => {
        const tInf = inferType(t);
        if (isInferError(tInf)) {
          // El generador produce sólo well-typed; si dispara, es regresión.
          throw new Error(
            `Término well-typed reportado como error: ${JSON.stringify(t)}, error=${tInf.error}`,
          );
        }
        const normT = mlttNormalize(t);
        const tInf2 = inferType(normT);
        if (isInferError(tInf2)) {
          throw new Error(
            `Normalize rompió well-typedness: t=${JSON.stringify(t)}, normT=${JSON.stringify(normT)}, error=${tInf2.error}`,
          );
        }
        if (!alphaBetaEq(tInf, tInf2)) {
          throw new Error(
            `Tipo no preservado: t=${JSON.stringify(t)}, tipo1=${JSON.stringify(tInf)}, tipo2=${JSON.stringify(tInf2)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
