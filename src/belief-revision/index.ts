// ============================================================
// ST Belief Revision — Barrel export
// ============================================================
//
// Operadores AGM (Alchourrón-Gärdenfors-Makinson) sobre belief sets
// proposicionales. Incluye expansion, contraction (partial-meet con
// entrenchment opcional), revision (vía identidad de Levi) y
// verificadores de los postulados K1-K3.

export type { BeliefSet, PartialOrder, PropFormula } from './types';
export {
  newBeliefSet,
  isConsistent,
  entails,
  expand,
  contract,
  revise,
  verifyClosure,
  verifySuccess,
  verifyInclusion,
  beliefSetToArray,
  canonicalize,
} from './agm';
export { parsePropFormula, formulaToString, collectAtoms } from './parser';
export { evalFormula, isSatisfiable, entailsFormula, areEquivalent } from './sat';
export type { Valuation } from './sat';
