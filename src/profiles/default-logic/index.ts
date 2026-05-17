// ============================================================
// ST Default Logic (Reiter) — Barrel export
// ============================================================
//
// Lógica default de Reiter (1980): razonamiento no-monotónico
// basado en reglas `α : β / γ` donde α es el prerequisite, β las
// justificaciones (consistentes con creencias) y γ el consequent.
//
// API pública:
//   - computeExtensions(T): punto fijo del operador Γ_T.
//   - isInExtension(φ, E): pertenencia a una extensión dada.
//   - isSkepticallyEntailed(φ, T): φ en TODAS las extensiones.
//   - isCredulouslyEntailed(φ, T): φ en AL MENOS una extensión.
//
// Casos canónicos cubiertos por tests: Tweety, pingüino, Nixon diamond.
// ============================================================

export type { DefaultRule, DefaultTheory, Extension, ComputeOptions } from './types';
export { DEFAULT_MAX_EXTENSIONS, DEFAULT_MAX_DEFAULTS } from './types';
export {
  computeExtensions,
  normalizeLiteral,
  negate,
  isConsistent,
  isJustificationConsistent,
} from './extensions';
export { isInExtension, isSkepticallyEntailed, isCredulouslyEntailed } from './entailment';
