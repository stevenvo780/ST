// ============================================================
// Property: System F — typeOf determinístico para well-typed
// ============================================================
//
// ∀ FTerm bien-tipado t: typeOf(t) llamado dos veces da el mismo
// tipo (no hay state global). Y typeOf(t) no devuelve error.

import { describe, it } from 'vitest';
import { fc, fTermSimple } from './generators';
import { typeOf, isTypeError, emptyContext, alphaEqType } from '../../type-theory/system-f';

function makeCtx() {
  // Declaramos A y B como variables de tipo para que el well-formed check pase.
  const ctx = emptyContext();
  ctx.type.add('A');
  ctx.type.add('B');
  return ctx;
}

describe('property: System F typeOf is deterministic on well-typed terms', () => {
  it('typeOf(t) consistent across calls', () => {
    fc.assert(
      fc.property(fTermSimple(), ({ term, type: expected }) => {
        const r1 = typeOf(term, makeCtx());
        const r2 = typeOf(term, makeCtx());
        if (isTypeError(r1) || isTypeError(r2)) {
          throw new Error(
            `Term well-typed reportado como error: ${JSON.stringify(term)}, r1=${JSON.stringify(r1)}, r2=${JSON.stringify(r2)}`,
          );
        }
        if (!alphaEqType(r1, r2)) {
          throw new Error(
            `typeOf no determinístico: r1=${JSON.stringify(r1)}, r2=${JSON.stringify(r2)}`,
          );
        }
        if (!alphaEqType(r1, expected)) {
          throw new Error(
            `Tipo inferido ≠ esperado: inferido=${JSON.stringify(r1)}, esperado=${JSON.stringify(expected)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
