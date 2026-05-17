// ============================================================
// Intuitionistic Natural Deduction (NJ) — Entrada pública
// ============================================================

export type { IntuitFormula, ProofRule, NJProof, KripkeIntuitModel } from './types';

export {
  formulaKey,
  formulaEquals,
  formulaToString,
  collectAtoms,
  atom,
  bottom,
  not,
  and,
  or,
  implies,
} from './formula';

export { proveIntuitionistically, verifyProof } from './prover';

export { kripkeCounterModel, isIPCValid } from './kripke';
