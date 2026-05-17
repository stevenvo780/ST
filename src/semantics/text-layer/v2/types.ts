/**
 * ST Text Layer 2.0 — tipos del grafo de claims con dependencias.
 *
 * Una Claim es una afirmación formal con dependencias explícitas hacia
 * otras claims. El grafo permite validación topológica e invalidación
 * propagada: si una claim base falla, todas las claims que dependen
 * transitivamente de ella se marcan inválidas.
 */

export interface ClaimSource {
  docId: string;
  offset: number;
}

export interface Claim {
  id: string;
  formula: string;
  profile: string;
  dependencies: string[];
  source?: ClaimSource;
}

export interface ClaimValidation {
  claimId: string;
  valid: boolean;
  result?: string;
  errors?: string[];
  invalidatedBy?: string[];
}

export type ClaimEvaluator = (claim: Claim) => Promise<{
  valid: boolean;
  result?: string;
  errors?: string[];
}>;
