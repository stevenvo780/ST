// ============================================================
// ST Citation Reasoning — Tipos base
// ============================================================

/**
 * Premisa externa extraída de otro documento (cross-doc citation).
 * Representa un teorema, axioma o claim citado desde docId.
 */
export interface CitedClaim {
  id: string;
  docId: string;
  formula: string;
  profile: string;
  weight?: number;
}

/**
 * Descripción de una derivación que combina premisas locales
 * con premisas citadas de documentos externos.
 */
export interface CitationDerivation {
  goal: string;
  citations: CitedClaim[];
  localPremises: string[];
}

/**
 * Un paso individual en la traza de la derivación.
 */
export interface DerivationStep {
  step: string;
  cite?: string;
}

/**
 * Resultado de deriveWithCitations.
 */
export interface CitationDerivationResult {
  valid: boolean;
  trace: DerivationStep[];
  explanation: string;
}
