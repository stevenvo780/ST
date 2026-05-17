// ============================================================
// ST Proof Guidance — ML-guided proof search
//
// Sistema de ranking de tácticas/lemas con feature extraction
// simple + logistic regression + beam search guiada.
//
// Sin dependencias externas, sin embeddings — todo deterministic
// y barato. Pensado para integrarse al agente IA del Agora como
// heurística previa a aplicar tácticas reales sobre ST.
// ============================================================

export type {
  ApplyTactic,
  Feature,
  ProofState,
  RankedTactic,
  RankingModel,
  SearchOptions,
  SearchResult,
  TacticRecord,
} from './types';

export { extractFeatures, featureNames } from './features';

export {
  createEmptyModel,
  rankTactics,
  tacticSuccessProbability,
  trainModel,
  updateModel,
} from './model';

export { guidedSearch } from './search';
