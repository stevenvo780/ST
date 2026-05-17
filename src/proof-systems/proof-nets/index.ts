// ============================================================
// Proof Nets — Punto de entrada público
// ============================================================
//
// Proof nets de Girard para MLL (Multiplicative Linear Logic):
//   - construcción a partir de un secuente,
//   - verificación de corrección (criterio Danos-Regnier),
//   - eliminación de cortes (axiom-cut y mult-cut).
//
// Diseño "didáctico" cercano al estándar de la literatura:
// nodos numerados, links {axiom, cut, tensor, par} con ports en
// orden canónico, conclusiones explícitas.

export type { Polarity, MLLFormula, LinkKind, ProofNetLink, ProofNetNode, ProofNet } from './types';

export { atomPos, atomNeg, tensor, par, dual, formulaEquals, formulaToString } from './types';

export { constructFromSequent } from './construct';
export { isCorrect } from './correctness';
export { reduceCut, reduceCutStep, normalizeCuts, isCutFree } from './cut-elim';
