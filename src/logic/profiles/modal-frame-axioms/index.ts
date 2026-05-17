// ============================================================
// Modal Frame Axioms — Entrada pública
// ============================================================
//
// Tableau modal extendido con axiomas de frame (T, B, 4, 5, D)
// y composición de sistemas estándar (K, T, D, B, S4, S5, KD45...).
//
// Uso típico:
//
//   import {
//     atom, box, diamond, implies,
//     isValid, isSatisfiable, tableauWithAxioms,
//   } from '@stevenvo780/st-lang/profiles/modal-frame-axioms';
//
//   const p = atom('p');
//   isValid(implies(box(p), p), 'T');      // true
//   isValid(implies(box(p), p), 'K');      // false
//   isValid(implies(box(p), box(box(p))), 'S4'); // true

export type { FrameAxiom, ModalSystem, ModalFormula, KripkeModel, TableauResult } from './types';

export {
  atom,
  not,
  and,
  or,
  implies,
  box,
  diamond,
  formulaKey,
  formulaEquals,
  formulaToString,
  collectAtoms,
} from './formula';

export { tableauWithAxioms } from './tableau';
export type { TableauOptions } from './tableau';

export { systemAxioms, isSatisfiable, isValid, axiomFormula } from './systems';
