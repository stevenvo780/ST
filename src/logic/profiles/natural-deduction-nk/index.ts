// ============================================================
// Natural Deduction NK (classical) — Entrada pública
// ============================================================

export type { NKFormula, NKRule, NKProof } from './types';
export { CLASSICAL_ONLY_RULES } from './types';

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

export {
  proveClassically,
  proveIntuitOnly,
  verifyProof,
  provedPeirce,
  provedDNE,
  provedLEM,
  nkToNJ,
} from './prover';
