// ============================================================
// Property: Profile Bridge — Glivenko: classical-valid ⇒ intuit-valid
// ============================================================
//
// Teorema de Glivenko (proposicional): φ es clásicamente válida sii
// ¬¬φ es intuicionísticamente válida.
//
// Acá testeamos la dirección "fácil" del bridge:
//   ∀ φ propositional tal que classical-provable(φ) =true:
//     intuit-provable(glivenkoTranslation(φ)) = true.

import { describe, it } from 'vitest';
import { fc, propFormula } from './generators';
import { proveFormula as proveClassical } from '../../logic/profiles/sequent-g3';
import { glivenkoTranslation } from '../../logic/profile-bridge';
import { proveIntuitionistically } from '../../logic/profiles/intuitionistic-nj';
import type { Formula } from '../../types';
import type { IntuitFormula } from '../../logic/profiles/intuitionistic-nj/types';

// Convierte Formula (clásico) a IntuitFormula.
function classicalToIntuit(phi: Formula): IntuitFormula {
  switch (phi.kind) {
    case 'atom':
      return { kind: 'atom', name: phi.name ?? 'p' };
    case 'and':
      return {
        kind: 'and',
        left: classicalToIntuit(phi.args![0]!),
        right: classicalToIntuit(phi.args![1]!),
      };
    case 'or':
      return {
        kind: 'or',
        left: classicalToIntuit(phi.args![0]!),
        right: classicalToIntuit(phi.args![1]!),
      };
    case 'implies':
      return {
        kind: 'implies',
        left: classicalToIntuit(phi.args![0]!),
        right: classicalToIntuit(phi.args![1]!),
      };
    case 'not':
      return { kind: 'not', arg: classicalToIntuit(phi.args![0]!) };
    case 'true':
      // En IntuitFormula no hay 'true' directo; usamos ⊥→⊥.
      return { kind: 'implies', left: { kind: 'bottom' }, right: { kind: 'bottom' } };
    case 'false':
      return { kind: 'bottom' };
    default:
      // Default: tratarlo como atom opaco (no debería pasar con propFormula).
      return { kind: 'atom', name: 'p' };
  }
}

describe('property: Glivenko — classical-valid ⇒ intuit-valid via ¬¬', () => {
  it('classical-provable(φ) ⇒ intuit-provable(¬¬φ)', () => {
    fc.assert(
      fc.property(propFormula(2), (phi) => {
        const classicalR = proveClassical(phi, { budget: 5000 });
        if (!classicalR.provable) return true; // skip — no es teorema clásico
        // Aplicar Glivenko: la traducción devuelve un Formula clásico
        // pero con la forma de ¬¬φ; lo pasamos al perfil intuit.
        const translated = glivenkoTranslation(phi);
        const intuitGoal = classicalToIntuit(translated);
        const intuitR = proveIntuitionistically([], intuitGoal, { budget: 8000 });
        if (intuitR === null) {
          throw new Error(
            `Classical-provable pero intuit-NO-provable Glivenko: phi=${JSON.stringify(phi)}, intuitGoal=${JSON.stringify(intuitGoal)}`,
          );
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
