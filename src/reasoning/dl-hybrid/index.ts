// ============================================================
// ST dL-Hybrid — Reasoning helpers
// ============================================================
// API pública para análisis de invariantes diferenciales (regla de
// Platzer 2010). Estos helpers viven fuera del core del perfil para
// no inflar el bundle del runtime; quien sólo necesite parse + check
// puede ignorarlos.
// ============================================================

export type { InvariantVerdict, InvariantOptions, CandidateResult } from './invariant-search';
export {
  checkDifferentialInvariant,
  suggestInvariants,
  describeVerdict,
} from './invariant-search';
