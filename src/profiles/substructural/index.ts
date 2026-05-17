// ============================================================
// Substructural Logics — Public entrypoint
// ============================================================
//
// Logicas substructurales (Linear y Affine) con calculo de
// secuentes intuicionistico unilateral. Conectivos multiplicativos
// (⊗, ⊸, 1), aditivos (&, ⊕) y el exponencial bang (!).
//
//   import {
//     LinearFormula,
//     proveLinear,
//     proveAffine,
//   } from 'src/profiles/substructural';

export type {
  LinearFormula,
  LinearSequent,
  LinearProof,
  SequentRule,
  SubstructuralMode,
} from './types';

export { proveLinear, proveAffine, proofToString, formulaKey } from './prover';
export type { ProveOptions, ProveResult } from './prover';
