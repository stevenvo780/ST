// ============================================================
// ST Bisimulation — barrel público.
// ============================================================
// API:
//   paigeTarjan(lts)              → BisimulationResult
//   areBisimilar(lts, s, t)       → boolean
//   quotientLTS(lts)              → LTS mínimo módulo ~
//   strongBisimulation(L1, L2)    → boolean
//   weakBisimulation(lts, tau)    → BisimulationResult (oculta τ)
// ============================================================

export type { LTS, BisimulationResult } from './types';
export { paigeTarjan } from './paige-tarjan';
export { areBisimilar, quotientLTS, strongBisimulation, weakBisimulation } from './operations';
