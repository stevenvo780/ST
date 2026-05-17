// ============================================================
// LK Sequent Calculus — Entrada publica del perfil
// ============================================================
//
// Calculo de secuentes LK de Gentzen (1934) para logica
// proposicional clasica con cut-elimination (Hauptsatz).
//
//   import { proveLK, hasCut, eliminateCut, isValid }
//     from 'src/profiles/sequent-lk';

export type { LKFormula, LKRule, LKSequent, LKProof } from './types';
export { proveLK, proveLKFormula, hasCut, isValid } from './prover';
export { eliminateCut } from './cut-elimination';
export { lkKey, eq, depth } from './util';
