// ============================================================
// Property: Intuitionistic NJ — intuit ⊆ classical
// ============================================================
//
// ∀ formula φ tal que proveIntuitionistically(φ) tiene éxito:
//   classical proof también tiene éxito (proveFormula en G3
//   debe encontrar prueba).
//
// Es decir: si φ es intuit-provable, también es clásicamente válida.

import { describe, it } from 'vitest';
import { fc } from './generators';
import {
  proveIntuitionistically,
  kripkeCounterModel,
  atom as iatom,
  not as inot,
  and as iand,
  or as ior,
  implies as iimplies,
} from '../../logic/profiles/intuitionistic-nj';
import type { IntuitFormula } from '../../logic/profiles/intuitionistic-nj/types';
import { proveFormula as proveClassical } from '../../logic/profiles/sequent-g3';
import type { Formula } from '../../types';

// Generador de IntuitFormula simple.
function intuitFormulaArb(maxDepth = 3): fc.Arbitrary<IntuitFormula> {
  const { f } = fc.letrec((tie) => ({
    f: fc.oneof(
      { maxDepth, depthIdentifier: 'i' },
      fc.constantFrom('p', 'q', 'r').map((n) => iatom(n)),
      tie('f').map((arg) => inot(arg as IntuitFormula)),
      fc.tuple(tie('f'), tie('f')).map(([l, r]) => iand(l as IntuitFormula, r as IntuitFormula)),
      fc.tuple(tie('f'), tie('f')).map(([l, r]) => ior(l as IntuitFormula, r as IntuitFormula)),
      fc
        .tuple(tie('f'), tie('f'))
        .map(([l, r]) => iimplies(l as IntuitFormula, r as IntuitFormula)),
    ),
  }));
  return f;
}

// Convierte IntuitFormula al Formula clásico de `types/index.ts`.
function intuitToClassical(phi: IntuitFormula): Formula {
  switch (phi.kind) {
    case 'atom':
      return { kind: 'atom', name: phi.name };
    case 'and':
      return { kind: 'and', args: [intuitToClassical(phi.left), intuitToClassical(phi.right)] };
    case 'or':
      return { kind: 'or', args: [intuitToClassical(phi.left), intuitToClassical(phi.right)] };
    case 'implies':
      return {
        kind: 'implies',
        args: [intuitToClassical(phi.left), intuitToClassical(phi.right)],
      };
    case 'not':
      return { kind: 'not', args: [intuitToClassical(phi.arg)] };
    case 'bottom':
      return { kind: 'false' };
  }
}

describe('property: intuitionistic ⊆ classical', () => {
  it('intuit-provable ⇒ classical-provable', () => {
    fc.assert(
      fc.property(intuitFormulaArb(2), (phi) => {
        const intuitResult = proveIntuitionistically([], phi, { budget: 3000 });
        if (intuitResult === null) return true; // skip — no es intuit-provable
        const classical = proveClassical(intuitToClassical(phi), { budget: 5000 });
        if (!classical.provable) {
          throw new Error(`intuit-provable pero NO classical: phi=${JSON.stringify(phi)}`);
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  // Inverse property (soundness of NJ prover w.r.t. Kripke semantics):
  // si kripkeCounterModel(φ) retorna no-null, existe un mundo Kripke que
  // refuta φ, luego φ NO es intuit-válida ⇒ proveIntuitionistically debe
  // retornar null. Un counterexample aquí significaría que el prover
  // demostró algo que la semántica de Kripke refuta (unsound).
  it('kripke-refutable ⇒ NOT intuit-provable', () => {
    fc.assert(
      fc.property(intuitFormulaArb(2), (phi) => {
        const counter = kripkeCounterModel(phi);
        if (counter === null) return true; // skip — válida (dentro de la cota)
        const intuitProof = proveIntuitionistically([], phi, { budget: 3000 });
        if (intuitProof !== null) {
          throw new Error(
            `kripke-refutable pero el prover la PROBO (unsound): phi=${JSON.stringify(phi)}, model=${JSON.stringify(counter)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  }, 30000);
});
