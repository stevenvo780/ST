// ============================================================
// ST Markov Logic Networks — Barrel
// ============================================================
//
// Una Markov Logic Network combina FOL con redes de Markov:
// cada fórmula `F` lleva un peso `w` real; cada mundo `W` tiene
// probabilidad
//
//   P(W) ∝ exp( Σ_i  w_i · n_i(W) )
//
// donde `n_i(W)` es el número de grounding instances de `F_i`
// SATISFECHAS por `W`. Pesos +∞ representan hard constraints.
//
// API pública:
//   - `ground(theory)`            → array de GroundedFormula
//   - `weight(theory, world)`     → log-prob no normalizada
//   - `probability(theory, world, Z)` → P(world) dada partición Z
//   - `gibbsSample(theory, evidence, n)` → cadena de mundos
//   - `gibbsMarginals(...)`       → P(atom=true) aproximada
//   - `mapInference(theory, ev)`  → mundo más probable (MaxWalkSAT)
//   - `exactPartition(theory)`    → Z exacta (sólo teorías chicas)
//   - `exactMarginals(theory)`    → P(atom=true) exacta (chicas)
//
// Utilidades de grounding/parsing también expuestas para
// herramientas (UI, debugging).

export type { FOLNode } from './parser';
export { freeVariables, parseFOL } from './parser';

export type { GroundedFormula, MLNFormula, MLNTheory, MLNWorld } from './types';

export {
  allGroundAtoms,
  atomKey,
  evaluateGround,
  ground,
  groundFormula,
  renderGround,
} from './grounding';

export {
  exactMarginals,
  exactPartition,
  gibbsMarginals,
  gibbsSample,
  mapInference,
  probability,
  weight,
} from './inference';
