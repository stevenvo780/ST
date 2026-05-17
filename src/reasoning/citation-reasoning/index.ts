// ============================================================
// ST Citation Reasoning — Punto de entrada público
// ============================================================

export type {
  CitedClaim,
  CitationDerivation,
  CitationDerivationResult,
  DerivationStep,
} from './types';
export { deriveWithCitations, explainProof } from './derive';
export type { Evaluator } from './derive';
