// ============================================================
// ST Default Logic (Reiter) — Barrel export
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
